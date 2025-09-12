-- Create notifications table for user notifications and reminders
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification content
  type text NOT NULL CHECK (type IN ('invoice_reminder', 'payment_reminder', 'job_completion', 'quote_follow_up', 'system')),
  title text NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  message text NOT NULL CHECK (length(message) >= 1 AND length(message) <= 1000),
  
  -- Action data for interactive notifications
  action_type text CHECK (action_type IN ('create_invoice', 'view_job', 'send_reminder', 'view_quote')),
  action_data jsonb, -- Store related IDs and data for actions
  
  -- Notification properties
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  
  -- Timing
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- Optional expiration date
  
  -- Audit
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, is_dismissed) WHERE is_read = false AND is_dismissed = false;
CREATE INDEX idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Function to clean up expired notifications automatically
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
  UPDATE notifications 
  SET is_dismissed = true 
  WHERE expires_at < now() 
    AND is_dismissed = false;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE notifications IS 'User notifications and reminders for job completion, payment follow-ups, and system alerts';
COMMENT ON COLUMN notifications.type IS 'Type of notification: invoice_reminder, payment_reminder, job_completion, quote_follow_up, system';
COMMENT ON COLUMN notifications.action_type IS 'Action that can be taken from this notification: create_invoice, view_job, send_reminder, view_quote';
COMMENT ON COLUMN notifications.action_data IS 'JSON data containing related IDs (job_id, customer_id, invoice_id, quote_id) for notification actions';
COMMENT ON COLUMN notifications.priority IS 'Notification priority level affecting display and urgency';

-- Sample notification data structure in action_data:
-- For invoice reminders: {"job_id": "uuid", "customer_id": "uuid"}
-- For payment reminders: {"invoice_id": "uuid", "customer_id": "uuid"}
-- For job completion: {"job_id": "uuid", "customer_id": "uuid"}
-- For quote follow-up: {"quote_id": "uuid", "customer_id": "uuid"}
