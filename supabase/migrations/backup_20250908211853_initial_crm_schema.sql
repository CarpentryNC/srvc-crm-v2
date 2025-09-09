-- =============================================
-- SECURE CRM SCHEMA WITH COMPREHENSIVE RLS
-- =============================================

-- Enable Row Level Security on auth.users (Supabase requirement)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Customer Information
  first_name text NOT NULL CHECK (length(first_name) >= 1 AND length(first_name) <= 100),
  last_name text NOT NULL CHECK (length(last_name) >= 1 AND length(last_name) <= 100),
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone text CHECK (phone IS NULL OR length(phone) >= 10),
  company_name text CHECK (company_name IS NULL OR length(company_name) <= 200),
  
  -- Address Information
  address_street text CHECK (address_street IS NULL OR length(address_street) <= 200),
  address_city text CHECK (address_city IS NULL OR length(address_city) <= 100),
  address_state text CHECK (address_state IS NULL OR length(address_state) <= 50),
  address_zip text CHECK (address_zip IS NULL OR length(address_zip) <= 20),
  
  -- Additional Information
  notes text CHECK (notes IS NULL OR length(notes) <= 2000),
  
  -- Constraints
  CONSTRAINT customers_email_user_unique UNIQUE (email, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(user_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(user_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON customers(updated_at);

-- Enable RLS and create policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers" ON customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers" ON customers
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers" ON customers
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- JOBS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  
  -- Job Information
  title text NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  description text CHECK (description IS NULL OR length(description) <= 5000),
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Scheduling
  scheduled_date timestamptz,
  estimated_hours numeric(8,2) CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
  actual_hours numeric(8,2) CHECK (actual_hours IS NULL OR actual_hours >= 0),
  
  -- Additional Information
  notes text CHECK (notes IS NULL OR length(notes) <= 2000)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at ON jobs(updated_at);

-- Enable RLS and create policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM customers WHERE id = customer_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM customers WHERE id = customer_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete own jobs" ON jobs
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- QUOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  
  -- Quote Information
  quote_number text NOT NULL CHECK (length(quote_number) >= 1 AND length(quote_number) <= 50),
  title text NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  description text CHECK (description IS NULL OR length(description) <= 5000),
  
  -- Financial Information
  subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  
  -- Status and Validity
  status text NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until timestamptz,
  
  -- Constraints
  CONSTRAINT quotes_number_user_unique UNIQUE (quote_number, user_id),
  CONSTRAINT quotes_total_consistency CHECK (total_amount = subtotal + tax_amount)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(user_id, quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until) WHERE valid_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_updated_at ON quotes(updated_at);

-- Enable RLS and create policies
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotes" ON quotes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotes" ON quotes
  FOR INSERT WITH CHECK (auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM customers WHERE id = customer_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own quotes" ON quotes
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM customers WHERE id = customer_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete own quotes" ON quotes
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- INVOICES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  
  -- Invoice Information
  invoice_number text NOT NULL CHECK (length(invoice_number) >= 1 AND length(invoice_number) <= 50),
  title text NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  description text CHECK (description IS NULL OR length(description) <= 5000),
  
  -- Financial Information
  subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  
  -- Status and Dates
  status text NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date timestamptz,
  paid_date timestamptz,
  
  -- Payment Integration
  stripe_payment_intent_id text CHECK (stripe_payment_intent_id IS NULL OR length(stripe_payment_intent_id) <= 200),
  
  -- Constraints
  CONSTRAINT invoices_number_user_unique UNIQUE (invoice_number, user_id),
  CONSTRAINT invoices_total_consistency CHECK (total_amount = subtotal + tax_amount),
  CONSTRAINT invoices_paid_date_logic CHECK (
    (status = 'paid' AND paid_date IS NOT NULL) OR 
    (status != 'paid' AND paid_date IS NULL)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(user_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_payment_intent ON invoices(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_updated_at ON invoices(updated_at);

-- Enable RLS and create policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM customers WHERE id = customer_id AND user_id = auth.uid()) AND
    (quote_id IS NULL OR EXISTS (SELECT 1 FROM quotes WHERE id = quote_id AND user_id = auth.uid())));

CREATE POLICY "Users can update own invoices" ON invoices
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM customers WHERE id = customer_id AND user_id = auth.uid()) AND
    (quote_id IS NULL OR EXISTS (SELECT 1 FROM quotes WHERE id = quote_id AND user_id = auth.uid())));

CREATE POLICY "Users can delete own invoices" ON invoices
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- SUBSCRIPTION PLANS TABLE (PUBLIC READ)
-- =============================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Plan Information
  stripe_price_id text NOT NULL UNIQUE CHECK (length(stripe_price_id) >= 1 AND length(stripe_price_id) <= 200),
  name text NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  description text CHECK (description IS NULL OR length(description) <= 1000),
  
  -- Pricing
  price_amount integer NOT NULL CHECK (price_amount >= 0),
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year')),
  
  -- Plan Limits
  features jsonb NOT NULL DEFAULT '[]',
  max_customers integer CHECK (max_customers IS NULL OR max_customers > 0),
  max_invoices integer CHECK (max_invoices IS NULL OR max_invoices > 0),
  
  -- Status
  is_active boolean NOT NULL DEFAULT true
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active, billing_interval);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price_id ON subscription_plans(stripe_price_id);

-- Enable RLS and create policies (read-only for authenticated users)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read subscription plans" ON subscription_plans
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- USER SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Stripe Information
  stripe_customer_id text NOT NULL CHECK (length(stripe_customer_id) >= 1 AND length(stripe_customer_id) <= 200),
  stripe_subscription_id text NOT NULL UNIQUE CHECK (length(stripe_subscription_id) >= 1 AND length(stripe_subscription_id) <= 200),
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  
  -- Subscription Status
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  
  -- Constraints
  CONSTRAINT user_subscriptions_period_logic CHECK (
    (current_period_start IS NULL AND current_period_end IS NULL) OR
    (current_period_start IS NOT NULL AND current_period_end IS NOT NULL AND current_period_start < current_period_end)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end) WHERE current_period_end IS NOT NULL;

-- Enable RLS and create policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGER FUNCTIONS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at 
  BEFORE UPDATE ON quotes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at 
  BEFORE UPDATE ON subscription_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- GRANT PERMISSIONS FOR SUPABASE ROLES
-- =============================================

-- Grant permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO authenticated;
GRANT SELECT ON subscription_plans TO authenticated;
GRANT SELECT, UPDATE ON user_subscriptions TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
