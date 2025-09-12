-- Fix the create_default_reminders function to resolve PostgreSQL error
-- "set-returning functions are not allowed in WHERE"

CREATE OR REPLACE FUNCTION public.create_default_reminders()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only create reminders for future events
  IF NEW.start_datetime > now() AND array_length(NEW.reminder_minutes, 1) > 0 THEN
    INSERT INTO event_reminders (event_id, user_id, reminder_type, minutes_before, reminder_datetime)
    SELECT
      NEW.id,
      NEW.user_id,
      'in_app',
      minute_val,
      NEW.start_datetime - interval '1 minute' * minute_val
    FROM unnest(NEW.reminder_minutes) AS minute_val
    WHERE NEW.start_datetime - interval '1 minute' * minute_val > now();
  END IF;

  RETURN NEW;
END;
$function$;
