-- Email tracking system for quotes and invoices
-- This migration creates tables and policies for tracking sent emails

-- Create sent_emails table for tracking all sent emails
CREATE TABLE IF NOT EXISTS sent_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Document reference
    document_type TEXT NOT NULL CHECK (document_type IN ('quote', 'invoice')),
    document_id UUID NOT NULL,
    
    -- Recipient information
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    
    -- Email content
    subject TEXT NOT NULL,
    html_content TEXT,
    text_content TEXT,
    
    -- Delivery tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked', 'unsubscribed')
    ),
    email_service_id TEXT, -- ID from email service provider (SendGrid, AWS SES, etc.)
    error_message TEXT,
    
    -- Timestamps
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    
    -- Additional metadata
    email_provider TEXT DEFAULT 'supabase', -- 'supabase', 'sendgrid', 'ses', etc.
    metadata JSONB DEFAULT '{}',
    
    -- Indexes for performance
    CONSTRAINT sent_emails_document_check CHECK (
        (document_type = 'quote' AND document_id IS NOT NULL) OR
        (document_type = 'invoice' AND document_id IS NOT NULL)
    )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sent_emails_user_id ON sent_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_document ON sent_emails(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_recipient ON sent_emails(recipient_email);
CREATE INDEX IF NOT EXISTS idx_sent_emails_status ON sent_emails(status);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON sent_emails(sent_at);
CREATE INDEX IF NOT EXISTS idx_sent_emails_created_at ON sent_emails(created_at);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_sent_emails_user_document ON sent_emails(user_id, document_type, document_id);

-- Enable Row Level Security
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sent_emails
CREATE POLICY "Users can view own sent emails"
    ON sent_emails FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sent emails"
    ON sent_emails FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sent emails"
    ON sent_emails FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sent emails"
    ON sent_emails FOR DELETE
    USING (auth.uid() = user_id);

-- Create email_templates table for reusable templates
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Template identification
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT NOT NULL CHECK (template_type IN ('quote', 'invoice', 'general')),
    
    -- Template content
    subject_template TEXT NOT NULL,
    html_template TEXT NOT NULL,
    text_template TEXT NOT NULL,
    
    -- Template settings
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    variables JSONB DEFAULT '[]', -- Array of available template variables
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for email_templates
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Enable RLS for email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates
CREATE POLICY "Users can view own email templates"
    ON email_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email templates"
    ON email_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email templates"
    ON email_templates FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email templates"
    ON email_templates FOR DELETE
    USING (auth.uid() = user_id);

-- Create email_attachments table for tracking email attachments
CREATE TABLE IF NOT EXISTS email_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    sent_email_id UUID REFERENCES sent_emails(id) ON DELETE CASCADE NOT NULL,
    
    -- Attachment details
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER,
    
    -- Storage reference (if stored in Supabase Storage)
    storage_path TEXT,
    storage_bucket TEXT DEFAULT 'email-attachments',
    
    -- Or base64 content for small attachments
    content_base64 TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for email_attachments
CREATE INDEX IF NOT EXISTS idx_email_attachments_sent_email ON email_attachments(sent_email_id);

-- Enable RLS for email_attachments
ALTER TABLE email_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_attachments (inherit from sent_emails)
CREATE POLICY "Users can view attachments of own sent emails"
    ON email_attachments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sent_emails 
            WHERE sent_emails.id = email_attachments.sent_email_id 
            AND sent_emails.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert attachments for own sent emails"
    ON email_attachments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sent_emails 
            WHERE sent_emails.id = email_attachments.sent_email_id 
            AND sent_emails.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update attachments of own sent emails"
    ON email_attachments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM sent_emails 
            WHERE sent_emails.id = email_attachments.sent_email_id 
            AND sent_emails.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete attachments of own sent emails"
    ON email_attachments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM sent_emails 
            WHERE sent_emails.id = email_attachments.sent_email_id 
            AND sent_emails.user_id = auth.uid()
        )
    );

-- Create email_events table for tracking email events (opens, clicks, etc.)
CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    sent_email_id UUID REFERENCES sent_emails(id) ON DELETE CASCADE NOT NULL,
    
    -- Event details
    event_type TEXT NOT NULL CHECK (
        event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')
    ),
    event_data JSONB DEFAULT '{}',
    
    -- Tracking information
    ip_address INET,
    user_agent TEXT,
    location_data JSONB,
    
    -- Email service provider data
    provider_event_id TEXT,
    provider_timestamp TIMESTAMPTZ
);

-- Create indexes for email_events
CREATE INDEX IF NOT EXISTS idx_email_events_sent_email ON email_events(sent_email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at);

-- Enable RLS for email_events
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_events (inherit from sent_emails)
CREATE POLICY "Users can view events of own sent emails"
    ON email_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sent_emails 
            WHERE sent_emails.id = email_events.sent_email_id 
            AND sent_emails.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert email events"
    ON email_events FOR INSERT
    WITH CHECK (true); -- Allow system/webhooks to insert events

