import { useState, useEffect, useRef } from 'react'
import { useCustomers } from '../../hooks/useCustomers'

interface Customer {
  id: string
  first_name: string
  last_name: string
  company_name?: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
}

interface CustomerSearchProps {
  selectedCustomer: Customer | null
  onCustomerSelect: (customer: Customer | null) => void
  placeholder?: string
  error?: string
  required?: boolean
}

export default function CustomerSearch({
  selectedCustomer,
  onCustomerSelect,
  placeholder = "Search customers...",
  error,
  required = false
}: CustomerSearchProps) {
  const { customers, loading } = useCustomers()
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter customers based on search term
  useEffect(() => {
    if (!customers.length) {
      setFilteredCustomers([])
      return
    }

    let filtered = customers

    if (searchTerm.trim()) {
      // Filter by search term
      const term = searchTerm.toLowerCase()
      filtered = customers.filter(customer => {
        const fullName = `${customer.first_name} ${customer.last_name}`.toLowerCase()
        const company = customer.company_name?.toLowerCase() || ''
        const email = customer.email?.toLowerCase() || ''
        const phone = customer.phone || ''
        
        return (
          fullName.includes(term) ||
          company.includes(term) ||
          email.includes(term) ||
          phone.includes(term)
        )
      })
    } else {
      // Show recent customers (sorted by updated_at, then created_at)
      filtered = [...customers].sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at)
        const dateB = new Date(b.updated_at || b.created_at)
        return dateB.getTime() - dateA.getTime()
      }).slice(0, 10) // Show top 10 recent customers
    }

    setFilteredCustomers(filtered)
  }, [customers, searchTerm])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    
    if (!isOpen && value) {
      setIsOpen(true)
    }
  }

  const handleInputClick = () => {
    if (!isOpen) {
      setIsOpen(true)
      setSearchTerm('')
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer)
    setIsOpen(false)
    setSearchTerm('')
    inputRef.current?.blur()
  }

  const clearSelection = () => {
    onCustomerSelect(null)
    setSearchTerm('')
    inputRef.current?.focus()
  }

  const getCustomerDisplayName = (customer: Customer) => {
    const name = `${customer.first_name} ${customer.last_name}`
    return customer.company_name ? `${name} (${customer.company_name})` : name
  }

  const getCustomerSubtext = (customer: Customer) => {
    const parts = []
    if (customer.email) parts.push(customer.email)
    if (customer.phone) parts.push(customer.phone)
    return parts.join(' • ')
  }

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={selectedCustomer ? getCustomerDisplayName(selectedCustomer) : searchTerm}
          onChange={handleInputChange}
          onClick={handleInputClick}
          onFocus={handleInputClick}
          placeholder={selectedCustomer ? getCustomerDisplayName(selectedCustomer) : placeholder}
          required={required}
          className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
          }`}
          disabled={loading}
        />
        
        {/* Search/Clear Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {selectedCustomer ? (
            <button
              type="button"
              onClick={clearSelection}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              ✕
            </button>
          ) : (
            <div className="text-gray-400">
              🔍
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Loading customers...
            </div>
          ) : filteredCustomers.length > 0 ? (
            <>
              {!searchTerm && (
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                  Recent Customers
                </div>
              )}
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => handleCustomerSelect(customer)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {getCustomerDisplayName(customer)}
                      </div>
                      {getCustomerSubtext(customer) && (
                        <div className="text-xs text-gray-500 truncate mt-1">
                          {getCustomerSubtext(customer)}
                        </div>
                      )}
                    </div>
                    {selectedCustomer?.id === customer.id && (
                      <div className="ml-2 text-blue-600">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              {searchTerm ? 'No customers found' : 'No customers available'}
              {searchTerm && (
                <div className="mt-2">
                  <a
                    href="/customers/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs underline"
                    onClick={() => setIsOpen(false)}
                  >
                    Add new customer →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
