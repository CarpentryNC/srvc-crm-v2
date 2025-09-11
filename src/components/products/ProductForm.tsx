import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { PRODUCT_CATEGORIES, COMMON_UNITS } from '../../types/product'
import type { ProductFormData, ProductCategory } from '../../types/product'

interface ProductFormProps {
  isOpen: boolean
  onClose: () => void
  productId?: string // If provided, edit mode
  initialData?: Partial<ProductFormData> // For pre-filling from quote line items
}

export default function ProductForm({ isOpen, onClose, productId, initialData }: ProductFormProps) {
  const { createProduct, updateProduct, getProduct } = useProducts()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    category: 'service',
    default_unit_price: 0,
    unit: 'each',
    is_active: true
  })

  // Load product data for editing
  useEffect(() => {
    if (productId) {
      const loadProduct = async () => {
        const product = await getProduct(productId)
        if (product) {
          setFormData({
            name: product.name,
            description: product.description || '',
            category: (product.category || 'materials') as ProductCategory,
            default_unit_price: product.default_unit_price || 0,
            unit: product.unit || 'each',
            is_active: product.is_active ?? true
          })
        }
      }
      loadProduct()
    } else if (initialData) {
      // Pre-fill from initial data (e.g., from quote line items)
      setFormData(prev => ({
        ...prev,
        ...initialData
      }))
    }
  }, [productId, initialData, getProduct])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Product name is required')
        return
      }

      if (formData.default_unit_price < 0) {
        setError('Price must be a positive number')
        return
      }

      if (productId) {
        // Update existing product
        await updateProduct(productId, formData)
      } else {
        // Create new product
        await createProduct(formData)
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'service',
      default_unit_price: 0,
      unit: 'each',
      is_active: true
    })
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {productId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 text-sm text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product/Service Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Kitchen Cabinet Installation"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed description of the product or service..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as ProductCategory)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              {PRODUCT_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.default_unit_price}
                  onChange={(e) => handleInputChange('default_unit_price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                {COMMON_UNITS.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              Active (available for use in quotes)
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : (productId ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
