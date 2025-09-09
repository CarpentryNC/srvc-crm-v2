-- =============================================
-- FIX CUSTOMER CONSTRAINTS FOR UPSERT
-- =============================================
-- This migration adds a proper unique constraint that works with upsert
-- while maintaining support for optional emails

-- Drop the conditional unique index (it doesn't work with upsert)
DROP INDEX IF EXISTS idx_customers_email_user_unique;

-- Add a proper unique constraint for non-null emails
-- We'll use a composite constraint that works with upsert
ALTER TABLE public.customers 
  ADD CONSTRAINT customers_email_user_unique 
    UNIQUE (user_id, email);

-- Note: This constraint will still allow multiple NULL emails for the same user
-- because NULL values are not considered equal in PostgreSQL unique constraints

-- Add a comment to document this change
COMMENT ON CONSTRAINT customers_email_user_unique ON public.customers 
  IS 'Ensures unique email per user. NULL emails are allowed and not considered duplicates.';
