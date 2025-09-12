-- =============================================
-- Master Calendar System Schema
-- Creates unified calendar infrastructure for all events
-- =============================================

-- Calendar Events Table - Universal event storage
CREATE TABLE calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Event Details
  title text NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
  description text CHECK (length(description) <= 2000),
  location text CHECK (length(location) <= 500),
  
  -- Event Type and Source
  event_type text NOT NULL CHECK (event_type IN ('job', 'assessment', 'meeting', 'reminder', 'follow_up', 'quote_expiry', 'custom')),
  source_type text CHECK (source_type IN ('job', 'assessment', 'quote', 'request', 'manual')),
  source_id uuid, -- References jobs.id, assessments.id, quotes.id, requests.id
  
  -- Date & Time
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz,
  all_day boolean DEFAULT false,
  timezone text DEFAULT 'America/New_York',
  
  -- Recurring Events
  is_recurring boolean DEFAULT false,
  recurrence_pattern text CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')),
  recurrence_end_date timestamptz,
  recurrence_data jsonb, -- Store complex recurrence rules
  
  -- Status and Priority
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Reminders and Notifications
  reminder_minutes integer[] DEFAULT '{15, 60}', -- Minutes before event to remind
  notification_sent boolean DEFAULT false,
  
  -- Customer and Assignment
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  color text DEFAULT '#3B82F6' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'), -- Hex color code
  is_private boolean DEFAULT false,
  notes text,
  
  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT valid_datetime_range CHECK (
    end_datetime IS NULL OR end_datetime > start_datetime
  ),
  CONSTRAINT valid_recurrence CHECK (
    NOT is_recurring OR (is_recurring AND recurrence_pattern IS NOT NULL)
  ),
  CONSTRAINT valid_source_reference CHECK (
    source_type IS NULL OR source_id IS NOT NULL
  )
);

-- Event Reminders Table - Track individual reminders
CREATE TABLE event_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  reminder_type text NOT NULL CHECK (reminder_type IN ('email', 'push', 'sms', 'in_app')),
  minutes_before integer NOT NULL CHECK (minutes_before >= 0),
  reminder_datetime timestamptz NOT NULL,
  
  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at timestamptz,
  error_message text,
  
  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Calendar Event Attendees Table - Multi-user events
CREATE TABLE event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  
  -- Contact Info (for non-system users)
  email text,
  name text,
  phone text,
  
  -- Attendance Status
  status text DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'tentative', 'no_response')),
  response_datetime timestamptz,
  notes text,
  
  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT attendee_reference CHECK (
    user_id IS NOT NULL OR customer_id IS NOT NULL OR email IS NOT NULL
  )
);

-- Calendar Event Files Table - Attachments and photos
CREATE TABLE event_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  mime_type text,
  
  -- File Category
  category text DEFAULT 'attachment' CHECK (category IN ('attachment', 'photo', 'document', 'reference')),
  description text,
  
  -- Audit
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- Indexes for Performance
-- =============================================

-- Primary indexes for queries
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_datetime ON calendar_events(start_datetime);
CREATE INDEX idx_calendar_events_customer_id ON calendar_events(customer_id);
CREATE INDEX idx_calendar_events_assigned_to ON calendar_events(assigned_to);
CREATE INDEX idx_calendar_events_source ON calendar_events(source_type, source_id);
CREATE INDEX idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_events_status ON calendar_events(status);

-- Date range queries (most common calendar operation)
CREATE INDEX idx_calendar_events_date_range ON calendar_events(user_id, start_datetime, end_datetime);
-- Note: Using direct date columns instead of date_trunc for compatibility
CREATE INDEX idx_calendar_events_user_start ON calendar_events(user_id, start_datetime);
CREATE INDEX idx_calendar_events_user_end ON calendar_events(user_id, end_datetime);

-- Recurring events
CREATE INDEX idx_calendar_events_recurring ON calendar_events(is_recurring, recurrence_pattern) WHERE is_recurring = true;

-- Reminders
CREATE INDEX idx_event_reminders_datetime ON event_reminders(reminder_datetime, status) WHERE status = 'pending';
CREATE INDEX idx_event_reminders_event_user ON event_reminders(event_id, user_id);

-- Attendees
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);
CREATE INDEX idx_event_attendees_customer ON event_attendees(customer_id);

-- Files
CREATE INDEX idx_event_files_event ON event_files(event_id);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_files ENABLE ROW LEVEL SECURITY;

-- Calendar Events RLS Policies
CREATE POLICY "Users can access own calendar events" ON calendar_events
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR
    EXISTS (
      SELECT 1 FROM event_attendees ea 
      WHERE ea.event_id = id AND ea.user_id = auth.uid()
    )
  );

-- Event Reminders RLS Policies
CREATE POLICY "Users can access own event reminders" ON event_reminders
  FOR ALL USING (auth.uid() = user_id);

-- Event Attendees RLS Policies
CREATE POLICY "Users can access event attendees for their events" ON event_attendees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM calendar_events ce 
      WHERE ce.id = event_id AND (
        ce.user_id = auth.uid() OR 
        ce.assigned_to = auth.uid()
      )
    ) OR
    auth.uid() = user_id
  );

