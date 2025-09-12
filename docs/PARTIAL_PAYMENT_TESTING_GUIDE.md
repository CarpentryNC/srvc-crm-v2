# Partial Payment System - End-to-End Testing Guide

## 🎯 Test Objectives
Verify that the enhanced payment system correctly handles partial payments, updates invoice status, and displays proper UI feedback in real-time.

## 🧪 Test Scenarios

### **Scenario 1: Basic Partial Payment Flow**
1. **Setup:**
   - Log into the application at http://localhost:5173
   - Navigate to Invoices section
   - Find or create an invoice with status 'sent'

2. **Test Steps:**
   - Click "View" on an invoice
   - Click "Make Payment" button
   - Choose Stripe payment option
   - Enter a payment amount LESS than the total invoice amount
   - Complete the Stripe payment flow
   - Observe real-time status updates

3. **Expected Results:**
   - ✅ Payment form shows payment amount options
   - ✅ Stripe payment completes successfully
   - ✅ Enhanced success modal displays with progress indicators
   - ✅ Invoice status automatically updates to 'partially_paid'
   - ✅ Balance due reflects the remaining amount
   - ✅ Payment appears in payment history
   - ✅ Invoice list shows yellow 'Partially Paid' badge

### **Scenario 2: Complete Payment After Partial**
1. **Setup:**
   - Use an invoice from Scenario 1 that has 'partially_paid' status

2. **Test Steps:**
   - Make another payment for the remaining balance
   - Complete the Stripe payment flow

3. **Expected Results:**
   - ✅ Invoice status updates to 'paid'
   - ✅ Balance due shows $0.00
   - ✅ Invoice list shows green 'Paid' badge
   - ✅ All payments appear in payment history

### **Scenario 3: UI Status Display Tests**
1. **Invoice List View:**
   - ✅ 'Partially Paid' status shows yellow badge
   - ✅ Filter dropdown includes 'Partially Paid' option
   - ✅ Summary stats include partially paid invoices

2. **Invoice Detail View:**
   - ✅ Status badge displays correct color and text
   - ✅ Balance due calculation is accurate
   - ✅ Payment history shows all payments
   - ✅ Real-time updates work without page refresh

3. **Email Modal:**
   - ✅ 'Partially Paid' badge appears in email preview
   - ✅ Email templates handle partial payment status

### **Scenario 4: Webhook Integration Test**
1. **Setup:**
   - Use production Stripe keys to test real webhook flow
   - Monitor Supabase Edge Functions logs

2. **Test Steps:**
   - Make a partial payment via Stripe
   - Check webhook processing in Edge Functions

3. **Expected Results:**
   - ✅ Webhook receives payment success event
   - ✅ Balance calculations are correct
   - ✅ Status determination logic works (paid vs partially_paid)
   - ✅ Database updates reflect proper payment tracking

## 🔍 Verification Points

### **Database Verification:**
```sql
-- Check invoice status constraint includes 'partially_paid'
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'invoices_status_check';

-- Check invoices with partial payments
SELECT 
  invoice_number, 
  status, 
  total_cents,
  (SELECT COALESCE(SUM(amount_cents), 0) 
   FROM invoice_payments 
   WHERE invoice_id = invoices.id AND status = 'completed') as paid_amount
FROM invoices 
WHERE status = 'partially_paid';
```

### **UI Component Verification:**
- InvoiceList.tsx: ✅ Filter and badge display
- InvoiceView.tsx: ✅ Status display and real-time updates  
- PaymentForm.tsx: ✅ Success modal and polling
- PaymentStatusDashboard.tsx: ✅ Payment tracking integration
- SendInvoiceEmailModal.tsx: ✅ Status badge display

### **Real-time Subscription Verification:**
- ✅ Payment updates trigger real-time UI refresh
- ✅ Invoice status changes appear immediately
- ✅ Balance calculations update without page reload

## 🚀 Testing Instructions

### **Step 1: Environment Setup**
1. Ensure development server is running (localhost:5173)
2. Confirm local Supabase is running (localhost:54321)
3. Verify Stripe webhook function is deployed
4. Check that production database has 'partially_paid' constraint

### **Step 2: Create Test Data**
1. Log into the application
2. Create or find a customer
3. Create an invoice with multiple line items
4. Set invoice status to 'sent'
5. Note the total amount for partial payment calculations

### **Step 3: Execute Test Scenarios**
Follow each scenario in order, documenting results

### **Step 4: Verify All Components**
Test each UI component and verify proper status display

## 🎉 Success Criteria
- All invoice statuses display correctly
- Partial payments update status to 'partially_paid'
- Complete payments update status to 'paid'
- Real-time updates work seamlessly
- Webhook processing handles balance calculations
- UI components show proper badges and styling
- Payment history tracks all transactions accurately

## 🔧 Troubleshooting
- If status doesn't update: Check real-time subscriptions
- If payments don't record: Check webhook function logs
- If UI doesn't refresh: Check useEffect dependencies
- If balance is wrong: Check payment calculation logic
