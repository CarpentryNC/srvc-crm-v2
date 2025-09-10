import type { Database } from './database'

// Product types from database
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

// Product categories
export type ProductCategory = 'service' | 'material' | 'labor' | 'equipment' | 'other'

// Extended product type with computed fields
export interface ProductWithDetails extends Product {
  formatted_price: string
  display_name: string
}

// Product form data
export interface ProductFormData {
  name: string
  description: string
  category: ProductCategory
  default_unit_price: number
  unit: string
  is_active: boolean
}

// Product search/filter options
export interface ProductFilters {
  search?: string
  category?: ProductCategory | 'all'
  is_active?: boolean
}

// Product picker selection
export interface ProductSelection {
  product: Product
  quantity: number
  unit_price?: number // Override default price
}

// Category options for forms/filters
export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'service', label: 'Service' },
  { value: 'material', label: 'Material' },
  { value: 'labor', label: 'Labor' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' }
]

// Common units for products/services
export const COMMON_UNITS = [
  'each',
  'hour',
  'linear ft',
  'square ft',
  'cubic ft',
  'gallon',
  'pound',
  'ton',
  'day',
  'week',
  'month'
]
