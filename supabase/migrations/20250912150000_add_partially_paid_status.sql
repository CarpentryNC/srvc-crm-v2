-- Add 'partially_paid' status to invoices table for better payment tracking
-- This allows invoices to have a status between 'sent' and 'paid'

-- Drop existing constraint
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Add new constraint with 'partially_paid' status
ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled'));

-- Update any existing invoices that have partial payments to 'partially_paid' status
-- This ensures data consistency after the migration
UPDATE public.invoices 
SET status = 'partially_paid'
WHERE status = 'sent' 
  AND id IN (
    SELECT DISTINCT invoice_id 
    FROM invoice_payments 
    WHERE status = 'completed'
  )
  AND (
    SELECT COALESCE(SUM(amount_cents), 0) 
    FROM invoice_payments 
    WHERE invoice_id = invoices.id 
      AND status = 'completed'
  ) < total_cents
  AND (
    SELECT COALESCE(SUM(amount_cents), 0) 
    FROM invoice_payments 
    WHERE invoice_id = invoices.id 
      AND status = 'completed'
  ) > 0;

-- Add comment for documentation
COMMENT ON CONSTRAINT invoices_status_check ON public.invoices IS 
'Invoice status constraint: draft (being created), sent (delivered to customer), partially_paid (some payment received), paid (fully paid), overdue (past due date), cancelled (voided)';

-- Verification
DO $$
BEGIN
  -- Test that the new constraint allows 'partially_paid'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'invoices_status_check' 
    AND check_clause LIKE '%partially_paid%'
  ) THEN
    RAISE EXCEPTION 'partially_paid status was not added to invoices status constraint';
  END IF;
  
  RAISE NOTICE 'partially_paid status added successfully to invoices table ✅';
END $$;
