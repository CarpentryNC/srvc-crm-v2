import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useInvoices } from '../../hooks/useInvoices'
import type { InvoiceStatus } from '../../types/invoice'

interface InvoiceListProps {
  className?: string
}

export default function InvoiceList({ className = '' }: InvoiceListProps) {
  const { invoices, loading, error } = useInvoices()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter and sort invoices
  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(query) ||
        invoice.title.toLowerCase().includes(query) ||
        invoice.customer?.first_name?.toLowerCase().includes(query) ||
        invoice.customer?.last_name?.toLowerCase().includes(query) ||
        invoice.customer?.company_name?.toLowerCase().includes(query) ||
        invoice.customer?.email?.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'amount':
          aValue = (a.total_cents || 0) / 100
          bValue = (b.total_cents || 0) / 100
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [invoices, searchQuery, statusFilter, sortBy, sortOrder])

  // Status display configuration
  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          icon: DocumentTextIcon,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        }
      case 'sent':
        return {
          label: 'Sent',
          icon: ClockIcon,
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
        }
      case 'paid':
        return {
          label: 'Paid',
          icon: CheckCircleIcon,
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }
      case 'partially_paid':
        return {
          label: 'Partially Paid',
          icon: CurrencyDollarIcon,
          className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        }
      case 'overdue':
        return {
          label: 'Overdue',
          icon: ExclamationTriangleIcon,
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: ExclamationTriangleIcon,
          className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }
      default:
        return {
          label: 'Unknown',
          icon: DocumentTextIcon,
          className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        }
    }
  }

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    return {
      total: invoices.length,
      draft: invoices.filter(i => i.status === 'draft').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      partially_paid: invoices.filter(i => i.status === 'partially_paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      totalAmount: invoices.reduce((sum, invoice) => sum + ((invoice.total_cents || 0) / 100), 0),
      paidAmount: invoices
        .filter(i => i.status === 'paid')
        .reduce((sum, invoice) => sum + ((invoice.total_cents || 0) / 100), 0),
      pendingAmount: invoices
        .filter(i => ['sent', 'overdue', 'partially_paid'].includes(i.status))
        .reduce((sum, invoice) => sum + ((invoice.total_cents || 0) / 100), 0)
    }
  }, [invoices])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
          Error loading invoices
        </h3>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage and track your invoices
          </p>
        </div>
        <Link
          to="/invoices/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Invoice
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Invoices
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {summaryStats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Paid Amount
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    ${summaryStats.paidAmount.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Pending Amount
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    ${summaryStats.pendingAmount.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Overdue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {summaryStats.overdue}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">
                Search invoices
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  name="search"
                  type="text"
                  placeholder="Search invoices..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <label htmlFor="status-filter" className="sr-only">
                Filter by status
              </label>
              <div className="relative">
                <select
                  id="status-filter"
                  name="status-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <FunnelIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Sort Options */}
            <div className="sm:w-40">
              <label htmlFor="sort-by" className="sr-only">
                Sort by
              </label>
              <select
                id="sort-by"
                name="sort-by"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder]
                  setSortBy(newSortBy)
                  setSortOrder(newSortOrder)
                }}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
                <option value="status-asc">Status A-Z</option>
                <option value="status-desc">Status Z-A</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {filteredAndSortedInvoices.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No invoices found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first invoice.'
              }
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <div className="mt-6">
                <Link
                  to="/invoices/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Invoice
                </Link>
              </div>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedInvoices.map((invoice) => {
              const statusConfig = getStatusConfig(invoice.status as InvoiceStatus)
              const StatusIcon = statusConfig.icon
              const customerName = invoice.customer 
                ? `${invoice.customer.first_name || ''} ${invoice.customer.last_name || ''}`.trim() 
                  || invoice.customer.company_name 
                  || 'Unknown Customer'
                : 'Unknown Customer'

              return (
                <li key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <DocumentTextIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {invoice.invoice_number}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="mt-1">
                            <p className="text-sm text-gray-900 dark:text-white font-medium">
                              {invoice.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {customerName}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            ${((invoice.total_cents || 0) / 100).toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                          </p>
                          {invoice.due_date && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/invoices/${invoice.id}`}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="View invoice"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/invoices/${invoice.id}/edit`}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            title="Edit invoice"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Results Summary */}
      {filteredAndSortedInvoices.length > 0 && (
        <div className="flex justify-between items-center text-sm text-gray-700 dark:text-gray-300">
          <span>
            Showing {filteredAndSortedInvoices.length} of {invoices.length} invoices
          </span>
          <span>
            Total: ${filteredAndSortedInvoices.reduce((sum, invoice) => sum + ((invoice.total_cents || 0) / 100), 0).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
}
