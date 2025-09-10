export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          first_name: string
          last_name: string
          email?: string
          phone?: string
          company_name?: string
          address_street?: string
          address_city?: string
          address_state?: string
          address_zip?: string
          notes?: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          first_name: string
          last_name: string
          email?: string
          phone?: string
          company_name?: string
          address_street?: string
          address_city?: string
          address_state?: string
          address_zip?: string
          notes?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          company_name?: string
          address_street?: string
          address_city?: string
          address_state?: string
          address_zip?: string
          notes?: string
        }
      }
      jobs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          customer_id: string
          title: string
          description?: string
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_date?: string
          estimated_hours?: number
          actual_hours?: number
          notes?: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          customer_id: string
          title: string
          description?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_date?: string
          estimated_hours?: number
          actual_hours?: number
          notes?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          customer_id?: string
          title?: string
          description?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          scheduled_date?: string
          estimated_hours?: number
          actual_hours?: number
          notes?: string
        }
      }
      quotes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          customer_id: string
          quote_number: string
          title: string
          description?: string
          subtotal: number
          tax_amount: number
          total_amount: number
          status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          valid_until?: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          customer_id: string
          quote_number: string
          title: string
          description?: string
          subtotal: number
          tax_amount: number
          total_amount: number
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          valid_until?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          customer_id?: string
          quote_number?: string
          title?: string
          description?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          valid_until?: string
        }
      }
      invoices: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          customer_id: string
          quote_id?: string
          invoice_number: string
          title: string
          description?: string
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date?: string
          paid_date?: string
          stripe_payment_intent_id?: string
          subtotal: number
          tax_amount: number
          total_amount: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          customer_id: string
          quote_id?: string
          invoice_number: string
          title: string
          description?: string
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date?: string
          paid_date?: string
          stripe_payment_intent_id?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          customer_id?: string
          quote_id?: string
          invoice_number?: string
          title?: string
          description?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date?: string
          paid_date?: string
          stripe_payment_intent_id?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          created_at: string
          stripe_price_id: string
          name: string
          description?: string
          price_amount: number
          billing_interval: 'month' | 'year'
          features: Record<string, any>
          max_customers?: number
          max_invoices?: number
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          stripe_price_id: string
          name: string
          description?: string
          price_amount: number
          billing_interval: 'month' | 'year'
          features: Record<string, any>
          max_customers?: number
          max_invoices?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          stripe_price_id?: string
          name?: string
          description?: string
          price_amount?: number
          billing_interval?: 'month' | 'year'
          features?: Record<string, any>
          max_customers?: number
          max_invoices?: number
          is_active?: boolean
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          plan_id: string
          status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          plan_id: string
          status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          plan_id?: string
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          description?: string
          category: 'service' | 'material' | 'labor' | 'equipment' | 'other'
          default_unit_price: number
          unit: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string
          category?: 'service' | 'material' | 'labor' | 'equipment' | 'other'
          default_unit_price?: number
          unit?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          category?: 'service' | 'material' | 'labor' | 'equipment' | 'other'
          default_unit_price?: number
          unit?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      invoice_line_items: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          invoice_id: string
          user_id: string
          title: string
          description?: string
          quantity: number
          unit_price_cents: number
          total_cents: number
          unit_price: number
          total_amount: number
          sort_order: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          invoice_id: string
          user_id: string
          title: string
          description?: string
          quantity: number
          unit_price_cents: number
          total_cents: number
          sort_order?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          invoice_id?: string
          user_id?: string
          title?: string
          description?: string
          quantity?: number
          unit_price_cents?: number
          total_cents?: number
          sort_order?: number
        }
      }
      invoice_payments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          invoice_id: string
          user_id: string
          amount_cents: number
          amount: number
          payment_date: string
          payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'stripe' | 'other'
          transaction_id?: string
          stripe_payment_intent_id?: string
          notes?: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          invoice_id: string
          user_id: string
          amount_cents: number
          payment_date?: string
          payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'stripe' | 'other'
          transaction_id?: string
          stripe_payment_intent_id?: string
          notes?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          invoice_id?: string
          user_id?: string
          amount_cents?: number
          payment_date?: string
          payment_method?: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'stripe' | 'other'
          transaction_id?: string
          stripe_payment_intent_id?: string
          notes?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
        }
      }
    }
    Views: {
      invoice_summary: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          customer_id: string
          quote_id?: string
          invoice_number: string
          title: string
          description?: string
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date?: string
          paid_date?: string
          stripe_payment_intent_id?: string
          subtotal: number
          tax_amount: number
          total_amount: number
          total_paid: number
          balance_due: number
          is_fully_paid: boolean
          customer_name: string
          customer_company?: string
          customer_email?: string
        }
      }
    }
    Functions: {
      get_invoice_payment_total: {
        Args: { invoice_uuid: string }
        Returns: number
      }
      get_invoice_balance: {
        Args: { invoice_uuid: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type exports for easier importing
export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInput = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export type Quote = Database['public']['Tables']['quotes']['Row'];
export type QuoteInput = Database['public']['Tables']['quotes']['Insert'];
export type QuoteUpdate = Database['public']['Tables']['quotes']['Update'];

export type Job = Database['public']['Tables']['jobs']['Row'];
export type JobInput = Database['public']['Tables']['jobs']['Insert'];
export type JobUpdate = Database['public']['Tables']['jobs']['Update'];

export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceInput = Database['public']['Tables']['invoices']['Insert'];
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];

export type InvoiceLineItem = Database['public']['Tables']['invoice_line_items']['Row'];
export type InvoiceLineItemInput = Database['public']['Tables']['invoice_line_items']['Insert'];
export type InvoiceLineItemUpdate = Database['public']['Tables']['invoice_line_items']['Update'];

export type InvoicePayment = Database['public']['Tables']['invoice_payments']['Row'];
export type InvoicePaymentInput = Database['public']['Tables']['invoice_payments']['Insert'];
export type InvoicePaymentUpdate = Database['public']['Tables']['invoice_payments']['Update'];
