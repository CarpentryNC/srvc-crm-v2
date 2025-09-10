import React, { useState } from 'react'
import { X, Calendar, Clock, User, MapPin, FileText } from 'lucide-react'
import { CalendarEventInput, CalendarEvent } from '../../hooks/useCalendar'
import { useCustomers } from '../../hooks/useCustomers'

interface EventFormProps {
  onClose: () => void
  onSave: (eventData: CalendarEventInput) => Promise<void>
  initialData?: Partial<CalendarEvent>
  mode?: 'create' | 'edit'
}

export default function EventForm({ onClose, onSave, initialData, mode = 'create' }: EventFormProps) {
  const { customers } = useCustomers()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CalendarEventInput>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    location: initialData?.location || '',
    start_datetime: initialData?.start_datetime || new Date().toISOString().slice(0, 16),
    end_datetime: initialData?.end_datetime || '',
    all_day: initialData?.all_day || false,
    event_type: initialData?.event_type || 'custom',
    priority: initialData?.priority || 'medium',
    customer_id: initialData?.customer_id || '',
    assigned_to: initialData?.assigned_to || '',
    reminder_minutes: initialData?.reminder_minutes || [15, 60],
    is_private: initialData?.is_private || false,
    notes: initialData?.notes || '',
    color: initialData?.color || '#3B82F6'
  })

  const eventTypes = [
    { value: 'job', label: 'Job', icon: '🔨', color: '#10B981' },
    { value: 'assessment', label: 'Assessment', icon: '🔍', color: '#3B82F6' },
    { value: 'meeting', label: 'Meeting', icon: '👥', color: '#8B5CF6' },
    { value: 'reminder', label: 'Reminder', icon: '⏰', color: '#F59E0B' },
    { value: 'follow_up', label: 'Follow-up', icon: '📞', color: '#EF4444' },
    { value: 'custom', label: 'Custom', icon: '📅', color: '#6B7280' }
  ] as const

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ] as const

  const reminderOptions = [
    { value: 0, label: 'At time of event' },
    { value: 5, label: '5 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 120, label: '2 hours before' },
    { value: 1440, label: '1 day before' }
  ]

  const handleChange = (field: keyof CalendarEventInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-update color when event type changes
    if (field === 'event_type') {
      const eventType = eventTypes.find(type => type.value === value)
      if (eventType) {
        setFormData(prev => ({ ...prev, color: eventType.color }))
      }
    }
  }

  const handleReminderChange = (minutes: number, checked: boolean) => {
    const current = formData.reminder_minutes || []
    const updated = checked
      ? [...current, minutes].sort((a, b) => a - b)
      : current.filter(m => m !== minutes)
    handleChange('reminder_minutes', updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validation
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }
      if (!formData.start_datetime) {
        throw new Error('Start date and time is required')
      }
      if (formData.end_datetime && new Date(formData.end_datetime) <= new Date(formData.start_datetime)) {
        throw new Error('End time must be after start time')
      }

      // Auto-set end time for all-day events
      let eventData = { ...formData }
      if (formData.all_day && !formData.end_datetime) {
        const endDate = new Date(formData.start_datetime)
        endDate.setHours(23, 59, 59, 999)
        eventData.end_datetime = endDate.toISOString()
      }

      await onSave(eventData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate end time when start time changes (if not all-day and no end time set)
  React.useEffect(() => {
    if (formData.start_datetime && !formData.all_day && !formData.end_datetime) {
      const startDate = new Date(formData.start_datetime)
      const endDate = new Date(startDate.getTime() + (2 * 60 * 60 * 1000)) // Add 2 hours
      setFormData(prev => ({
        ...prev,
        end_datetime: endDate.toISOString().slice(0, 16)
      }))
    }
  }, [formData.start_datetime, formData.all_day])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {mode === 'create' ? 'Create New Event' : 'Edit Event'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Title and Event Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter event title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Type
              </label>
              <select
                value={formData.event_type}
                onChange={(e) => handleChange('event_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Event description..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Event location"
            />
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="all_day"
                checked={formData.all_day}
                onChange={(e) => handleChange('all_day', e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="all_day" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                All day event
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Start Date & Time *
                </label>
                <input
                  type={formData.all_day ? 'date' : 'datetime-local'}
                  value={formData.all_day ? formData.start_datetime.split('T')[0] : formData.start_datetime}
                  onChange={(e) => handleChange('start_datetime', formData.all_day ? `${e.target.value}T00:00` : e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {!formData.all_day && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.end_datetime}
                    onChange={(e) => handleChange('end_datetime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Customer and Priority */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Customer
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => handleChange('customer_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">No customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {priorityOptions.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color and Privacy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Event Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="is_private"
                checked={formData.is_private}
                onChange={(e) => handleChange('is_private', e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_private" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Private event
              </label>
            </div>
          </div>

          {/* Reminders */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reminders
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {reminderOptions.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.reminder_minutes?.includes(option.value) || false}
                    onChange={(e) => handleReminderChange(option.value, e.target.checked)}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Additional notes..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
