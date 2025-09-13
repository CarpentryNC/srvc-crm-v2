-- Advanced Payment Troubleshooting Query
-- Run this in your Supabase SQL Editor to debug the $5 payment

-- 1. Check if invoice_payments table exists and has data
SELECT 
  'invoice_payments' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN payment_method = 'stripe' THEN 1 END) as stripe_payments,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recent_payments,
  MAX(created_at) as last_payment_date
FROM invoice_payments;

-- 2. Check for $5 payments specifically (500 cents)
SELECT 
  id,
  invoice_id,
  amount_cents,
  amount,
  payment_method,
  stripe_payment_intent_id,
  status,
  created_at,
  notes
FROM invoice_payments 
WHERE amount_cents = 500  -- $5 payment
ORDER BY created_at DESC;

-- 3. Check invoices with Stripe payment intent IDs
SELECT 
  i.id,
  i.invoice_number,
  i.status,
  i.total_cents / 100 as total_dollars,
  i.stripe_payment_intent_id,
  i.paid_date,
  i.created_at,
  COUNT(ip.id) as payment_count,
  COALESCE(SUM(ip.amount_cents), 0) / 100 as total_paid_dollars
FROM invoices i
LEFT JOIN invoice_payments ip ON i.id = ip.invoice_id
WHERE i.stripe_payment_intent_id IS NOT NULL
GROUP BY i.id, i.invoice_number, i.status, i.total_cents, i.stripe_payment_intent_id, i.paid_date, i.created_at
ORDER BY i.created_at DESC;

-- 4. Check invoice_summary view (if it exists)
SELECT 
  invoice_number,
  status as invoice_status,
  total_amount,
  total_paid,
  balance_due,
  is_fully_paid,
  customer_name
FROM invoice_summary 
WHERE total_amount = 5.00  -- $5 invoices
ORDER BY created_at DESC;

-- 5. Look for any payments with amount 500 cents in last 24 hours
SELECT 
  ip.id,
  ip.amount_cents,
  ip.payment_method,
  ip.status,
  ip.stripe_payment_intent_id,
  ip.created_at,
  i.invoice_number,
  i.status as invoice_status,
  i.total_cents as invoice_total_cents
FROM invoice_payments ip
JOIN invoices i ON ip.invoice_id = i.id
WHERE ip.amount_cents = 500
AND ip.created_at > NOW() - INTERVAL '24 hours'
ORDER BY ip.created_at DESC;
