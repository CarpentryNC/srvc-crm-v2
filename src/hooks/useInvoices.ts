import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Database } from '../types/database'

type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']
type InvoiceLineItemInsert = Database['public']['Tables']['invoice_line_items']['Insert']
type InvoicePaymentInsert = Database['public']['Tables']['invoice_payments']['Insert']
type QuoteRow = Database['public']['Tables']['quotes']['Row']
type QuoteLineItemRow = Database['public']['Tables']['quote_line_items']['Row']

// Simple type definitions to avoid conflicts
export interface Invoice {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  customer_id: string
  quote_id: string | null
  invoice_number: string
  title: string
  description: string | null
  subtotal_cents: number
  tax_cents: number
  total_cents: number
  subtotal: number | null
  tax_amount: number | null
  total_amount: number | null
  status: string
  due_date: string | null
  paid_date: string | null
  stripe_payment_intent_id: string | null
}

export interface SimpleInvoice {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  customer_id: string
  quote_id: string | null
  invoice_number: string
  title: string
  description: string | null
  subtotal_cents: number
  tax_cents: number
  total_cents: number
  status: string
  due_date: string | null
  paid_date: string | null
  stripe_payment_intent_id: string | null
}

export interface InvoiceLineItem {
  id: string
  created_at: string | null
  updated_at: string | null
  invoice_id: string
  user_id: string
  title: string
  description: string | null
  quantity: number
  unit_price_cents: number
  total_cents: number
  unit_price: number | null
  total_amount: number | null
  sort_order: number
}

export interface SimpleInvoiceLineItem {
  id: string
  created_at: string | null
  updated_at: string | null
  invoice_id: string
  user_id: string
  title: string
  description: string | null
  quantity: number
  unit_price_cents: number
  total_cents: number
  sort_order: number
}

export interface InvoicePayment {
  id: string
  created_at: string | null
  updated_at: string | null
  invoice_id: string
  user_id: string
  amount_cents: number
  amount: number | null
  payment_date: string
  payment_method: string
  transaction_id: string | null
  stripe_payment_intent_id: string | null
  notes: string | null
  status: string
}

export interface SimpleInvoicePayment {
  id: string
  created_at: string | null
  updated_at: string | null
  invoice_id: string
  user_id: string
  amount_cents: number
  payment_date: string
  payment_method: string
  transaction_id: string | null
  stripe_payment_intent_id: string | null
  notes: string | null
  status: string
}

// Input interfaces for creating invoices
export interface InvoiceLineItemInput {
  title: string
  description?: string
  quantity: number
  unit_price_cents: number
  sort_order?: number
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

// Extended invoice type with relations
export interface InvoiceWithRelations extends SimpleInvoice {
  customer?: {
    id: string
    first_name?: string | null
    last_name?: string | null
    company_name?: string | null
    email?: string | null
    phone?: string | null
  } | null
  quote?: {
    id: string
    quote_number: string
    title: string
  } | null
  line_items?: SimpleInvoiceLineItem[] | null
  payments?: SimpleInvoicePayment[] | null
}

export interface InvoiceInput {
  customer_id: string
  quote_id?: string
  title: string
  description?: string
  due_date?: string
  line_items?: InvoiceLineItemInput[]
}

export function useInvoices() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<InvoiceWithRelations[]>([])
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

      // Create invoice using typed interface
      const invoiceInsert: InvoiceInsert = {
        user_id: user.id,
        customer_id: invoiceData.customer_id,
        quote_id: invoiceData.quote_id || null,
        invoice_number,
        title: invoiceData.title,
        description: invoiceData.description || null,
        subtotal_cents,
        tax_cents,
        total_cents,
        due_date: invoiceData.due_date || null,
        status: 'draft'
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceInsert)
        .select('id')
        .single()

      if (invoiceError) throw invoiceError

