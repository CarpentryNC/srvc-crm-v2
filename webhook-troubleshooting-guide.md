# Stripe Webhook Troubleshooting Guide

## Issue Summary
You successfully made a $5 payment in production, but the invoice status is not updating. The payment tracking system and webhook are correctly implemented, so the issue is likely with webhook configuration or environment variables.

## Webhook Architecture
The payment completion workflow works as follows:
1. Customer completes payment via Stripe
2. Stripe sends webhook to your Edge Function: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Webhook verifies signature and processes `payment_intent.succeeded` event
4. Webhook records payment in `invoice_payments` table
5. Webhook updates invoice status to `paid` or `partially_paid`
6. Frontend polling detects changes and updates UI

## Required Environment Variables (Production)
Your Supabase Edge Functions need these environment variables:


## Troubleshooting Steps

### 1. Check Stripe Webhook Configuration
In your Stripe Dashboard:
1. Go to Developers → Webhooks
2. Verify webhook endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Check "Events to send": Must include `payment_intent.succeeded`
4. Note the webhook signing secret (starts with `whsec_`)

### 2. Check Supabase Environment Variables
In your Supabase dashboard:
1. Go to Edge Functions → stripe-webhook
2. Check environment variables are set correctly
3. Redeploy the function if variables were missing:
   ```bash
   supabase functions deploy stripe-webhook
   ```

### 3. Test Webhook Locally
Use the test script below to simulate a webhook call:

```bash
# Test webhook endpoint
curl -X POST https://your-project.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"type": "test"}'
```

### 4. Check Production Logs
1. In Supabase Dashboard → Edge Functions → stripe-webhook
2. Check the "Logs" tab for webhook calls
3. Look for errors like:
   - "Missing webhook secret"
   - "Webhook signature verification failed"
   - Database connection errors

### 5. Verify Payment Intent Metadata
The payment intent must include this metadata:
```javascript
{
  invoice_id: "your-invoice-uuid",
  supabase_user_id: "your-user-uuid",
  invoice_number: "INV-001"
}
```

## Quick Production Check
Run this query in your production database to see if the payment was recorded:

```sql
-- Check for recent Stripe payments
SELECT 
  ip.amount_cents,
  ip.payment_date,
  ip.stripe_payment_intent_id,
  ip.status,
  i.invoice_number,
  i.status as invoice_status
FROM invoice_payments ip
JOIN invoices i ON ip.invoice_id = i.id
WHERE ip.payment_method = 'stripe'
AND ip.created_at > NOW() - INTERVAL '24 hours'
ORDER BY ip.created_at DESC;
```

## Common Issues and Solutions

### Issue: Webhook receives call but fails silently
**Solution**: Check environment variables and redeploy function

### Issue: Payment intent missing metadata
**Solution**: Verify `create-payment-intent` function sets correct metadata

### Issue: RLS policy blocking webhook
**Solution**: Webhook uses service role key which bypasses RLS - this should work

### Issue: Stripe webhook not configured
**Solution**: Set up webhook endpoint in Stripe dashboard with correct events

## Next Steps
1. Check Stripe Dashboard webhook logs for delivery attempts
2. Check Supabase Edge Function logs for processing errors
3. Verify environment variables are set in production
4. If webhook was never called, add webhook endpoint to Stripe
5. If webhook failed, check logs and redeploy with correct environment variables

## Testing New Payments
Once webhook is fixed, test with a small amount to verify:
1. Payment intent creates successfully
2. Payment completes in Stripe
3. Webhook processes the event
4. Invoice status updates to "paid"
5. Payment record appears in `invoice_payments` table
