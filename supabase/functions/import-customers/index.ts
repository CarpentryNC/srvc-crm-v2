import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CustomerImportData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  notes?: string;
  user_id: string;
}

interface ImportResult {
  success: boolean;
  importedCount: number;
  errorCount: number;
  duplicates: number;
  errors: Array<{
    row: number;
    email: string;
    message: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { customers }: { customers: CustomerImportData[] } = await req.json()
    
    if (!customers || !Array.isArray(customers)) {
      return new Response(
        JSON.stringify({ error: 'Invalid customers data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const result: ImportResult = {
      success: true,
      importedCount: 0,
      errorCount: 0,
      duplicates: 0,
      errors: []
    }

    // Check for existing customers by email to avoid duplicates
    const emails = customers.map(c => c.email).filter(Boolean)
    const { data: existingCustomers } = await supabaseClient
      .from('customers')
      .select('email')
      .eq('user_id', user.id)
      .in('email', emails)

    const existingEmails = new Set(existingCustomers?.map(c => c.email) || [])

    // Process each customer
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i]
      
      try {
        // Validate required fields
        if (!customer.first_name || !customer.last_name || !customer.email) {
          result.errors.push({
            row: i + 1,
            email: customer.email || 'unknown',
            message: 'Missing required fields (first_name, last_name, email)'
          })
          result.errorCount++
          continue
        }

        // Check for duplicates
        if (existingEmails.has(customer.email)) {
          result.duplicates++
          continue
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(customer.email)) {
          result.errors.push({
            row: i + 1,
            email: customer.email,
            message: 'Invalid email format'
          })
          result.errorCount++
          continue
        }

        // Set user_id to authenticated user
        const customerData = {
          ...customer,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Insert customer
        const { error: insertError } = await supabaseClient
          .from('customers')
          .insert(customerData)

        if (insertError) {
          console.error('Insert error:', insertError)
          result.errors.push({
            row: i + 1,
            email: customer.email,
            message: insertError.message || 'Failed to insert customer'
          })
          result.errorCount++
        } else {
          result.importedCount++
          // Add to existing emails set to prevent duplicates in same batch
          existingEmails.add(customer.email)
        }

      } catch (error) {
        console.error('Processing error:', error)
        result.errors.push({
          row: i + 1,
          email: customer.email || 'unknown',
          message: error.message || 'Unknown error occurred'
        })
        result.errorCount++
      }
    }

    // Set success based on whether any customers were imported
    result.success = result.importedCount > 0

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