-- Event Files RLS Policies
CREATE POLICY "Users can access files for their events" ON event_files
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM calendar_events ce 
      WHERE ce.id = event_id AND (
        ce.user_id = auth.uid() OR 
        ce.assigned_to = auth.uid()
      )
    )
  );

-- =============================================
-- Triggers for Audit and Automation
-- =============================================

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_updated_at();

-- Auto-create reminders when event is created
CREATE OR REPLACE FUNCTION create_default_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create reminders for future events
  IF NEW.start_datetime > now() AND array_length(NEW.reminder_minutes, 1) > 0 THEN
    INSERT INTO event_reminders (event_id, user_id, reminder_type, minutes_before, reminder_datetime)
    SELECT 
      NEW.id,
      NEW.user_id,
      'in_app',
      unnest(NEW.reminder_minutes),
      NEW.start_datetime - interval '1 minute' * unnest(NEW.reminder_minutes)
    WHERE NEW.start_datetime - interval '1 minute' * unnest(NEW.reminder_minutes) > now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_events_create_reminders
  AFTER INSERT ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION create_default_reminders();

-- =============================================
-- Helper Functions
-- =============================================

-- Function to get events for a date range
CREATE OR REPLACE FUNCTION get_calendar_events(
  p_user_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_event_types text[] DEFAULT NULL,
  p_include_recurring boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  start_datetime timestamptz,
  end_datetime timestamptz,
  event_type text,
  status text,
  priority text,
  color text,
  customer_name text,
  source_info jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id,
    ce.title,
    ce.description,
    ce.start_datetime,
    ce.end_datetime,
    ce.event_type,
    ce.status,
    ce.priority,
    ce.color,
    c.name as customer_name,
    jsonb_build_object(
      'source_type', ce.source_type,
      'source_id', ce.source_id,
      'location', ce.location,
      'all_day', ce.all_day,
      'is_recurring', ce.is_recurring
    ) as source_info
  FROM calendar_events ce
  LEFT JOIN customers c ON ce.customer_id = c.id
  WHERE 
    (ce.user_id = p_user_id OR ce.assigned_to = p_user_id)
    AND ce.start_datetime >= p_start_date 
    AND ce.start_datetime <= p_end_date
    AND (p_event_types IS NULL OR ce.event_type = ANY(p_event_types))
    AND ce.status != 'cancelled'
  ORDER BY ce.start_datetime ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to create job-related calendar event
CREATE OR REPLACE FUNCTION create_job_calendar_event(
  p_job_id uuid,
  p_title text,
  p_scheduled_date timestamptz,
  p_estimated_hours numeric DEFAULT 4,
  p_customer_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_event_id uuid;
  v_user_id uuid;
  v_end_datetime timestamptz;
BEGIN
  -- Get job owner
  SELECT user_id INTO v_user_id FROM jobs WHERE id = p_job_id;
  
  -- Calculate end time based on estimated hours
  v_end_datetime := p_scheduled_date + interval '1 hour' * p_estimated_hours;
  
  -- Create calendar event
  INSERT INTO calendar_events (
    user_id,
    title,
    description,
    start_datetime,
    end_datetime,
    event_type,
    source_type,
    source_id,
    customer_id,
    status,
    priority,
    color
  ) VALUES (
    v_user_id,
    p_title,
    'Scheduled job work',
    p_scheduled_date,
    v_end_datetime,
    'job',
    'job',
    p_job_id,
    p_customer_id,
    'scheduled',
    'medium',
    '#10B981'
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Sample Data and Comments
-- =============================================

-- Add helpful comments
COMMENT ON TABLE calendar_events IS 'Master calendar table storing all events, appointments, reminders, and scheduled items across the CRM system';
COMMENT ON COLUMN calendar_events.event_type IS 'Type of event: job (scheduled work), assessment (onsite evaluation), meeting (general meetings), reminder (follow-ups), quote_expiry (quote deadlines), custom (user-defined)';
COMMENT ON COLUMN calendar_events.source_type IS 'Source system that created this event (job, assessment, quote, request, manual)';
COMMENT ON COLUMN calendar_events.recurrence_data IS 'JSON data for complex recurring patterns, e.g., {"days": ["monday", "wednesday"], "interval": 2}';
COMMENT ON COLUMN calendar_events.reminder_minutes IS 'Array of minutes before event to send reminders, e.g., {15, 60, 1440} for 15min, 1hr, 1day';

COMMENT ON TABLE event_reminders IS 'Individual reminder instances generated from calendar_events.reminder_minutes';
COMMENT ON TABLE event_attendees IS 'Event participants including users, customers, and external contacts';
COMMENT ON TABLE event_files IS 'Files and photos associated with calendar events (contracts, photos, references)';

-- Add example of how to use the system
COMMENT ON FUNCTION get_calendar_events IS 'Retrieve calendar events for a user within a date range. Example: SELECT * FROM get_calendar_events(auth.uid(), ''2024-01-01'', ''2024-01-31'', ARRAY[''job'', ''assessment''])';
COMMENT ON FUNCTION create_job_calendar_event IS 'Automatically create a calendar event when a job is scheduled. Called from job creation/update triggers.';