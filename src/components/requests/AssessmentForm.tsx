import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Assessment } from '../../hooks/useRequests'

interface AssessmentFormProps {
  requestId: string
  existingAssessment?: Assessment
  onComplete?: (assessment: Assessment) => void
  onCancel?: () => void
  className?: string
}

export default function AssessmentForm({
  requestId,
  existingAssessment,
  onComplete,
  onCancel,
  className = ''
}: AssessmentFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    estimated_duration_hours: 2,
    findings: '',
    recommendations: '',
    estimated_cost: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled',
    notes: ''
  })

  // Initialize form with existing assessment data
  useEffect(() => {
    if (existingAssessment) {
      const scheduledDateTime = existingAssessment.scheduled_date 
        ? new Date(existingAssessment.scheduled_date)
        : null

      setFormData({
        scheduled_date: scheduledDateTime ? scheduledDateTime.toISOString().split('T')[0] : '',
        scheduled_time: scheduledDateTime ? scheduledDateTime.toTimeString().split(' ')[0].slice(0, 5) : '',
        estimated_duration_hours: existingAssessment.estimated_duration_hours || 2,
        findings: existingAssessment.findings || '',
        recommendations: existingAssessment.recommendations || '',
        estimated_cost: existingAssessment.estimated_cost?.toString() || '',
        status: existingAssessment.status,
        notes: ''
      })
    }
  }, [existingAssessment])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Combine date and time into ISO datetime
      let scheduledDateTime = null
      if (formData.scheduled_date && formData.scheduled_time) {
        scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}:00`).toISOString()
      }

      const assessmentData = {
        request_id: requestId,
        user_id: user.id,
        scheduled_date: scheduledDateTime,
        estimated_duration_hours: formData.estimated_duration_hours,
        findings: formData.findings || null,
        recommendations: formData.recommendations || null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        status: formData.status,
        completed_date: formData.status === 'completed' ? new Date().toISOString() : null
      }

      let result
      if (existingAssessment) {
        // Update existing assessment
        const { data, error } = await (supabase as any)
          .from('assessments')
          .update(assessmentData)
          .eq('id', existingAssessment.id)
          .eq('user_id', user.id)
          .select()
          .single()

        result = { data, error }
      } else {
        // Create new assessment
        const { data, error } = await (supabase as any)
          .from('assessments')
          .insert(assessmentData)
          .select()
          .single()

        result = { data, error }
      }

      if (result.error) throw result.error

      // Update request status if assessment is completed
      if (formData.status === 'completed') {
        await (supabase as any)
          .from('requests')
          .update({ status: 'assessed' })
          .eq('id', requestId)
          .eq('user_id', user.id)
      }

      if (onComplete && result.data) {
        onComplete(result.data as Assessment)
      }

    } catch (err) {
      console.error('Error saving assessment:', err)
      setError(err instanceof Error ? err.message : 'Failed to save assessment')
    } finally {
      setLoading(false)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {existingAssessment ? 'Update Assessment' : 'Schedule Assessment'}
        </h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Scheduling Section */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Scheduling</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date */}
            <div>
              <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-1">
                Assessment Date *
              </label>
              <input
                type="date"
                id="scheduled_date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                min={today}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Time */}
            <div>
              <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700 mb-1">
                Time *
              </label>
              <input
                type="time"
                id="scheduled_time"
                name="scheduled_time"
                value={formData.scheduled_time}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="estimated_duration_hours" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (hours)
              </label>
              <select
                id="estimated_duration_hours"
                name="estimated_duration_hours"
                value={formData.estimated_duration_hours}
                onChange={handleChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value={0.5}>30 minutes</option>
                <option value={1}>1 hour</option>
                <option value={1.5}>1.5 hours</option>
                <option value={2}>2 hours</option>
                <option value={3}>3 hours</option>
                <option value={4}>4 hours</option>
                <option value={6}>6 hours</option>
                <option value={8}>Full day</option>
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="mt-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Assessment Results Section */}
        {(formData.status === 'completed' || existingAssessment) && (
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assessment Results</h3>
            
            {/* Findings */}
            <div className="mb-4">
              <label htmlFor="findings" className="block text-sm font-medium text-gray-700 mb-1">
                Findings & Observations
              </label>
              <textarea
                id="findings"
                name="findings"
                value={formData.findings}
                onChange={handleChange}
                rows={4}
                placeholder="Document what you observed during the assessment..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Recommendations */}
            <div className="mb-4">
              <label htmlFor="recommendations" className="block text-sm font-medium text-gray-700 mb-1">
                Recommendations
              </label>
              <textarea
                id="recommendations"
                name="recommendations"
                value={formData.recommendations}
                onChange={handleChange}
                rows={4}
                placeholder="Recommend next steps, materials needed, approach, etc..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Estimated Cost */}
            <div>
              <label htmlFor="estimated_cost" className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Cost ($)
              </label>
              <input
                type="number"
                id="estimated_cost"
                name="estimated_cost"
                value={formData.estimated_cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? 'Saving...' : existingAssessment ? 'Update Assessment' : 'Schedule Assessment'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-none bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
