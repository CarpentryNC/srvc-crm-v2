import { useState } from 'react'
import { useQuotes, type Quote } from '../../hooks/useQuotes'

interface QuotePreviewProps {
  quote: Quote
  onEdit?: () => void
  onStatusChange?: (status: Quote['status']) => void
}

export default function QuotePreview({ quote, onEdit, onStatusChange }: QuotePreviewProps) {
  const { updateQuote } = useQuotes()
  const [generatingPDF, setGeneratingPDF] = useState(false)

  const customerName = quote.customer
    ? `${quote.customer.first_name} ${quote.customer.last_name}`
    : 'Unknown Customer'

  const customerAddress = quote.customer && (
    quote.customer.address_street ||
    quote.customer.address_city ||
    quote.customer.address_state ||
    quote.customer.address_zip
  ) ? [
    quote.customer.address_street,
    [quote.customer.address_city, quote.customer.address_state].filter(Boolean).join(', '),
    quote.customer.address_zip
  ].filter(Boolean).join(', ') : null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleStatusChange = async (newStatus: Quote['status']) => {
    if (onStatusChange) {
      onStatusChange(newStatus)
    } else {
      const updated = await updateQuote(quote.id, { status: newStatus })
      if (updated) {
        // Quote will be updated via real-time subscription
      }
    }
  }

  const generatePDF = async () => {
    setGeneratingPDF(true)
    try {
      // For now, we'll use the browser's print functionality
      // In a real implementation, you might use a library like jsPDF or react-pdf
      window.print()
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setGeneratingPDF(false)
    }
  }

  const getStatusBadge = (status: Quote['status']) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepted' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      expired: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Expired' }
    }
    
    const config = statusConfig[status]
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                Quote Preview
              </h1>
              {getStatusBadge(quote.status)}
            </div>

            <div className="flex items-center space-x-3">
              {/* Status Actions */}
              {quote.status === 'draft' && (
                <button
                  onClick={() => handleStatusChange('sent')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Mark as Sent
                </button>
              )}

              {quote.status === 'sent' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusChange('accepted')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Mark Accepted
                  </button>
                  <button
                    onClick={() => handleStatusChange('rejected')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Mark Rejected
                  </button>
                </div>
              )}

              {/* PDF Export */}
              <button
                onClick={generatePDF}
                disabled={generatingPDF}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {generatingPDF ? 'Generating...' : 'Export PDF'}
              </button>

              {/* Edit Button */}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Quote
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quote Document */}
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 print:max-w-none print:py-0 print:px-0">
        <div className="bg-white shadow-lg rounded-lg print:shadow-none print:rounded-none">
          <div className="p-8 print:p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 print:mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">QUOTE</h1>
                <p className="text-lg text-gray-600 mt-2 print:text-base">
                  {quote.quote_number}
                </p>
              </div>
              
              {/* Company Info - This would come from settings in a real app */}
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900 print:text-lg">
                  Your Company Name
                </div>
                <div className="text-gray-600 mt-1 print:text-sm">
                  123 Business Street<br />
                  City, State 12345<br />
                  (555) 123-4567<br />
                  email@company.com
                </div>
              </div>
            </div>

            {/* Quote and Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 print:mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">Quote For:</h2>
                <div className="text-gray-700 print:text-sm">
                  <div className="font-medium text-lg print:text-base">{customerName}</div>
                  {quote.customer?.company_name && (
                    <div className="font-medium">{quote.customer.company_name}</div>
                  )}
                  {customerAddress && (
                    <div className="mt-1">{customerAddress}</div>
                  )}
                  {quote.customer?.email && (
                    <div className="mt-1">{quote.customer.email}</div>
                  )}
                  {quote.customer?.phone && (
                    <div className="mt-1">{quote.customer.phone}</div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">Quote Details:</h2>
                <div className="space-y-2 text-gray-700 print:text-sm">
                  <div className="flex justify-between">
                    <span>Quote Number:</span>
                    <span className="font-medium">{quote.quote_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date Created:</span>
                    <span>{formatDate(quote.created_at)}</span>
                  </div>
                  {quote.valid_until && (
                    <div className="flex justify-between">
                      <span>Valid Until:</span>
                      <span>{formatDate(quote.valid_until)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium capitalize">{quote.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Title and Description */}
            <div className="mb-8 print:mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3 print:text-lg">
                {quote.title}
              </h2>
              {quote.description && (
                <p className="text-gray-700 print:text-sm">
                  {quote.description}
                </p>
              )}
            </div>

            {/* Line Items - Placeholder for now */}
            <div className="mb-8 print:mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 print:text-base">
                Items & Services
              </h3>
              
              {/* This would be populated from actual line items in a real implementation */}
              <div className="bg-gray-50 p-4 rounded-lg print:bg-transparent print:border print:border-gray-300">
                <p className="text-gray-600 text-sm italic">
                  Line items will be displayed here. This is currently a placeholder as line items 
                  are not stored in the database yet - they would typically be in a separate 
                  quote_line_items table.
                </p>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-end">
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(quote.subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-700">
                    <span>Tax:</span>
                    <span>{formatCurrency(quote.tax_amount)}</span>
                  </div>
                  
                  <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-200 pt-3">
                    <span>Total:</span>
                    <span>{formatCurrency(quote.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mt-8 pt-6 border-t border-gray-200 print:mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-base">
                Terms & Conditions
              </h3>
              <div className="text-sm text-gray-600 space-y-2 print:text-xs">
                <p>• Payment is due within 30 days of quote acceptance.</p>
                <p>• This quote is valid for 30 days from the date issued.</p>
                <p>• All work will be completed according to industry standards.</p>
                <p>• Additional charges may apply for changes to the original scope of work.</p>
                <p>• Customer is responsible for obtaining necessary permits unless otherwise specified.</p>
              </div>
            </div>

            {/* Signature Section */}
            <div className="mt-8 pt-6 border-t border-gray-200 print:mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Acceptance:</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="border-b border-gray-300 pb-1 mb-1">
                        <span className="text-xs text-gray-500">Signature</span>
                      </div>
                    </div>
                    <div>
                      <div className="border-b border-gray-300 pb-1 mb-1">
                        <span className="text-xs text-gray-500">Date</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Company Representative:</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="border-b border-gray-300 pb-1 mb-1">
                        <span className="text-xs text-gray-500">Signature</span>
                      </div>
                    </div>
                    <div>
                      <div className="border-b border-gray-300 pb-1 mb-1">
                        <span className="text-xs text-gray-500">Date</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500 print:mt-6">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
