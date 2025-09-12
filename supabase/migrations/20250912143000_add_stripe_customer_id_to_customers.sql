-- Add stripe_customer_id column to customers table for Stripe integration
-- This column stores the Stripe customer ID for payment processing

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS stripe_customer_id text CHECK (stripe_customer_id IS NULL OR length(stripe_customer_id) BETWEEN 1 AND 200);

-- Add index for performance when looking up customers by Stripe ID
CREATE INDEX IF NOT EXISTS idx_customers_stripe_customer_id 
ON public.customers(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Update type definitions comment
COMMENT ON COLUMN public.customers.stripe_customer_id IS 'Stripe Customer ID for payment processing integration';

-- Verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'customers' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    RAISE EXCEPTION 'stripe_customer_id column was not added to customers table';
  END IF;
  
  RAISE NOTICE 'stripe_customer_id column added successfully to customers table ✅';
END $$;
