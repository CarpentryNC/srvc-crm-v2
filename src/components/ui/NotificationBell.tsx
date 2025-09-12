import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  BellIcon, 
  CheckIcon, 
  XMarkIcon,
  EyeIcon,
  PlusIcon,
  EnvelopeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid'
import { useNotifications, type Notification } from '../../hooks/useNotifications'
import { format } from 'date-fns'

interface NotificationBellProps {
  className?: string
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    dismissNotification 
  } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.notification-dropdown')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getActionIcon = (actionType?: string) => {
    switch (actionType) {
      case 'create_invoice':
        return PlusIcon
      case 'view_job':
        return EyeIcon
      case 'send_reminder':
        return EnvelopeIcon
      case 'view_quote':
        return EyeIcon
      default:
        return ClockIcon
    }
  }

  const getActionLink = (notification: Notification) => {
    const { action_type, action_data } = notification
    
    switch (action_type) {
      case 'create_invoice':
        if (action_data?.job_id) {
          return `/invoices/from-job?jobId=${action_data.job_id}`
        }
        return '/invoices/new'
      case 'view_job':
        if (action_data?.job_id) {
          return `/jobs/${action_data.job_id}`
        }
        return '/jobs'
      case 'view_quote':
        if (action_data?.quote_id) {
          return `/quotes/${action_data.quote_id}`
        }
        return '/quotes'
      case 'send_reminder':
        if (action_data?.invoice_id) {
          return `/invoices/${action_data.invoice_id}`
        }
        return '/invoices'
      default:
        return '#'
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
    setIsOpen(false)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const handleDismiss = async (e: React.MouseEvent, notificationId: string) => {
    e.preventDefault()
    e.stopPropagation()
    await dismissNotification(notificationId)
  }

  return (
    <div className={`relative notification-dropdown ${className}`}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
        
        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Mark all as read
                </button>
              )}
            </div>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <BellIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No notifications
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.slice(0, 10).map((notification) => {
                  const ActionIcon = getActionIcon(notification.action_type)
                  const actionLink = getActionLink(notification)
                  
                  return (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 p-1 rounded-full ${
                          notification.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900' :
                          notification.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900' :
                          'bg-blue-100 dark:bg-blue-900'
                        }`}>
                          <ActionIcon className={`h-4 w-4 ${
                            notification.priority === 'urgent' ? 'text-red-600 dark:text-red-400' :
                            notification.priority === 'high' ? 'text-orange-600 dark:text-orange-400' :
                            'text-blue-600 dark:text-blue-400'
                          }`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${
                                !notification.is_read 
                                  ? 'text-gray-900 dark:text-white' 
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                  {notification.priority}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-1 ml-2">
                              {/* Action Button */}
                              {notification.action_type && actionLink !== '#' && (
                                <Link
                                  to={actionLink}
                                  onClick={() => handleNotificationClick(notification)}
                                  className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  title="Take action"
                                >
                                  <ActionIcon className="h-4 w-4" />
                                </Link>
                              )}

                              {/* Mark as Read */}
                              {!notification.is_read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                  title="Mark as read"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                </button>
                              )}

                              {/* Dismiss */}
                              <button
                                onClick={(e) => handleDismiss(e, notification.id)}
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                title="Dismiss"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
