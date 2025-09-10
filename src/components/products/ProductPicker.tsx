import React, { useState } from 'react'
import { X, Package } from 'lucide-react'
import ProductLibrary from './ProductLibrary'
import { useProducts } from '../../hooks/useProducts'
import type { Product } from '../../types/product'

interface ProductPickerProps {
  isOpen: boolean
  onClose: () => void
  onProductSelect: (product: Product, quantity?: number) => void
}

export default function ProductPicker({ isOpen, onClose, onProductSelect }: ProductPickerProps) {
  const { getProduct } = useProducts()
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [customPrice, setCustomPrice] = useState<number | null>(null)
  const [useCustomPrice, setUseCustomPrice] = useState(false)
  
  const handleProductSelect = async (productId: string) => {
    setSelectedProductId(productId)
    // Reset custom price when selecting new product
    setUseCustomPrice(false)
    setCustomPrice(null)
  }

  const handleAddToQuote = async () => {
    if (!selectedProductId) return
    
    const product = await getProduct(selectedProductId)
    if (!product) return
    
    // Create a modified product with custom quantity/price if specified
    const productToAdd: Product = {
      ...product,
      default_unit_price: useCustomPrice && customPrice !== null ? customPrice : product.default_unit_price
    }
    
    onProductSelect(productToAdd, quantity)
    
    // Reset and close
    setSelectedProductId(null)
    setQuantity(1)
    setUseCustomPrice(false)
    setCustomPrice(null)
    onClose()
  }

  const resetSelection = () => {
    setSelectedProductId(null)
    setQuantity(1)
    setUseCustomPrice(false)
    setCustomPrice(null)
  }

  const handleClose = () => {
    resetSelection()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Select from Product Library
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Product Selection Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <ProductLibrary 
              selectionMode={true} 
              onProductSelect={handleProductSelect}
            />
          </div>

          {/* Selection Panel */}
          {selectedProductId && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Configure Selection
              </h3>
              
              <ProductSelectionPanel 
                productId={selectedProductId}
                quantity={quantity}
                onQuantityChange={setQuantity}
                useCustomPrice={useCustomPrice}
                onUseCustomPriceChange={setUseCustomPrice}
                customPrice={customPrice}
                onCustomPriceChange={setCustomPrice}
                onAddToQuote={handleAddToQuote}
                onCancel={resetSelection}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {selectedProductId 
                ? 'Configure the selected product and click "Add to Quote"' 
                : 'Select a product from your library to add to the quote'
              }
            </p>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Product Selection Panel Component
interface ProductSelectionPanelProps {
  productId: string
  quantity: number
  onQuantityChange: (quantity: number) => void
  useCustomPrice: boolean
  onUseCustomPriceChange: (use: boolean) => void
  customPrice: number | null
  onCustomPriceChange: (price: number | null) => void
  onAddToQuote: () => void
  onCancel: () => void
}

function ProductSelectionPanel({
  productId,
  quantity,
  onQuantityChange,
  useCustomPrice,
  onUseCustomPriceChange,
  customPrice,
  onCustomPriceChange,
  onAddToQuote,
  onCancel
}: ProductSelectionPanelProps) {
  const { getProduct } = useProducts()
  const [product, setProduct] = useState<Product | null>(null)

  React.useEffect(() => {
    const loadProduct = async () => {
      const p = await getProduct(productId)
      setProduct(p)
      if (p && !useCustomPrice) {
        onCustomPriceChange(p.default_unit_price)
      }
    }
    loadProduct()
  }, [productId, getProduct, useCustomPrice, onCustomPriceChange])

  if (!product) return null

  const finalPrice = useCustomPrice && customPrice !== null ? customPrice : product.default_unit_price
  const totalAmount = finalPrice * quantity

  return (
    <div className="space-y-4">
      {/* Product Info */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
          {product.name}
        </h4>
        {product.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Default Price:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            ${product.default_unit_price.toFixed(2)} / {product.unit}
          </span>
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quantity
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={quantity}
          onChange={(e) => onQuantityChange(parseFloat(e.target.value) || 1)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Custom Price Toggle */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="useCustomPrice"
          checked={useCustomPrice}
          onChange={(e) => onUseCustomPriceChange(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="useCustomPrice" className="text-sm text-gray-700 dark:text-gray-300">
          Override price for this quote
        </label>
      </div>

      {/* Custom Price Input */}
      {useCustomPrice && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Custom Unit Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={customPrice || ''}
              onChange={(e) => onCustomPriceChange(parseFloat(e.target.value) || null)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Total Calculation */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
            Total Amount:
          </span>
          <span className="text-lg font-bold text-blue-900 dark:text-blue-200">
            ${totalAmount.toFixed(2)}
          </span>
        </div>
        <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          {quantity} × ${finalPrice.toFixed(2)} per {product.unit}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={onAddToQuote}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add to Quote
        </button>
      </div>
    </div>
  )
}
