import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Quote } from './useQuotes'
import type { InvoiceWithRelations } from './useInvoices'
import type { Database } from '../types/database'

// Email types and interfaces
export interface EmailTemplate {
  subject: string
  htmlContent: string
  textContent: string
}

export interface EmailRecipient {
  email: string
  name?: string
}

export interface EmailSendRequest {
  to: EmailRecipient[]
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  subject: string
  htmlContent: string
  textContent: string
  attachments?: EmailAttachment[]
  documentType: 'quote' | 'invoice'
  documentId: string
}

export interface EmailAttachment {
  filename: string
  content: string // base64 encoded
  contentType: string
}

// Use the database type directly for consistency
export type SentEmail = Database['public']['Tables']['sent_emails']['Row']

export function useEmailService() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentEmails] = useState<SentEmail[]>([])

  // Generate quote email template
  const generateQuoteEmailTemplate = useCallback((quote: Quote): EmailTemplate => {
    const customerName = quote.customer 
      ? `${quote.customer.first_name} ${quote.customer.last_name}`.trim() 
        || quote.customer.company_name 
        || 'Valued Customer'
      : 'Valued Customer'

    const subject = `Quote ${quote.quote_number} - ${quote.title}`

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quote ${quote.quote_number}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .quote-number {
            font-size: 18px;
            color: #6b7280;
        }
        .content {
            margin-bottom: 30px;
        }
        .quote-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 4px 0;
        }
        .detail-label {
            font-weight: 600;
            color: #374151;
        }
        .detail-value {
            color: #6b7280;
        }
        .total {
            border-top: 2px solid #e5e7eb;
            padding-top: 12px;
            font-size: 18px;
            font-weight: bold;
            color: #111827;
        }
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            border-top: 1px solid #e9ecef;
            padding-top: 20px;
            margin-top: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .line-items {
            margin: 20px 0;
        }
        .line-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .line-item:last-child {
            border-bottom: none;
        }
        .item-description {
            flex: 1;
        }
        .item-title {
            font-weight: 600;
            color: #111827;
        }
        .item-details {
            color: #6b7280;
            font-size: 14px;
        }
        .item-amount {
            font-weight: 600;
            color: #111827;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Your Company Name</div>
            <div class="quote-number">Quote #${quote.quote_number}</div>
        </div>

        <div class="content">
            <h2>Hello ${customerName},</h2>
            
            <p>Thank you for your interest in our services. Please find your quote details below:</p>

            <div class="quote-details">
                <div class="detail-row">
                    <span class="detail-label">Quote Number:</span>
                    <span class="detail-value">${quote.quote_number}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Project:</span>
                    <span class="detail-value">${quote.title}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${new Date(quote.created_at).toLocaleDateString()}</span>
                </div>
                ${quote.valid_until ? `
                <div class="detail-row">
                    <span class="detail-label">Valid Until:</span>
                    <span class="detail-value">${new Date(quote.valid_until).toLocaleDateString()}</span>
                </div>
                ` : ''}
            </div>

            ${quote.description ? `<p><strong>Description:</strong> ${quote.description}</p>` : ''}

            ${quote.quote_line_items && quote.quote_line_items.length > 0 ? `
            <div class="line-items">
                <h3>Services & Items:</h3>
                ${quote.quote_line_items.map(item => `
                <div class="line-item">
                    <div class="item-description">
                        <div class="item-title">${item.title || item.description}</div>
                        ${item.title && item.description ? `<div class="item-details">${item.description}</div>` : ''}
                        <div class="item-details">Qty: ${item.quantity} × $${item.unit_price.toFixed(2)}</div>
                    </div>
                    <div class="item-amount">$${item.total_amount.toFixed(2)}</div>
                </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="quote-details">
                <div class="detail-row">
                    <span class="detail-label">Subtotal:</span>
                    <span class="detail-value">$${quote.subtotal.toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tax:</span>
                    <span class="detail-value">$${quote.tax_amount.toFixed(2)}</span>
                </div>
                <div class="detail-row total">
                    <span class="detail-label">Total:</span>
                    <span class="detail-value">$${quote.total_amount.toFixed(2)}</span>
                </div>
            </div>

            <p>This quote is valid for 30 days from the date issued. If you have any questions or would like to proceed, please don't hesitate to contact us.</p>

            <div style="text-align: center;">
                <a href="mailto:your-email@company.com" class="cta-button">Contact Us to Accept</a>
            </div>
        </div>

        <div class="footer">
            <p><strong>Your Company Name</strong><br>
            123 Business Street<br>
            City, State 12345<br>
            Phone: (555) 123-4567<br>
            Email: your-email@company.com</p>
        </div>
    </div>
</body>
</html>
    `

    const textContent = `
Quote #${quote.quote_number}

Hello ${customerName},

Thank you for your interest in our services. Please find your quote details below:

Quote Number: ${quote.quote_number}
Project: ${quote.title}
Date: ${new Date(quote.created_at).toLocaleDateString()}
${quote.valid_until ? `Valid Until: ${new Date(quote.valid_until).toLocaleDateString()}` : ''}

${quote.description ? `Description: ${quote.description}` : ''}

${quote.quote_line_items && quote.quote_line_items.length > 0 ? `
Services & Items:
${quote.quote_line_items.map(item => 
  `- ${item.title || item.description} (Qty: ${item.quantity} × $${item.unit_price.toFixed(2)}) = $${item.total_amount.toFixed(2)}`
).join('\n')}
` : ''}

Subtotal: $${quote.subtotal.toFixed(2)}
Tax: $${quote.tax_amount.toFixed(2)}
Total: $${quote.total_amount.toFixed(2)}

This quote is valid for 30 days from the date issued. If you have any questions or would like to proceed, please contact us at your-email@company.com or (555) 123-4567.

Thank you for your business!

Your Company Name
123 Business Street
City, State 12345
Phone: (555) 123-4567
Email: your-email@company.com
    `

    return { subject, htmlContent, textContent }
  }, [])

  // Generate invoice email template
  const generateInvoiceEmailTemplate = useCallback((invoice: InvoiceWithRelations): EmailTemplate => {
    const customerName = invoice.customer 
      ? `${invoice.customer.first_name || ''} ${invoice.customer.last_name || ''}`.trim() 
        || invoice.customer.company_name 
        || 'Valued Customer'
      : 'Valued Customer'

    const subject = `Invoice ${invoice.invoice_number} - Payment Due`

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoice_number}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 10px;
        }
        .invoice-number {
            font-size: 18px;
            color: #6b7280;
        }
        .content {
            margin-bottom: 30px;
        }
        .invoice-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 4px 0;
        }
        .detail-label {
            font-weight: 600;
            color: #374151;
        }
        .detail-value {
            color: #6b7280;
        }
        .total {
            border-top: 2px solid #e5e7eb;
            padding-top: 12px;
            font-size: 18px;
            font-weight: bold;
            color: #111827;
        }
        .cta-button {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            border-top: 1px solid #e9ecef;
            padding-top: 20px;
            margin-top: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .line-items {
            margin: 20px 0;
        }
        .line-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .line-item:last-child {
            border-bottom: none;
        }
        .item-description {
            flex: 1;
        }
        .item-title {
            font-weight: 600;
            color: #111827;
        }
        .item-details {
            color: #6b7280;
            font-size: 14px;
        }
        .item-amount {
            font-weight: 600;
            color: #111827;
        }
        .status-paid {
            background: #10b981;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-overdue {
            background: #dc2626;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-sent {
            background: #f59e0b;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Your Company Name</div>
            <div class="invoice-number">Invoice #${invoice.invoice_number}</div>
            <div class="status-${invoice.status}">${invoice.status.toUpperCase()}</div>
        </div>

        <div class="content">
            <h2>Hello ${customerName},</h2>
            
            <p>Thank you for your business. Please find your invoice details below:</p>

            <div class="invoice-details">
                <div class="detail-row">
                    <span class="detail-label">Invoice Number:</span>
                    <span class="detail-value">${invoice.invoice_number}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Project:</span>
                    <span class="detail-value">${invoice.title}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Invoice Date:</span>
                    <span class="detail-value">${new Date(invoice.created_at).toLocaleDateString()}</span>
                </div>
                ${invoice.due_date ? `
                <div class="detail-row">
                    <span class="detail-label">Due Date:</span>
                    <span class="detail-value">${new Date(invoice.due_date).toLocaleDateString()}</span>
                </div>
                ` : ''}
                ${invoice.quote ? `
                <div class="detail-row">
                    <span class="detail-label">Related Quote:</span>
                    <span class="detail-value">${invoice.quote.quote_number}</span>
                </div>
                ` : ''}
            </div>

            ${invoice.description ? `<p><strong>Description:</strong> ${invoice.description}</p>` : ''}

            ${invoice.line_items && invoice.line_items.length > 0 ? `
            <div class="line-items">
                <h3>Services & Items:</h3>
                ${invoice.line_items.map(item => `
                <div class="line-item">
                    <div class="item-description">
                        <div class="item-title">${item.title}</div>
                        ${item.description ? `<div class="item-details">${item.description}</div>` : ''}
                        <div class="item-details">Qty: ${item.quantity} × $${(item.unit_price_cents / 100).toFixed(2)}</div>
                    </div>
                    <div class="item-amount">$${(item.total_cents / 100).toFixed(2)}</div>
                </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="invoice-details">
                <div class="detail-row">
                    <span class="detail-label">Subtotal:</span>
                    <span class="detail-value">$${(invoice.subtotal_cents / 100).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Tax:</span>
                    <span class="detail-value">$${(invoice.tax_cents / 100).toFixed(2)}</span>
                </div>
                <div class="detail-row total">
                    <span class="detail-label">Amount Due:</span>
                    <span class="detail-value">$${(invoice.total_cents / 100).toFixed(2)}</span>
                </div>
            </div>

            <p>Payment is due within 30 days of the invoice date. If you have any questions about this invoice, please contact us.</p>

            <div style="text-align: center;">
                <a href="mailto:your-email@company.com" class="cta-button">Contact Us About Payment</a>
            </div>
        </div>

        <div class="footer">
            <p><strong>Your Company Name</strong><br>
            123 Business Street<br>
            City, State 12345<br>
            Phone: (555) 123-4567<br>
            Email: your-email@company.com</p>
        </div>
    </div>
</body>
</html>
    `

    const textContent = `
Invoice #${invoice.invoice_number}

Hello ${customerName},

Thank you for your business. Please find your invoice details below:

Invoice Number: ${invoice.invoice_number}
Project: ${invoice.title}
Invoice Date: ${new Date(invoice.created_at).toLocaleDateString()}
${invoice.due_date ? `Due Date: ${new Date(invoice.due_date).toLocaleDateString()}` : ''}
${invoice.quote ? `Related Quote: ${invoice.quote.quote_number}` : ''}

${invoice.description ? `Description: ${invoice.description}` : ''}

${invoice.line_items && invoice.line_items.length > 0 ? `
Services & Items:
${invoice.line_items.map(item => 
  `- ${item.title} (Qty: ${item.quantity} × $${(item.unit_price_cents / 100).toFixed(2)}) = $${(item.total_cents / 100).toFixed(2)}`
).join('\n')}
` : ''}

Subtotal: $${(invoice.subtotal_cents / 100).toFixed(2)}
Tax: $${(invoice.tax_cents / 100).toFixed(2)}
Amount Due: $${(invoice.total_cents / 100).toFixed(2)}

Payment is due within 30 days of the invoice date. If you have any questions about this invoice, please contact us at your-email@company.com or (555) 123-4567.

Thank you for your business!

Your Company Name
123 Business Street
City, State 12345
Phone: (555) 123-4567
Email: your-email@company.com
    `

    return { subject, htmlContent, textContent }
  }, [])

  // Send quote email
  const sendQuoteEmail = useCallback(async (
    quote: Quote,
    recipients: EmailRecipient[],
    customSubject?: string,
    customMessage?: string
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setLoading(true)
      setError(null)

      // Generate email template
      const template = generateQuoteEmailTemplate(quote)
      
      // Customize subject if provided
      const subject = customSubject || template.subject
      
      // Add custom message if provided
      let htmlContent = template.htmlContent
      let textContent = template.textContent
      
      if (customMessage) {
        const customMessageHtml = `<div style="background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0;"><p><strong>Personal Message:</strong></p><p>${customMessage.replace(/\n/g, '<br>')}</p></div>`
        htmlContent = htmlContent.replace('<p>Thank you for your interest', customMessageHtml + '<p>Thank you for your interest')
        textContent = textContent.replace('Thank you for your interest', `Personal Message:\n${customMessage}\n\nThank you for your interest`)
      }

      const emailRequest: EmailSendRequest = {
        to: recipients,
        subject,
        htmlContent,
        textContent,
        documentType: 'quote',
        documentId: quote.id
      }

      // Check if we're running in local development
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      // Allow forcing production mode with URL parameter: ?emailMode=production
      const forceProduction = new URLSearchParams(window.location.search).get('emailMode') === 'production'
      
      if (isLocal && !forceProduction) {
        // Development mode: simulate email sending
        console.log('🚀 DEVELOPMENT MODE: Simulating quote email send')
        console.log('📧 Email Request:', emailRequest)
        console.log('✅ Email would be sent successfully in production')
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        console.log('✅ Quote email sent successfully (development mode)')
      } else {
        // Production mode: use the remote production edge function
        console.log('🚀 PRODUCTION MODE: Sending quote email via Remote Edge Function')
        console.log('📧 Email Request:', emailRequest)
        
        // Get the current session to pass auth token
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          throw new Error('No valid session found. Please log in again.')
        }
        
        console.log('🔑 Using session token for authentication')
        
        // Use the existing supabase client but with production URL override
        const response = await fetch('https://lrvzqxyqrrjusvwazaak.supabase.co/functions/v1/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxydnpxeHlxcnJqdXN2d2F6YWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyODM3NTUsImV4cCI6MjA3Mjg1OTc1NX0.fGa3ojCVJeSxfK7CJjswS4NchPbtRuzuOJIB6tME97o'
          },
          body: JSON.stringify(emailRequest)
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ HTTP Error:', response.status, errorText)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        
        if (!data?.success && !data?.messageId) {
          console.error('❌ Email sending failed:', data)
          throw new Error(data?.error || 'Failed to send email')
        }

        console.log('✅ Quote email sent successfully via Remote Edge Function:', data)
      }

      return true
    } catch (err) {
      console.error('Error sending quote email:', err)
      setError(err instanceof Error ? err.message : 'Failed to send quote email')
      return false
    } finally {
      setLoading(false)
    }
  }, [user, generateQuoteEmailTemplate])

  // Send invoice email
  const sendInvoiceEmail = useCallback(async (
    invoice: InvoiceWithRelations,
    recipients: EmailRecipient[],
    customSubject?: string,
    customMessage?: string
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    try {
      setLoading(true)
      setError(null)

      // Generate email template
      const template = generateInvoiceEmailTemplate(invoice)
      
      // Customize subject if provided
      const subject = customSubject || template.subject
      
      // Add custom message if provided
      let htmlContent = template.htmlContent
      let textContent = template.textContent
      
      if (customMessage) {
        const customMessageHtml = `<div style="background: #fef3f2; padding: 20px; border-radius: 6px; margin: 20px 0;"><p><strong>Personal Message:</strong></p><p>${customMessage.replace(/\n/g, '<br>')}</p></div>`
        htmlContent = htmlContent.replace('<p>Thank you for your business', customMessageHtml + '<p>Thank you for your business')
        textContent = textContent.replace('Thank you for your business', `Personal Message:\n${customMessage}\n\nThank you for your business`)
      }

      const emailRequest: EmailSendRequest = {
        to: recipients,
        subject,
        htmlContent,
        textContent,
        documentType: 'invoice',
        documentId: invoice.id
      }

      // Check if we're running in local development
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      // Allow forcing production mode with URL parameter: ?emailMode=production
      const forceProduction = new URLSearchParams(window.location.search).get('emailMode') === 'production'
      
      if (isLocal && !forceProduction) {
        // Development mode: simulate email sending
        console.log('🚀 DEVELOPMENT MODE: Simulating invoice email send')
        console.log('📧 Email Request:', emailRequest)
        console.log('✅ Email would be sent successfully in production')
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        console.log('✅ Invoice email sent successfully (development mode)')
      } else {
        // Production mode: use the remote production edge function
        console.log('🚀 PRODUCTION MODE: Sending invoice email via Remote Edge Function')
        console.log('📧 Email Request:', emailRequest)
        
        // Get the current session to pass auth token
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          throw new Error('No valid session found. Please log in again.')
        }
        
        console.log('🔑 Using session token for authentication')
        
        // Use the existing supabase client but with production URL override
        const response = await fetch('https://lrvzqxyqrrjusvwazaak.supabase.co/functions/v1/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxydnpxeHlxcnJqdXN2d2F6YWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyODM3NTUsImV4cCI6MjA3Mjg1OTc1NX0.fGa3ojCVJeSxfK7CJjswS4NchPbtRuzuOJIB6tME97o'
          },
          body: JSON.stringify(emailRequest)
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ HTTP Error:', response.status, errorText)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        
        if (!data?.success && !data?.messageId) {
          console.error('❌ Email sending failed:', data)
          throw new Error(data?.error || 'Failed to send email')
        }

        console.log('✅ Invoice email sent successfully via Remote Edge Function:', data)
      }

      return true
    } catch (err) {
      console.error('Error sending invoice email:', err)
      setError(err instanceof Error ? err.message : 'Failed to send invoice email')
      return false
    } finally {
      setLoading(false)
    }
  }, [user, generateInvoiceEmailTemplate])

  // Get sent emails for a document
  const getSentEmails = useCallback(async (documentType: 'quote' | 'invoice', documentId: string): Promise<SentEmail[]> => {
    if (!user) return []

    try {
      const { data, error } = await supabase
        .from('sent_emails')
        .select('*')
        .eq('user_id', user.id)
        .eq('document_type', documentType)
        .eq('document_id', documentId)
        .order('sent_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching sent emails:', err)
      return []
    }
  }, [user])

  // Preview email template
  const previewQuoteEmail = useCallback((quote: Quote, customMessage?: string): EmailTemplate => {
    const template = generateQuoteEmailTemplate(quote)
    
    if (customMessage) {
      const customMessageHtml = `<div style="background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 20px 0;"><p><strong>Personal Message:</strong></p><p>${customMessage.replace(/\n/g, '<br>')}</p></div>`
      template.htmlContent = template.htmlContent.replace('<p>Thank you for your interest', customMessageHtml + '<p>Thank you for your interest')
      template.textContent = template.textContent.replace('Thank you for your interest', `Personal Message:\n${customMessage}\n\nThank you for your interest`)
    }
    
    return template
  }, [generateQuoteEmailTemplate])

  const previewInvoiceEmail = useCallback((invoice: InvoiceWithRelations, customMessage?: string): EmailTemplate => {
    const template = generateInvoiceEmailTemplate(invoice)
    
    if (customMessage) {
      const customMessageHtml = `<div style="background: #fef3f2; padding: 20px; border-radius: 6px; margin: 20px 0;"><p><strong>Personal Message:</strong></p><p>${customMessage.replace(/\n/g, '<br>')}</p></div>`
      template.htmlContent = template.htmlContent.replace('<p>Thank you for your business', customMessageHtml + '<p>Thank you for your business')
      template.textContent = template.textContent.replace('Thank you for your business', `Personal Message:\n${customMessage}\n\nThank you for your business`)
    }
    
    return template
  }, [generateInvoiceEmailTemplate])

  return {
    // State
    loading,
    error,
    sentEmails,

    // Template generation
    generateQuoteEmailTemplate,
    generateInvoiceEmailTemplate,
    previewQuoteEmail,
    previewInvoiceEmail,

    // Email sending
    sendQuoteEmail,
    sendInvoiceEmail,

    // Email tracking
    getSentEmails,

    // Utility
    setError
  }
}
