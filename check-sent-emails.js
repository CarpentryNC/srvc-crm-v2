// Script to check sent emails from the database
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lrvzqxyqrrjusvwazaak.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxydnpxeHlxcnJqdXN2d2F6YWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4NDE4MTEsImV4cCI6MjA0MTQxNzgxMX0.V1s2vJXhYiCxBDNn3XF_Dw8nQq6TjV2Bz6xjL0FjmU0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function checkSentEmails() {
    console.log('📧 Checking sent emails from database...')
    
    try {
        // Get all sent emails ordered by most recent
        const { data, error } = await supabase
            .from('sent_emails')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        if (error) {
            console.error('❌ Error fetching sent emails:', error)
            return
        }

        if (!data || data.length === 0) {
            console.log('📭 No sent emails found in database')
            return
        }

        console.log(`📬 Found ${data.length} sent emails:`)
        console.log('=' .repeat(60))
        
        data.forEach((email, index) => {
            console.log(`\n${index + 1}. Email Details:`)
            console.log(`   📧 To: ${email.recipient_email}`)
            console.log(`   📑 Subject: ${email.subject}`)
            console.log(`   📋 Type: ${email.document_type}`)
            console.log(`   🚦 Status: ${email.status}`)
            console.log(`   🕒 Sent: ${new Date(email.created_at).toLocaleString()}`)
            console.log(`   🆔 Email Service ID: ${email.email_service_id || 'N/A'}`)
            console.log(`   🏷️ Provider: ${email.email_provider}`)
            
            if (email.error_message) {
                console.log(`   ❌ Error: ${email.error_message}`)
            }
            
            if (email.sent_at) {
                console.log(`   ✅ Delivered: ${new Date(email.sent_at).toLocaleString()}`)
            }
        })
        
    } catch (err) {
        console.error('❌ Unexpected error:', err)
    }
}

// Run the check
checkSentEmails()
