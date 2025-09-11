// Test script for production email functionality
// This tests the actual deployed Edge Function with SendGrid

const SUPABASE_URL = 'https://lrvzqxyqrrjusvwazaak.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxydnpxeHlxcnJqdXN2d2F6YWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU4NDE4MTEsImV4cCI6MjA0MTQxNzgxMX0.V1s2vJXhYiCxBDNn3XF_Dw8nQq6TjV2Bz6xjL0FjmU0';

async function testProductionEmail() {
    console.log('🧪 Testing Production Email Function...');
    
    const testEmailData = {
        to: 'test@example.com',
        subject: 'Production Email Test from SRVC CRM',
        html: `
            <h2>🎉 Production Email Test Successful!</h2>
            <p>This email was sent from the production Supabase Edge Function using SendGrid.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Test ID:</strong> ${Math.random().toString(36).substring(7)}</p>
            <hr>
            <p><em>SRVC CRM Email System - Production Ready</em></p>
        `,
        text: `Production Email Test Successful! This email was sent from the production Supabase Edge Function using SendGrid. Timestamp: ${new Date().toISOString()}`
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify(testEmailData)
        });

        console.log('📤 Request sent to:', `${SUPABASE_URL}/functions/v1/send-email`);
        console.log('📋 Response status:', response.status);
        console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📄 Raw response:', responseText);

        if (response.ok) {
            try {
                const data = JSON.parse(responseText);
                console.log('✅ Production email test successful!');
                console.log('📧 Email details:', {
                    messageId: data.messageId,
                    to: testEmailData.to,
                    subject: testEmailData.subject,
                    provider: data.provider || 'SendGrid'
                });
                console.log('🎯 Email sent through production Edge Function!');
            } catch (parseError) {
                console.log('✅ Email likely sent (response not JSON):', responseText);
            }
        } else {
            console.error('❌ Production email test failed');
            console.error('Status:', response.status);
            console.error('Response:', responseText);
        }

    } catch (error) {
        console.error('❌ Network error during production email test:');
        console.error(error.message);
        
        // Additional debugging info
        if (error.code) {
            console.error('Error code:', error.code);
        }
        if (error.cause) {
            console.error('Error cause:', error.cause);
        }
    }
}

// Run the test
testProductionEmail();
