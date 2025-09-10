-- Add quote_id field to jobs table for quote-to-job conversion tracking
-- This enables seamless conversion of accepted quotes into active jobs

-- Add the quote_id column with foreign key constraint
ALTER TABLE jobs 
ADD COLUMN quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL;

-- Add index for performance on quote_id lookups
CREATE INDEX idx_jobs_quote_id ON jobs(quote_id) WHERE quote_id IS NOT NULL;

-- Add constraint to ensure jobs can be linked to either request OR quote (not both)
ALTER TABLE jobs
ADD CONSTRAINT jobs_source_constraint
CHECK (
  (request_id IS NOT NULL AND quote_id IS NULL) OR 
  (request_id IS NULL AND quote_id IS NOT NULL) OR 
  (request_id IS NULL AND quote_id IS NULL)
);

-- Comment the table to document the change
COMMENT ON COLUMN jobs.quote_id IS 'Foreign key to quote that this job was converted from (optional)';
COMMENT ON CONSTRAINT jobs_source_constraint ON jobs IS 'Ensures job can be linked to either request OR quote, not both';
