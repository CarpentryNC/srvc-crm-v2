-- Create storage bucket for request files (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
SELECT 'request-files', 'request-files', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'request-files'
);

-- Create RLS policies for request files bucket (with error handling)
DO $$
BEGIN
  -- Upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can upload their own request files'
  ) THEN
    CREATE POLICY "Users can upload their own request files" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'request-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- View policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can view their own request files'
  ) THEN
    CREATE POLICY "Users can view their own request files" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'request-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can delete their own request files'
  ) THEN
    CREATE POLICY "Users can delete their own request files" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'request-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Users can update their own request files'
  ) THEN
    CREATE POLICY "Users can update their own request files" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'request-files' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;
