import { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  EnvelopeIcon,
  EyeIcon,
  PaperAirplaneIcon,
  UserIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useEmailService, type EmailRecipient } from '../../hooks/useEmailService'
import type { InvoiceWithRelations } from '../../hooks/useInvoices'

interface SendInvoiceEmailModalProps {
  invoice: InvoiceWithRelations
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function SendInvoiceEmailModal({
  invoice,
  isOpen,
  onClose,
  onSuccess
}: SendInvoiceEmailModalProps) {
  const { 
    sendInvoiceEmail, 
    previewInvoiceEmail, 
    loading, 
    error,
    setError 
  } = useEmailService()

  const [recipients, setRecipients] = useState<EmailRecipient[]>([])
  const [newRecipientEmail, setNewRecipientEmail] = useState('')
  const [newRecipientName, setNewRecipientName] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Initialize recipients with customer email
  useEffect(() => {
    if (invoice.customer?.email && recipients.length === 0) {
      const customerName = `${invoice.customer.first_name || ''} ${invoice.customer.last_name || ''}`.trim() 
        || invoice.customer.company_name 
        || ''
      
      setRecipients([{
        email: invoice.customer.email,
        name: customerName
      }])
    }
  }, [invoice.customer, recipients.length])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCustomSubject('')
      setCustomMessage('')
      setShowPreview(false)
      setError(null)
      setIsSending(false)
    }
  }, [isOpen, setError])

  const addRecipient = () => {
    if (newRecipientEmail.trim()) {
      const newRecipient: EmailRecipient = {
        email: newRecipientEmail.trim(),
        name: newRecipientName.trim() || undefined
      }

      // Check if email already exists
      if (!recipients.some(r => r.email.toLowerCase() === newRecipient.email.toLowerCase())) {
        setRecipients([...recipients, newRecipient])
      }

      setNewRecipientEmail('')
      setNewRecipientName('')
    }
  }

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if (recipients.length === 0) {
      setError('Please add at least one recipient')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const success = await sendInvoiceEmail(
        invoice,
        recipients,
        customSubject.trim() || undefined,
        customMessage.trim() || undefined
      )

      if (success) {
        onSuccess()
        onClose()
      }
    } catch (err) {
      console.error('Error sending invoice email:', err)
    } finally {
      setIsSending(false)
    }
  }

  const getPreview = () => {
    return previewInvoiceEmail(invoice, customMessage.trim() || undefined)
  }

  const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date()
  const isPaid = invoice.status === 'paid'
  const isPartiallyPaid = invoice.status === 'partially_paid'

  if (!isOpen) return null

  const preview = showPreview ? getPreview() : null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal content */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900">
                <EnvelopeIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Send Invoice via Email
                </h3>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Invoice #{invoice.invoice_number} - {invoice.title}
                  </p>
                  {isPaid && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Paid
                    </span>
                  )}
                  {isPartiallyPaid && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Partially Paid
                    </span>
                  )}
                  {isOverdue && !isPaid && !isPartiallyPaid && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      Overdue
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Overdue Warning */}
          {isOverdue && !isPaid && !isPartiallyPaid && (
            <div className="mt-4 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Overdue Invoice
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    This invoice was due on {new Date(invoice.due_date!).toLocaleDateString()}. 
                    Consider adding a note about late fees or payment arrangements.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="mt-6">
            {showPreview ? (
              /* Preview Mode */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">Email Preview</h4>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    ← Back to Edit
                  </button>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div><strong>To:</strong> {recipients.map(r => r.name ? `${r.name} <${r.email}>` : r.email).join(', ')}</div>
                    <div><strong>Subject:</strong> {customSubject || preview?.subject}</div>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <div 
                    className="max-h-96 overflow-y-auto p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: preview?.htmlContent || '' }}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={isSending || loading}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-4 w-4 mr-2 inline-block" />
                        Send Invoice
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                {/* Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Recipients
                  </label>
                  
                  {/* Existing recipients */}
                  <div className="space-y-2 mb-3">
                    {recipients.map((recipient, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {recipient.name || recipient.email}
                            </div>
                            {recipient.name && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {recipient.email}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeRecipient(index)}
                          className="text-red-600 hover:text-red-500"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add new recipient */}
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <input
                          type="text"
                          placeholder="Name (optional)"
                          value={newRecipientName}
                          onChange={(e) => setNewRecipientName(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="email"
                          placeholder="Email address"
                          value={newRecipientEmail}
                          onChange={(e) => setNewRecipientEmail(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <button
                          onClick={addRecipient}
                          disabled={!newRecipientEmail.trim()}
                          className="w-full px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <PlusIcon className="h-4 w-4 inline-block mr-1" />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    placeholder={`Invoice ${invoice.invoice_number} - Payment Due`}
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Custom Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Personal Message <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder={
                      isOverdue 
                        ? "This invoice is now overdue. Please arrange payment as soon as possible..."
                        : "Thank you for your business. Payment details are included below..."
                    }
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                          Error sending email
                        </h3>
                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                          {error}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    onClick={() => setShowPreview(true)}
                    disabled={recipients.length === 0}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <EyeIcon className="h-4 w-4 mr-2 inline-block" />
                    Preview Email
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={recipients.length === 0 || isSending || loading}
                    className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-4 w-4 mr-2 inline-block" />
                        Send Invoice
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
