import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// Quote types based on database schema
export interface Quote {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  customer_id: string
  quote_number: string
  title: string
  description?: string
  subtotal_cents: number
  tax_cents: number
  total_cents: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  valid_until?: string
  subtotal: number // Generated column (subtotal_cents / 100)
  tax_amount: number // Generated column (tax_cents / 100)
  total_amount: number // Generated column (total_cents / 100)
  request_id?: string
  assessment_id?: string
  // Relations
  customer?: {
    id: string
    first_name: string
    last_name: string
    company_name?: string
    email?: string
    phone?: string
    address_street?: string
    address_city?: string
    address_state?: string
    address_zip?: string
  }
  request?: {
    id: string
    title: string
    description?: string
    status: string
  }
  assessment?: {
    id: string
    findings?: string
    recommendations?: string
    estimated_cost?: number
  }
}

export interface QuoteInput {
  customer_id: string
  quote_number: string
  title: string
  description?: string
  subtotal_cents: number
  tax_cents: number
  total_cents: number
  status?: Quote['status']
  valid_until?: string
  request_id?: string
  assessment_id?: string
}

export function useQuotes() {
  const { user } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch quotes with real-time subscription
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function fetchQuotes() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('quotes')
          .select(`
            *,
            customer:customers!inner(
              id,
              first_name,
              last_name,
              company_name,
              email,
              phone,
              address_street,
              address_city,
              address_state,
              address_zip
            ),
            request:requests(
              id,
              title,
              description,
              status
            ),
            assessment:assessments(
              id,
              findings,
              recommendations,
              estimated_cost
            )
          `)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (fetchError) throw fetchError
        setQuotes(data || [])
      } catch (err) {
        console.error('Error fetching quotes:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch quotes')
      } finally {
        setLoading(false)
      }
    }

    fetchQuotes()

    // Set up real-time subscription
    const subscription = supabase
      .channel('quotes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Quote change:', payload)
          fetchQuotes() // Refetch to get complete data with relations
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  // Create quote
  const createQuote = async (quoteData: QuoteInput): Promise<Quote | null> => {
    if (!user) return null

    try {
      setError(null)

      const { data, error: insertError } = await supabase
        .from('quotes')
        .insert({
          ...quoteData,
          user_id: user.id
        })
        .select(`
          *,
          customer:customers!inner(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone,
            address_street,
            address_city,
            address_state,
            address_zip
          ),
          request:requests(
            id,
            title,
            description,
            status
          ),
          assessment:assessments(
            id,
            findings,
            recommendations,
            estimated_cost
          )
        `)
        .single()

      if (insertError) throw insertError
      return data
    } catch (err) {
      console.error('Error creating quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to create quote')
      return null
    }
  }

  // Update quote
  const updateQuote = async (id: string, updates: Partial<QuoteInput>): Promise<Quote | null> => {
    if (!user) return null

    try {
      setError(null)

      const { data, error: updateError } = await supabase
        .from('quotes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          customer:customers!inner(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone,
            address_street,
            address_city,
            address_state,
            address_zip
          ),
          request:requests(
            id,
            title,
            description,
            status
          ),
          assessment:assessments(
            id,
            findings,
            recommendations,
            estimated_cost
          )
        `)
        .single()

      if (updateError) throw updateError
      return data
    } catch (err) {
      console.error('Error updating quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to update quote')
      return null
    }
  }

  // Get single quote
  const getQuote = async (id: string): Promise<Quote | null> => {
    if (!user) return null

    try {
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('quotes')
        .select(`
          *,
          customer:customers!inner(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone,
            address_street,
            address_city,
            address_state,
            address_zip
          ),
          request:requests(
            id,
            title,
            description,
            status
          ),
          assessment:assessments(
            id,
            findings,
            recommendations,
            estimated_cost
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError
      return data
    } catch (err) {
      console.error('Error fetching quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch quote')
      return null
    }
  }

  // Delete quote
  const deleteQuote = async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      return true
    } catch (err) {
      console.error('Error deleting quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete quote')
      return false
    }
  }

  // Generate unique quote number
  const generateQuoteNumber = async (): Promise<string> => {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    // Check for uniqueness (basic implementation)
    let quoteNumber = `Q-${timestamp}-${randomSuffix}`
    let attempts = 0
    
    while (attempts < 10) {
      const existing = quotes.find(q => q.quote_number === quoteNumber)
      if (!existing) break
      
      attempts++
      const newSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      quoteNumber = `Q-${timestamp}-${newSuffix}`
    }
    
    return quoteNumber
  }

  // Convert dollars to cents for database storage
  const dollarsToCents = (dollars: number): number => {
    return Math.round(dollars * 100)
  }

  // Convert cents to dollars for display
  const centsToDollars = (cents: number): number => {
    return cents / 100
  }

  // Calculate totals
  const calculateTotals = (subtotalCents: number, taxCents: number) => {
    return {
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
      subtotal: centsToDollars(subtotalCents),
      taxAmount: centsToDollars(taxCents),
      total: centsToDollars(subtotalCents + taxCents)
    }
  }

  // Filter quotes by status
  const getQuotesByStatus = (status: Quote['status']) => {
    return quotes.filter(quote => quote.status === status)
  }

  // Get quotes statistics
  const getQuoteStats = () => {
    const totalQuotes = quotes.length
    const draftQuotes = getQuotesByStatus('draft').length
    const sentQuotes = getQuotesByStatus('sent').length
    const acceptedQuotes = getQuotesByStatus('accepted').length
    const rejectedQuotes = getQuotesByStatus('rejected').length
    const expiredQuotes = getQuotesByStatus('expired').length

    const totalValue = quotes.reduce((sum, quote) => sum + quote.total_amount, 0)
    const acceptedValue = getQuotesByStatus('accepted').reduce((sum, quote) => sum + quote.total_amount, 0)
    const pendingValue = [...getQuotesByStatus('draft'), ...getQuotesByStatus('sent')]
      .reduce((sum, quote) => sum + quote.total_amount, 0)

    return {
      totalQuotes,
      draftQuotes,
      sentQuotes,
      acceptedQuotes,
      rejectedQuotes,
      expiredQuotes,
      totalValue,
      acceptedValue,
      pendingValue,
      conversionRate: sentQuotes > 0 ? (acceptedQuotes / sentQuotes) * 100 : 0
    }
  }

  return {
    quotes,
    loading,
    error,
    createQuote,
    updateQuote,
    getQuote,
    deleteQuote,
    generateQuoteNumber,
    dollarsToCents,
    centsToDollars,
    calculateTotals,
    getQuotesByStatus,
    getQuoteStats
  }
}
