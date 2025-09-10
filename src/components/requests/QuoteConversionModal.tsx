import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { Request } from '../../hooks/useRequests'

interface QuoteConversionModalProps {
  isOpen: boolean
  onClose: () => void
  request: Request
}

export default function QuoteConversionModal({
  isOpen,
  onClose,
  request
}: QuoteConversionModalProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: `Quote for ${request.title}`,
    description: request.description || '',
    labor_cost: '',
    materials_cost: '',
    other_costs: '',
    notes: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // Calculate total cost
      const laborCost = parseFloat(formData.labor_cost) || 0
      const materialsCost = parseFloat(formData.materials_cost) || 0
      const otherCosts = parseFloat(formData.other_costs) || 0
      const totalCost = laborCost + materialsCost + otherCosts

      // Convert dollars to cents for database storage
      const subtotalCents = Math.round(totalCost * 100)
      const taxCents = 0 // No tax calculation for now
      const totalCents = subtotalCents + taxCents

      // Generate a unique quote number
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const quoteNumber = `Q-${timestamp}-${randomSuffix}`

      // Create quote record in quotes table
      const { data: newQuote, error: quoteError } = await (supabase as any)
        .from('quotes')
        .insert({
          customer_id: request.customer_id,
          user_id: user.id,
          request_id: request.id,
          quote_number: quoteNumber,
          title: formData.title,
          description: formData.description,
          subtotal_cents: subtotalCents,
          tax_cents: taxCents,
          total_cents: totalCents,
          status: 'draft'
        })
        .select()
        .single()

      if (quoteError) throw quoteError

      // Create workflow conversion record to track the conversion
      const { error: conversionError } = await (supabase as any)
        .from('workflow_conversions')
        .insert({
          user_id: user.id,
          source_type: 'request',
          source_id: request.id,
          target_type: 'quote',
          target_id: newQuote.id,
          conversion_notes: `Converted request "${request.title}" to quote "${quoteNumber}" with total $${totalCost.toFixed(2)}`
        })

      if (conversionError) throw conversionError

      // Update request status to converted
      const { error: updateError } = await (supabase as any)
        .from('requests')
        .update({ status: 'converted' })
        .eq('id', request.id)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Navigate to quotes page (or could navigate to the new quote)
      navigate('/quotes')

    } catch (err) {
      console.error('Error converting to quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to convert to quote')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const customerName = request.customer 
    ? `${request.customer.first_name} ${request.customer.last_name}`
    : 'Unknown Customer'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Convert Request to Quote
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2"
              >
                ✕
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Converting Request:</h3>
              <p className="text-blue-800 text-sm">
                <strong>{request.title}</strong> for {customerName}
              </p>
              {request.description && (
                <p className="text-blue-700 text-sm mt-1">{request.description}</p>
              )}
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Quote Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Detailed description of the work to be quoted"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Cost Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="labor_cost" className="block text-sm font-medium text-gray-700 mb-1">
                    Labor Cost ($)
                  </label>
                  <input
                    type="number"
                    id="labor_cost"
                    name="labor_cost"
                    value={formData.labor_cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="materials_cost" className="block text-sm font-medium text-gray-700 mb-1">
                    Materials Cost ($)
                  </label>
                  <input
                    type="number"
                    id="materials_cost"
                    name="materials_cost"
                    value={formData.materials_cost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="other_costs" className="block text-sm font-medium text-gray-700 mb-1">
                    Other Costs ($)
                  </label>
                  <input
                    type="number"
                    id="other_costs"
                    name="other_costs"
                    value={formData.other_costs}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Total Preview */}
              {(formData.labor_cost || formData.materials_cost || formData.other_costs) && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    Total: ${(
                      (parseFloat(formData.labor_cost) || 0) +
                      (parseFloat(formData.materials_cost) || 0) +
                      (parseFloat(formData.other_costs) || 0)
                    ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional notes or terms for the quote"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {loading ? 'Converting to Quote...' : 'Convert to Quote'}
                </button>
                
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
