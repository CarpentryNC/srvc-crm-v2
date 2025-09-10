-- Add title field to quote_line_items table
-- This allows for separate title and description fields for better line item organization

-- Add the title column
ALTER TABLE quote_line_items 
ADD COLUMN title text;

-- Add constraint to ensure title is not empty when provided
ALTER TABLE quote_line_items 
ADD CONSTRAINT quote_line_items_title_check 
CHECK (
  title IS NULL OR 
  (length(TRIM(BOTH FROM title)) >= 1 AND length(TRIM(BOTH FROM title)) <= 100)
);

-- Update existing description constraint to allow longer descriptions since we now have titles
ALTER TABLE quote_line_items 
DROP CONSTRAINT IF EXISTS quote_line_items_description_check;

ALTER TABLE quote_line_items 
ADD CONSTRAINT quote_line_items_description_check 
CHECK (length(TRIM(BOTH FROM description)) >= 1 AND length(TRIM(BOTH FROM description)) <= 1000);

-- Comment the table to document the change
COMMENT ON COLUMN quote_line_items.title IS 'Short title/name for the line item (optional, max 100 chars)';
COMMENT ON COLUMN quote_line_items.description IS 'Detailed description of the line item (required, max 1000 chars)';
