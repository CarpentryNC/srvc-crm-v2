export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          completed_date: string | null
          created_at: string | null
          estimated_cost: number | null
          estimated_duration_hours: number | null
          findings: string | null
          id: string
          recommendations: string | null
          request_id: string | null
          scheduled_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          estimated_duration_hours?: number | null
          findings?: string | null
          id?: string
          recommendations?: string | null
          request_id?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          estimated_cost?: number | null
          estimated_duration_hours?: number | null
          findings?: string | null
          id?: string
          recommendations?: string | null
          request_id?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          assigned_to: string | null
          color: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          description: string | null
          end_datetime: string | null
          event_type: string
          id: string
          is_private: boolean | null
          is_recurring: boolean | null
          location: string | null
          notes: string | null
          notification_sent: boolean | null
          priority: string | null
          recurrence_data: Json | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          reminder_minutes: number[] | null
          source_id: string | null
          source_type: string | null
          start_datetime: string
          status: string | null
          timezone: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          all_day?: boolean | null
          assigned_to?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          end_datetime?: string | null
          event_type: string
          id?: string
          is_private?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          notes?: string | null
          notification_sent?: boolean | null
          priority?: string | null
          recurrence_data?: Json | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder_minutes?: number[] | null
          source_id?: string | null
          source_type?: string | null
          start_datetime: string
          status?: string | null
          timezone?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          all_day?: boolean | null
          assigned_to?: string | null
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          end_datetime?: string | null
          event_type?: string
          id?: string
          is_private?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          notes?: string | null
          notification_sent?: boolean | null
          priority?: string | null
          recurrence_data?: Json | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder_minutes?: number[] | null
          source_id?: string | null
          source_type?: string | null
          start_datetime?: string
          status?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          company_name: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_attachments: {
        Row: {
          content_base64: string | null
          content_type: string
          created_at: string
          filename: string
          id: string
          metadata: Json | null
          sent_email_id: string
          size_bytes: number | null
          storage_bucket: string | null
          storage_path: string | null
        }
        Insert: {
          content_base64?: string | null
          content_type: string
          created_at?: string
          filename: string
          id?: string
          metadata?: Json | null
          sent_email_id: string
          size_bytes?: number | null
          storage_bucket?: string | null
          storage_path?: string | null
        }
        Update: {
          content_base64?: string | null
          content_type?: string
          created_at?: string
          filename?: string
          id?: string
          metadata?: Json | null
          sent_email_id?: string
          size_bytes?: number | null
          storage_bucket?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_sent_email_id_fkey"
            columns: ["sent_email_id"]
            isOneToOne: false
            referencedRelation: "sent_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          location_data: Json | null
          provider_event_id: string | null
          provider_timestamp: string | null
          sent_email_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          provider_event_id?: string | null
          provider_timestamp?: string | null
          sent_email_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          provider_event_id?: string | null
          provider_timestamp?: string | null
          sent_email_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_sent_email_id_fkey"
            columns: ["sent_email_id"]
            isOneToOne: false
            referencedRelation: "sent_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          description: string | null
          html_template: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          metadata: Json | null
          name: string
          subject_template: string
          template_type: string
          text_template: string
          updated_at: string
          user_id: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          html_template: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          name: string
          subject_template: string
          template_type: string
          text_template: string
          updated_at?: string
          user_id: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          html_template?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          name?: string
          subject_template?: string
          template_type?: string
          text_template?: string
          updated_at?: string
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          created_at: string | null
          customer_id: string | null
          email: string | null
          event_id: string
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          response_datetime: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          event_id: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          response_datetime?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          event_id?: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          response_datetime?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_files: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          event_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          mime_type: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          event_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          mime_type?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          event_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_files_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_id: string
          id: string
          minutes_before: number
          reminder_datetime: string
          reminder_type: string
          sent_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_id: string
          id?: string
          minutes_before: number
          reminder_datetime: string
          reminder_type: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string
          id?: string
          minutes_before?: number
          reminder_datetime?: string
          reminder_type?: string
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string
          quantity: number
          sort_order: number
          title: string
          total_amount: number | null
          total_cents: number
          unit_price: number | null
          unit_price_cents: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number
          title: string
          total_amount?: number | null
          total_cents?: number
          unit_price?: number | null
          unit_price_cents?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number
          title?: string
          total_amount?: number | null
          total_cents?: number
          unit_price?: number | null
          unit_price_cents?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number | null
          amount_cents: number
          created_at: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          status: string
          stripe_payment_intent_id: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          amount_cents: number
          created_at?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          status?: string
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          amount_cents?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          status?: string
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoice_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          paid_date: string | null
          quote_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          subtotal: number | null
          subtotal_cents: number
          tax_amount: number | null
          tax_cents: number
          title: string
          total_amount: number | null
          total_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          paid_date?: string | null
          quote_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          subtotal_cents?: number
          tax_amount?: number | null
          tax_cents?: number
          title: string
          total_amount?: number | null
          total_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          paid_date?: string | null
          quote_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          subtotal_cents?: number
          tax_amount?: number | null
          tax_cents?: number
          title?: string
          total_amount?: number | null
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_hours: number | null
          created_at: string
          customer_id: string
          description: string | null
          estimated_hours: number | null
          id: string
          notes: string | null
          quote_id: string | null
          request_id: string | null
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          created_at?: string
          customer_id: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          quote_id?: string | null
          request_id?: string | null
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_hours?: number | null
          created_at?: string
          customer_id?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          notes?: string | null
          quote_id?: string | null
          request_id?: string | null
          scheduled_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string | null
          default_unit_price: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          unit: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_unit_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_unit_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      quote_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          quote_id: string
          sort_order: number
          title: string | null
          total_amount: number | null
          total_cents: number | null
          unit_price: number | null
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity: number
          quote_id: string
          sort_order?: number
          title?: string | null
          total_amount?: number | null
          total_cents?: number | null
          unit_price?: number | null
          unit_price_cents: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          quote_id?: string
          sort_order?: number
          title?: string | null
          total_amount?: number | null
          total_cents?: number | null
          unit_price?: number | null
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          assessment_id: string | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          quote_number: string
          request_id: string | null
          status: string
          subtotal: number | null
          subtotal_cents: number
          tax_amount: number | null
          tax_cents: number
          title: string
          total_amount: number | null
          total_cents: number
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          quote_number: string
          request_id?: string | null
          status?: string
          subtotal?: number | null
          subtotal_cents?: number
          tax_amount?: number | null
          tax_cents?: number
          title: string
          total_amount?: number | null
          total_cents?: number
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          quote_number?: string
          request_id?: string | null
          status?: string
          subtotal?: number | null
          subtotal_cents?: number
          tax_amount?: number | null
          tax_cents?: number
          title?: string
          total_amount?: number | null
          total_cents?: number
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_files: {
        Row: {
          assessment_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          request_id: string | null
          user_id: string | null
        }
        Insert: {
          assessment_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          request_id?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          request_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "request_files_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_files_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requests: {
        Row: {
          created_at: string | null
          customer_id: string | null
          description: string | null
          id: string
          location_notes: string | null
          preferred_contact_method: string | null
          priority: string | null
          requires_assessment: boolean | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          location_notes?: string | null
          preferred_contact_method?: string | null
          priority?: string | null
          requires_assessment?: boolean | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          location_notes?: string | null
          preferred_contact_method?: string | null
          priority?: string | null
          requires_assessment?: boolean | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_emails: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          document_id: string
          document_type: string
          email_provider: string | null
          email_service_id: string | null
          error_message: string | null
          html_content: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string
          subject: string
          text_content: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          document_id: string
          document_type: string
          email_provider?: string | null
          email_service_id?: string | null
          error_message?: string | null
          html_content?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          text_content?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          document_id?: string
          document_type?: string
          email_provider?: string | null
          email_service_id?: string | null
          error_message?: string | null
          html_content?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          text_content?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          max_customers: number | null
          max_invoices: number | null
          max_storage_gb: number | null
          name: string
          price_amount: number | null
          price_cents: number
          stripe_price_id: string
          updated_at: string
        }
        Insert: {
          billing_interval: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_customers?: number | null
          max_invoices?: number | null
          max_storage_gb?: number | null
          name: string
          price_amount?: number | null
          price_cents: number
          stripe_price_id: string
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_customers?: number | null
          max_invoices?: number | null
          max_storage_gb?: number | null
          name?: string
          price_amount?: number | null
          price_cents?: number
          stripe_price_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_conversions: {
        Row: {
          conversion_notes: string | null
          created_at: string | null
          id: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          user_id: string | null
        }
        Insert: {
          conversion_notes?: string | null
          created_at?: string | null
          id?: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          user_id?: string | null
        }
        Update: {
          conversion_notes?: string | null
          created_at?: string | null
          id?: string
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      email_analytics: {
        Row: {
          bounced_count: number | null
          click_rate: number | null
          clicked_count: number | null
          delivered_count: number | null
          delivery_rate: number | null
          document_type: string | null
          failed_count: number | null
          open_rate: number | null
          opened_count: number | null
          sent_date: string | null
          total_sent: number | null
          user_id: string | null
        }
        Relationships: []
      }
      invoice_summary: {
        Row: {
          balance_due: number | null
          created_at: string | null
          customer_company: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          description: string | null
          due_date: string | null
          id: string | null
          invoice_number: string | null
          is_fully_paid: boolean | null
          paid_date: string | null
          quote_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          subtotal: number | null
          subtotal_cents: number | null
          tax_amount: number | null
          tax_cents: number | null
          title: string | null
          total_amount: number | null
          total_cents: number | null
          total_paid: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_job_calendar_event: {
        Args: {
          p_customer_id?: string
          p_estimated_hours?: number
          p_job_id: string
          p_scheduled_date: string
          p_title: string
        }
        Returns: string
      }
      get_calendar_events: {
        Args: {
          p_end_date: string
          p_event_types?: string[]
          p_include_recurring?: boolean
          p_start_date: string
          p_user_id: string
        }
        Returns: {
          color: string
          customer_name: string
          description: string
          end_datetime: string
          event_type: string
          id: string
          priority: string
          source_info: Json
          start_datetime: string
          status: string
          title: string
        }[]
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_invoice_balance: {
        Args: { invoice_uuid: string }
        Returns: number
      }
      get_invoice_payment_total: {
        Args: { invoice_uuid: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

