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
          email: string
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
          email: string
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
          subtotal: number
          tax_amount: number
          total_amount: number
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          due_date?: string
          paid_date?: string
          stripe_payment_intent_id?: string
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
          subtotal: number
          tax_amount: number
          total_amount: number
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
          subtotal?: number
          tax_amount?: number
          total_amount?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
