import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Product, ProductInsert, ProductUpdate, ProductFilters, ProductFormData } from '../types/product'

export function useProducts() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch products with optional filters
  const fetchProducts = useCallback(async (filters?: ProductFilters) => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)

      // Apply filters
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      // Order by name
      query = query.order('name')

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setProducts(data || [])
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Create a new product  
  const createProduct = useCallback(async (productData: ProductFormData): Promise<Product | null> => {
    if (!user) return null

    try {
      setError(null)
      
      const productInsert: ProductInsert = {
        ...productData,
        user_id: user.id
      }

      const { data, error: createError } = await (supabase as any)
        .from('products')
        .insert(productInsert)
        .select()
        .single()

      if (createError) throw createError
      
      // Add to local state
      setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return data
    } catch (err) {
      console.error('Error creating product:', err)
      setError(err instanceof Error ? err.message : 'Failed to create product')
      return null
    }
  }, [user])

  // Update a product
  const updateProduct = useCallback(async (id: string, updates: ProductUpdate): Promise<Product | null> => {
    if (!user) return null

    try {
      setError(null)

      const { data, error: updateError } = await (supabase as any)
        .from('products')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      
      // Update local state
      setProducts(prev => 
        prev.map(product => 
          product.id === id ? data : product
        ).sort((a, b) => a.name.localeCompare(b.name))
      )
      return data
    } catch (err) {
      console.error('Error updating product:', err)
      setError(err instanceof Error ? err.message : 'Failed to update product')
      return null
    }
  }, [user])

  // Delete a product
  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      setError(null)

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      
      // Remove from local state
      setProducts(prev => prev.filter(product => product.id !== id))
      return true
    } catch (err) {
      console.error('Error deleting product:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete product')
      return false
    }
  }, [user])

  // Get a single product by ID
  const getProduct = useCallback(async (id: string): Promise<Product | null> => {
    if (!user) return null

    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError
      return data
    } catch (err) {
      console.error('Error fetching product:', err)
      return null
    }
  }, [user])

  // Toggle product active status
  const toggleProductStatus = useCallback(async (id: string): Promise<boolean> => {
    const product = products.find(p => p.id === id)
    if (!product) return false

    const updated = await updateProduct(id, { is_active: !product.is_active })
    return updated !== null
  }, [products, updateProduct])

  // Duplicate a product
  const duplicateProduct = useCallback(async (id: string): Promise<Product | null> => {
    const product = products.find(p => p.id === id)
    if (!product) return null

    const duplicateData: ProductFormData = {
      name: `${product.name} (Copy)`,
      description: product.description || '',
      category: product.category,
      default_unit_price: product.default_unit_price,
      unit: product.unit,
      is_active: product.is_active
    }

    return createProduct(duplicateData)
  }, [products, createProduct])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    // Initial fetch
    fetchProducts()

    // Set up real-time subscription
    const subscription = supabase
      .channel('products')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          // Refresh products when changes occur
          fetchProducts()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, fetchProducts])

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    toggleProductStatus,
    duplicateProduct
  }
}
