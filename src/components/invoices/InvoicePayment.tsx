import { useState, useEffect } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { useStripePayment } from '../../hooks/useStripePayment'
import { useInvoices } from '../../hooks/useInvoices'
import { useAuth } from '../../hooks/useAuth'
import type { Invoice } from '../../hooks/useInvoices'
import { CheckCircleIcon, CreditCardIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import PaymentForm from './PaymentForm'

interface InvoicePaymentProps {
  invoiceId: string
  onPaymentSuccess?: () => void
  onPaymentError?: (error: string) => void
}

export default function InvoicePayment({ invoiceId, onPaymentSuccess, onPaymentError }: InvoicePaymentProps) {
  const { stripePromise, createPaymentIntent, createPaymentLink, loading, error, isStripeConfigured } = useStripePayment()
  const { getInvoice } = useInvoices()
  const { user } = useAuth()
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentMode, setPaymentMode] = useState<'embedded' | 'link'>('embedded')
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [invoiceLoading, setInvoiceLoading] = useState(true)

  // Load invoice data
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setInvoiceLoading(true)
        const invoiceData = await getInvoice(invoiceId)
        setInvoice(invoiceData)
      } catch (err) {
        console.error('Error loading invoice:', err)
        onPaymentError?.('Failed to load invoice details')
      } finally {
        setInvoiceLoading(false)
      }
    }

    if (invoiceId) {
      loadInvoice()
    }
  }, [invoiceId, getInvoice, onPaymentError])

  // Handle embedded payment setup
  const handleEmbeddedPayment = async () => {
    if (!invoice) return

    try {
      const secret = await createPaymentIntent({
        invoiceId: invoice.id,
        amount: invoice.total_cents, // Already in cents
        currency: 'usd',
        metadata: {
          invoice_id: invoice.id,
          customer_id: invoice.customer_id,
          supabase_user_id: user?.id || ''
        }
      })

      if (secret) {
        setClientSecret(secret)
        setPaymentMode('embedded')
      }
    } catch (err) {
      console.error('Error creating payment intent:', err)
      onPaymentError?.('Failed to initialize payment')
    }
  }

  // Handle payment link generation
  const handlePaymentLink = async () => {
    if (!invoice) return

    try {
      const link = await createPaymentLink(invoice.id)
      if (link) {
        setPaymentLink(link)
        setPaymentMode('link')
      }
    } catch (err) {
      console.error('Error creating payment link:', err)
      onPaymentError?.('Failed to create payment link')
    }
  }

  // Handle payment success
  const handlePaymentSuccess = () => {
    onPaymentSuccess?.()
  }

  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    onPaymentError?.(errorMessage)
  }

  if (invoiceLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">
            Invoice not found or you don't have permission to view it.
          </p>
        </div>
      </div>
    )
  }

  if (!isStripeConfigured()) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">
            Payment processing is not configured. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  // Show success state if invoice is already paid
  if (invoice.status === 'paid') {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-700 mb-2">Payment Complete</h3>
        <p className="text-gray-600 mb-4">
          This invoice has been paid successfully.
        </p>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Paid ${(invoice.total_cents / 100).toFixed(2)}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Invoice Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            Payment for Invoice #{invoice.invoice_number}
          </h3>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Due:</span>
              <span className="font-semibold text-lg">${(invoice.total_cents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Customer ID:</span>
              <span>{invoice.customer_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Due Date:</span>
              <span>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                invoice.status === 'overdue' 
                  ? 'bg-red-100 text-red-800' 
                  : invoice.status === 'partially_paid'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Options */}
      {!clientSecret && !paymentLink && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Choose Payment Method</h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <button
              onClick={handleEmbeddedPayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Pay with Card'}
            </button>
            
            <div className="text-center text-gray-500">or</div>
            
            <button
              onClick={handlePaymentLink}
              disabled={loading}
              className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Get Payment Link'}
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Embedded Payment Form */}
      {clientSecret && paymentMode === 'embedded' && stripePromise && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#2563eb',
                colorBackground: '#ffffff',
                colorText: '#374151',
                colorDanger: '#ef4444',
                spacingUnit: '4px',
                borderRadius: '6px',
              },
            },
          }}
        >
          <PaymentForm
            clientSecret={clientSecret}
            invoice={invoice}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </Elements>
      )}

      {/* Payment Link Display */}
      {paymentLink && paymentMode === 'link' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Payment Link Generated</h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <p className="text-gray-600">
              Use this link to complete your payment:
            </p>
            <div className="p-3 bg-gray-50 rounded-lg break-all">
              <code className="text-sm">{paymentLink}</code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigator.clipboard.writeText(paymentLink)}
                className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm hover:bg-gray-50"
              >
                Copy Link
              </button>
              <button
                onClick={() => window.open(paymentLink, '_blank')}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700"
              >
                Open Payment Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