      // Create line items if provided
      if (invoiceData.line_items && invoiceData.line_items.length > 0) {
        const lineItemsWithInvoiceId: InvoiceLineItemInsert[] = invoiceData.line_items.map((item, index) => ({
          invoice_id: invoice.id,
          user_id: user.id,
          title: item.title,
          description: item.description || null,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
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

  // Update invoice status
  const updateInvoiceStatus = useCallback(async (
    invoiceId: string, 
    status: SimpleInvoice['status']
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setError(null)

      const updates: InvoiceUpdate = { 
        status,
        updated_at: new Date().toISOString()
      }

      // Set paid_date when marking as paid, clear it for other statuses
      if (status === 'paid') {
        updates.paid_date = new Date().toISOString()
      } else if (status === 'partially_paid') {
        // For partially paid, keep existing paid_date or don't set it yet
        // This allows for multiple partial payments before full payment
      } else {
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

      const paymentInsert: InvoicePaymentInsert = {
        invoice_id: invoiceId,
        user_id: user.id,
        amount_cents: paymentData.amount_cents,
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
        transaction_id: paymentData.transaction_id || null,
        stripe_payment_intent_id: paymentData.stripe_payment_intent_id || null,
        notes: paymentData.notes || null,
        status: paymentData.status || 'completed'
      }

      const { error } = await supabase
        .from('invoice_payments')
        .insert(paymentInsert)

      if (error) throw error

      // Refresh invoices list
      await fetchInvoices()

      return true
    } catch (err) {
      console.error('Error adding payment:', err)
      setError(err instanceof Error ? err.message : 'Failed to add payment')
      return false
    }
  }, [user, fetchInvoices])

  // Create invoice from quote
  const createInvoiceFromQuote = useCallback(async (
    quoteId: string, 
    invoiceData: {
      title: string
      description?: string
      due_date?: string
    }
  ): Promise<string | null> => {
    if (!user) {
      setError('User not authenticated')
      return null
    }

    try {
      setError(null)

      // First, fetch the quote with all its data
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_line_items (*)
        `)
        .eq('id', quoteId)
        .eq('user_id', user.id)
        .single()

      if (quoteError) throw quoteError
      if (!quote) throw new Error('Quote not found')

      // Generate invoice number
      const invoice_number = await generateInvoiceNumber()

      // Use quote totals (already calculated) with proper typing
      const quoteWithLineItems = quote as QuoteRow & { quote_line_items: QuoteLineItemRow[] }
      const subtotal_cents = quoteWithLineItems.subtotal_cents
      const tax_cents = quoteWithLineItems.tax_cents
      const total_cents = quoteWithLineItems.total_cents

      // Create invoice
      const invoiceInsert: InvoiceInsert = {
        user_id: user.id,
        customer_id: quoteWithLineItems.customer_id,
        quote_id: quoteId,
        invoice_number,
        title: invoiceData.title,
        description: invoiceData.description || null,
        subtotal_cents,
        tax_cents,
        total_cents,
        due_date: invoiceData.due_date || null,
        status: 'draft'
      }

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceInsert)
        .select('id')
        .single()

      if (invoiceError) throw invoiceError

      // Copy line items from quote to invoice
      const quoteLineItems = quoteWithLineItems.quote_line_items
      if (quoteLineItems && quoteLineItems.length > 0) {
        const invoiceLineItems: InvoiceLineItemInsert[] = quoteLineItems.map((item: QuoteLineItemRow) => ({
          invoice_id: invoice.id,
          user_id: user.id,
          title: item.title?.trim() || item.description?.trim() || 'Service Item',
          description: item.description || null,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
          total_cents: item.total_cents || (item.quantity * item.unit_price_cents),
          sort_order: item.sort_order
        }))

        const { error: lineItemsError } = await supabase
          .from('invoice_line_items')
          .insert(invoiceLineItems)

        if (lineItemsError) {
          console.error('Line items error:', lineItemsError)
          console.error('Line items data:', invoiceLineItems)
          throw lineItemsError
        }
      }

      // Refresh invoices list
      await fetchInvoices()

      return invoice.id
    } catch (err) {
      console.error('Error creating invoice from quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to create invoice from quote')
      return null
    }
  }, [user, generateInvoiceNumber, fetchInvoices])

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
    updateInvoiceStatus,
    deleteInvoice,
    getInvoice,
    getInvoiceLineItems,
    getInvoicePayments,
    // Utility functions
    generateInvoiceNumber,
    fetchInvoices,
    // Payment operations
    addPayment
  }
}
