-- =============================================
-- MAKE EMAIL OPTIONAL FOR CUSTOMERS
-- =============================================
-- This migration makes the email field optional in the customers table
-- to support customers who may not have email addresses

-- Step 1: Drop the existing unique constraint that includes email
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_email_user_unique;

-- Step 2: Make email field nullable and update the check constraint
ALTER TABLE public.customers 
  ALTER COLUMN email DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS customers_email_check,
  ADD CONSTRAINT customers_email_check 
    CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Step 3: Add a new unique constraint that only applies when email is not null
-- This prevents duplicate emails while allowing multiple customers with null emails
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email_user_unique 
  ON public.customers(email, user_id) 
  WHERE email IS NOT NULL;

-- Step 4: Update the performance index to account for nullable emails
DROP INDEX IF EXISTS idx_customers_email;
CREATE INDEX IF NOT EXISTS idx_customers_email 
  ON public.customers(user_id, email) 
  WHERE email IS NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN public.customers.email IS 'Customer email address (optional). When provided, must be unique per user.';
