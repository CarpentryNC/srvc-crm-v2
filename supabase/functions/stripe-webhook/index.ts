import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0'
import Stripe from 'https://esm.sh/stripe@12.9.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe with secret key
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const body = await req.text()
      const signature = req.headers.get('stripe-signature')

      if (!signature) {
        throw new Error('Missing Stripe signature')
      }

      // Verify webhook signature
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
      if (!webhookSecret) {
        throw new Error('Missing webhook secret')
      }

      let event: Stripe.Event
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return new Response('Webhook signature verification failed', { status: 400 })
      }

      console.log('Received Stripe webhook event:', event.type)

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          await handlePaymentSuccess(supabaseClient, paymentIntent)
          break
        }
        
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          await handlePaymentFailure(supabaseClient, paymentIntent)
          break
        }
        
        case 'payment_intent.canceled': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          await handlePaymentCanceled(supabaseClient, paymentIntent)
          break
        }
        
        case 'invoice.payment_succeeded': {
          // Handle Stripe subscription invoice payments (future feature)
          console.log('Subscription payment succeeded:', event.data.object.id)
          break
        }
        
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response('Method not allowed', {
      headers: corsHeaders,
      status: 405,
    })

  } catch (error) {
    console.error('Stripe webhook error:', error)
    return new Response('Internal server error', {
      headers: corsHeaders,
      status: 500,
    })
  }
})

async function handlePaymentSuccess(supabaseClient: SupabaseClient, paymentIntent: Stripe.PaymentIntent) {
  const invoiceId = paymentIntent.metadata.invoice_id
  const userId = paymentIntent.metadata.supabase_user_id
  
  if (!invoiceId || !userId) {
    console.error('Missing invoice ID or user ID in payment intent metadata')
    return
  }

  try {
    console.log(`Processing successful payment for invoice ${invoiceId}`)

    // Start a transaction-like operation
    // 1. Update invoice status to paid
    const { error: invoiceUpdateError } = await supabaseClient
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        stripe_payment_intent_id: paymentIntent.id
      })
      .eq('id', invoiceId)
      .eq('user_id', userId)

    if (invoiceUpdateError) {
      throw new Error(`Failed to update invoice: ${invoiceUpdateError.message}`)
    }

    // 2. Record the payment in invoice_payments table
    const { error: paymentInsertError } = await supabaseClient
      .from('invoice_payments')
      .insert({
        invoice_id: invoiceId,
        user_id: userId,
        amount_cents: paymentIntent.amount,
        payment_date: new Date().toISOString(),
        payment_method: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        status: 'completed',
        notes: `Stripe payment - ${paymentIntent.id}`
      })

    if (paymentInsertError) {
      console.error('Failed to record payment:', paymentInsertError)
      // Don't throw here as the invoice is already marked as paid
    }

    // 3. Log the successful payment
    console.log(`Successfully processed payment for invoice ${invoiceId}, amount: $${paymentIntent.amount / 100}`)

  } catch (error) {
    console.error('Error handling payment success:', error)
    
    // Attempt to revert invoice status if payment recording failed
    try {
      await supabaseClient
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoiceId)
        .eq('user_id', userId)
    } catch (revertError) {
      console.error('Failed to revert invoice status:', revertError)
    }
  }
}

async function handlePaymentFailure(supabaseClient: SupabaseClient, paymentIntent: Stripe.PaymentIntent) {
  const invoiceId = paymentIntent.metadata.invoice_id
  const userId = paymentIntent.metadata.supabase_user_id
  
  if (!invoiceId || !userId) {
    console.error('Missing invoice ID or user ID in payment intent metadata')
    return
  }

  try {
    console.log(`Processing failed payment for invoice ${invoiceId}`)

    // Record the failed payment attempt
    const { error: paymentInsertError } = await supabaseClient
      .from('invoice_payments')
      .insert({
        invoice_id: invoiceId,
        user_id: userId,
        amount_cents: paymentIntent.amount,
        payment_date: new Date().toISOString(),
        payment_method: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        status: 'failed',
        notes: `Stripe payment failed - ${paymentIntent.id}. Reason: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
      })

    if (paymentInsertError) {
      console.error('Failed to record payment failure:', paymentInsertError)
    }

    console.log(`Recorded failed payment attempt for invoice ${invoiceId}`)

  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handlePaymentCanceled(supabaseClient: SupabaseClient, paymentIntent: Stripe.PaymentIntent) {
  const invoiceId = paymentIntent.metadata.invoice_id
  const userId = paymentIntent.metadata.supabase_user_id
  
  if (!invoiceId || !userId) {
    console.error('Missing invoice ID or user ID in payment intent metadata')
    return
  }

  try {
    console.log(`Processing canceled payment for invoice ${invoiceId}`)

    // Record the canceled payment
    const { error: paymentInsertError } = await supabaseClient
      .from('invoice_payments')
      .insert({
        invoice_id: invoiceId,
        user_id: userId,
        amount_cents: paymentIntent.amount,
        payment_date: new Date().toISOString(),
        payment_method: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        status: 'refunded', // Using refunded status for canceled payments
        notes: `Stripe payment canceled - ${paymentIntent.id}`
      })

    if (paymentInsertError) {
      console.error('Failed to record payment cancellation:', paymentInsertError)
    }

    console.log(`Recorded canceled payment for invoice ${invoiceId}`)

  } catch (error) {
    console.error('Error handling payment cancellation:', error)
  }
}
