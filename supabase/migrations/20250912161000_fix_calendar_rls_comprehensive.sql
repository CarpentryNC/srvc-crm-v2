-- Comprehensive fix for calendar_events RLS infinite recursion
-- This completely removes and recreates all problematic policies

-- First, disable RLS temporarily to avoid conflicts during policy changes
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can access own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can access event attendees for their events" ON event_attendees;
DROP POLICY IF EXISTS "Attendees can access events they're invited to" ON calendar_events;

-- Re-enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for calendar_events
CREATE POLICY "calendar_events_owner_access" ON calendar_events
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "calendar_events_assigned_access" ON calendar_events
  FOR ALL USING (auth.uid() = assigned_to);

-- Create simple policy for event_attendees (no reference to calendar_events)
CREATE POLICY "event_attendees_user_access" ON event_attendees
  FOR ALL USING (auth.uid() = user_id);

-- Create a separate, safe policy for attendees to view events (SELECT only)
CREATE POLICY "event_attendees_view_events" ON calendar_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_attendees 
      WHERE event_id = calendar_events.id 
      AND user_id = auth.uid()
    )
  );

-- Comments for documentation
COMMENT ON POLICY "calendar_events_owner_access" ON calendar_events IS 
'Users can access calendar events they own';

COMMENT ON POLICY "calendar_events_assigned_access" ON calendar_events IS 
'Users can access calendar events assigned to them';

COMMENT ON POLICY "event_attendees_user_access" ON event_attendees IS 
'Users can manage their own event attendance records';

COMMENT ON POLICY "event_attendees_view_events" ON calendar_events IS 
'Attendees can view events they are invited to (SELECT only)';