-- Create function to update sent_emails status based on events
CREATE OR REPLACE FUNCTION update_sent_email_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the sent_emails table based on the event type
    CASE NEW.event_type
        WHEN 'sent' THEN
            UPDATE sent_emails 
            SET status = 'sent', sent_at = COALESCE(NEW.provider_timestamp, NEW.created_at)
            WHERE id = NEW.sent_email_id;
        WHEN 'delivered' THEN
            UPDATE sent_emails 
            SET status = 'delivered', delivered_at = COALESCE(NEW.provider_timestamp, NEW.created_at)
            WHERE id = NEW.sent_email_id;
        WHEN 'opened' THEN
            UPDATE sent_emails 
            SET status = 'opened', opened_at = COALESCE(NEW.provider_timestamp, NEW.created_at)
            WHERE id = NEW.sent_email_id AND status != 'clicked'; -- Don't downgrade from clicked
        WHEN 'clicked' THEN
            UPDATE sent_emails 
            SET status = 'clicked', clicked_at = COALESCE(NEW.provider_timestamp, NEW.created_at)
            WHERE id = NEW.sent_email_id;
        WHEN 'bounced' THEN
            UPDATE sent_emails 
            SET status = 'bounced', bounced_at = COALESCE(NEW.provider_timestamp, NEW.created_at)
            WHERE id = NEW.sent_email_id;
        WHEN 'complained' THEN
            UPDATE sent_emails 
            SET status = 'failed', error_message = 'Recipient marked as spam'
            WHERE id = NEW.sent_email_id;
        WHEN 'unsubscribed' THEN
            UPDATE sent_emails 
            SET status = 'unsubscribed'
            WHERE id = NEW.sent_email_id;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update sent_email status
CREATE TRIGGER trigger_update_sent_email_status
    AFTER INSERT ON email_events
    FOR EACH ROW
    EXECUTE FUNCTION update_sent_email_status();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all relevant tables
CREATE TRIGGER trigger_sent_emails_updated_at
    BEFORE UPDATE ON sent_emails
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_email_templates_updated_at
    BEFORE UPDATE ON email_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for email analytics
CREATE OR REPLACE VIEW email_analytics AS
SELECT 
    se.user_id,
    se.document_type,
    DATE(se.created_at) as sent_date,
    COUNT(*) as total_sent,
    COUNT(CASE WHEN se.status = 'delivered' THEN 1 END) as delivered_count,
    COUNT(CASE WHEN se.status = 'opened' THEN 1 END) as opened_count,
    COUNT(CASE WHEN se.status = 'clicked' THEN 1 END) as clicked_count,
    COUNT(CASE WHEN se.status = 'bounced' THEN 1 END) as bounced_count,
    COUNT(CASE WHEN se.status = 'failed' THEN 1 END) as failed_count,
    ROUND(
        COUNT(CASE WHEN se.status IN ('delivered', 'opened', 'clicked') THEN 1 END)::numeric / 
        GREATEST(COUNT(*), 1) * 100, 2
    ) as delivery_rate,
    ROUND(
        COUNT(CASE WHEN se.status IN ('opened', 'clicked') THEN 1 END)::numeric / 
        GREATEST(COUNT(CASE WHEN se.status IN ('delivered', 'opened', 'clicked') THEN 1 END), 1) * 100, 2
    ) as open_rate,
    ROUND(
        COUNT(CASE WHEN se.status = 'clicked' THEN 1 END)::numeric / 
        GREATEST(COUNT(CASE WHEN se.status IN ('opened', 'clicked') THEN 1 END), 1) * 100, 2
    ) as click_rate
FROM sent_emails se
GROUP BY se.user_id, se.document_type, DATE(se.created_at);

-- Grant appropriate permissions
GRANT SELECT ON email_analytics TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE sent_emails IS 'Tracks all emails sent for quotes and invoices with delivery status';
COMMENT ON TABLE email_templates IS 'Stores reusable email templates for different document types';
COMMENT ON TABLE email_attachments IS 'Stores attachments for sent emails';
COMMENT ON TABLE email_events IS 'Tracks email events like opens, clicks, bounces from email service providers';
COMMENT ON VIEW email_analytics IS 'Provides email performance analytics by user and document type';

-- Insert default email templates (these match our current templates)
INSERT INTO email_templates (user_id, name, description, template_type, subject_template, html_template, text_template, is_default, variables)
SELECT 
    auth.uid(),
    'Default Quote Template',
    'Default template for quote emails',
    'quote',
    'Quote {{quote_number}} - {{quote_title}}',
    '<!-- HTML template content would go here -->',
    'Quote #{{quote_number}}\n\nHello {{customer_name}},\n\nThank you for your interest in our services...',
    true,
    '["quote_number", "quote_title", "customer_name", "subtotal", "tax_amount", "total_amount"]'::jsonb
WHERE auth.uid() IS NOT NULL;

INSERT INTO email_templates (user_id, name, description, template_type, subject_template, html_template, text_template, is_default, variables)
SELECT 
    auth.uid(),
    'Default Invoice Template',
    'Default template for invoice emails',
    'invoice',
    'Invoice {{invoice_number}} - Payment Due',
    '<!-- HTML template content would go here -->',
    'Invoice #{{invoice_number}}\n\nHello {{customer_name}},\n\nThank you for your business...',
    true,
    '["invoice_number", "invoice_title", "customer_name", "subtotal", "tax_amount", "total_amount", "due_date"]'::jsonb
WHERE auth.uid() IS NOT NULL;
