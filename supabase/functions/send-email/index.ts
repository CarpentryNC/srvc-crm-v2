import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface EmailRequest {
  to: Array<{
    email: string
    name?: string
  }>
  subject: string
  htmlContent: string
  textContent: string
  documentType: 'quote' | 'invoice'
  documentId: string
}

interface EmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

// SendGrid API configuration
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'samir.emailme@gmail.com'
const FROM_NAME = Deno.env.get('FROM_NAME') || 'SRVC CRM'

async function sendWithSendGrid(emailData: EmailRequest): Promise<EmailResponse> {
  if (!SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured')
  }

  const sendGridData = {
    personalizations: [{
      to: emailData.to.map(recipient => ({
        email: recipient.email,
        name: recipient.name || recipient.email
      })),
      subject: emailData.subject
    }],
    from: {
      email: FROM_EMAIL,
      name: FROM_NAME
    },
    content: [
      {
        type: 'text/plain',
        value: emailData.textContent
      },
      {
        type: 'text/html',
        value: emailData.htmlContent
      }
    ]
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendGridData),
    })

    if (response.ok) {
      // SendGrid returns 202 for successful sends, but no body
      const messageId = response.headers.get('x-message-id') || `sendgrid_${Date.now()}`
      return {
        success: true,
        messageId
      }
    } else {
      const errorText = await response.text()
      console.error('SendGrid API error:', errorText)
      return {
        success: false,
        error: `SendGrid API error: ${response.status} - ${errorText}`
      }
    }
  } catch (error) {
    console.error('SendGrid request failed:', error)
    return {
      success: false,
      error: `Network error: ${error.message}`
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
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

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const emailRequest: EmailRequest = await req.json()

    // Validate required fields
    if (!emailRequest.to || emailRequest.to.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Recipients are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!emailRequest.subject || !emailRequest.htmlContent) {
      return new Response(
        JSON.stringify({ error: 'Subject and content are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send email with SendGrid
    console.log('Sending email with SendGrid')
    const emailResult: EmailResponse = await sendWithSendGrid(emailRequest)

    // Track email sending in database
    const emailTrackingPromises = emailRequest.to.map(async (recipient) => {
      const emailRecord = {
        user_id: user.id,
        document_type: emailRequest.documentType,
        document_id: emailRequest.documentId,
        recipient_email: recipient.email,
        recipient_name: recipient.name || null,
        subject: emailRequest.subject,
        html_content: emailRequest.htmlContent,
        text_content: emailRequest.textContent,
        status: emailResult.success ? 'sent' : 'failed',
        email_service_id: emailResult.messageId || null,
        error_message: emailResult.success ? null : emailResult.error,
        sent_at: emailResult.success ? new Date().toISOString() : null,
        email_provider: 'sendgrid'
      }

      const { error: trackingError } = await supabaseClient
        .from('sent_emails')
        .insert(emailRecord)

      if (trackingError) {
        console.error('Error tracking email:', trackingError)
        // Don't fail the entire request if tracking fails
      }
    })

    // Wait for all tracking records to be inserted
    await Promise.all(emailTrackingPromises)

    if (emailResult.success) {
      return new Response(
        JSON.stringify({
          success: true,
          messageId: emailResult.messageId,
          message: `Email sent successfully to ${emailRequest.to.length} recipient(s)`
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: emailResult.error || 'Failed to send email'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
