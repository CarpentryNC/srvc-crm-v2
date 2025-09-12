import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Notification {
  id: string
  user_id: string
  type: 'invoice_reminder' | 'payment_reminder' | 'job_completion' | 'quote_follow_up' | 'system'
  title: string
  message: string
  action_type?: 'create_invoice' | 'view_job' | 'send_reminder' | 'view_quote'
  action_data?: {
    job_id?: string
    quote_id?: string
    customer_id?: string
    invoice_id?: string
  }
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_read: boolean
  is_dismissed: boolean
  created_at: string
  expires_at?: string
}

export interface NotificationInput {
  type: Notification['type']
  title: string
  message: string
  action_type?: Notification['action_type']
  action_data?: Notification['action_data']
  priority?: Notification['priority']
  expires_at?: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Note: notifications table not yet in generated types, using type assertion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50) // Limit to recent notifications

      if (fetchError) throw fetchError

      const notificationData = (data || []) as Notification[]
      setNotifications(notificationData)
      setUnreadCount(notificationData.filter(n => !n.is_read).length)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      // Gracefully handle missing notifications table in production
      const error = err as { code?: string; message?: string }
      if (error?.code === 'PGRST205' && error?.message?.includes("Could not find the table 'public.notifications'")) {
        console.log('Notifications table not found - this is expected until migration is applied')
        setNotifications([])
        setUnreadCount(0)
        setError(null)
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Create notification
  const createNotification = useCallback(async (
    notificationData: NotificationInput
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)

      // Note: notifications table not yet in generated types, using type assertion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: createError } = await (supabase as any)
        .from('notifications')
        .insert({
          user_id: user.id,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          action_type: notificationData.action_type,
          action_data: notificationData.action_data,
          priority: notificationData.priority || 'medium',
          is_read: false,
          is_dismissed: false,
          expires_at: notificationData.expires_at,
        })

      if (createError) throw createError

      // Refresh notifications
      await fetchNotifications()
      return true
    } catch (err) {
      console.error('Error creating notification:', err)
      setError(err instanceof Error ? err.message : 'Failed to create notification')
      return false
    }
  }, [user, fetchNotifications])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!user) return false

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      return true
    } catch (err) {
      console.error('Error marking notification as read:', err)
      return false
    }
  }, [user])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!user) return false

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)

      return true
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      return false
    }
  }, [user])

  // Dismiss notification
  const dismissNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    if (!user) return false

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_dismissed: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId)
        return notification && !notification.is_read ? Math.max(0, prev - 1) : prev
      })

      return true
    } catch (err) {
      console.error('Error dismissing notification:', err)
      return false
    }
  }, [user, notifications])

  // Create job completion reminder
  const createJobCompletionReminder = useCallback(async (
    jobId: string,
    jobTitle: string,
    customerId: string
  ): Promise<boolean> => {
    return await createNotification({
      type: 'invoice_reminder',
      title: 'Job Completed - Create Invoice',
      message: `Job "${jobTitle}" has been completed. You can now create an invoice for this job.`,
      action_type: 'create_invoice',
      action_data: {
        job_id: jobId,
        customer_id: customerId
      },
      priority: 'high'
    })
  }, [createNotification])

  // Create payment reminder
  const createPaymentReminder = useCallback(async (
    invoiceId: string,
    invoiceNumber: string,
    customerId: string,
    daysOverdue: number
  ): Promise<boolean> => {
    const priority = daysOverdue > 30 ? 'urgent' : daysOverdue > 14 ? 'high' : 'medium'
    
    return await createNotification({
      type: 'payment_reminder',
      title: `Invoice ${invoiceNumber} Payment Overdue`,
      message: `Invoice ${invoiceNumber} is ${daysOverdue} days overdue. Consider sending a payment reminder.`,
      action_type: 'send_reminder',
      action_data: {
        invoice_id: invoiceId,
        customer_id: customerId
      },
      priority
    })
  }, [createNotification])

  // Clean up expired notifications
  const cleanupExpiredNotifications = useCallback(async (): Promise<void> => {
    if (!user) return

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_dismissed: true })
        .eq('user_id', user.id)
        .lt('expires_at', new Date().toISOString())
        .is('is_dismissed', false)

      if (error) throw error

      // Refresh notifications to remove expired ones
      await fetchNotifications()
    } catch (err) {
      console.error('Error cleaning up expired notifications:', err)
      // Gracefully handle missing notifications table
      const error = err as { code?: string; message?: string }
      if (error?.code === 'PGRST205' && error?.message?.includes("Could not find the table 'public.notifications'")) {
        console.log('Notifications table not found - skipping cleanup')
        return
      }
    }
  }, [user, fetchNotifications])

  // Initial fetch on mount and user change
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchNotifications])

  // Clean up expired notifications on mount
  useEffect(() => {
    cleanupExpiredNotifications()
  }, [cleanupExpiredNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    // CRUD operations
    createNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    fetchNotifications,
    // Specific notification creators
    createJobCompletionReminder,
    createPaymentReminder,
    // Utility functions
    cleanupExpiredNotifications
  }
}
