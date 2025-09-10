import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRequests, type Request } from '../../hooks/useRequests'
import { useCustomers } from '../../hooks/useCustomers'

export default function RequestEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getRequest, updateRequest, error } = useRequests()
  const { customers, loading: customersLoading } = useCustomers()
  
  const [request, setRequest] = useState<Request | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: '',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: 'received' as 'received' | 'assessed' | 'quoted' | 'approved' | 'converted',
    requires_assessment: false,
    location_notes: '',
    preferred_contact_method: '',
  })

  // Fetch request to edit
  useEffect(() => {
    async function fetchRequest() {
      if (!id) return
      
      setLoading(true)
      try {
        const requestData = await getRequest(id)
        if (requestData) {
          setRequest(requestData)
          setFormData({
            customer_id: requestData.customer_id,
            title: requestData.title,
            description: requestData.description || '',
            priority: requestData.priority,
            status: requestData.status,
            requires_assessment: requestData.requires_assessment,
            location_notes: requestData.location_notes || '',
            preferred_contact_method: requestData.preferred_contact_method || '',
          })
        }
      } catch (err) {
        console.error('Error fetching request:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRequest()
  }, [id, getRequest])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!request) return

    setSubmitting(true)
    try {
      const updatedRequest = await updateRequest(request.id, formData)
      if (updatedRequest) {
        navigate(`/requests/${request.id}`)
      }
    } catch (err) {
      console.error('Error updating request:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || customersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Request Not Found</h2>
          <p className="text-gray-600 mb-4">The request you're trying to edit doesn't exist.</p>
          <button
            onClick={() => navigate('/requests')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Back to Requests
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/requests/${request.id}`)}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Back to Request
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Request</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div>
              <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                id="customer_id"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name}
                    {customer.company_name && ` (${customer.company_name})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Brief description of the request"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Detailed description of the work requested"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Priority and Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="received">Received</option>
                  <option value="assessed">Assessed</option>
                  <option value="quoted">Quoted</option>
                  <option value="approved">Approved</option>
                  <option value="converted">Converted</option>
                </select>
              </div>
            </div>

            {/* Assessment Required */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requires_assessment"
                name="requires_assessment"
                checked={formData.requires_assessment}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requires_assessment" className="ml-2 block text-sm text-gray-700">
                This request requires an onsite assessment
              </label>
            </div>

            {/* Location Notes */}
            <div>
              <label htmlFor="location_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Location Notes
              </label>
              <textarea
                id="location_notes"
                name="location_notes"
                value={formData.location_notes}
                onChange={handleChange}
                rows={2}
                placeholder="Special instructions for finding or accessing the location"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Preferred Contact Method */}
            <div>
              <label htmlFor="preferred_contact_method" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Contact Method
              </label>
              <select
                id="preferred_contact_method"
                name="preferred_contact_method"
                value={formData.preferred_contact_method}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">No preference</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="text">Text Message</option>
              </select>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {submitting ? 'Updating Request...' : 'Update Request'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate(`/requests/${request.id}`)}
                className="flex-1 sm:flex-none bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
