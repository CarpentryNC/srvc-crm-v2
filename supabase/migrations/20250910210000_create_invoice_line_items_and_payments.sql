-- Create invoice line items table for detailed invoice breakdown
CREATE TABLE invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Line item details
  title text NOT NULL CHECK (length(trim(title)) >= 1 AND length(trim(title)) <= 200),
  description text CHECK (description IS NULL OR length(description) <= 1000),
  
  -- Pricing and calculations
  quantity numeric(10,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents bigint NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
  total_cents bigint NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  
  -- Generated columns for easy decimal access
  unit_price numeric(12,2) GENERATED ALWAYS AS (unit_price_cents::numeric / 100) STORED,
  total_amount numeric(12,2) GENERATED ALWAYS AS (total_cents::numeric / 100) STORED,
  
  -- Ordering
  sort_order integer NOT NULL DEFAULT 0,
  
  -- Constraint to ensure total = quantity * unit_price
  CONSTRAINT invoice_line_items_total_consistency 
    CHECK (total_cents = (quantity * unit_price_cents)::bigint)
);

-- Create indexes for invoice line items
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_user_id ON invoice_line_items(user_id);
CREATE INDEX idx_invoice_line_items_sort_order ON invoice_line_items(invoice_id, sort_order);

-- Enable RLS on invoice line items
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice line items
CREATE POLICY invoice_line_items_select_policy ON invoice_line_items
  FOR SELECT USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_line_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY invoice_line_items_insert_policy ON invoice_line_items
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_line_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY invoice_line_items_update_policy ON invoice_line_items
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_line_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_line_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY invoice_line_items_delete_policy ON invoice_line_items
  FOR DELETE USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_line_items.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Create payment tracking table for invoice payments
CREATE TABLE invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Payment details
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  amount numeric(12,2) GENERATED ALWAYS AS (amount_cents::numeric / 100) STORED,
  payment_date timestamptz NOT NULL DEFAULT now(),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'check', 'credit_card', 'bank_transfer', 'stripe', 'other')),
  
  -- Payment references
  transaction_id text CHECK (transaction_id IS NULL OR length(transaction_id) <= 200),
  stripe_payment_intent_id text CHECK (stripe_payment_intent_id IS NULL OR length(stripe_payment_intent_id) <= 200),
  
  -- Notes
  notes text CHECK (notes IS NULL OR length(notes) <= 1000),
  
  -- Status
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Create indexes for payments
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_user_id ON invoice_payments(user_id);
CREATE INDEX idx_invoice_payments_payment_date ON invoice_payments(payment_date);
CREATE INDEX idx_invoice_payments_stripe_payment_intent ON invoice_payments(stripe_payment_intent_id) 
  WHERE stripe_payment_intent_id IS NOT NULL;

-- Enable RLS on payments
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payments
CREATE POLICY invoice_payments_select_policy ON invoice_payments
  FOR SELECT USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_payments.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY invoice_payments_insert_policy ON invoice_payments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_payments.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY invoice_payments_update_policy ON invoice_payments
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_payments.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_payments.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

CREATE POLICY invoice_payments_delete_policy ON invoice_payments
  FOR DELETE USING (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM invoices 
      WHERE invoices.id = invoice_payments.invoice_id 
      AND invoices.user_id = auth.uid()
    )
  );

-- Add updated_at trigger for invoice line items
CREATE TRIGGER invoice_line_items_updated_at
  BEFORE UPDATE ON invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add updated_at trigger for payments
CREATE TRIGGER invoice_payments_updated_at
  BEFORE UPDATE ON invoice_payments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create a function to calculate total payments for an invoice
CREATE OR REPLACE FUNCTION get_invoice_payment_total(invoice_uuid uuid)
RETURNS numeric(12,2)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM invoice_payments 
  WHERE invoice_id = invoice_uuid 
  AND status = 'completed';
$$;

-- Create a function to get invoice balance (total - payments)
CREATE OR REPLACE FUNCTION get_invoice_balance(invoice_uuid uuid)
RETURNS numeric(12,2)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(i.total_amount, 0) - COALESCE(get_invoice_payment_total(invoice_uuid), 0)
  FROM invoices i
  WHERE i.id = invoice_uuid;
$$;

-- Create a view for invoice summaries with payment information
CREATE VIEW invoice_summary AS
SELECT 
  i.*,
  get_invoice_payment_total(i.id) as total_paid,
  get_invoice_balance(i.id) as balance_due,
  CASE 
    WHEN get_invoice_balance(i.id) <= 0 THEN true
    ELSE false
  END as is_fully_paid,
  CONCAT(c.first_name, ' ', c.last_name) as customer_name,
  c.company_name as customer_company,
  c.email as customer_email
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id;

-- Grant access to the view
GRANT SELECT ON invoice_summary TO authenticated;

-- Add RLS to the view (inherits from base tables)
ALTER VIEW invoice_summary SET (security_invoker = on);
