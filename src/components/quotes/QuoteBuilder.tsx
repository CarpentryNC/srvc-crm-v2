import { useState, useEffect } from 'react'
import { useQuotes, type Quote, type QuoteInput, type QuoteLineItemInput } from '../../hooks/useQuotes'
import { useCustomers } from '../../hooks/useCustomers'
import CustomerSearch from '../customers/CustomerSearch'
import ProductPicker from '../products/ProductPicker'
import SaveToLibrary from '../products/SaveToLibrary'

// Local line item interface for UI (using unitPrice instead of unit_price_cents)
interface LocalLineItem {
  id: string
  title?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface QuoteBuilderProps {
  initialQuote?: Partial<Quote>
  requestId?: string
  customerId?: string
  onSave?: (quote: Quote) => void
  onCancel?: () => void
}

export default function QuoteBuilder({
  initialQuote,
  requestId,
  customerId,
  onSave,
  onCancel
}: QuoteBuilderProps) {
  const { 
    createQuote, 
    updateQuote, 
    generateQuoteNumber, 
    dollarsToCents, 
    saveQuoteLineItems
  } = useQuotes()
  const { customers } = useCustomers()

  // Form state
  const [formData, setFormData] = useState({
    title: initialQuote?.title || (requestId ? 'Quote for Request' : ''),
    description: initialQuote?.description || '',
    customer_id: customerId || initialQuote?.customer_id || '',
    quote_number: initialQuote?.quote_number || '',
    status: (initialQuote?.status || 'draft') as Quote['status'],
    valid_until: initialQuote?.valid_until || ''
  })

  // Selected customer for CustomerSearch component
  const [selectedCustomerObject, setSelectedCustomerObject] = useState<any>(null)

  // Line items state (using local interface for UI)
  const [lineItems, setLineItems] = useState<LocalLineItem[]>([
    {
      id: crypto.randomUUID(),
      title: requestId ? 'Labor and Services' : '',
      description: requestId ? 'Professional services as per request requirements' : '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
  ])

  // Tax settings
  const [taxRate, setTaxRate] = useState(0) // Default 0% tax
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Product library modals
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [showSaveToLibrary, setShowSaveToLibrary] = useState(false)
  const [saveToLibraryLineItem, setSaveToLibraryLineItem] = useState<LocalLineItem | null>(null)

  // Generate quote number on mount if creating new quote
  useEffect(() => {
    if (!initialQuote?.id && !formData.quote_number) {
      generateQuoteNumber().then(number => {
        setFormData(prev => ({ ...prev, quote_number: number }))
      })
    }
  }, [initialQuote?.id, formData.quote_number, generateQuoteNumber])

  // Load existing line items when editing a quote
  useEffect(() => {
    if (initialQuote?.quote_line_items && initialQuote.quote_line_items.length > 0) {
      const existingLineItems: LocalLineItem[] = initialQuote.quote_line_items
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(item => ({
          id: item.id,
          title: item.title || '',
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total_amount
        }))
      
      setLineItems(existingLineItems)
    }
  }, [initialQuote?.quote_line_items])

  // Initialize selected customer when editing or when customers load
  useEffect(() => {
    if (formData.customer_id && customers.length > 0) {
      const customer = customers.find(c => c.id === formData.customer_id)
      setSelectedCustomerObject(customer || null)
    }
  }, [formData.customer_id, customers])

  // Calculate line item totals
  useEffect(() => {
    setLineItems(items =>
      items.map(item => ({
        ...item,
        total: item.quantity * item.unitPrice
      }))
    )
  }, [])

  // Handle form field changes
  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle customer selection
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomerObject(customer)
    setFormData(prev => ({ ...prev, customer_id: customer ? customer.id : '' }))
  }

  // Add new line item
  const addLineItem = () => {
    setLineItems(prev => [...prev, {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    }])
  }

  // Remove line item
  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id))
    }
  }

  // Update line item
  const updateLineItem = (id: string, field: keyof Omit<LocalLineItem, 'id'>, value: string | number) => {
    setLineItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item
        
        const updated = { ...item, [field]: value }
        
        // Recalculate total when quantity or unit price changes
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice
        }
        
        return updated
      })
    )
  }

  // Handle product selection from library
  const handleProductSelect = (product: any, quantity?: number) => {
    const newLineItem: LocalLineItem = {
      id: crypto.randomUUID(),
      title: product.name,
      description: product.description || '',
      quantity: quantity || 1,
      unitPrice: product.default_unit_price,
      total: (quantity || 1) * product.default_unit_price
    }

    // Replace empty line items or add to existing ones
    setLineItems(prev => {
      const hasEmptyItems = prev.some(item => !item.title?.trim() && !item.description.trim() && item.unitPrice === 0)
      if (hasEmptyItems && prev.length === 1) {
        // Replace the single empty item
        return [newLineItem]
      } else {
        // Add to existing items
        return [...prev, newLineItem]
      }
    })

    setShowProductPicker(false)
  }

  // Handle save line item to library
  const handleSaveToLibrary = (lineItem: LocalLineItem) => {
    if (!lineItem.title?.trim() && !lineItem.description.trim()) {
      setError('Please add a title or description to the line item before saving to library')
      return
    }
    setSaveToLibraryLineItem(lineItem)
    setShowSaveToLibrary(true)
  }

  // Handle successful save to library
  const handleLibrarySaveSuccess = () => {
    setSaveToLibraryLineItem(null)
    setShowSaveToLibrary(false)
  }

  // Handle save to library modal close
  const handleSaveToLibraryClose = () => {
    setSaveToLibraryLineItem(null)
    setShowSaveToLibrary(false)
  }

  // Calculate quote totals
  const calculateQuoteTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    return {
      subtotal,
      taxAmount,
      total,
      subtotalCents: dollarsToCents(subtotal),
      taxCents: dollarsToCents(taxAmount),
      totalCents: dollarsToCents(total)
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customer_id) {
      setError('Please select a customer')
      return
    }

    if (!formData.title.trim()) {
      setError('Please enter a quote title')
      return
    }

    if (lineItems.filter(item => item.title?.trim() || item.description.trim()).length === 0) {
      setError('Please add at least one line item with a title or description')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const totals = calculateQuoteTotals()
      
      const quoteData: QuoteInput = {
        ...formData,
        subtotal_cents: totals.subtotalCents,
        tax_cents: totals.taxCents,
        total_cents: totals.totalCents,
        request_id: requestId || initialQuote?.request_id
      }

      let result: Quote | null
      
      if (initialQuote?.id) {
        // Update existing quote
        result = await updateQuote(initialQuote.id, quoteData)
      } else {
        // Create new quote
        result = await createQuote(quoteData)
      }

      // Save line items if quote was created/updated successfully
      if (result) {
        const lineItemsData: QuoteLineItemInput[] = lineItems
          .filter(item => item.title?.trim() || item.description.trim())
          .map((item, index) => ({
            title: item.title?.trim() || undefined,
            description: item.description.trim() || 'No description provided',
            quantity: item.quantity,
            unit_price_cents: dollarsToCents(item.unitPrice),
            sort_order: index + 1
          }))

        if (lineItemsData.length > 0) {
          await saveQuoteLineItems(result.id, lineItemsData)
        }

        if (onSave) {
          onSave(result)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quote')
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateQuoteTotals()

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {initialQuote?.id 
            ? 'Edit Quote' 
            : requestId 
              ? 'Convert Request to Quote' 
              : 'Create New Quote'}
        </h2>
        {requestId && !initialQuote?.id && (
          <p className="mt-1 text-sm text-gray-600">
            Converting request to a professional quote with line items
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        {/* Quote Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label htmlFor="quote_number" className="block text-sm font-medium text-gray-700 mb-2">
              Quote Number
            </label>
            <input
              type="text"
              id="quote_number"
              value={formData.quote_number}
              onChange={(e) => handleFormChange('quote_number', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Auto-generated"
            />
          </div>

          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-2">
              Customer *
            </label>
            <CustomerSearch
              selectedCustomer={selectedCustomerObject}
              onCustomerSelect={handleCustomerSelect}
              placeholder="Search for a customer..."
              required={true}
            />
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Quote Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleFormChange('title', e.target.value)}
            required
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter a descriptive title for this quote"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleFormChange('description', e.target.value)}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Additional details about this quote"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleFormChange('status', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label htmlFor="valid_until" className="block text-sm font-medium text-gray-700 mb-2">
              Valid Until
            </label>
            <input
              type="datetime-local"
              id="valid_until"
              value={formData.valid_until ? new Date(formData.valid_until).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleFormChange('valid_until', e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Line Items</h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowProductPicker(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Pick from Library
              </button>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {lineItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-start p-4 border border-gray-200 rounded-lg">
                <div className="col-span-12 sm:col-span-5 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Line Item Title
                    </label>
                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => updateLineItem(item.id, 'title', e.target.value)}
                      className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Kitchen Cabinet Installation"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Description
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      rows={2}
                      className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Detailed description of work or materials"
                    />
                  </div>
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Unit Price
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="block w-full pl-7 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="col-span-3 sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Total
                  </label>
                  <div className="mt-1 text-sm font-medium text-gray-900 py-2">
                    ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="col-span-1 flex flex-col space-y-2 justify-end">
                  <button
                    type="button"
                    onClick={() => handleSaveToLibrary(item)}
                    disabled={!item.title?.trim() && !item.description.trim()}
                    className="text-green-600 hover:text-green-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                    title="Save to product library"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    disabled={lineItems.length === 1}
                    className="text-red-600 hover:text-red-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                    title="Remove item"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tax and Totals */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tax-rate" className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                id="tax-rate"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({taxRate}%):</span>
                <span>${totals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span>${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info Preview */}
        {selectedCustomerObject && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Quote For:</h4>
            <div className="text-sm text-blue-800">
              <div className="font-medium">
                {selectedCustomerObject.first_name} {selectedCustomerObject.last_name}
              </div>
              {selectedCustomerObject.company_name && (
                <div>{selectedCustomerObject.company_name}</div>
              )}
              {selectedCustomerObject.email && (
                <div>{selectedCustomerObject.email}</div>
              )}
              {selectedCustomerObject.phone && (
                <div>{selectedCustomerObject.phone}</div>
              )}
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
            {loading ? 'Saving...' : (initialQuote?.id ? 'Update Quote' : 'Create Quote')}
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

      {/* Product Picker Modal */}
      <ProductPicker
        isOpen={showProductPicker}
        onClose={() => setShowProductPicker(false)}
        onProductSelect={handleProductSelect}
      />

      {/* Save to Library Modal */}
      {saveToLibraryLineItem && (
        <SaveToLibrary
          isOpen={showSaveToLibrary}
          onClose={handleSaveToLibraryClose}
          onSaved={handleLibrarySaveSuccess}
          lineItem={{
            title: saveToLibraryLineItem.title,
            description: saveToLibraryLineItem.description,
            quantity: saveToLibraryLineItem.quantity,
            unit_price: saveToLibraryLineItem.unitPrice,
            unit: 'each' // Default unit, could be enhanced later
          }}
        />
      )}
    </div>
  )
}
