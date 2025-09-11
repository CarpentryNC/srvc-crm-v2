import type { Database } from './database'

// Database table types
export type Customer = Database['public']['Tables']['customers']['Row']
export type Job = Database['public']['Tables']['jobs']['Row']
export type Quote = Database['public']['Tables']['quotes']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceLineItem = Database['public']['Tables']['invoice_line_items']['Row']
export type InvoicePayment = Database['public']['Tables']['invoice_payments']['Row']
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row']
export type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row']

// Insert types for creating new records
export type NewCustomer = Database['public']['Tables']['customers']['Insert']
export type NewJob = Database['public']['Tables']['jobs']['Insert']
export type NewQuote = Database['public']['Tables']['quotes']['Insert']
export type NewInvoice = Database['public']['Tables']['invoices']['Insert']

// Update types for updating existing records
export type UpdateCustomer = Database['public']['Tables']['customers']['Update']
export type UpdateJob = Database['public']['Tables']['jobs']['Update']
export type UpdateQuote = Database['public']['Tables']['quotes']['Update']
export type UpdateInvoice = Database['public']['Tables']['invoices']['Update']

// Extended types with relationships
export type CustomerWithJobs = Customer & {
  jobs?: Job[]
}

export type QuoteWithCustomer = Quote & {
  customer?: Customer
}

export type InvoiceWithCustomer = Invoice & {
  customer?: Customer
  quote?: Quote
}

export type JobWithCustomer = Job & {
  customer?: Customer
}

// Authentication types
export interface User {
  id: string
  email: string
  user_metadata?: {
    first_name?: string
    last_name?: string
    company_name?: string
  }
  subscription?: UserSubscription
}

// UI State types
export interface LoadingState {
  isLoading: boolean
  error?: string | null
}

export interface PaginationState {
  page: number
  limit: number
  total: number
}

export interface FilterState {
  search?: string
  status?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

// Form types
export interface CustomerFormData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  company_name?: string
  address_street?: string
  address_city?: string
  address_state?: string
  address_zip?: string
  notes?: string
}

export interface JobFormData {
  customer_id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_date?: string
  estimated_hours?: number
  notes?: string
}

export interface QuoteFormData {
  customer_id: string
  title: string
  description?: string
  line_items: QuoteLineItem[]
  valid_until?: string
}

export interface QuoteLineItem {
  id?: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  total: number
}

// Payment types
export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  client_secret?: string
}

export interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
}

// Subscription types
export interface SubscriptionStatus {
  isActive: boolean
  plan?: SubscriptionPlan
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
  usage: {
    customers: number
    invoices: number
    storage: string
  }
  limits: {
    customers: number
    invoices: number
    storage: string
  }
}

// Dashboard types
export interface DashboardStats {
  totalCustomers: number
  activeJobs: number
  pendingQuotes: number
  monthlyRevenue: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: 'customer' | 'job' | 'quote' | 'invoice' | 'payment'
  message: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: PaginationState
}
