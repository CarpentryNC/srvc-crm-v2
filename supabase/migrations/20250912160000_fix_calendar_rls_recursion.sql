-- Fix infinite recursion in calendar_events RLS policies
-- The issue is that calendar_events policy checks event_attendees, 
-- and event_attendees policy checks calendar_events, creating infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can access own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can access event attendees for their events" ON event_attendees;

-- Create fixed calendar_events policy (simplified to avoid recursion)
CREATE POLICY "Users can access own calendar events" ON calendar_events
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to
  );

-- Create fixed event_attendees policy (simplified to avoid recursion)  
CREATE POLICY "Users can access event attendees for their events" ON event_attendees
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM calendar_events ce 
      WHERE ce.id = event_id AND ce.user_id = auth.uid()
    )
  );

-- Add separate policy for attendees to access events they're invited to
CREATE POLICY "Attendees can access events they're invited to" ON calendar_events
  FOR SELECT USING (
    id IN (
      SELECT event_id FROM event_attendees 
      WHERE user_id = auth.uid()
    )
  );

-- Comments for clarity
COMMENT ON POLICY "Users can access own calendar events" ON calendar_events IS 
'Allows users to access events they own or are assigned to (avoiding recursion)';

COMMENT ON POLICY "Attendees can access events they're invited to" ON calendar_events IS 
'Separate policy for attendees to access events without causing recursion';
