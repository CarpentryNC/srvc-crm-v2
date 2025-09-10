import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

// =============================================
// Calendar Types and Interfaces
// =============================================

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description?: string
  location?: string
  start_datetime: string
  end_datetime?: string
  all_day: boolean
  timezone: string
  event_type: 'job' | 'assessment' | 'meeting' | 'reminder' | 'follow_up' | 'quote_expiry' | 'custom'
  source_type?: 'job' | 'assessment' | 'quote' | 'request' | 'manual'
  source_id?: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  color: string
  is_recurring: boolean
  recurrence_pattern?: string
  customer_id?: string
  assigned_to?: string
  reminder_minutes: number[]
  is_private: boolean
  notes?: string
  created_at: string
  updated_at: string
  
  // Populated data
  customer_name?: string
  assigned_to_name?: string
  attendees?: EventAttendee[]
  files?: EventFile[]
}

export interface EventAttendee {
  id: string
  event_id: string
  user_id?: string
  customer_id?: string
  email?: string
  name?: string
  phone?: string
  status: 'invited' | 'accepted' | 'declined' | 'tentative' | 'no_response'
  response_datetime?: string
  notes?: string
}

export interface EventFile {
  id: string
  event_id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  mime_type?: string
  category: 'attachment' | 'photo' | 'document' | 'reference'
  description?: string
  created_at: string
}

export interface EventReminder {
  id: string
  event_id: string
  reminder_type: 'email' | 'push' | 'sms' | 'in_app'
  minutes_before: number
  reminder_datetime: string
  status: 'pending' | 'sent' | 'failed' | 'cancelled'
  sent_at?: string
  error_message?: string
}

export interface CalendarEventInput {
  title: string
  description?: string
  location?: string
  start_datetime: string
  end_datetime?: string
  all_day?: boolean
  timezone?: string
  event_type: CalendarEvent['event_type']
  source_type?: CalendarEvent['source_type']
  source_id?: string
  priority?: CalendarEvent['priority']
  color?: string
  is_recurring?: boolean
  recurrence_pattern?: string
  customer_id?: string
  assigned_to?: string
  reminder_minutes?: number[]
  is_private?: boolean
  notes?: string
}

export interface CalendarFilters {
  event_types?: CalendarEvent['event_type'][]
  status?: CalendarEvent['status'][]
  priority?: CalendarEvent['priority'][]
  customer_id?: string
  assigned_to?: string
  show_private?: boolean
  search?: string
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda'
  date: Date
  start_date: Date
  end_date: Date
}

// =============================================
// Main useCalendar Hook
// =============================================

