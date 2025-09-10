import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { useJobs } from '../../hooks/useJobs'
import type { Quote } from '../../hooks/useQuotes'
import type { JobFormData } from '../../types/job'

interface QuoteToJobModalProps {
  isOpen: boolean
  onClose: () => void
  quote: Quote
  onConversionSuccess?: (jobId: string) => void
}

export default function QuoteToJobModal({ 
  isOpen, 
  onClose, 
  quote, 
  onConversionSuccess 
}: QuoteToJobModalProps) {
  const { createJobFromQuote } = useJobs()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state with smart defaults from quote
  const [formData, setFormData] = useState<JobFormData>({
    customer_id: quote.customer_id,
    title: quote.title,
    description: quote.description || generateJobDescription(quote),
    scheduled_date: getDefaultScheduledDate(),
    estimated_hours: estimateHoursFromQuote(quote),
    notes: `Converted from Quote #${quote.quote_number}`
  })

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        customer_id: quote.customer_id,
        title: quote.title,
        description: quote.description || generateJobDescription(quote),
        scheduled_date: getDefaultScheduledDate(),
        estimated_hours: estimateHoursFromQuote(quote),
        notes: `Converted from Quote #${quote.quote_number}`
      })
      setError(null)
      setSuccess(false)
    }
  }, [isOpen, quote])

  // Generate smart job description from quote line items
  function generateJobDescription(quote: Quote): string {
    if (quote.quote_line_items && quote.quote_line_items.length > 0) {
      const lineItems = quote.quote_line_items
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(item => {
          if (item.title && item.description) {
            return `• ${item.title}\n  ${item.description}`
          } else if (item.title) {
            return `• ${item.title}`
          } else {
            return `• ${item.description}`
          }
        })
        .join('\n\n')
      
      return `Work to be completed as per accepted quote:\n\n${lineItems}`
    }
    
    return quote.description || 'Work to be completed as per accepted quote'
  }

  // Estimate hours based on quote value (rough heuristic)
  function estimateHoursFromQuote(quote: Quote): number | null {
    if (!quote.total_amount) return null
    
    // Simple estimation: $100-150 per hour as rough guideline
    // Users can always adjust this
    const estimatedHours = Math.ceil(quote.total_amount / 125)
    return Math.min(estimatedHours, 40) // Cap at 40 hours for reasonableness
  }

  // Get default scheduled date (tomorrow at 9 AM)
  function getDefaultScheduledDate(): string {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)
    
    // Format as datetime-local input value
    return tomorrow.toISOString().slice(0, 16)
  }

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Handle form field changes
  const handleChange = (field: keyof JobFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError('Job title is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Prepare job input data (excluding quote_id since createJobFromQuote handles it)
      const jobInput = {
        customer_id: formData.customer_id,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        scheduled_date: formData.scheduled_date || undefined,
        estimated_hours: formData.estimated_hours || undefined,
        notes: formData.notes?.trim() || undefined
      }

      // Create the job from quote
      const newJob = await createJobFromQuote(quote.id, jobInput)
      if (!newJob) {
        throw new Error('Failed to create job')
      }

      // Update quote status to 'converted' (or keep as 'accepted')
      // We'll keep it as 'accepted' since it represents the business state
      
      // Track workflow conversion in workflow_conversions table
      // This would be handled by the createJob function if we enhance it

      setSuccess(true)
      
      // Call success callback
      if (onConversionSuccess) {
        onConversionSuccess(newJob.id)
      }

      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (err) {
      console.error('Error converting quote to job:', err)
      setError(err instanceof Error ? err.message : 'Failed to convert quote to job')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Convert Quote to Job</h2>
              <p className="text-sm text-gray-600">
                Create a new job from accepted quote #{quote.quote_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Quote Summary */}
        <div className="p-6 bg-green-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-green-900 mb-3">Quote Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-green-800">Customer:</span>
              <div className="text-green-700">
                {quote.customer?.first_name} {quote.customer?.last_name}
                {quote.customer?.company_name && (
                  <span className="block">{quote.customer.company_name}</span>
                )}
              </div>
            </div>
            <div>
              <span className="font-medium text-green-800">Quote Value:</span>
              <div className="text-green-700 text-lg font-semibold">
                {formatCurrency(quote.total_amount)}
              </div>
            </div>
            <div>
              <span className="font-medium text-green-800">Line Items:</span>
              <div className="text-green-700">
                {quote.quote_line_items?.length || 0} items
              </div>
            </div>
            <div>
              <span className="font-medium text-green-800">Status:</span>
              <div className="text-green-700 capitalize">{quote.status}</div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-6 bg-green-50 border-b border-green-200">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="text-green-900 font-medium">Job Created Successfully!</h4>
                <p className="text-green-700 text-sm">
                  The job has been created and is ready for scheduling and execution.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-6 bg-red-50 border-b border-red-200">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="text-red-900 font-medium">Conversion Failed</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Job Creation Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Job Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter job title"
              required
            />
          </div>

          {/* Job Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Job Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={6}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Detailed description of work to be performed..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Auto-generated from quote line items. You can modify as needed.
            </p>
          </div>

          {/* Scheduled Date and Estimated Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                id="scheduled_date"
                value={formData.scheduled_date}
                onChange={(e) => handleChange('scheduled_date', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Estimated Hours
              </label>
              <input
                type="number"
                id="estimated_hours"
                value={formData.estimated_hours || ''}
                onChange={(e) => handleChange('estimated_hours', e.target.value ? parseFloat(e.target.value) : null)}
                min="0"
                step="0.5"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="0.0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Estimated based on quote value. Adjust as needed.
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Additional Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Any additional notes or special instructions..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Job...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Job Created!
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Convert to Job
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 sm:flex-none bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              {success ? 'Close' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
