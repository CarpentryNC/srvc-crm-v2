import { useState, useMemo } from 'react'
import { format, isValid } from 'date-fns'
import { 
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { usePaymentTracking } from '../../hooks/usePaymentTracking'
import type { PaymentStatus } from '../../hooks/usePaymentTracking'
import { Link } from 'react-router-dom'

interface PaymentStatusDashboardProps {
  className?: string
}

export default function PaymentStatusDashboard({ className = '' }: PaymentStatusDashboardProps) {
  const { 
    paymentStatuses, 
    analytics, 
    loading, 
    error, 
    getOverdueInvoices, 
    getInvoicesDueSoon,
    markInvoiceAsPaid 
  } = usePaymentTracking()

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'current' | 'overdue' | 'paid'>('all')
  const [sortBy, setSortBy] = useState<'due_date' | 'amount' | 'days_overdue'>('days_overdue')

  // Filter and sort payment statuses
  const filteredStatuses = useMemo(() => {
    let filtered = paymentStatuses

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(status => status.status === selectedFilter)
    }

    // Sort based on selection
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        case 'amount':
          return b.balance_due - a.balance_due
        case 'days_overdue':
          return b.days_overdue - a.days_overdue
        default:
          return 0
      }
    })
  }, [paymentStatuses, selectedFilter, sortBy])

  const overdueInvoices = getOverdueInvoices()
  const dueSoonInvoices = getInvoicesDueSoon()

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 ${className}`}>
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Payment Data</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Status Dashboard</h2>
        <div className="flex items-center space-x-2">
          {overdueInvoices.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              <BellIcon className="h-3 w-3 mr-1" />
              {overdueInvoices.length} Overdue
            </span>
          )}
          {dueSoonInvoices.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <ClockIcon className="h-3 w-3 mr-1" />
              {dueSoonInvoices.length} Due Soon
            </span>
          )}
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Outstanding */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Outstanding
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      ${analytics.total_outstanding.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Overdue */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Overdue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      ${analytics.total_overdue.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Collection Rate */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Collection Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {analytics.collection_rate.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Counts */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarDaysIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Invoice Status
                    </dt>
                    <dd className="text-sm text-gray-900 dark:text-white">
                      <div className="flex space-x-4">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {analytics.paid_count} Paid
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {analytics.current_count} Current
                        </span>
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {analytics.overdue_count} Overdue
                        </span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          {/* Filter */}
          <div>
            <label htmlFor="filter" className="sr-only">Filter by status</label>
            <select
              id="filter"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as 'all' | 'current' | 'overdue' | 'paid')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="all">All Invoices</option>
              <option value="current">Current</option>
              <option value="overdue">Overdue</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label htmlFor="sort" className="sr-only">Sort by</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'due_date' | 'amount' | 'days_overdue')}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="days_overdue">Days Overdue</option>
              <option value="due_date">Due Date</option>
              <option value="amount">Amount</option>
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredStatuses.length} of {paymentStatuses.length} invoices
        </div>
      </div>

      {/* Payment Status List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredStatuses.length === 0 ? (
            <li className="px-6 py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No invoices match the selected criteria.</p>
            </li>
          ) : (
            filteredStatuses.map((status) => (
              <PaymentStatusItem
                key={status.invoice_id}
                status={status}
                onMarkAsPaid={markInvoiceAsPaid}
              />
            ))
          )}
        </ul>
      </div>
    </div>
  )
}

interface PaymentStatusItemProps {
  status: PaymentStatus
  onMarkAsPaid: (invoiceId: string) => Promise<boolean>
}

function PaymentStatusItem({ status, onMarkAsPaid }: PaymentStatusItemProps) {
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  const getStatusIcon = () => {
    switch (status.status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />
      case 'overdue':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
      case 'current':
        return <ClockIcon className="h-5 w-5 text-blue-400" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'paid':
        return 'text-green-600 dark:text-green-400'
      case 'overdue':
        return 'text-red-600 dark:text-red-400'
      case 'current':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const handleMarkAsPaid = async () => {
    if (isMarkingPaid) return

    setIsMarkingPaid(true)
    try {
      await onMarkAsPaid(status.invoice_id)
    } finally {
      setIsMarkingPaid(false)
    }
  }

  return (
    <li className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <Link
                to={`/invoices/${status.invoice_id}`}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
              >
                #{status.invoice_number}
              </Link>
              <span className={`text-sm font-medium ${getStatusColor()}`}>
                {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
              </span>
              {status.days_overdue > 0 && (
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {status.days_overdue} days overdue
                </span>
              )}
            </div>
            
            <div className="mt-1">
              <p className="text-sm text-gray-900 dark:text-white font-medium">
                {status.customer_name}
              </p>
              {status.customer_email && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {status.customer_email}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              ${status.balance_due.toLocaleString()}
            </p>
            {status.due_date && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Due: {isValid(new Date(status.due_date)) ? format(new Date(status.due_date), 'MMM d, yyyy') : 'Invalid date'}
              </p>
            )}
            {status.total_paid > 0 && (
              <p className="text-xs text-green-600 dark:text-green-400">
                ${status.total_paid.toLocaleString()} paid
              </p>
            )}
          </div>

          {status.status !== 'paid' && status.balance_due > 0 && (
            <button
              onClick={handleMarkAsPaid}
              disabled={isMarkingPaid}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 disabled:opacity-50"
            >
              {isMarkingPaid ? 'Marking...' : 'Mark Paid'}
            </button>
          )}
        </div>
      </div>
    </li>
  )
}
