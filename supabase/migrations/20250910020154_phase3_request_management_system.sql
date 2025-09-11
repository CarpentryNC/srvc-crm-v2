-- Phase 3: Request Management System Migration
-- Creates tables for service requests, onsite assessments, file uploads, and workflow tracking

-- Service Requests Table
CREATE TABLE requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'received' CHECK (status IN ('received', 'assessed', 'quoted', 'approved', 'converted')),
  requires_assessment boolean DEFAULT false,
  location_notes text,
  preferred_contact_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Onsite Assessments Table
CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date timestamptz,
  completed_date timestamptz,
  findings text,
  recommendations text,
  estimated_duration_hours numeric(5,2),
  estimated_cost numeric(10,2),
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Request Files/Photos Table
CREATE TABLE request_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  description text,
  category text DEFAULT 'reference' CHECK (category IN ('reference', 'assessment', 'before', 'after', 'damage')),
  created_at timestamptz DEFAULT now()
);

-- Workflow Tracking Table
CREATE TABLE workflow_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('request', 'quote', 'job')),
  source_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('quote', 'job', 'invoice')),
  target_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  conversion_notes text,
  created_at timestamptz DEFAULT now()
);

-- Add request reference to existing quotes table
ALTER TABLE quotes ADD COLUMN request_id uuid REFERENCES requests(id) ON DELETE SET NULL;
ALTER TABLE quotes ADD COLUMN assessment_id uuid REFERENCES assessments(id) ON DELETE SET NULL;

-- Add request reference to existing jobs table for direct conversions
ALTER TABLE jobs ADD COLUMN request_id uuid REFERENCES requests(id) ON DELETE SET NULL;

-- Row Level Security Policies
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_conversions ENABLE ROW LEVEL SECURITY;

-- Requests RLS Policies
CREATE POLICY "Users can view own requests" ON requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests" ON requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own requests" ON requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own requests" ON requests
  FOR DELETE USING (auth.uid() = user_id);

-- Assessments RLS Policies
CREATE POLICY "Users can view own assessments" ON assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments" ON assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments" ON assessments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assessments" ON assessments
  FOR DELETE USING (auth.uid() = user_id);

-- Request Files RLS Policies
CREATE POLICY "Users can view own request files" ON request_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own request files" ON request_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own request files" ON request_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own request files" ON request_files
  FOR DELETE USING (auth.uid() = user_id);

-- Workflow Conversions RLS Policies
CREATE POLICY "Users can view own workflow conversions" ON workflow_conversions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workflow conversions" ON workflow_conversions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflow conversions" ON workflow_conversions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflow conversions" ON workflow_conversions
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX requests_customer_id_idx ON requests(customer_id);
CREATE INDEX requests_user_id_idx ON requests(user_id);
CREATE INDEX requests_status_idx ON requests(status);
CREATE INDEX requests_priority_idx ON requests(priority);
CREATE INDEX requests_created_at_idx ON requests(created_at);

CREATE INDEX assessments_request_id_idx ON assessments(request_id);
CREATE INDEX assessments_user_id_idx ON assessments(user_id);
CREATE INDEX assessments_scheduled_date_idx ON assessments(scheduled_date);
CREATE INDEX assessments_status_idx ON assessments(status);

CREATE INDEX request_files_request_id_idx ON request_files(request_id);
CREATE INDEX request_files_assessment_id_idx ON request_files(assessment_id);
CREATE INDEX request_files_user_id_idx ON request_files(user_id);
CREATE INDEX request_files_category_idx ON request_files(category);

CREATE INDEX workflow_conversions_source_idx ON workflow_conversions(source_type, source_id);
CREATE INDEX workflow_conversions_target_idx ON workflow_conversions(target_type, target_id);
CREATE INDEX workflow_conversions_user_id_idx ON workflow_conversions(user_id);

-- Updated at trigger functions for requests and assessments
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
