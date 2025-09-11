import React, { useState, useMemo } from 'react'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ViewColumnsIcon
} from '@heroicons/react/24/outline'
import { format, isToday, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns'
import { useCalendar } from '../../hooks/useCalendar'
import type { CalendarEvent, CalendarFilters } from '../../hooks/useCalendar'
import { useCustomers } from '../../hooks/useCustomers'
import EventForm from './EventForm'

// =============================================
// Calendar Event Component
// =============================================

interface EventItemProps {
  event: CalendarEvent
  onClick?: (event: CalendarEvent) => void
  compact?: boolean
}

function EventItem({ event, onClick, compact = false }: EventItemProps) {
  const getEventIcon = () => {
    switch (event.event_type) {
      case 'job': return '🔨'
      case 'assessment': return '🔍'
      case 'meeting': return '👥'
      case 'reminder': return '⏰'
      case 'follow_up': return '📞'
      case 'quote_expiry': return '⚠️'
      default: return '📅'
    }
  }

  const getPriorityColor = () => {
    switch (event.priority) {
      case 'urgent': return 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300'
      case 'medium': return 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300'
      case 'low': return 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-300'
    }
  }

  const formatTime = (dateStr: string) => {
    return format(new Date(dateStr), 'h:mm a')
  }

  if (compact) {
    return (
      <div
        className={`text-xs p-1 mb-1 rounded border-l-2 cursor-pointer hover:bg-opacity-80 ${getPriorityColor()}`}
        style={{ borderLeftColor: event.color }}
        onClick={() => onClick?.(event)}
        title={`${event.title} - ${formatTime(event.start_datetime)}${event.customer_name ? ` - ${event.customer_name}` : ''}`}
      >
        <div className="flex items-center justify-between">
          <span className="mr-1">{getEventIcon()}</span>
          <span className="truncate flex-1 font-medium">{event.title}</span>
          <span className="text-xs opacity-75 ml-1">{formatTime(event.start_datetime)}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`p-3 mb-2 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor()}`}
      style={{ borderLeftColor: event.color, borderLeftWidth: '4px' }}
      onClick={() => onClick?.(event)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <span className="mr-2">{getEventIcon()}</span>
            <h3 className="font-semibold truncate">{event.title}</h3>
            {event.is_private && (
              <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Private</span>
            )}
          </div>
          
          <div className="flex items-center text-sm opacity-75 mb-2">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>
              {formatTime(event.start_datetime)}
              {event.end_datetime && ` - ${formatTime(event.end_datetime)}`}
              {event.all_day && ' (All day)'}
            </span>
          </div>

          {event.customer_name && (
            <div className="flex items-center text-sm opacity-75 mb-2">
              <UserIcon className="h-4 w-4 mr-1" />
              <span>{event.customer_name}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center text-sm opacity-75 mb-2">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{event.location}</span>
            </div>
          )}

          {event.description && (
            <p className="text-sm opacity-75 mt-2">{event.description}</p>
          )}
        </div>

        <div className="flex flex-col items-end">
          <span className={`text-xs px-2 py-1 rounded-full ${
            event.status === 'completed' ? 'bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            event.status === 'in_progress' ? 'bg-blue-200 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
            event.status === 'cancelled' ? 'bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
            'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {event.status.replace('_', ' ')}
          </span>
          {event.priority === 'urgent' && (
            <span className="text-red-500 text-xs mt-1 font-semibold">URGENT</span>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================
// Calendar Filter Component
// =============================================

interface CalendarFiltersProps {
  filters: CalendarFilters
  onFiltersChange: (filters: CalendarFilters) => void
}

function CalendarFiltersPanel({ filters, onFiltersChange }: CalendarFiltersProps) {
  const { customers } = useCustomers()
  const [showFilters, setShowFilters] = useState(false)

  const eventTypes = [
    { value: 'job', label: 'Jobs', color: '#10B981', icon: '🔨' },
    { value: 'assessment', label: 'Assessments', color: '#3B82F6', icon: '🔍' },
    { value: 'meeting', label: 'Meetings', color: '#8B5CF6', icon: '👥' },
    { value: 'reminder', label: 'Reminders', color: '#F59E0B', icon: '⏰' },
    { value: 'follow_up', label: 'Follow-ups', color: '#EF4444', icon: '📞' },
    { value: 'custom', label: 'Custom', color: '#6B7280', icon: '📅' }
  ] as const

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }
  ] as const



  return (
    <div className="relative">
      {/* Filter Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <FunnelIcon className="h-4 w-4" />
          Filters
          {(filters.event_types?.length || filters.status?.length || filters.priority?.length || filters.customer_id) && (
            <span className="ml-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
              Active
            </span>
          )}
        </button>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 space-y-4">
          {/* Event Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Types
            </label>
            <div className="flex flex-wrap gap-2">
              {eventTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => {
                    const current = filters.event_types || []
                    const updated = current.includes(type.value)
                      ? current.filter(t => t !== type.value)
                      : [...current, type.value]
                    onFiltersChange({ ...filters, event_types: updated.length ? updated : undefined })
                  }}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    filters.event_types?.includes(type.value)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  onClick={() => {
                    const current = filters.status || []
                    const updated = current.includes(status.value)
                      ? current.filter(s => s !== status.value)
                      : [...current, status.value]
                    onFiltersChange({ ...filters, status: updated.length ? updated : undefined })
                  }}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    filters.status?.includes(status.value)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Customer
            </label>
            <select
              value={filters.customer_id || ''}
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                customer_id: e.target.value || undefined 
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Customers</option>
              {customers.map(customer => (
                              <option key={customer.id} value={customer.id}>
                {customer.first_name} {customer.last_name}
              </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onFiltersChange({})}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================
// Calendar Month View Component
// =============================================

interface MonthViewProps {
  currentView: any
  eventsByDate: Record<string, CalendarEvent[]>
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
}

function MonthView({ currentView, eventsByDate, onEventClick, onDateClick }: MonthViewProps) {
  const weeks = useMemo(() => {
    const start = startOfWeek(currentView.start_date)
    const end = endOfWeek(currentView.end_date)
    const days = eachDayOfInterval({ start, end })
    
    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }
    return weeks
  }, [currentView.start_date, currentView.end_date])

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
        {dayNames.map(day => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {weeks.map((week, weekIdx) =>
          week.map((day, dayIdx) => {
            const dateKey = day.toDateString()
            const dayEvents = eventsByDate[dateKey] || []
            const isCurrentMonth = isSameMonth(day, currentView.date)
            const isCurrentDay = isToday(day)

            return (
              <div
                key={`${weekIdx}-${dayIdx}`}
                className={`min-h-32 p-2 border-r border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50' : ''
                } ${isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onClick={() => onDateClick(day)}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isCurrentDay 
                    ? 'text-blue-600 dark:text-blue-400 font-bold' 
                    : isCurrentMonth 
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <EventItem
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                      compact
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// =============================================
// Calendar Week View Component
// =============================================

function WeekView({ currentView, eventsByDate, onEventClick }: Omit<MonthViewProps, 'onDateClick'>) {
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentView.date)
    return eachDayOfInterval({ start, end: addDays(start, 6) })
  }, [currentView.date])

  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
        <div className="p-3 bg-gray-50 dark:bg-gray-700"></div>
        {weekDays.map(day => (
          <div key={day.toDateString()} className={`p-3 text-center text-sm font-semibold bg-gray-50 dark:bg-gray-700 ${
            isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
          }`}>
            <div>{format(day, 'EEE')}</div>
            <div className={`text-lg ${isToday(day) ? 'font-bold' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Week Grid */}
      <div className="overflow-auto max-h-96">
        <div className="grid grid-cols-8">
          {hours.map(hour => (
            <React.Fragment key={hour}>
              {/* Time column */}
              <div className="p-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-700">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              
              {/* Day columns */}
              {weekDays.map(day => {
                const dateKey = day.toDateString()
                const dayEvents = (eventsByDate[dateKey] || []).filter(event => {
                  const eventHour = new Date(event.start_datetime).getHours()
                  return eventHour === hour
                })

                return (
                  <div
                    key={`${day.toDateString()}-${hour}`}
                    className="p-1 min-h-12 border-r border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {dayEvents.map(event => (
                      <EventItem
                        key={event.id}
                        event={event}
                        onClick={onEventClick}
                        compact
                      />
                    ))}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================
// Calendar Day View Component
// =============================================

function DayView({ currentView, eventsByDate, onEventClick }: Omit<MonthViewProps, 'onDateClick'>) {
  const dateKey = currentView.date.toDateString()
  const dayEvents = eventsByDate[dateKey] || []
  const hours = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {format(currentView.date, 'EEEE, MMMM d, yyyy')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>

      {/* Day Timeline */}
      <div className="overflow-auto max-h-96">
        {hours.map(hour => {
          const hourEvents = dayEvents.filter(event => {
            const eventHour = new Date(event.start_datetime).getHours()
            return eventHour === hour
          })

          return (
            <div key={hour} className="flex border-b border-gray-200 dark:border-gray-700">
              {/* Time */}
              <div className="w-20 p-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-700">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              
              {/* Events */}
              <div className="flex-1 p-3 min-h-16">
                {hourEvents.length > 0 ? (
                  <div className="space-y-2">
                    {hourEvents.map(event => (
                      <EventItem
                        key={event.id}
                        event={event}
                        onClick={onEventClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center text-gray-400 dark:text-gray-500">
                    {/* Empty hour slot */}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================
// Agenda View Component
// =============================================

function AgendaView({ events, onEventClick }: { events: CalendarEvent[], onEventClick: (event: CalendarEvent) => void }) {
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {}
    events.forEach(event => {
      const dateKey = format(new Date(event.start_datetime), 'yyyy-MM-dd')
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(event)
    })
    return grouped
  }, [events])

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Upcoming Events
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {events.length} event{events.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>
      
      <div className="max-h-96 overflow-auto">
        {Object.keys(eventsByDate).length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No events scheduled
          </div>
        ) : (
          Object.entries(eventsByDate).map(([dateKey, dayEvents]) => (
            <div key={dateKey} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {format(new Date(dateKey), 'EEEE, MMMM d')}
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {dayEvents.map(event => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// =============================================
// Main Calendar Component
// =============================================

export default function Calendar() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  
  const {
    events,
    eventsByDate,
    upcomingEvents,
    loading,
    error,
    currentView,
    filters,
    navigateToDate,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    setFilters,
    createEvent,
    getEventsForDate
  } = useCalendar()

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  const handleDateClick = (date: Date) => {
    if (currentView.type !== 'day') {
      navigateToDate(date, 'day')
    }
  }

  const handleCreateEvent = () => {
    setShowEventForm(true)
  }

  const handleSaveEvent = async (eventData: any) => {
    await createEvent(eventData)
  }

  const viewButtons = [
    { type: 'month' as const, label: 'Month' },
    { type: 'week' as const, label: 'Week' },
    { type: 'day' as const, label: 'Day' },
    { type: 'agenda' as const, label: 'Agenda' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-300">Error loading calendar: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CalendarIcon className="h-7 w-7" />
            Calendar
          </h1>
          
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={navigatePrevious}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={navigateToToday}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Today
            </button>
          </div>

          {/* Current Date Display */}
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            {currentView.type === 'month' && format(currentView.date, 'MMMM yyyy')}
            {currentView.type === 'week' && `${format(currentView.start_date, 'MMM d')} - ${format(currentView.end_date, 'MMM d, yyyy')}`}
            {currentView.type === 'day' && format(currentView.date, 'EEEE, MMMM d, yyyy')}
            {currentView.type === 'agenda' && 'Upcoming Events'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* View Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg">
            {viewButtons.map(view => (
              <button
                key={view.type}
                onClick={() => navigateToDate(currentView.date, view.type)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView.type === view.type
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>

          {/* Add Event Button */}
          <button
            onClick={handleCreateEvent}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            <PlusIcon className="h-5 w-5" />
            Add Event
          </button>
        </div>
      </div>

      {/* Filters */}
      <CalendarFiltersPanel filters={filters} onFiltersChange={setFilters} />

      {/* Calendar Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Calendar View */}
        <div className="lg:col-span-3">
          {currentView.type === 'month' && (
            <MonthView
              currentView={currentView}
              eventsByDate={eventsByDate}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
            />
          )}
          {currentView.type === 'week' && (
            <WeekView
              currentView={currentView}
              eventsByDate={eventsByDate}
              onEventClick={handleEventClick}
            />
          )}
          {currentView.type === 'day' && (
            <DayView
              currentView={currentView}
              eventsByDate={eventsByDate}
              onEventClick={handleEventClick}
            />
          )}
          {currentView.type === 'agenda' && (
            <AgendaView
              events={events}
              onEventClick={handleEventClick}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Today's Events */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <ClockIcon className="h-5 w-5" />
              Today's Events
            </h3>
            {getEventsForDate(new Date()).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No events today</p>
            ) : (
              <div className="space-y-2">
                {getEventsForDate(new Date()).slice(0, 5).map(event => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onClick={handleEventClick}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <ViewColumnsIcon className="h-5 w-5" />
              Upcoming
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.slice(0, 5).map(event => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onClick={handleEventClick}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Quick Stats
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Events:</span>
                <span className="font-medium">{events.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Today:</span>
                <span className="font-medium">{getEventsForDate(new Date()).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">This Week:</span>
                <span className="font-medium">
                  {events.filter(event => {
                    const eventDate = new Date(event.start_datetime)
                    const weekStart = startOfWeek(new Date())
                    const weekEnd = endOfWeek(new Date())
                    return eventDate >= weekStart && eventDate <= weekEnd
                  }).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full max-h-96 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Event Details</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <EventItem event={selectedEvent} />
            
            <div className="mt-4 flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Edit
              </button>
              <button 
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          onClose={() => setShowEventForm(false)}
          onSave={handleSaveEvent}
          mode="create"
        />
      )}
    </div>
  )
}
