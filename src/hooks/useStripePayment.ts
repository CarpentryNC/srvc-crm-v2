import { useState, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import type { StripeElements } from '@stripe/stripe-js'
import { useAuth } from './useAuth'

// Stripe configuration
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = loadStripe(stripePublishableKey)

// Get Supabase URL from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export interface PaymentIntentData {
  invoiceId: string
  amount: number
  currency: string
  customer_email?: string
  metadata?: Record<string, string>
}

export interface PaymentResult {
  success: boolean
  payment_intent_id?: string
  error?: string
  requires_action?: boolean
}

export interface StripePaymentStatus {
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'requires_capture' | 'canceled'
  amount: number
  currency: string
  metadata: Record<string, string>
}

export function useStripePayment() {
  const { user, session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create payment intent on the server
  const createPaymentIntent = useCallback(async (paymentData: PaymentIntentData): Promise<string | null> => {
    if (!user || !session) {
      setError('User not authenticated')
      return null
    }

    try {
      setError(null)
      setLoading(true)

      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: paymentData.invoiceId,
          returnUrl: window.location.origin + '/invoices/' + paymentData.invoiceId,
          metadata: paymentData.metadata || {}
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment intent')
      }

      return result.client_secret
    } catch (err) {
      console.error('Error creating payment intent:', err)
      setError(err instanceof Error ? err.message : 'Failed to create payment intent')
      return null
    } finally {
      setLoading(false)
    }
  }, [user, session])

  // Process payment with Stripe Elements
  const confirmPayment = useCallback(async (
    clientSecret: string,
    paymentElement: StripeElements,
    confirmationOptions?: {
      return_url?: string
      receipt_email?: string
    }
  ): Promise<PaymentResult> => {
    if (!stripePromise) {
      return { success: false, error: 'Stripe not initialized' }
    }

    try {
      setError(null)
      setLoading(true)

      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Failed to load Stripe')
      }

      const { error: submitError } = await paymentElement.submit()
      if (submitError) {
        throw new Error(submitError.message)
      }

      const result = await stripe.confirmPayment({
        elements: paymentElement,
        clientSecret,
        confirmParams: {
          return_url: confirmationOptions?.return_url || window.location.href,
          receipt_email: confirmationOptions?.receipt_email,
        },
      })

      if (result.error) {
        // Payment failed
        return {
          success: false,
          error: result.error.message,
          requires_action: result.error.type === 'card_error' && result.error.code === 'authentication_required'
        }
      }

      // Payment succeeded - return success without detailed payment intent data
      return {
        success: true,
        payment_intent_id: clientSecret.split('_secret_')[0] // Extract PI ID from client secret
      }

    } catch (err) {
      console.error('Error confirming payment:', err)
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Payment confirmation failed'
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Create payment link for invoice (redirect-based payment)
  const createPaymentLink = useCallback(async (invoiceId: string): Promise<string | null> => {
    if (!user || !session) {
      setError('User not authenticated')
      return null
    }

    try {
      setError(null)
      setLoading(true)

      // First create the payment intent
      const clientSecret = await createPaymentIntent({ invoiceId, amount: 0, currency: 'usd' })
      
      if (!clientSecret) {
        throw new Error('Failed to create payment intent')
      }

      // Extract payment intent ID from client secret
      const paymentIntentId = clientSecret.split('_secret_')[0]

      // Create a payment link using Stripe's hosted checkout
      const paymentUrl = `${window.location.origin}/pay/${paymentIntentId}?client_secret=${clientSecret}`
      
      return paymentUrl
    } catch (err) {
      console.error('Error creating payment link:', err)
      setError(err instanceof Error ? err.message : 'Failed to create payment link')
      return null
    } finally {
      setLoading(false)
    }
  }, [user, session, createPaymentIntent])

  // Check payment status
  const getPaymentStatus = useCallback(async (paymentIntentId: string): Promise<StripePaymentStatus | null> => {
    if (!user || !session) {
      setError('User not authenticated')
      return null
    }

    try {
      setError(null)

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/create-payment-intent?payment_intent_id=${paymentIntentId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment status')
      }

      return {
        status: result.status,
        amount: result.amount,
        currency: result.currency,
        metadata: result.metadata || {}
      }
    } catch (err) {
      console.error('Error getting payment status:', err)
      setError(err instanceof Error ? err.message : 'Failed to get payment status')
      return null
    }
  }, [user, session])

  // Retry failed payment
  const retryPayment = useCallback(async (paymentIntentId: string): Promise<string | null> => {
    if (!stripePromise) {
      setError('Stripe not initialized')
      return null
    }

    try {
      setError(null)
      setLoading(true)

      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Failed to load Stripe')
      }

      const { paymentIntent, error } = await stripe.retrievePaymentIntent(paymentIntentId)

      if (error) {
        throw new Error(error.message)
      }

      if (paymentIntent.status === 'succeeded') {
        return null // Already paid
      }

      return paymentIntent.client_secret
    } catch (err) {
      console.error('Error retrying payment:', err)
      setError(err instanceof Error ? err.message : 'Failed to retry payment')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Cancel payment intent
  const cancelPayment = useCallback(async (paymentIntentId: string): Promise<boolean> => {
    if (!stripePromise) {
      setError('Stripe not initialized')
      return false
    }

    try {
      setError(null)
      setLoading(true)

      // Note: Payment intent cancellation should be done server-side for security
      // This is a placeholder for the UI - actual cancellation should go through Edge Function
      console.log('Payment cancellation requested for:', paymentIntentId)
      
      return true
    } catch (err) {
      console.error('Error canceling payment:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel payment')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Check if Stripe is properly configured
  const isStripeConfigured = useCallback(() => {
    return !!(
      stripePublishableKey && 
      stripePublishableKey !== 'pk_test_your-publishable-key-here' &&
      stripePublishableKey.startsWith('pk_')
    )
  }, [])

  return {
    // State
    loading,
    error,
    
    // Payment operations
    createPaymentIntent,
    confirmPayment,
    createPaymentLink,
    getPaymentStatus,
    retryPayment,
    cancelPayment,
    
    // Utilities
    isStripeConfigured,
    stripePromise
  }
}
