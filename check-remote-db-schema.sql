-- Quick diagnostic query to check remote database state
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/lrvzqxyqrrjusvwazaak/sql)

-- 1. Check if invoice_payments table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'invoice_payments'
ORDER BY ordinal_position;

-- 2. Check if invoice_summary view exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'invoice_summary'
ORDER BY ordinal_position;

-- 3. Check recent payment attempts (if table exists)
SELECT COUNT(*) as payment_records_count 
FROM invoice_payments 
WHERE payment_method = 'stripe'
AND created_at > NOW() - INTERVAL '24 hours';

-- 4. Check if webhooks tried to write but failed
-- Look for any error patterns in recent activity
