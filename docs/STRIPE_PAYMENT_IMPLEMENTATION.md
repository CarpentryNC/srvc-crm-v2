# Stripe Payment Processing Implementation Guide

This document outlines the complete Stripe payment processing implementation for the SRVC Base application.

## Overview

We have implemented a comprehensive Stripe payment system that allows customers to pay invoices using various payment methods including cards, Apple Pay, and Google Pay. The implementation includes both server-side Edge Functions and client-side React components.

## Architecture

### Server-Side Components

#### 1. Edge Functions (`supabase/functions/`)

**create-payment-intent/index.ts**
- Creates Stripe payment intents for invoices
- Handles customer creation and updates
- Manages invoice status updates
- Includes comprehensive error handling and security

**stripe-webhook/index.ts**
- Processes Stripe webhook events
- Records payment confirmations
- Updates invoice status automatically
- Handles payment failures and refunds

### Client-Side Components

#### 1. Payment Hook (`src/hooks/useStripePayment.ts`)
- Manages Stripe client-side operations
- Creates payment intents via Edge Functions
- Handles payment confirmation
- Provides payment status checking
- Supports both embedded and link payment flows

#### 2. Payment Components (`src/components/invoices/`)

**InvoicePayment.tsx**
- Main payment interface component
- Displays invoice summary and payment options
- Integrates Stripe Elements for embedded payments
- Supports payment link generation

**PaymentForm.tsx**
- Stripe Elements payment form
- Handles payment submission and confirmation
- Provides real-time payment status updates
- Includes error handling and success states

#### 3. Integration (`src/components/invoices/InvoiceView.tsx`)
- Added "Pay with Stripe" button to invoice view
- Modal integration for Stripe payment flow
- Success/error handling with toast notifications

## Features

### Payment Methods Supported
- Credit/Debit Cards (Visa, Mastercard, Amex, etc.)
- Apple Pay
- Google Pay
- ACH Bank Transfers (via Stripe)

### Payment Flows
1. **Embedded Payment**: Direct payment form within the application
2. **Payment Links**: Shareable links for external payment processing

### Security Features
- Webhook signature verification
- PCI-compliant payment processing via Stripe
- Secure payment intent creation with metadata
- User authentication required for all operations

## Configuration

### Environment Variables Required

```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase (already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Schema

The implementation uses existing invoice tables with additional Stripe fields:

```sql
-- invoices table includes:
stripe_payment_intent_id TEXT -- Links to Stripe payment intent

-- invoice_payments table includes:
stripe_payment_intent_id TEXT -- For tracking Stripe payments
payment_method TEXT -- Payment method used
reference_number TEXT -- Stripe charge ID or reference
```

## Usage

### For Customers

1. **View Invoice**: Navigate to an invoice with pending status
2. **Choose Payment Method**: Click "Pay with Stripe" button
3. **Complete Payment**: 
   - Use embedded form for immediate payment
   - Or generate payment link for later payment
4. **Confirmation**: Receive immediate confirmation upon successful payment

### For Business Users

1. **Payment Tracking**: View real-time payment status on invoices
2. **Payment History**: See all payment attempts and successes
3. **Manual Recording**: Still available for non-Stripe payments
4. **Automatic Updates**: Invoice status updates automatically upon payment

## Development Setup

### 1. Install Dependencies
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Deploy Edge Functions
```bash
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
```

### 3. Configure Stripe Webhook
- Add webhook endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- Copy webhook secret to environment variables

### 4. Test Payment Flow
- Use Stripe test cards for development
- Test card: 4242 4242 4242 4242 (Visa)
- Any future date for expiry
- Any 3-digit CVC

## API Reference

### useStripePayment Hook

```typescript
const {
  createPaymentIntent,
  confirmPayment,
  createPaymentLink,
  getPaymentStatus,
  loading,
  error,
  isStripeConfigured
} = useStripePayment()
```

### Edge Function Endpoints

#### Create Payment Intent
```http
POST /functions/v1/create-payment-intent
Authorization: Bearer <user_jwt>
Content-Type: application/json

{
  "invoiceId": "invoice_uuid",
  "returnUrl": "https://your-app.com/invoices/uuid",
  "metadata": {
    "invoice_id": "uuid",
    "customer_id": "uuid"
  }
}
```

#### Stripe Webhook
```http
POST /functions/v1/stripe-webhook
Stripe-Signature: <webhook_signature>
Content-Type: application/json

{
  "type": "payment_intent.succeeded",
  "data": { ... }
}
```

## Error Handling

### Common Error Scenarios
1. **Invalid Payment Method**: Display user-friendly error message
2. **Insufficient Funds**: Show decline reason from Stripe
3. **Authentication Required**: Handle 3D Secure flow automatically
4. **Network Issues**: Retry mechanism with exponential backoff

### Error Recovery
- Failed payments remain in `requires_payment_method` status
- Users can retry with same or different payment method
- Manual payment recording still available as fallback

## Testing

### Test Scenarios
1. **Successful Payment**: Use test card 4242 4242 4242 4242
2. **Declined Payment**: Use test card 4000 0000 0000 0002
3. **Authentication Required**: Use test card 4000 0000 0000 3220
4. **Processing Error**: Use test card 4000 0000 0000 0119

### Webhook Testing
- Use Stripe CLI for local webhook testing
- Verify webhook signature validation
- Test all supported event types

## Monitoring

### Key Metrics to Monitor
- Payment success rate
- Payment processing time
- Webhook delivery success
- Error rates by type

### Logging
- All payment attempts logged with metadata
- Error details captured for debugging
- Webhook events logged with processing status

## Security Considerations

### Data Protection
- No card data stored in application database
- All sensitive operations server-side only
- Webhook signature verification required
- User authentication required for all operations

### Compliance
- PCI DSS compliance through Stripe
- GDPR compliance for customer data
- SOC 2 Type II compliance via Stripe infrastructure

## Support and Troubleshooting

### Common Issues

1. **Payment Intent Creation Fails**
   - Check Stripe API key configuration
   - Verify user authentication
   - Ensure invoice exists and is accessible

2. **Webhook Not Receiving Events**
   - Verify webhook URL configuration in Stripe
   - Check webhook secret configuration
   - Review Supabase Edge Function logs

3. **Payment Form Not Loading**
   - Verify Stripe publishable key
   - Check browser console for errors
   - Ensure proper Stripe Elements setup

### Debug Mode
Enable debug logging by setting `VITE_APP_ENV=development` to see detailed Stripe logs.

## Future Enhancements

### Planned Features
1. **Recurring Payments**: Subscription-based billing
2. **Split Payments**: Partial payments with remaining balance
3. **Payment Plans**: Installment payment options
4. **Multi-Currency**: Support for international customers
5. **Advanced Reporting**: Detailed payment analytics

### Integration Opportunities
1. **Accounting Software**: QuickBooks/Xero integration
2. **CRM Systems**: Enhanced customer payment history
3. **Marketing Tools**: Payment-based customer segmentation
4. **Mobile App**: React Native payment components

---

*This implementation provides a robust, secure, and user-friendly payment processing system that scales with business growth and meets modern payment experience expectations.*
