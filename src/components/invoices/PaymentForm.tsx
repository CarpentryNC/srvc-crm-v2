import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { Invoice } from '../../hooks/useInvoices'

interface PaymentFormProps {
  clientSecret?: string // Optional since it's passed via Stripe Elements context
  invoice: Invoice
  onSuccess: () => void
  onError: (error: string) => void
}

export default function PaymentForm({ invoice, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'ready' | 'processing' | 'succeeded' | 'failed'>('ready')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setPaymentStatus('processing')
    setErrorMessage(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      })

      if (error) {
        setPaymentStatus('failed')
        setErrorMessage(error.message || 'Payment failed')
        onError(error.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('succeeded')
        onSuccess()
      } else {
        setPaymentStatus('failed')
        setErrorMessage('Payment was not completed')
        onError('Payment was not completed')
      }
    } catch (err) {
      setPaymentStatus('failed')
      const message = err instanceof Error ? err.message : 'Payment failed'
      setErrorMessage(message)
      onError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  if (paymentStatus === 'succeeded') {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-700 mb-2">Payment Successful!</h3>
        <p className="text-gray-600 mb-4">
          Your payment of ${(invoice.total_cents / 100).toFixed(2)} has been processed successfully.
        </p>
        <p className="text-sm text-gray-500">
          Invoice #{invoice.invoice_number} is now paid.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Complete Payment</h3>
        <p className="text-sm text-gray-600 mt-1">
          Enter your payment details below to pay ${(invoice.total_cents / 100).toFixed(2)}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="px-6 py-4">
        <div className="mb-6">
          <PaymentElement
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
              defaultValues: {
                billingDetails: {
                  email: '',
                  name: '',
                }
              }
            }}
          />
        </div>

        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Total Amount:</span>
          <span className="text-xl font-bold text-gray-900">
            ${(invoice.total_cents / 100).toFixed(2)}
          </span>
        </div>

        <button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
            isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isProcessing ? 'Processing Payment...' : `Pay $${(invoice.total_cents / 100).toFixed(2)}`}
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
          Your payment is secured by Stripe. Your card information is encrypted and never stored on our servers.
        </p>
      </form>
    </div>
  )
}
