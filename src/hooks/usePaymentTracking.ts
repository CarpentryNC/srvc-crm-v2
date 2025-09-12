import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export interface PaymentStatus {
  invoice_id: string
  invoice_number: string
  customer_name: string
  customer_email: string | null
  total_amount: number
  total_paid: number
  balance_due: number
  due_date: string | null
  days_overdue: number
  status: 'current' | 'overdue' | 'paid'
  last_payment_date: string | null
  payment_count: number
}

export interface PaymentAnalytics {
  total_outstanding: number
  total_overdue: number
  average_days_to_payment: number
  overdue_count: number
  current_count: number
  paid_count: number
  collection_rate: number
}

export function usePaymentTracking() {
  const { user } = useAuth()
  const [paymentStatuses, setPaymentStatuses] = useState<PaymentStatus[]>([])
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch payment statuses for all invoices
  const fetchPaymentStatuses = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      setLoading(true)

      // Query invoices with payment information using the invoice_summary view
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoice_summary')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (invoicesError) throw invoicesError

      // Calculate payment statuses - filter for valid invoices first
      const validInvoices = invoicesData.filter((invoice): invoice is typeof invoice & { id: string; invoice_number: string } => 
        invoice.id !== null && invoice.invoice_number !== null
      )
      
      const statuses: PaymentStatus[] = validInvoices.map((invoice) => {
        const totalAmount = invoice.total_amount || 0
        const totalPaid = invoice.total_paid || 0
        const balanceDue = invoice.balance_due || 0
        const dueDate = invoice.due_date ? new Date(invoice.due_date) : null
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        let daysOverdue = 0
        let status: 'current' | 'overdue' | 'paid' = 'current'

        if (balanceDue <= 0) {
          status = 'paid'
        } else if (dueDate && dueDate < today) {
          daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          status = 'overdue'
        }

        return {
          invoice_id: invoice.id, // Now guaranteed to be string
          invoice_number: invoice.invoice_number, // Now guaranteed to be string
          customer_name: invoice.customer_name || 'Unknown Customer',
          customer_email: invoice.customer_email,
          total_amount: totalAmount,
          total_paid: totalPaid,
          balance_due: balanceDue,
          due_date: invoice.due_date,
          days_overdue: daysOverdue,
          status,
          last_payment_date: null, // Will be fetched separately if needed
          payment_count: 0 // Will be calculated separately if needed
        }
      })

      // Get payment details for each invoice
      const invoiceIds = statuses.map(s => s.invoice_id)
      
      if (invoiceIds.length > 0) {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('invoice_payments')
          .select('invoice_id, payment_date, status')
          .in('invoice_id', invoiceIds)
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('payment_date', { ascending: false })

        if (paymentsError) {
          console.warn('Error fetching payment details:', paymentsError)
        } else {
          // Update statuses with payment information
          const paymentsByInvoice = paymentsData.reduce((acc, payment) => {
            if (!acc[payment.invoice_id]) {
              acc[payment.invoice_id] = []
            }
            acc[payment.invoice_id].push(payment)
            return acc
          }, {} as Record<string, Array<{ invoice_id: string; payment_date: string; status: string }>>)

          statuses.forEach(status => {
            const payments = paymentsByInvoice[status.invoice_id] || []
            status.payment_count = payments.length
            status.last_payment_date = payments.length > 0 ? payments[0].payment_date : null
          })
        }
      }

      setPaymentStatuses(statuses)

      // Calculate analytics
      const analytics: PaymentAnalytics = {
        total_outstanding: statuses
          .filter(s => s.status !== 'paid')
          .reduce((sum, s) => sum + s.balance_due, 0),
        total_overdue: statuses
          .filter(s => s.status === 'overdue')
          .reduce((sum, s) => sum + s.balance_due, 0),
        overdue_count: statuses.filter(s => s.status === 'overdue').length,
        current_count: statuses.filter(s => s.status === 'current').length,
        paid_count: statuses.filter(s => s.status === 'paid').length,
        average_days_to_payment: 0, // Would need historical data to calculate
        collection_rate: statuses.length > 0 
          ? (statuses.filter(s => s.status === 'paid').length / statuses.length) * 100 
          : 0
      }

      setAnalytics(analytics)

    } catch (err) {
      console.error('Error fetching payment statuses:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch payment statuses')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Get overdue invoices
  const getOverdueInvoices = useCallback(() => {
    return paymentStatuses.filter(status => status.status === 'overdue')
  }, [paymentStatuses])

  // Get invoices due soon (within next 7 days)
  const getInvoicesDueSoon = useCallback(() => {
    const oneWeekFromNow = new Date()
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)

    return paymentStatuses.filter(status => {
      if (status.status !== 'current' || !status.due_date) return false
      const dueDate = new Date(status.due_date)
      return dueDate <= oneWeekFromNow
    })
  }, [paymentStatuses])

  // Mark invoice as paid (for manual payment recording)
  const markInvoiceAsPaid = useCallback(async (invoiceId: string) => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)

      // Update invoice status to paid
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Refresh payment statuses
      await fetchPaymentStatuses()

      return true
    } catch (err) {
      console.error('Error marking invoice as paid:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark invoice as paid')
      return false
    }
  }, [user, fetchPaymentStatuses])

  // Auto-update invoice statuses based on due dates
  const updateOverdueStatuses = useCallback(async () => {
    if (!user) return

    try {
      setError(null)

      // Get invoices that should be marked as overdue
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today

      const { data: overdueInvoices, error: fetchError } = await supabase
        .from('invoices')
        .select('id, status, due_date, total_amount')
        .eq('user_id', user.id)
        .eq('status', 'sent')
        .not('due_date', 'is', null)
        .lt('due_date', today.toISOString())

      if (fetchError) throw fetchError

      // Filter invoices that need status update
      const invoicesToUpdate = overdueInvoices?.filter(invoice => {
        // Check if invoice has any balance due
        const status = paymentStatuses.find(s => s.invoice_id === invoice.id)
        return status && status.balance_due > 0
      }) || []

      if (invoicesToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ status: 'overdue' })
          .in('id', invoicesToUpdate.map(inv => inv.id))

        if (updateError) throw updateError

        // Refresh payment statuses
        await fetchPaymentStatuses()
      }

    } catch (err) {
      console.error('Error updating overdue statuses:', err)
      setError(err instanceof Error ? err.message : 'Failed to update overdue statuses')
    }
  }, [user, paymentStatuses, fetchPaymentStatuses])

  // Initialize data on mount
  useEffect(() => {
    fetchPaymentStatuses()
  }, [fetchPaymentStatuses])

  // Auto-update overdue statuses when payment statuses change
  useEffect(() => {
    if (paymentStatuses.length > 0) {
      updateOverdueStatuses()
    }
  }, [paymentStatuses.length, updateOverdueStatuses]) // Only run when initial data is loaded

  return {
    paymentStatuses,
    analytics,
    loading,
    error,
    fetchPaymentStatuses,
    getOverdueInvoices,
    getInvoicesDueSoon,
    markInvoiceAsPaid,
    updateOverdueStatuses
  }
}
