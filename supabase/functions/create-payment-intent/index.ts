import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.5.0'
import Stripe from 'https://esm.sh/stripe@12.9.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentIntentResponse {
  success: boolean
  client_secret?: string
  payment_intent_id?: string
  error?: string
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

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    if (req.method === 'POST') {
      const requestBody = await req.json()
      console.log('Request body received:', requestBody)
      
      const { invoiceId, metadata } = requestBody
      
      if (!invoiceId) {
        throw new Error('Invoice ID is required')
      }

      console.log(`Processing payment intent for invoice: ${invoiceId}`)

      // Fetch invoice details
      console.log(`Looking for invoice: ${invoiceId} for user: ${user.id}`)
      console.log('Using service role key, should bypass RLS')
      
      // First check if invoice exists at all (debugging)
      const { data: anyInvoice, error: anyError } = await supabaseClient
        .from('invoices')
        .select('id, user_id, invoice_number, status, total_cents')
        .eq('id', invoiceId)
        .single()
      
      console.log('Invoice exists check:', { anyInvoice, anyError })
      
      // Now fetch with user check
      const { data: invoice, error: invoiceError } = await supabaseClient
        .from('invoices')
        .select(`
          *,
          customers (
            id,
            email,
            first_name,
            last_name,
            company_name,
            stripe_customer_id
          )
        `)
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single()

      console.log('Invoice query with user filter:', { invoice, invoiceError })

      if (invoiceError || !invoice) {
        console.error('Invoice fetch failed. Error details:', invoiceError)
        console.log('Invoice exists but user mismatch or RLS issue')
        throw new Error(`Invoice not found. Invoice ID: ${invoiceId}, User ID: ${user.id}, Error: ${invoiceError?.message || 'Unknown'}`)
      }

      // Check if invoice is already paid
      if (invoice.status === 'paid') {
        throw new Error('Invoice is already paid')
      }

      // Calculate amount (Stripe expects amounts in cents)
      const amount = Math.round((invoice.total_cents || 0))
      
      if (amount <= 0) {
        throw new Error('Invalid invoice amount')
      }

      // Get or create Stripe customer
      let stripeCustomerId = invoice.customers?.stripe_customer_id

      if (!stripeCustomerId && invoice.customers) {
        const customer = invoice.customers
        const stripeCustomer = await stripe.customers.create({
          email: customer.email || undefined,
          name: customer.company_name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || undefined,
          metadata: {
            supabase_customer_id: customer.id,
            supabase_user_id: user.id
          }
        })

        stripeCustomerId = stripeCustomer.id

        // Update customer with Stripe ID
        await supabaseClient
          .from('customers')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', customer.id)
          .eq('user_id', user.id)
      }

      // Create or update Payment Intent
      let paymentIntent: Stripe.PaymentIntent

      if (invoice.stripe_payment_intent_id) {
        // Try to retrieve existing payment intent
        try {
          paymentIntent = await stripe.paymentIntents.retrieve(invoice.stripe_payment_intent_id)
          
          // Always update metadata to ensure it's present, and update amount if changed
          const needsUpdate = paymentIntent.amount !== amount || 
                             !paymentIntent.metadata?.invoice_id || 
                             !paymentIntent.metadata?.supabase_user_id
          
          if (needsUpdate) {
            paymentIntent = await stripe.paymentIntents.update(invoice.stripe_payment_intent_id, {
              amount,
              metadata: {
                invoice_id: invoiceId,
                invoice_number: invoice.invoice_number,
                supabase_user_id: user.id,
                ...metadata
              }
            })
          }
        } catch (error) {
          console.error('Error retrieving payment intent:', error)
          // Create new payment intent if retrieval fails
          paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            customer: stripeCustomerId,
            metadata: {
              invoice_id: invoiceId,
              invoice_number: invoice.invoice_number,
              supabase_user_id: user.id,
              ...metadata
            },
            automatic_payment_methods: {
              enabled: true,
            },
          })
        }
      } else {
        // Create new payment intent
        paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd',
          customer: stripeCustomerId,
          metadata: {
            invoice_id: invoiceId,
            invoice_number: invoice.invoice_number,
            supabase_user_id: user.id,
            ...metadata
          },
          automatic_payment_methods: {
            enabled: true,
          },
        })

        // Update invoice with payment intent ID
        await supabaseClient
          .from('invoices')
          .update({ 
            stripe_payment_intent_id: paymentIntent.id,
            status: 'sent' // Mark as sent when payment link is created
          })
          .eq('id', invoiceId)
          .eq('user_id', user.id)
      }

      const response: PaymentIntentResponse = {
        success: true,
        client_secret: paymentIntent.client_secret || undefined,
        payment_intent_id: paymentIntent.id
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    if (req.method === 'GET') {
      // Handle payment intent status check
      const url = new URL(req.url)
      const paymentIntentId = url.searchParams.get('payment_intent_id')

      if (!paymentIntentId) {
        throw new Error('Payment Intent ID is required')
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

      // Verify this payment intent belongs to the user
      const invoiceId = paymentIntent.metadata.invoice_id
      if (!invoiceId) {
        throw new Error('Invalid payment intent metadata')
      }

      const { data: invoice, error: invoiceError } = await supabaseClient
        .from('invoices')
        .select('id, status')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single()

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found')
      }

      return new Response(JSON.stringify({
        success: true,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    return new Response('Method not allowed', {
      headers: corsHeaders,
      status: 405,
    })

  } catch (error) {
    console.error('Stripe payment error:', error)
    
    const response: PaymentIntentResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
