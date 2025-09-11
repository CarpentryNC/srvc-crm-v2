import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { 
  XMarkIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { useInvoices } from '../../hooks/useInvoices'
import type { Quote } from '../../hooks/useQuotes'

interface QuoteToInvoiceConverterProps {
  quote: Quote
  isOpen: boolean
  onClose: () => void
  onSuccess: (invoiceId: string) => void
}

interface InvoiceFormData {
  title: string
  description: string
  due_date: string
}

export default function QuoteToInvoiceConverter({
  quote,
  isOpen,
  onClose,
  onSuccess
}: QuoteToInvoiceConverterProps) {
  const { createInvoiceFromQuote, error } = useInvoices()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<InvoiceFormData>({
    title: quote.title || '',
    description: quote.description || '',
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd') // Default to 30 days from now
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      
      const invoiceId = await createInvoiceFromQuote(quote.id, {
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date
      })

      if (invoiceId) {
        onSuccess(invoiceId)
        onClose()
        // Reset form
        setFormData({
          title: quote.title || '',
          description: quote.description || '',
          due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd')
        })
      }
    } catch (err) {
      console.error('Error creating invoice:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof InvoiceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Calculate totals from quote line items
  const lineItemsPreview = quote.quote_line_items || []
  const subtotal = lineItemsPreview.reduce((sum: number, item: any) => sum + item.total_amount, 0)
  const taxAmount = subtotal * 0.0875 // 8.75% tax rate
  const total = subtotal + taxAmount

  const customerName = quote.customer 
    ? `${quote.customer.first_name || ''} ${quote.customer.last_name || ''}`.trim() 
      || quote.customer.company_name 
      || 'Unknown Customer'
    : 'Unknown Customer'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6 relative z-10">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 sm:mx-0 sm:h-10 sm:w-10">
              <DocumentTextIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Convert Quote to Invoice
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create an invoice from quote <span className="font-medium">{quote.quote_number}</span> for <span className="font-medium">{customerName}</span>.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Quote Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Quote Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Quote Number:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{quote.quote_number}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Customer:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{customerName}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Line Items:</span>
                  <div className="font-medium text-gray-900 dark:text-white">{lineItemsPreview.length}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total Amount:</span>
                  <div className="font-medium text-gray-900 dark:text-white">${total.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Line Items Preview */}
            {lineItemsPreview.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Line Items to Transfer</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {lineItemsPreview.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {item.title || item.description}
                        </div>
                        {item.title && item.description && (
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {item.description}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-gray-900 dark:text-white">
                          {item.quantity} × ${item.unit_price.toFixed(2)}
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          ${item.total_amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Totals */}
                <div className="border-t border-gray-200 dark:border-gray-600 mt-3 pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                    <span className="text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Tax (8.75%):</span>
                    <span className="text-gray-900 dark:text-white">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium border-t border-gray-200 dark:border-gray-600 pt-1">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-gray-900 dark:text-white">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Details Form */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">Invoice Details</h4>
              
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invoice Title
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Invoice title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                  <DocumentTextIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Invoice description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Due Date
                </label>
                <div className="mt-1 relative">
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Error creating invoice
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.title.trim()}
                className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Create Invoice
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
