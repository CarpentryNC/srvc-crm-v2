-- Manual Recovery for Failed Webhook Payments
-- Run this in your production Supabase SQL Editor

-- Step 1: Find invoices with payment intent IDs but no corresponding payments
SELECT 
  i.id as invoice_id,
  i.invoice_number,
  i.status as current_status,
  i.total_cents / 100 as total_amount,
  i.stripe_payment_intent_id,
  i.created_at,
  COUNT(ip.id) as payment_count
FROM invoices i
LEFT JOIN invoice_payments ip ON i.id = ip.invoice_id AND ip.status = 'completed'
WHERE i.stripe_payment_intent_id IS NOT NULL
  AND i.status NOT IN ('paid', 'cancelled')
GROUP BY i.id, i.invoice_number, i.status, i.total_cents, i.stripe_payment_intent_id, i.created_at
HAVING COUNT(ip.id) = 0  -- No payments recorded
ORDER BY i.created_at DESC;

-- Step 2: Check if there are any failed payment attempts
SELECT 
  ip.id,
  ip.invoice_id,
  ip.amount_cents / 100 as amount,
  ip.payment_method,
  ip.status,
  ip.stripe_payment_intent_id,
  ip.notes,
  ip.created_at,
  i.invoice_number,
  i.status as invoice_status
FROM invoice_payments ip
JOIN invoices i ON ip.invoice_id = i.id
WHERE ip.status = 'failed'
AND ip.created_at > NOW() - INTERVAL '7 days'
ORDER BY ip.created_at DESC;

-- Step 3: For recovery, you would need to check Stripe dashboard for successful payments
-- that correspond to the payment intent IDs from Step 1, then either:
-- A) Retry the webhook call in Stripe dashboard, or  
-- B) Manually insert the payment record and update invoice status
