import { useState } from 'react'
import { useQuotes, type Quote } from '../../hooks/useQuotes'
import QuoteStatusHistory from './QuoteStatusHistory'
import QuoteStatusWorkflow from './QuoteStatusWorkflow'
import QuoteToJobModal from './QuoteToJobModal'

interface QuotePreviewProps {
  quote: Quote
  onEdit?: () => void
  onStatusChange?: (status: Quote['status']) => void
}

export default function QuotePreview({ quote, onEdit, onStatusChange }: QuotePreviewProps) {
  const { updateQuote } = useQuotes()
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [optimisticStatus, setOptimisticStatus] = useState<Quote['status'] | null>(null)
  const [showJobConversionModal, setShowJobConversionModal] = useState(false)

  // Handle successful job conversion
  const handleJobConversionSuccess = (jobId: string) => {
    console.log('Job created successfully:', jobId)
    setShowJobConversionModal(false)
    setSuccessMessage('Quote converted to job successfully!')
    setTimeout(() => setSuccessMessage(null), 5000)
  }

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
      setUpdatingStatus(true)
      setStatusError(null)
      setSuccessMessage(null)
      
      // Optimistic update - immediately show the new status
      setOptimisticStatus(newStatus)
      
      try {
        const updated = await updateQuote(quote.id, { status: newStatus })
        if (updated) {
          // Show success message
          const statusLabels = {
            draft: 'Draft',
            sent: 'Sent', 
            accepted: 'Accepted',
            rejected: 'Rejected',
            expired: 'Expired'
          }
          setSuccessMessage(`Quote successfully marked as ${statusLabels[newStatus]}!`)
          
          // Clear success message after 3 seconds
          setTimeout(() => setSuccessMessage(null), 3000)
        } else {
          // Revert optimistic update on failure
          setOptimisticStatus(null)
          setStatusError('Failed to update quote status. Please try again.')
        }
      } catch (error) {
        console.error('Error updating quote status:', error)
        // Revert optimistic update on error
        setOptimisticStatus(null)
        setStatusError(error instanceof Error ? error.message : 'Failed to update quote status')
      } finally {
        setUpdatingStatus(false)
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
              {getStatusBadge(optimisticStatus || quote.status)}
              {updatingStatus && (
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">

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

              {/* Convert to Job Button - Only for accepted quotes */}
              {(optimisticStatus === 'accepted' || quote.status === 'accepted') && (
                <button
                  onClick={() => setShowJobConversionModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Convert to Job
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {statusError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 print:hidden">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{statusError}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setStatusError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 print:hidden">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccessMessage(null)}
                className="inline-flex text-green-400 hover:text-green-600"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Management */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 print:hidden">
        <div className="space-y-4 mb-6">
          <QuoteStatusWorkflow 
            currentStatus={optimisticStatus || quote.status}
            onStatusChange={handleStatusChange}
            isUpdating={updatingStatus}
          />
          <QuoteStatusHistory quote={quote} />
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

            {/* Line Items */}
            <div className="mb-8 print:mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 print:text-base">
                Items & Services
              </h3>
              
              {quote.quote_line_items && quote.quote_line_items.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden print:border print:border-gray-300">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 print:bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2">
                          Description
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2">
                          Qty
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:px-3 print:py-2">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-300">
                      {quote.quote_line_items
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((item) => (
                          <tr key={item.id} className="print:break-inside-avoid">
                            <td className="px-6 py-4 text-sm text-gray-900 print:px-3 print:py-2 print:text-xs">
                              {item.title && (
                                <div className="font-medium text-gray-900 mb-1">
                                  {item.title}
                                </div>
                              )}
                              <div className={item.title ? 'text-gray-600 text-xs' : ''}>
                                {item.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right print:px-3 print:py-2 print:text-xs">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right print:px-3 print:py-2 print:text-xs">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right print:px-3 print:py-2 print:text-xs">
                              {formatCurrency(item.total_amount)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg print:bg-transparent print:border print:border-gray-300">
                  <p className="text-gray-600 text-sm italic">
                    No line items have been added to this quote.
                  </p>
                </div>
              )}
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

      {/* Quote to Job Conversion Modal */}
      <QuoteToJobModal
        isOpen={showJobConversionModal}
        onClose={() => setShowJobConversionModal(false)}
        quote={quote}
        onConversionSuccess={handleJobConversionSuccess}
      />
    </div>
  )
}
