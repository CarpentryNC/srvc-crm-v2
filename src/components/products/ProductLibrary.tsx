import React, { useState, useMemo } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { PRODUCT_CATEGORIES } from '../../types/product'
import type { ProductFilters, ProductCategory } from '../../types/product'
import ProductForm from './ProductForm'

interface ProductLibraryProps {
  onProductSelect?: (productId: string) => void
  selectionMode?: boolean
}

export default function ProductLibrary({ onProductSelect, selectionMode = false }: ProductLibraryProps) {
  const { products, loading, error, toggleProductStatus, deleteProduct, duplicateProduct } = useProducts()
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<string | null>(null)
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: 'all',
    is_active: true
  })

  // Filter products based on current filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !filters.search || 
        product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.description?.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesCategory = !filters.category || filters.category === 'all' || 
        product.category === filters.category
      
      const matchesActive = filters.is_active === undefined || 
        product.is_active === filters.is_active
      
      return matchesSearch && matchesCategory && matchesActive
    })
  }, [products, filters])

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id)
    }
  }

  const handleDuplicateProduct = async (id: string) => {
    await duplicateProduct(id)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getCategoryColor = (category: ProductCategory) => {
    const colors = {
      service: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      material: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      labor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      equipment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
    return colors[category]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-300">Loading products...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 dark:text-red-400 mb-4">
          Error loading products: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectionMode ? 'Select Product' : 'Product Library'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {selectionMode 
              ? 'Choose a product to add to your quote'
              : 'Manage your products and services'}
          </p>
        </div>
        {!selectionMode && (
          <button
            onClick={() => setShowProductForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search || ''}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            value={filters.category || 'all'}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as ProductCategory | 'all' }))}
            className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Active Filter */}
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.is_active ?? true}
              onChange={(e) => setFilters(prev => ({ ...prev, is_active: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active only</span>
          </label>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            {products.length === 0 ? 'No products found' : 'No products match your filters'}
          </div>
          {!selectionMode && products.length === 0 && (
            <button
              onClick={() => setShowProductForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border ${
                product.is_active 
                  ? 'border-gray-200 dark:border-gray-700' 
                  : 'border-gray-300 dark:border-gray-600 opacity-60'
              } p-6 hover:shadow-lg transition-shadow ${
                selectionMode ? 'cursor-pointer hover:border-blue-500' : ''
              }`}
              onClick={selectionMode ? () => onProductSelect?.(product.id) : undefined}
            >
              {/* Product Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {product.name}
                  </h3>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(product.category)}`}>
                    {PRODUCT_CATEGORIES.find(c => c.value === product.category)?.label}
                  </span>
                </div>
                {!selectionMode && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleProductStatus(product.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title={product.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {product.is_active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingProduct(product.id)}
                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateProduct(product.id)}
                      className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Product Details */}
              {product.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {product.description}
                </p>
              )}

              {/* Price and Unit */}
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatPrice(product.default_unit_price)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  per {product.unit}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      <ProductForm
        isOpen={showProductForm || editingProduct !== null}
        onClose={() => {
          setShowProductForm(false)
          setEditingProduct(null)
        }}
        productId={editingProduct || undefined}
      />
    </div>
  )
}
