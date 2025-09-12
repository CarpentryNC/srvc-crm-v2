import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { 
  XMarkIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { useInvoices } from '../../hooks/useInvoices'
import { useJobs } from '../../hooks/useJobs'
import { useCustomers } from '../../hooks/useCustomers'
import type { JobWithCustomer } from '../../types/job'

interface Customer {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
}

interface JobToInvoiceConverterProps {
  className?: string
}

interface InvoiceFormData {
  title: string
  description: string
  due_date: string
  line_items: {
    title: string
    description: string
    quantity: number
    unit_price_cents: number
  }[]
}

export default function JobToInvoiceConverter({ className = '' }: JobToInvoiceConverterProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const jobId = searchParams.get('jobId')
  
  const { createInvoice, error: invoiceError } = useInvoices()
  const { getJob } = useJobs()
  const { customers } = useCustomers()
  
  const [job, setJob] = useState<JobWithCustomer | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<InvoiceFormData>({
    title: '',
    description: '',
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    line_items: []
  })

  // Load job data when component mounts or jobId changes
  useEffect(() => {
    const loadJobData = async () => {
      if (!jobId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const jobData = await getJob(jobId)
        
        if (jobData) {
          setJob(jobData)
          
          // Find customer data
          const customerData = customers.find(c => c.id === jobData.customer_id) || jobData.customer
          setCustomer(customerData)
          
          // Pre-populate form with job data
          setFormData({
            title: `Invoice for Job: ${jobData.title}`,
            description: jobData.description || `Invoice for completed job: ${jobData.title}`,
            due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
            line_items: [
              {
                title: jobData.title,
                description: jobData.description || 'Job completion',
                quantity: 1,
                unit_price_cents: jobData.estimated_hours ? Math.round((jobData.estimated_hours * 10000)) : 50000 // Default to $500 or $100/hour
              }
            ]
          })
        }
      } catch (error) {
        console.error('Error loading job data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadJobData()
  }, [jobId, getJob, customers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !job) return

    try {
      setIsSubmitting(true)
      
      const invoiceId = await createInvoice({
        customer_id: job.customer_id,
        title: formData.title,
        description: formData.description,
        due_date: formData.due_date,
        line_items: formData.line_items
      })

      if (invoiceId) {
        // Navigate to the created invoice
        navigate(`/invoices/${invoiceId}`)
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof InvoiceFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLineItemChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.map((item, i) => 
        i === index 
          ? { ...item, [field]: value }
          : item
      )
    }))
  }

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        {
          title: 'Additional Service',
          description: '',
          quantity: 1,
          unit_price_cents: 0
        }
      ]
    }))
  }

  const removeLineItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index)
    }))
  }

  const calculateTotal = () => {
    const subtotal = formData.line_items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price_cents), 0
    )
    const tax = Math.round(subtotal * 0.0875) // 8.75% tax
    return {
      subtotal: subtotal / 100,
      tax: tax / 100,
      total: (subtotal + tax) / 100
    }
  }

  if (loading) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-center text-gray-500 dark:text-gray-400 mt-4">Loading job data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!jobId || !job) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 text-center">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Job Selected
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Please select a completed job to create an invoice.
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              View Jobs
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totals = calculateTotal()

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create Invoice from Job
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Job: {job.title}
              </p>
            </div>
            <button
              onClick={() => navigate('/jobs')}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Job Information */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Customer</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown Customer'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Status</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {job.status === 'completed' ? 'Completed' : job.status}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Completed Date</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {job.updated_at ? format(new Date(job.updated_at), 'MMM d, yyyy') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invoice Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Invoice description..."
              />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Line Items</h3>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-4">
                {formData.line_items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-4">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Service/Item
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleLineItemChange(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={(item.unit_price_cents / 100).toFixed(2)}
                        onChange={(e) => handleLineItemChange(index, 'unit_price_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="w-full px-2 py-2 text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                        disabled={formData.line_items.length <= 1}
                      >
                        <XMarkIcon className="h-4 w-4 mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="text-gray-900 dark:text-white">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax (8.75%):</span>
                    <span className="text-gray-900 dark:text-white">${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t border-gray-200 dark:border-gray-700 pt-2">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-gray-900 dark:text-white">${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {invoiceError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{invoiceError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || formData.line_items.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2 inline-block" />
                    Create Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
