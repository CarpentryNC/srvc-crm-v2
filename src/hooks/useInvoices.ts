import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// Invoice line item interface
export interface InvoiceLineItem {
  id: string
  created_at: string
  updated_at: string
  invoice_id: string
  user_id: string
  title: string
  description?: string
  quantity: number
  unit_price_cents: number
  total_cents: number
  unit_price: number // Generated column
  total_amount: number // Generated column
  sort_order: number
}

export interface InvoiceLineItemInput {
  title: string
  description?: string
  quantity: number
  unit_price_cents: number
  sort_order?: number
}

// Invoice payment interface
export interface InvoicePayment {
  id: string
  created_at: string
  updated_at: string
  invoice_id: string
  user_id: string
  amount_cents: number
  amount: number // Generated column
  payment_date: string
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'stripe' | 'other'
  transaction_id?: string
  stripe_payment_intent_id?: string
  notes?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
}

export interface InvoicePaymentInput {
  amount_cents: number
  payment_date: string
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'stripe' | 'other'
  transaction_id?: string
  stripe_payment_intent_id?: string
  notes?: string
  status?: 'pending' | 'completed' | 'failed' | 'refunded'
}

// Invoice types based on database schema
export interface Invoice {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  customer_id: string
  quote_id?: string
  invoice_number: string
  title: string
  description?: string
  subtotal_cents: number
  tax_cents: number
  total_cents: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date?: string
  paid_date?: string
  stripe_payment_intent_id?: string
  subtotal: number // Generated column (subtotal_cents / 100)
  tax_amount: number // Generated column (tax_cents / 100)
  total_amount: number // Generated column (total_cents / 100)
  // Relations
  customer?: {
    id: string
    first_name?: string
    last_name?: string
    company_name?: string
    email?: string
    phone?: string
  }
  quote?: {
    id: string
    quote_number: string
    title: string
  }
  line_items?: InvoiceLineItem[]
  payments?: InvoicePayment[]
}

export interface InvoiceInput {
  customer_id: string
  quote_id?: string
  title: string
  description?: string
  due_date?: string
  line_items?: InvoiceLineItemInput[]
}

// Invoice summary from database view
export interface InvoiceSummary extends Invoice {
  total_paid: number
  balance_due: number
  is_fully_paid: boolean
  customer_name: string
  customer_company?: string
  customer_email?: string
}

