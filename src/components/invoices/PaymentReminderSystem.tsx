import { useState, useCallback } from 'react'
import { format, differenceInDays } from 'date-fns'
import { 
  BellIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { usePaymentTracking } from '../../hooks/usePaymentTracking'
import { Link } from 'react-router-dom'

interface PaymentReminderSystemProps {
  className?: string
}

interface ReminderRule {
  id: string
  name: string
  trigger: 'days_overdue' | 'days_until_due'
  days: number
  enabled: boolean
  template: string
}

export default function PaymentReminderSystem({ className = '' }: PaymentReminderSystemProps) {
  const { 
    paymentStatuses, 
    getOverdueInvoices, 
    getInvoicesDueSoon,
    loading 
  } = usePaymentTracking()

  const [reminderRules, setReminderRules] = useState<ReminderRule[]>([
    {
      id: '1',
      name: 'Due Soon (7 days)',
      trigger: 'days_until_due',
      days: 7,
      enabled: true,
      template: 'friendly_reminder'
    },
    {
      id: '2', 
      name: 'Due Soon (3 days)',
      trigger: 'days_until_due',
      days: 3,
      enabled: true,
      template: 'urgent_reminder'
    },
    {
      id: '3',
      name: 'Just Overdue (1 day)',
      trigger: 'days_overdue',
      days: 1,
      enabled: true,
      template: 'overdue_notice'
    },
    {
      id: '4',
      name: 'Overdue (7 days)',
      trigger: 'days_overdue',
      days: 7,
      enabled: true,
      template: 'overdue_urgent'
    },
    {
      id: '5',
      name: 'Seriously Overdue (30 days)',
      trigger: 'days_overdue',
      days: 30,
      enabled: true,
      template: 'final_notice'
    }
  ])

  const [dismissedReminders, setDismissedReminders] = useState<Record<string, string[]>>({})

  // Get invoices that need reminders
  const getInvoicesNeedingReminders = useCallback(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return paymentStatuses
      .filter(status => status.status !== 'paid' && status.balance_due > 0)
      .map(status => {
        const dueDate = status.due_date ? new Date(status.due_date) : null
        const applicableRules: ReminderRule[] = []

        if (dueDate) {
          reminderRules.forEach(rule => {
            if (!rule.enabled) return

            // Skip if already dismissed
            const dismissedForInvoice = dismissedReminders[status.invoice_id] || []
            if (dismissedForInvoice.includes(rule.id)) return

            if (rule.trigger === 'days_overdue' && status.days_overdue === rule.days) {
              applicableRules.push(rule)
            } else if (rule.trigger === 'days_until_due') {
              const daysUntilDue = differenceInDays(dueDate, today)
              if (daysUntilDue === rule.days) {
                applicableRules.push(rule)
              }
            }
          })
        }

        return {
          ...status,
          applicableRules,
          needsReminder: applicableRules.length > 0
        }
      })
      .filter(status => status.needsReminder)
  }, [paymentStatuses, reminderRules, dismissedReminders])

  const invoicesNeedingReminders = getInvoicesNeedingReminders()

  // Dismiss reminder for a specific invoice and rule
  const dismissReminder = useCallback((invoiceId: string, ruleId: string) => {
    setDismissedReminders(prev => ({
      ...prev,
      [invoiceId]: [...(prev[invoiceId] || []), ruleId]
    }))
  }, [])

  // Toggle reminder rule
  const toggleReminderRule = useCallback((ruleId: string) => {
    setReminderRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }, [])

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment Reminder System</h3>
        <div className="flex items-center space-x-2">
          {invoicesNeedingReminders.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              <BellIcon className="h-3 w-3 mr-1" />
              {invoicesNeedingReminders.length} Need Attention
            </span>
          )}
        </div>
      </div>

      {/* Reminder Rules */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">Reminder Rules</h4>
          <div className="space-y-3">
            {reminderRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleReminderRule(rule.id)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      rule.enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        rule.enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{rule.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {rule.trigger === 'days_overdue' 
                        ? `Alert when ${rule.days} days overdue`
                        : `Alert ${rule.days} days before due date`
                      }
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {rule.template.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Reminders */}
      {invoicesNeedingReminders.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <BellIcon className="h-5 w-5 text-orange-400 mr-2" />
              <h4 className="text-base font-medium text-gray-900 dark:text-white">
                Active Reminders ({invoicesNeedingReminders.length})
              </h4>
            </div>
            <div className="space-y-3">
              {invoicesNeedingReminders.map(invoice => (
                <div key={invoice.invoice_id} className="border border-gray-200 dark:border-gray-600 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/invoices/${invoice.invoice_id}`}
                          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                        >
                          Invoice #{invoice.invoice_number}
                        </Link>
                        {invoice.status === 'overdue' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            {invoice.days_overdue} days overdue
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {invoice.customer_name} - ${invoice.balance_due.toLocaleString()}
                      </p>
                      {invoice.due_date && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Due: {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                        </p>
                      )}
                      {invoice.customer_email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {invoice.customer_email}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      {invoice.applicableRules.map(rule => (
                        <div key={rule.id} className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            rule.template === 'final_notice' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : rule.template.includes('overdue')
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {rule.name}
                          </span>
                          <button
                            onClick={() => dismissReminder(invoice.invoice_id, rule.id)}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                          >
                            Dismiss
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <BellIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Reminder System Status
            </h4>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="space-y-1">
                <li>• {getOverdueInvoices().length} overdue invoices</li>
                <li>• {getInvoicesDueSoon().length} invoices due soon</li>
                <li>• {invoicesNeedingReminders.length} invoices need attention today</li>
                <li>• {reminderRules.filter(r => r.enabled).length} of {reminderRules.length} reminder rules active</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}