import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequests } from '../../hooks/useRequests'
import type { Request } from '../../hooks/useRequests'

export default function RequestList() {
  const navigate = useNavigate()
  const { requests, loading, error } = useRequests()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.customer?.first_name + ' ' + request.customer?.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customer?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Service Requests</h1>
            <p className="mt-2 text-gray-600">
              Manage customer service requests and assessments
            </p>
          </div>
          <button
            onClick={() => navigate('/requests/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            New Request
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Requests
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, description, or customer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="received">Received</option>
                <option value="assessed">Assessed</option>
                <option value="quoted">Quoted</option>
                <option value="approved">Approved</option>
                <option value="converted">Converted</option>
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-600 mb-4">
          Showing {filteredRequests.length} of {requests.length} requests
        </div>

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 text-lg mb-2">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-600 mb-4">
              {requests.length === 0 
                ? "Get started by creating your first service request."
                : "Try adjusting your search filters to find what you're looking for."
              }
            </p>
            {requests.length === 0 && (
              <button
                onClick={() => navigate('/requests/new')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Create First Request
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface RequestCardProps {
  request: Request
}

function RequestCard({ request }: RequestCardProps) {
  const navigate = useNavigate()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

  const customerName = request.customer 
    ? `${request.customer.first_name} ${request.customer.last_name}`
    : 'Unknown Customer'

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/requests/${request.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {request.title}
          </h3>
          <p className="text-sm text-gray-600">
            {customerName}
            {request.customer?.company_name && (
              <span className="text-gray-400"> • {request.customer.company_name}</span>
            )}
          </p>
        </div>
      </div>

      {/* Description */}
      {request.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {request.description}
        </p>
      )}

      {/* Status and Priority */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(request.status || 'received')}`}>
          {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Received'}
        </span>
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(request.priority || 'medium')}`}>
          {request.priority ? request.priority.charAt(0).toUpperCase() + request.priority.slice(1) : 'Medium'} Priority
        </span>
        {request.requires_assessment && (
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            Assessment Required
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Created {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Unknown'}
        </span>
        <div className="flex items-center gap-3">
          {request.assessments && request.assessments.length > 0 && (
            <span className="flex items-center gap-1">
              🔍 {request.assessments.length}
            </span>
          )}
          {request.request_files && request.request_files.length > 0 && (
            <span className="flex items-center gap-1">
              📎 {request.request_files.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