export function useInvoices() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Generate invoice number
  const generateInvoiceNumber = useCallback(async (): Promise<string> => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error fetching last invoice number:', error)
      return 'INV-001'
    }

    if (!data || data.length === 0) {
      return 'INV-001'
    }

    // Extract number from last invoice number and increment
    const lastNumber = data[0].invoice_number
    const match = lastNumber.match(/INV-(\d+)/)
    if (match) {
      const nextNumber = parseInt(match[1]) + 1
      return `INV-${nextNumber.toString().padStart(3, '0')}`
    }

    return 'INV-001'
  }, [user])

  // Fetch invoices with related data
  const fetchInvoices = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers (
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone
          ),
          quote:quotes (
            id,
            quote_number,
            title
          ),
          line_items:invoice_line_items (*),
          payments:invoice_payments (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setInvoices(data || [])
    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Get single invoice by ID
  const getInvoice = useCallback(async (invoiceId: string): Promise<Invoice | null> => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers (
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone
          ),
          quote:quotes (
            id,
            quote_number,
            title
          ),
          line_items:invoice_line_items (*),
          payments:invoice_payments (*)
        `)
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching invoice:', err)
      return null
    }
  }, [user])

  // Create invoice
  const createInvoice = useCallback(async (invoiceData: InvoiceInput): Promise<string | null> => {
    if (!user) {
      setError('User not authenticated')
      return null
    }

    try {
      setError(null)

      // Generate invoice number
      const invoice_number = await generateInvoiceNumber()

      // Calculate totals from line items
      let subtotal_cents = 0
      if (invoiceData.line_items) {
        subtotal_cents = invoiceData.line_items.reduce((sum, item) => {
          return sum + (item.quantity * item.unit_price_cents)
        }, 0)
      }

      const tax_cents = Math.round(subtotal_cents * 0.0875) // 8.75% tax rate
      const total_cents = subtotal_cents + tax_cents

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          customer_id: invoiceData.customer_id,
          quote_id: invoiceData.quote_id,
          invoice_number,
          title: invoiceData.title,
          description: invoiceData.description,
          subtotal_cents,
          tax_cents,
          total_cents,
          due_date: invoiceData.due_date,
          status: 'draft'
        })
        .select('id')
        .single()

      if (invoiceError) throw invoiceError

      // Create line items if provided
      if (invoiceData.line_items && invoiceData.line_items.length > 0) {
        const lineItemsWithInvoiceId = invoiceData.line_items.map((item, index) => ({
          ...item,
          invoice_id: invoice.id,
          user_id: user.id,
          total_cents: item.quantity * item.unit_price_cents,
          sort_order: item.sort_order ?? index
        }))

        const { error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .insert(lineItemsWithInvoiceId)

        if (lineItemsError) throw lineItemsError
      }

      // Refresh invoices list
      await fetchInvoices()

      return invoice.id
    } catch (err) {
      console.error('Error creating invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to create invoice')
      return null
    }
  }, [user, generateInvoiceNumber, fetchInvoices])

  // Create invoice from quote
  const createInvoiceFromQuote = useCallback(async (
    quoteId: string, 
    invoiceData: { title?: string; description?: string; due_date?: string } = {}
  ): Promise<string | null> => {
    if (!user) {
      setError('User not authenticated')
      return null
    }

    try {
      setError(null)

      // Fetch quote with line items
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          line_items:quote_line_items (*)
        `)
        .eq('id', quoteId)
        .eq('user_id', user.id)
        .single()

      if (quoteError) throw quoteError

      // Convert quote line items to invoice line items
      const invoiceLineItems: InvoiceLineItemInput[] = quote.line_items?.map((item: any, index: number) => ({
        title: item.title || item.description.substring(0, 50),
        description: item.description,
        quantity: item.quantity,
        unit_price_cents: item.unit_price_cents,
        sort_order: item.sort_order ?? index
      })) || []

      // Create invoice with quote data
      const invoiceInput: InvoiceInput = {
        customer_id: quote.customer_id,
        quote_id: quoteId,
        title: invoiceData.title || quote.title,
        description: invoiceData.description || quote.description,
        due_date: invoiceData.due_date,
        line_items: invoiceLineItems
      }

      return await createInvoice(invoiceInput)
    } catch (err) {
      console.error('Error creating invoice from quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to create invoice from quote')
      return null
    }
  }, [user, createInvoice])

  // Update invoice
  const updateInvoice = useCallback(async (
    invoiceId: string, 
    updates: Partial<InvoiceInput>
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)

      // Update invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .update({
          title: updates.title,
          description: updates.description,
          due_date: updates.due_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)
        .eq('user_id', user.id)

      if (invoiceError) throw invoiceError

      // Update line items if provided
      if (updates.line_items) {
        // Delete existing line items
        const { error: deleteError } = await supabase
          .from('invoice_line_items')
          .delete()
          .eq('invoice_id', invoiceId)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError

        // Insert new line items
        if (updates.line_items.length > 0) {
          const lineItemsWithInvoiceId = updates.line_items.map((item, index) => ({
            ...item,
            invoice_id: invoiceId,
            user_id: user.id,
            total_cents: item.quantity * item.unit_price_cents,
            sort_order: item.sort_order ?? index
          }))

          const { error: insertError } = await supabase
            .from('invoice_line_items')
            .insert(lineItemsWithInvoiceId)

          if (insertError) throw insertError
        }

        // Recalculate totals
        const subtotal_cents = updates.line_items.reduce((sum, item) => {
          return sum + (item.quantity * item.unit_price_cents)
        }, 0)
        const tax_cents = Math.round(subtotal_cents * 0.0875)
        const total_cents = subtotal_cents + tax_cents

        const { error: totalsError } = await supabase
          .from('invoices')
          .update({
            subtotal_cents,
            tax_cents,
            total_cents
          })
          .eq('id', invoiceId)
          .eq('user_id', user.id)

        if (totalsError) throw totalsError
      }

      // Refresh invoices list
      await fetchInvoices()

      return true
    } catch (err) {
      console.error('Error updating invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to update invoice')
      return false
    }
  }, [user, fetchInvoices])

  // Update invoice status
  const updateInvoiceStatus = useCallback(async (
    invoiceId: string, 
    status: Invoice['status']
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)

      const updates: any = { 
        status,
        updated_at: new Date().toISOString()
      }

      // Set paid_date when marking as paid
      if (status === 'paid') {
        updates.paid_date = new Date().toISOString()
      } else if (status !== 'paid') {
        updates.paid_date = null
      }

      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId)
        .eq('user_id', user.id)

      if (error) throw error

      // Refresh invoices list
      await fetchInvoices()

      return true
    } catch (err) {
      console.error('Error updating invoice status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update invoice status')
      return false
    }
  }, [user, fetchInvoices])

  // Delete invoice
  const deleteInvoice = useCallback(async (invoiceId: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('user_id', user.id)

      if (error) throw error

      // Refresh invoices list
      await fetchInvoices()

      return true
    } catch (err) {
      console.error('Error deleting invoice:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete invoice')
      return false
    }
  }, [user, fetchInvoices])

  // Add payment to invoice
  const addPayment = useCallback(async (
    invoiceId: string, 
    paymentData: InvoicePaymentInput
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)

      const { error } = await supabase
        .from('invoice_payments')
        .insert({
          ...paymentData,
          invoice_id: invoiceId,
          user_id: user.id,
          status: paymentData.status || 'completed'
        })

      if (error) throw error

      // Check if invoice is now fully paid
      const { data: invoice } = await supabase
        .from('invoice_summary')
        .select('total_amount, total_paid, is_fully_paid')
        .eq('id', invoiceId)
        .single()

      if (invoice?.is_fully_paid) {
        await updateInvoiceStatus(invoiceId, 'paid')
      }

      // Refresh invoices list
      await fetchInvoices()

      return true
    } catch (err) {
      console.error('Error adding payment:', err)
      setError(err instanceof Error ? err.message : 'Failed to add payment')
      return false
    }
  }, [user, updateInvoiceStatus, fetchInvoices])

  // Get invoice line items
  const getInvoiceLineItems = useCallback(async (invoiceId: string): Promise<InvoiceLineItem[]> => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching line items:', err)
      return []
    }
  }, [user])

  // Get invoice payments
  const getInvoicePayments = useCallback(async (invoiceId: string): Promise<InvoicePayment[]> => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('invoice_payments')
        .select('*')
        .eq('invoice_id', invoiceId)
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching payments:', err)
      return []
    }
  }, [user])

  // Get invoice summary (with payment info)
  const getInvoiceSummary = useCallback(async (invoiceId: string): Promise<InvoiceSummary | null> => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from('invoice_summary')
        .select('*')
        .eq('id', invoiceId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error fetching invoice summary:', err)
      return null
    }
  }, [user])

  // Initial fetch on mount and user change
  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('invoices')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'invoices', filter: `user_id=eq.${user.id}` },
        () => {
          fetchInvoices()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'invoice_line_items', filter: `user_id=eq.${user.id}` },
        () => {
          fetchInvoices()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'invoice_payments', filter: `user_id=eq.${user.id}` },
        () => {
          fetchInvoices()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchInvoices])

  return {
    invoices,
    loading,
    error,
    // CRUD operations
    createInvoice,
    createInvoiceFromQuote,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    getInvoice,
    getInvoiceSummary,
    getInvoiceLineItems,
    getInvoicePayments,
    // Utility functions
    generateInvoiceNumber,
    fetchInvoices,
    // Payment operations
    addPayment
  }
}
