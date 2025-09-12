import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { InvoiceWithRelations } from './useInvoices'

interface JobPhoto {
  id: string
  file_name: string
  file_path: string
  category: 'reference' | 'assessment' | 'before' | 'after' | 'damage'
  description?: string
  created_at: string
}

interface PDFGenerationOptions {
  includePhotos?: boolean
  photoCategories?: JobPhoto['category'][]
  maxPhotosPerCategory?: number
  customMessage?: string
}

export function usePDFGeneration() {
  const { user } = useAuth()

  // Get photos related to a job through its quote and request chain
  const getJobPhotos = useCallback(async (invoice: InvoiceWithRelations): Promise<JobPhoto[]> => {
    if (!user || !invoice.quote_id) return []

    try {
      // Get the quote to find the related request
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('request_id')
        .eq('id', invoice.quote_id)
        .single()

      if (quoteError || !quote?.request_id) {
        console.log('No request associated with quote')
        return []
      }

      // Get photos from the request
      const { data: photos, error: photosError } = await supabase
        .from('request_files')
        .select('id, file_name, file_path, category, description, created_at')
        .eq('request_id', quote.request_id)
        .eq('user_id', user.id)
        .in('category', ['before', 'after', 'reference', 'assessment', 'damage'])
        .order('created_at', { ascending: true })

      if (photosError) {
        console.error('Error fetching photos:', photosError)
        return []
      }

      // Filter and map to ensure proper typing
      const validPhotos: JobPhoto[] = (photos || [])
        .filter(photo => photo.category && ['before', 'after', 'reference', 'assessment', 'damage'].includes(photo.category))
        .map(photo => ({
          id: photo.id,
          file_name: photo.file_name,
          file_path: photo.file_path,
          category: photo.category as JobPhoto['category'],
          description: photo.description || undefined,
          created_at: photo.created_at || new Date().toISOString()
        }))

      return validPhotos
    } catch (error) {
      console.error('Error getting job photos:', error)
      return []
    }
  }, [user])

  // Get Supabase Storage URL for a photo
  const getPhotoUrl = useCallback(async (filePath: string): Promise<string | null> => {
    try {
      const { data } = await supabase.storage
        .from('request-files')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      return data?.signedUrl || null
    } catch (error) {
      console.error('Error getting photo URL:', error)
      return null
    }
  }, [])

  // Convert image to base64 for PDF embedding
  const imageToBase64 = useCallback(async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error converting image to base64:', error)
      return null
    }
  }, [])

  // Generate enhanced HTML for invoice with photos
  const generateInvoiceHTML = useCallback(async (
    invoice: InvoiceWithRelations,
    options: PDFGenerationOptions = {}
  ): Promise<string> => {
    const {
      includePhotos = true,
      photoCategories = ['before', 'after'],
      maxPhotosPerCategory = 4,
      customMessage
    } = options

    // Get customer information
    const customerName = invoice.customer 
      ? `${invoice.customer.first_name || ''} ${invoice.customer.last_name || ''}`.trim() 
        || invoice.customer.company_name 
        || 'Valued Customer'
      : 'Valued Customer'

    // Get photos if requested
    let photosHTML = ''
    if (includePhotos) {
      const allPhotos = await getJobPhotos(invoice)
      
      // Group photos by category
      const photosByCategory = allPhotos.reduce((acc, photo) => {
        if (photoCategories.includes(photo.category)) {
          if (!acc[photo.category]) acc[photo.category] = []
          acc[photo.category].push(photo)
        }
        return acc
      }, {} as Record<string, JobPhoto[]>)

      // Generate photo sections
      const photoSections = await Promise.all(
        Object.entries(photosByCategory).map(async ([category, photos]) => {
          const limitedPhotos = photos.slice(0, maxPhotosPerCategory)
          
          const photoItems = await Promise.all(
            limitedPhotos.map(async (photo) => {
              const photoUrl = await getPhotoUrl(photo.file_path)
              if (!photoUrl) return ''

              const base64Image = await imageToBase64(photoUrl)
              if (!base64Image) return ''

              return `
                <div class="photo-item">
                  <img src="${base64Image}" alt="${photo.file_name}" class="photo-image" />
                  <div class="photo-caption">
                    ${photo.description || photo.file_name}
                  </div>
                </div>
              `
            })
          )

          const validPhotoItems = photoItems.filter(item => item !== '')
          
          if (validPhotoItems.length === 0) return ''

          return `
            <div class="photo-section">
              <h3 class="photo-section-title">${category.charAt(0).toUpperCase() + category.slice(1)} Photos</h3>
              <div class="photo-grid">
                ${validPhotoItems.join('')}
              </div>
            </div>
          `
        })
      )

      const validPhotoSections = photoSections.filter(section => section !== '')
      
      if (validPhotoSections.length > 0) {
        photosHTML = `
          <div class="photos-section">
            <h2 class="section-title">Project Documentation</h2>
            ${validPhotoSections.join('')}
          </div>
        `
      }
    }

    // Generate line items HTML
    const lineItemsHTML = invoice.line_items && invoice.line_items.length > 0
      ? invoice.line_items.map(item => `
          <div class="line-item">
            <div class="item-description">
              <div class="item-title">${item.title || item.description}</div>
              ${item.title && item.description ? `<div class="item-details">${item.description}</div>` : ''}
              <div class="item-details">Qty: ${item.quantity} × $${(item.unit_price_cents / 100).toFixed(2)}</div>
            </div>
            <div class="item-amount">$${(item.total_cents / 100).toFixed(2)}</div>
          </div>
        `).join('')
      : '<div class="line-item"><div class="item-description">No line items</div><div class="item-amount">$0.00</div></div>'

    // Calculate totals
    const subtotal = (invoice.subtotal_cents / 100)
    const tax = (invoice.tax_cents / 100)
    const total = (invoice.total_cents / 100)

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoice_number}</title>
    <style>
        @page {
            margin: 0.5in;
            size: A4;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #333;
            margin: 0;
            padding: 0;
            background: white;
        }
        
        .container {
            max-width: 100%;
            margin: 0 auto;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .company-info h1 {
            font-size: 28px;
            font-weight: bold;
            color: #dc2626;
            margin: 0 0 10px 0;
        }
        
        .company-details {
            color: #6b7280;
            line-height: 1.4;
        }
        
        .invoice-info {
            text-align: right;
        }
        
        .invoice-number {
            font-size: 24px;
            font-weight: bold;
            color: #111827;
            margin: 0 0 10px 0;
        }
        
        .invoice-details {
            color: #6b7280;
            line-height: 1.4;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 10px;
        }
        
        .status-draft { background: #f3f4f6; color: #374151; }
        .status-sent { background: #dbeafe; color: #1d4ed8; }
        .status-paid { background: #d1fae5; color: #059669; }
        .status-overdue { background: #fee2e2; color: #dc2626; }
        
        .billing-section {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
        }
        
        .bill-to, .bill-from {
            flex: 1;
        }
        
        .bill-to {
            margin-right: 30px;
        }
        
        .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 10px;
        }
        
        .customer-info, .company-address {
            color: #111827;
            line-height: 1.5;
        }
        
        .line-items-section {
            margin: 30px 0;
        }
        
        .line-items {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .line-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 16px;
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
            margin-bottom: 4px;
        }
        
        .item-details {
            color: #6b7280;
            font-size: 14px;
        }
        
        .item-amount {
            font-weight: 600;
            color: #111827;
            text-align: right;
            min-width: 100px;
        }
        
        .totals-section {
            margin: 30px 0;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals {
            min-width: 300px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }
        
        .total-row.final {
            border-top: 2px solid #e5e7eb;
            margin-top: 8px;
            padding-top: 12px;
            font-weight: 700;
            font-size: 18px;
        }
        
        .photos-section {
            margin: 40px 0;
            page-break-inside: avoid;
        }
        
        .photo-section {
            margin: 30px 0;
            page-break-inside: avoid;
        }
        
        .photo-section-title {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        
        .photo-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 15px;
        }
        
        .photo-item {
            text-align: center;
            page-break-inside: avoid;
        }
        
        .photo-image {
            width: 100%;
            max-height: 200px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        
        .photo-caption {
            margin-top: 8px;
            font-size: 12px;
            color: #6b7280;
            font-style: italic;
        }
        
        .custom-message {
            background: #fef3f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .custom-message h3 {
            color: #dc2626;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        
        @media print {
            .photo-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .photo-image {
                max-height: 180px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <h1>SRVC Base</h1>
                <div class="company-details">
                    Professional Service Management<br>
                    info@srvcbase.com<br>
                    (555) 123-4567
                </div>
            </div>
            <div class="invoice-info">
                <div class="invoice-number">Invoice #${invoice.invoice_number}</div>
                <div class="invoice-details">
                    Date: ${new Date(invoice.created_at).toLocaleDateString()}<br>
                    ${invoice.due_date ? `Due: ${new Date(invoice.due_date).toLocaleDateString()}<br>` : ''}
                    Status: <span class="status-badge status-${invoice.status}">${invoice.status}</span>
                </div>
            </div>
        </div>

        <!-- Billing Information -->
        <div class="billing-section">
            <div class="bill-to">
                <div class="section-title">Bill To</div>
                <div class="customer-info">
                    <strong>${customerName}</strong><br>
                    ${invoice.customer?.email || ''}<br>
                    ${invoice.customer?.phone || ''}
                </div>
            </div>
            <div class="bill-from">
                <div class="section-title">Bill From</div>
                <div class="company-address">
                    <strong>SRVC Base</strong><br>
                    123 Business Street<br>
                    City, State 12345<br>
                    info@srvcbase.com
                </div>
            </div>
        </div>

        <!-- Custom Message -->
        ${customMessage ? `
        <div class="custom-message">
            <h3>Personal Message</h3>
            <p>${customMessage.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}

        <!-- Line Items -->
        <div class="line-items-section">
            <div class="section-title">Services & Items</div>
            <div class="line-items">
                ${lineItemsHTML}
            </div>
        </div>

        <!-- Totals -->
        <div class="totals-section">
            <div class="totals">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Tax:</span>
                    <span>$${tax.toFixed(2)}</span>
                </div>
                <div class="total-row final">
                    <span>Total:</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <!-- Photos Section -->
        ${photosHTML}

        <!-- Footer -->
        <div class="footer">
            <p>Thank you for your business!</p>
            <p>Questions? Contact us at info@srvcbase.com or (555) 123-4567</p>
        </div>
    </div>
</body>
</html>
    `

    return html
  }, [getJobPhotos, getPhotoUrl, imageToBase64])

  // Generate and download PDF
  const generateInvoicePDF = useCallback(async (
    invoice: InvoiceWithRelations,
    options: PDFGenerationOptions = {}
  ): Promise<boolean> => {
    try {
      // Generate HTML content with photos
      const htmlContent = await generateInvoiceHTML(invoice, options)
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Failed to open print window. Please allow popups.')
      }

      // Write the HTML content to the new window
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Wait for images to load before printing
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          
          // Close the window after printing (optional)
          printWindow.onafterprint = () => {
            printWindow.close()
          }
        }, 1000) // Give images time to load
      }

      return true
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw error
    }
  }, [generateInvoiceHTML])

  return {
    generateInvoicePDF,
    generateInvoiceHTML,
    getJobPhotos,
    getPhotoUrl
  }
}
