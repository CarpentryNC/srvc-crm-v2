import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Request {
  id: string
  customer_id: string
  user_id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'received' | 'assessed' | 'quoted' | 'approved' | 'converted'
  requires_assessment: boolean
  location_notes?: string
  preferred_contact_method?: string
  created_at: string
  updated_at: string
  // Relations
  customer?: {
    id: string
    first_name: string
    last_name: string
    company_name?: string
    email?: string
    phone?: string
  }
  assessments?: Assessment[]
  request_files?: RequestFile[]
}

export interface Assessment {
  id: string
  request_id: string
  user_id: string
  scheduled_date?: string
  completed_date?: string
  findings?: string
  recommendations?: string
  estimated_duration_hours?: number
  estimated_cost?: number
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface RequestFile {
  id: string
  request_id: string
  assessment_id?: string
  user_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size?: number
  description?: string
  category: 'reference' | 'assessment' | 'before' | 'after' | 'damage'
  created_at: string
}

export interface RequestInput {
  customer_id: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'received' | 'assessed' | 'quoted' | 'approved' | 'converted'
  requires_assessment?: boolean
  location_notes?: string
  preferred_contact_method?: string
}

export function useRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch requests with customer data
  const fetchRequests = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('requests')
        .select(`
          *,
          customer:customers!inner(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone
          ),
          assessments(*),
          request_files(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setRequests(data || [])
    } catch (err) {
      console.error('Error fetching requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  // Create new request
  const createRequest = async (requestData: RequestInput): Promise<Request | null> => {
    if (!user) return null

    try {
      setError(null)

      const { data, error: insertError } = await (supabase as any)
        .from('requests')
        .insert({
          ...requestData,
          user_id: user.id,
        })
        .select(`
          *,
          customer:customers!inner(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone
          )
        `)
        .single()

      if (insertError) {
        throw insertError
      }

      return data
    } catch (err) {
      console.error('Error creating request:', err)
      setError(err instanceof Error ? err.message : 'Failed to create request')
      return null
    }
  }

  // Update request
  const updateRequest = async (id: string, updates: Partial<RequestInput>): Promise<Request | null> => {
    if (!user) return null

    try {
      setError(null)

      const { data, error: updateError } = await (supabase as any)
        .from('requests')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
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
            phone
          )
        `)
        .single()

      if (updateError) {
        throw updateError
      }

      return data
    } catch (err) {
      console.error('Error updating request:', err)
      setError(err instanceof Error ? err.message : 'Failed to update request')
      return null
    }
  }

  // Delete request
  const deleteRequest = async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('requests')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) {
        throw deleteError
      }

      return true
    } catch (err) {
      console.error('Error deleting request:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete request')
      return false
    }
  }

  // Get request by ID
  const getRequest = async (id: string): Promise<Request | null> => {
    if (!user) return null

    try {
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('requests')
        .select(`
          *,
          customer:customers!inner(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone,
            address,
            city,
            state,
            zip_code
          ),
          assessments(*),
          request_files(*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        throw fetchError
      }

      return data
    } catch (err) {
      console.error('Error fetching request:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch request')
      return null
    }
  }

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    fetchRequests()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchRequests()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return {
    requests,
    loading,
    error,
    createRequest,
    updateRequest,
    deleteRequest,
    getRequest,
    refetch: fetchRequests,
  }
}
