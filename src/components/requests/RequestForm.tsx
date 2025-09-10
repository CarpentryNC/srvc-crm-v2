import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequests } from '../../hooks/useRequests'
import type { RequestInput } from '../../hooks/useRequests'
import { useCustomers } from '../../hooks/useCustomers'

export default function RequestForm() {
  const navigate = useNavigate()
  const { createRequest, loading: requestLoading, error } = useRequests()
  const { customers, loading: customersLoading } = useCustomers()
  
  const [formData, setFormData] = useState<RequestInput>({
    customer_id: '',
    title: '',
    description: '',
    priority: 'medium',
    requires_assessment: false,
    location_notes: '',
    preferred_contact_method: '',
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customer_id || !formData.title.trim()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const newRequest = await createRequest(formData)
      if (newRequest) {
        navigate(`/requests/${newRequest.id}`)
      }
    } catch (err) {
      console.error('Failed to create request:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (customersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/requests')}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to Requests
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">New Service Request</h1>
          <p className="mt-2 text-gray-600">
            Create a new service request for a customer
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-2">
              Customer *
            </label>
            <select
              id="customer_id"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.first_name} {customer.last_name}
                  {customer.company_name && ` (${customer.company_name})`}
                </option>
              ))}
            </select>
          </div>

          {/* Request Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Request Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Brief description of the service request"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Detailed description of the work needed..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Priority and Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requires_assessment"
                  checked={formData.requires_assessment}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Requires onsite assessment</span>
              </label>
            </div>
          </div>

          {/* Location Notes */}
          <div>
            <label htmlFor="location_notes" className="block text-sm font-medium text-gray-700 mb-2">
              Location Notes
            </label>
            <textarea
              id="location_notes"
              name="location_notes"
              value={formData.location_notes}
              onChange={handleChange}
              rows={2}
              placeholder="Special instructions for finding or accessing the location..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Preferred Contact Method */}
          <div>
            <label htmlFor="preferred_contact_method" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Contact Method
            </label>
            <input
              type="text"
              id="preferred_contact_method"
              name="preferred_contact_method"
              value={formData.preferred_contact_method}
              onChange={handleChange}
              placeholder="Phone, email, text, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/requests')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || requestLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium transition-colors"
            >
              {isSubmitting || requestLoading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
