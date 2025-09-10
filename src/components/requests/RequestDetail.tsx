import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRequests } from '../../hooks/useRequests'
import type { Request } from '../../hooks/useRequests'
import PhotoUpload from './PhotoUpload'

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getRequest, updateRequest, deleteRequest, error } = useRequests()
  
  const [request, setRequest] = useState<Request | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Fetch request details
  useEffect(() => {
    async function fetchRequest() {
      if (!id) return
      
      setLoading(true)
      try {
        const requestData = await getRequest(id)
        setRequest(requestData)
      } catch (err) {
        console.error('Error fetching request:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRequest()
  }, [id, getRequest])

  // Update request status
  const handleStatusUpdate = async (newStatus: Request['status']) => {
    if (!request) return

    setIsUpdating(true)
    try {
      const updatedRequest = await updateRequest(request.id, { status: newStatus })
      if (updatedRequest) {
        setRequest(updatedRequest)
      }
    } catch (err) {
      console.error('Error updating request status:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  // Delete request
  const handleDelete = async () => {
    if (!request) return
    
    const confirmed = window.confirm('Are you sure you want to delete this request? This action cannot be undone.')
    if (!confirmed) return

    const success = await deleteRequest(request.id)
    if (success) {
      navigate('/requests')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'assessed': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'quoted': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'converted': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
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
          <p className="text-gray-600 mb-4">The request you're looking for doesn't exist or you don't have access to it.</p>
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

  const customerName = request.customer 
    ? `${request.customer.first_name} ${request.customer.last_name}`
    : 'Unknown Customer'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/requests')}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Back to Requests
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        {/* Request Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{request.title}</h1>
              <p className="text-lg text-gray-600">
                {customerName}
                {request.customer?.company_name && (
                  <span className="text-gray-400"> • {request.customer.company_name}</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${getStatusColor(request.status)}`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${getPriorityColor(request.priority)}`}>
                {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
              </span>
              {request.requires_assessment && (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  Assessment Required
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/requests/${request.id}/edit`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Edit Request
            </button>
            
            {/* Status Update Dropdown */}
            <div className="relative">
              <select
                value={request.status}
                onChange={(e) => handleStatusUpdate(e.target.value as Request['status'])}
                disabled={isUpdating}
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="received">Received</option>
                <option value="assessed">Assessed</option>
                <option value="quoted">Quoted</option>
                <option value="approved">Approved</option>
                <option value="converted">Converted</option>
              </select>
              {isUpdating && (
                <div className="absolute right-2 top-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            {request.requires_assessment && (
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium">
                Schedule Assessment
              </button>
            )}

            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium">
              Convert to Quote
            </button>

            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Delete Request
            </button>
          </div>
        </div>

        {/* Request Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Request Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h2>
            <div className="space-y-4">
              {request.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{request.description}</p>
                </div>
              )}
              
              {request.location_notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Notes</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{request.location_notes}</p>
                </div>
              )}
              
              {request.preferred_contact_method && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact</label>
                  <p className="text-gray-900">{request.preferred_contact_method}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-gray-900">{new Date(request.created_at).toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-gray-900">{new Date(request.updated_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            {request.customer ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900">{customerName}</p>
                </div>
                
                {request.customer.company_name && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <p className="text-gray-900">{request.customer.company_name}</p>
                  </div>
                )}
                
                {request.customer.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <a href={`mailto:${request.customer.email}`} className="text-blue-600 hover:text-blue-800">
                      {request.customer.email}
                    </a>
                  </div>
                )}
                
                {request.customer.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <a href={`tel:${request.customer.phone}`} className="text-blue-600 hover:text-blue-800">
                      {request.customer.phone}
                    </a>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={() => navigate(`/customers/${request.customer!.id}`)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Customer Details →
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Customer information not available</p>
            )}
          </div>
        </div>

        {/* Photos/Files Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos & Files</h2>
          
          {/* Existing Files */}
          {request.request_files && request.request_files.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {request.request_files.map((file) => (
                <div key={file.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-900 truncate">{file.file_name}</div>
                  <div className="text-xs text-gray-500 mt-1">{file.category}</div>
                  {file.description && (
                    <div className="text-xs text-gray-600 mt-1">{file.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Upload Component */}
          <PhotoUpload 
            requestId={request.id}
            onUploadComplete={(fileData) => {
              console.log('File uploaded:', fileData)
              // Refresh the request data to show the new file
              window.location.reload()
            }}
          />
        </div>

        {/* Assessments Section */}
        {request.requires_assessment && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessments</h2>
            {request.assessments && request.assessments.length > 0 ? (
              <div className="space-y-4">
                {request.assessments.map((assessment) => (
                  <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Assessment #{assessment.id.slice(-8)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        assessment.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : assessment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                      </span>
                    </div>
                    
                    {assessment.scheduled_date && (
                      <p className="text-sm text-gray-600 mb-2">
                        Scheduled: {new Date(assessment.scheduled_date).toLocaleString()}
                      </p>
                    )}
                    
                    {assessment.findings && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Findings: </span>
                        <span className="text-gray-900">{assessment.findings}</span>
                      </div>
                    )}
                    
                    {assessment.estimated_cost && (
                      <div className="text-sm mt-1">
                        <span className="font-medium text-gray-700">Estimated Cost: </span>
                        <span className="text-gray-900">${assessment.estimated_cost.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">🔍</div>
                <p className="text-gray-500">No assessments scheduled yet</p>
                <button className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Schedule Assessment
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