export function useCalendar() {
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Calendar view state
  const [currentView, setCurrentView] = useState<CalendarView>(() => {
    const today = new Date()
    return {
      type: 'month',
      date: today,
      start_date: getMonthStart(today),
      end_date: getMonthEnd(today)
    }
  })
  
  const [filters, setFilters] = useState<CalendarFilters>({})

  // =============================================
  // Date Helper Functions
  // =============================================

  function getMonthStart(date: Date): Date {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    // Include previous week to show full calendar grid
    const dayOfWeek = start.getDay()
    start.setDate(start.getDate() - dayOfWeek)
    return start
  }

  function getMonthEnd(date: Date): Date {
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    // Include next week to show full calendar grid
    const dayOfWeek = end.getDay()
    end.setDate(end.getDate() + (6 - dayOfWeek))
    return end
  }

  function getWeekStart(date: Date): Date {
    const start = new Date(date)
    const dayOfWeek = start.getDay()
    start.setDate(start.getDate() - dayOfWeek)
    return start
  }

  function getWeekEnd(date: Date): Date {
    const end = new Date(date)
    const dayOfWeek = end.getDay()
    end.setDate(end.getDate() + (6 - dayOfWeek))
    return end
  }

  function getDayStart(date: Date): Date {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    return start
  }

  function getDayEnd(date: Date): Date {
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    return end
  }

  // =============================================
  // Calendar Navigation
  // =============================================

  const navigateToDate = useCallback((date: Date, viewType?: CalendarView['type']) => {
    const type = viewType || currentView.type
    let start_date: Date
    let end_date: Date

    switch (type) {
      case 'month':
        start_date = getMonthStart(date)
        end_date = getMonthEnd(date)
        break
      case 'week':
        start_date = getWeekStart(date)
        end_date = getWeekEnd(date)
        break
      case 'day':
        start_date = getDayStart(date)
        end_date = getDayEnd(date)
        break
      case 'agenda':
        start_date = getDayStart(date)
        end_date = new Date(date.getFullYear(), date.getMonth() + 1, 0) // End of month
        break
    }

    setCurrentView({
      type,
      date: new Date(date),
      start_date,
      end_date
    })
  }, [currentView.type])

  const navigatePrevious = useCallback(() => {
    const { type, date } = currentView
    let newDate: Date

    switch (type) {
      case 'month':
        newDate = new Date(date.getFullYear(), date.getMonth() - 1, 1)
        break
      case 'week':
        newDate = new Date(date)
        newDate.setDate(date.getDate() - 7)
        break
      case 'day':
        newDate = new Date(date)
        newDate.setDate(date.getDate() - 1)
        break
      case 'agenda':
        newDate = new Date(date.getFullYear(), date.getMonth() - 1, 1)
        break
    }

    navigateToDate(newDate)
  }, [currentView, navigateToDate])

  const navigateNext = useCallback(() => {
    const { type, date } = currentView
    let newDate: Date

    switch (type) {
      case 'month':
        newDate = new Date(date.getFullYear(), date.getMonth() + 1, 1)
        break
      case 'week':
        newDate = new Date(date)
        newDate.setDate(date.getDate() + 7)
        break
      case 'day':
        newDate = new Date(date)
        newDate.setDate(date.getDate() + 1)
        break
      case 'agenda':
        newDate = new Date(date.getFullYear(), date.getMonth() + 1, 1)
        break
    }

    navigateToDate(newDate)
  }, [currentView, navigateToDate])

  const navigateToToday = useCallback(() => {
    navigateToDate(new Date())
  }, [navigateToDate])

  // =============================================
  // Data Fetching
  // =============================================

  const fetchEvents = useCallback(async (forceRefresh = false) => {
    if (!user) return

    try {
      if (!forceRefresh) setLoading(true)
      setError(null)

      // Build query with filters
      let query = supabase
        .from('calendar_events')
        .select(`
          *,
          customers!calendar_events_customer_id_fkey(name),
          assigned_user:auth.users!calendar_events_assigned_to_fkey(id, email),
          event_attendees(*),
          event_files(*)
        `)
        .gte('start_datetime', currentView.start_date.toISOString())
        .lte('start_datetime', currentView.end_date.toISOString())
        .neq('status', 'cancelled')

      // Apply filters
      if (filters.event_types && filters.event_types.length > 0) {
        query = query.in('event_type', filters.event_types)
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }
      if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority)
      }
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id)
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to)
      }
      if (!filters.show_private) {
        query = query.eq('is_private', false)
      }

      const { data, error } = await query.order('start_datetime', { ascending: true })

      if (error) throw error

      // Transform data and add computed fields
      const transformedEvents: CalendarEvent[] = (data || []).map(event => ({
        ...event,
        customer_name: event.customers?.name,
        assigned_to_name: event.assigned_user?.email,
        attendees: event.event_attendees || [],
        files: event.event_files || []
      }))

      // Apply search filter on client side for performance
      let filteredEvents = transformedEvents
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredEvents = transformedEvents.filter(event =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.customer_name?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower)
        )
      }

      setEvents(filteredEvents)
    } catch (err) {
      console.error('Error fetching calendar events:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }, [user, currentView.start_date, currentView.end_date, filters])

  // =============================================
  // Event CRUD Operations
  // =============================================

  const createEvent = useCallback(async (eventData: CalendarEventInput): Promise<CalendarEvent> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          ...eventData,
          user_id: user.id,
          status: 'scheduled',
          color: eventData.color || getDefaultColorForEventType(eventData.event_type),
          timezone: eventData.timezone || 'America/New_York',
          reminder_minutes: eventData.reminder_minutes || [15, 60],
          created_by: user.id
        }])
        .select(`
          *,
          customers!calendar_events_customer_id_fkey(name),
          assigned_user:auth.users!calendar_events_assigned_to_fkey(id, email)
        `)
        .single()

      if (error) throw error

      const newEvent: CalendarEvent = {
        ...data,
        customer_name: data.customers?.name,
        assigned_to_name: data.assigned_user?.email,
        attendees: [],
        files: []
      }

      // Update local state
      setEvents(prev => [...prev, newEvent].sort((a, b) => 
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      ))

      return newEvent
    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw error
    }
  }, [user])

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEventInput>): Promise<CalendarEvent> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({
          ...updates,
          updated_by: user.id
        })
        .eq('id', id)
        .select(`
          *,
          customers!calendar_events_customer_id_fkey(name),
          assigned_user:auth.users!calendar_events_assigned_to_fkey(id, email)
        `)
        .single()

      if (error) throw error

      const updatedEvent: CalendarEvent = {
        ...data,
        customer_name: data.customers?.name,
        assigned_to_name: data.assigned_user?.email,
        attendees: [],
        files: []
      }

      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
      ))

      return updatedEvent
    } catch (error) {
      console.error('Error updating calendar event:', error)
      throw error
    }
  }, [user])

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Update local state
      setEvents(prev => prev.filter(event => event.id !== id))
    } catch (error) {
      console.error('Error deleting calendar event:', error)
      throw error
    }
  }, [user])

  // =============================================
  // Integration Functions
  // =============================================

  const createJobEvent = useCallback(async (jobData: {
    job_id: string
    title: string
    scheduled_date: string
    estimated_hours?: number
    customer_id?: string
    description?: string
  }) => {
    const endDateTime = new Date(jobData.scheduled_date)
    endDateTime.setHours(endDateTime.getHours() + (jobData.estimated_hours || 4))

    return createEvent({
      title: jobData.title,
      description: jobData.description || 'Scheduled job work',
      start_datetime: jobData.scheduled_date,
      end_datetime: endDateTime.toISOString(),
      event_type: 'job',
      source_type: 'job',
      source_id: jobData.job_id,
      customer_id: jobData.customer_id,
      priority: 'medium',
      color: '#10B981'
    })
  }, [createEvent])

  const createAssessmentEvent = useCallback(async (assessmentData: {
    assessment_id: string
    title: string
    scheduled_date: string
    customer_id?: string
    location?: string
  }) => {
    const endDateTime = new Date(assessmentData.scheduled_date)
    endDateTime.setHours(endDateTime.getHours() + 2) // Default 2 hours

    return createEvent({
      title: assessmentData.title,
      description: 'Onsite assessment appointment',
      location: assessmentData.location,
      start_datetime: assessmentData.scheduled_date,
      end_datetime: endDateTime.toISOString(),
      event_type: 'assessment',
      source_type: 'assessment',
      source_id: assessmentData.assessment_id,
      customer_id: assessmentData.customer_id,
      priority: 'high',
      color: '#3B82F6'
    })
  }, [createEvent])

  // =============================================
  // Computed Values and Filters
  // =============================================

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Apply view-specific filtering if needed
      const eventDate = new Date(event.start_datetime)
      return eventDate >= currentView.start_date && eventDate <= currentView.end_date
    })
  }, [events, currentView.start_date, currentView.end_date])

  const eventsByDate = useMemo(() => {
    const byDate: Record<string, CalendarEvent[]> = {}
    
    filteredEvents.forEach(event => {
      const dateKey = new Date(event.start_datetime).toDateString()
      if (!byDate[dateKey]) {
        byDate[dateKey] = []
      }
      byDate[dateKey].push(event)
    })

    return byDate
  }, [filteredEvents])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter(event => new Date(event.start_datetime) > now)
      .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
      .slice(0, 10)
  }, [events])

  // =============================================
  // Real-time Subscriptions
  // =============================================

  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('calendar_events')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'calendar_events',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchEvents(true) // Refresh events on changes
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, fetchEvents])

  // Fetch events when view or filters change
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    // State
    events: filteredEvents,
    eventsByDate,
    upcomingEvents,
    loading,
    error,
    currentView,
    filters,

    // Navigation
    navigateToDate,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    setFilters,

    // CRUD operations
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: () => fetchEvents(true),

    // Integration helpers
    createJobEvent,
    createAssessmentEvent,

    // Utility functions
    getEventsForDate: (date: Date) => eventsByDate[date.toDateString()] || [],
    hasEventsOnDate: (date: Date) => Boolean(eventsByDate[date.toDateString()]?.length)
  }
}

// =============================================
// Helper Functions
// =============================================

function getDefaultColorForEventType(eventType: CalendarEvent['event_type']): string {
  const colors = {
    job: '#10B981',      // Green
    assessment: '#3B82F6', // Blue  
    meeting: '#8B5CF6',    // Purple
    reminder: '#F59E0B',   // Amber
    follow_up: '#EF4444',  // Red
    quote_expiry: '#F97316', // Orange
    custom: '#6B7280'      // Gray
  }
  return colors[eventType] || colors.custom
}
