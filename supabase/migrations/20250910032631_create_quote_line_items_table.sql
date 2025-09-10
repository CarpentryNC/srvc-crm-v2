-- Create quote_line_items table for storing individual line items within quotes
CREATE TABLE IF NOT EXISTS quote_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key to quotes table
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  
  -- Line item details
  description TEXT NOT NULL CHECK (LENGTH(TRIM(description)) >= 1 AND LENGTH(TRIM(description)) <= 500),
  quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
  unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents >= 0),
  
  -- Calculated fields (stored as cents for precision)
  total_cents BIGINT GENERATED ALWAYS AS (ROUND(quantity * unit_price_cents)) STORED,
  
  -- Display fields (generated from cents)
  unit_price DECIMAL(10,2) GENERATED ALWAYS AS (unit_price_cents::DECIMAL / 100) STORED,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (ROUND(quantity * unit_price_cents)::DECIMAL / 100) STORED,
  
  -- Ordering within quote
  sort_order INTEGER NOT NULL DEFAULT 1
);

-- Create indexes for performance
CREATE INDEX idx_quote_line_items_quote_id ON quote_line_items(quote_id);
CREATE INDEX idx_quote_line_items_sort_order ON quote_line_items(quote_id, sort_order);

-- Create updated_at trigger
CREATE TRIGGER quote_line_items_updated_at 
  BEFORE UPDATE ON quote_line_items 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE quote_line_items ENABLE ROW LEVEL SECURITY;

-- Users can only access line items for their own quotes
CREATE POLICY "quote_line_items_select_policy" ON quote_line_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = quote_line_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "quote_line_items_insert_policy" ON quote_line_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = quote_line_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "quote_line_items_update_policy" ON quote_line_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = quote_line_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

CREATE POLICY "quote_line_items_delete_policy" ON quote_line_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM quotes 
      WHERE quotes.id = quote_line_items.quote_id 
      AND quotes.user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE quote_line_items IS 'Individual line items within quotes for detailed breakdowns';
COMMENT ON COLUMN quote_line_items.quantity IS 'Quantity of the item (supports decimals for partial units)';
COMMENT ON COLUMN quote_line_items.unit_price_cents IS 'Unit price stored in cents for precision';
COMMENT ON COLUMN quote_line_items.total_cents IS 'Calculated total (quantity × unit_price_cents)';
COMMENT ON COLUMN quote_line_items.sort_order IS 'Order of line items within the quote';
