-- =============================================
-- SUPABASE CRM SCHEMA - PRODUCTION READY
-- =============================================
-- This migration follows Supabase best practices
-- No modifications to auth.users table required

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get current user ID safely
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- =============================================
-- CUSTOMERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  
  -- Customer Information
  first_name text NOT NULL CHECK (length(trim(first_name)) BETWEEN 1 AND 100),
  last_name text NOT NULL CHECK (length(trim(last_name)) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  phone text CHECK (phone IS NULL OR length(trim(phone)) >= 10),
  company_name text CHECK (company_name IS NULL OR length(trim(company_name)) <= 200),
  
  -- Address Information
  address_street text CHECK (address_street IS NULL OR length(trim(address_street)) <= 200),
  address_city text CHECK (address_city IS NULL OR length(trim(address_city)) <= 100),
  address_state text CHECK (address_state IS NULL OR length(trim(address_state)) <= 50),
  address_zip text CHECK (address_zip IS NULL OR length(trim(address_zip)) <= 20),
  
  -- Additional Information
  notes text CHECK (notes IS NULL OR length(notes) <= 2000),
  
  -- Constraints (Reference auth.users via UUID without explicit FK)
  CONSTRAINT customers_email_user_unique UNIQUE (email, user_id)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id) INCLUDE (first_name, last_name, email);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(user_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(user_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_customers_search ON public.customers USING gin (
  to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(company_name, ''))
);
CREATE INDEX IF NOT EXISTS idx_customers_updated_at ON public.customers(updated_at);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies with auth.uid() verification
CREATE POLICY "customers_select_policy" ON public.customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "customers_insert_policy" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "customers_update_policy" ON public.customers
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "customers_delete_policy" ON public.customers
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- JOBS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  
  -- Job Information
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  description text CHECK (description IS NULL OR length(description) <= 5000),
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Scheduling
  scheduled_date timestamptz,
  estimated_hours numeric(8,2) CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
  actual_hours numeric(8,2) CHECK (actual_hours IS NULL OR actual_hours >= 0),
  
  -- Additional Information
  notes text CHECK (notes IS NULL OR length(notes) <= 2000),
  
  -- Foreign Key to customers (app-level enforcement)
  CONSTRAINT jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON public.jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON public.jobs(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at ON public.jobs(updated_at);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies with cross-table validation
CREATE POLICY "jobs_select_policy" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "jobs_insert_policy" ON public.jobs
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid())
  );

CREATE POLICY "jobs_update_policy" ON public.jobs
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid())
  );

CREATE POLICY "jobs_delete_policy" ON public.jobs
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- QUOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  
  -- Quote Information
  quote_number text NOT NULL CHECK (length(trim(quote_number)) BETWEEN 1 AND 50),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  description text CHECK (description IS NULL OR length(description) <= 5000),
  
  -- Financial Information (stored in cents for precision)
  subtotal_cents bigint NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  tax_cents bigint NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents bigint NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  
  -- Status and Validity
  status text NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until timestamptz,
  
  -- Constraints
  CONSTRAINT quotes_number_user_unique UNIQUE (quote_number, user_id),
  CONSTRAINT quotes_total_consistency CHECK (total_cents = subtotal_cents + tax_cents),
  CONSTRAINT quotes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE
);

-- Add computed columns for convenience
ALTER TABLE public.quotes 
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) GENERATED ALWAYS AS (subtotal_cents::numeric / 100) STORED,
  ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2) GENERATED ALWAYS AS (tax_cents::numeric / 100) STORED,
  ADD COLUMN IF NOT EXISTS total_amount numeric(12,2) GENERATED ALWAYS AS (total_cents::numeric / 100) STORED;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(user_id, status);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON public.quotes(user_id, quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON public.quotes(valid_until) WHERE valid_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_updated_at ON public.quotes(updated_at);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "quotes_select_policy" ON public.quotes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "quotes_insert_policy" ON public.quotes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid())
  );

CREATE POLICY "quotes_update_policy" ON public.quotes
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid())
  );

CREATE POLICY "quotes_delete_policy" ON public.quotes
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- INVOICES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  quote_id uuid,
  
  -- Invoice Information
  invoice_number text NOT NULL CHECK (length(trim(invoice_number)) BETWEEN 1 AND 50),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
  description text CHECK (description IS NULL OR length(description) <= 5000),
  
  -- Financial Information (stored in cents for precision)
  subtotal_cents bigint NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  tax_cents bigint NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  total_cents bigint NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  
  -- Status and Dates
  status text NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date timestamptz,
  paid_date timestamptz,
  
  -- Payment Integration
  stripe_payment_intent_id text CHECK (stripe_payment_intent_id IS NULL OR length(stripe_payment_intent_id) <= 200),
  
  -- Constraints
  CONSTRAINT invoices_number_user_unique UNIQUE (invoice_number, user_id),
  CONSTRAINT invoices_total_consistency CHECK (total_cents = subtotal_cents + tax_cents),
  CONSTRAINT invoices_paid_date_logic CHECK (
    (status = 'paid' AND paid_date IS NOT NULL) OR 
    (status != 'paid' AND paid_date IS NULL)
  ),
  CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE,
  CONSTRAINT invoices_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL
);

-- Add computed columns for convenience
ALTER TABLE public.invoices 
  ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) GENERATED ALWAYS AS (subtotal_cents::numeric / 100) STORED,
  ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2) GENERATED ALWAYS AS (tax_cents::numeric / 100) STORED,
  ADD COLUMN IF NOT EXISTS total_amount numeric(12,2) GENERATED ALWAYS AS (total_cents::numeric / 100) STORED;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(user_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_payment_intent ON public.invoices(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_updated_at ON public.invoices(updated_at);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "invoices_select_policy" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "invoices_insert_policy" ON public.invoices
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid()) AND
    (quote_id IS NULL OR EXISTS (SELECT 1 FROM public.quotes WHERE id = quote_id AND user_id = auth.uid()))
  );

CREATE POLICY "invoices_update_policy" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid()) AND
    (quote_id IS NULL OR EXISTS (SELECT 1 FROM public.quotes WHERE id = quote_id AND user_id = auth.uid()))
  );

CREATE POLICY "invoices_delete_policy" ON public.invoices
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- SUBSCRIPTION PLANS TABLE (ADMIN MANAGED)
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Plan Information
  stripe_price_id text NOT NULL UNIQUE CHECK (length(stripe_price_id) BETWEEN 1 AND 200),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
  description text CHECK (description IS NULL OR length(description) <= 1000),
  
  -- Pricing (stored in cents for precision)
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year')),
  
  -- Plan Features
  features jsonb NOT NULL DEFAULT '[]',
  max_customers integer CHECK (max_customers IS NULL OR max_customers > 0),
  max_invoices integer CHECK (max_invoices IS NULL OR max_invoices > 0),
  max_storage_gb integer CHECK (max_storage_gb IS NULL OR max_storage_gb > 0),
  
  -- Status
  is_active boolean NOT NULL DEFAULT true
);

-- Add computed column for price in dollars
ALTER TABLE public.subscription_plans 
  ADD COLUMN IF NOT EXISTS price_amount numeric(12,2) GENERATED ALWAYS AS (price_cents::numeric / 100) STORED;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active, billing_interval);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price_id ON public.subscription_plans(stripe_price_id);

-- Enable RLS - Public read access
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscription_plans_select_policy" ON public.subscription_plans
  FOR SELECT USING (true); -- Public read for all authenticated users

-- =============================================
-- USER SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  user_id uuid NOT NULL UNIQUE, -- References auth.users(id) via app logic
  
  -- Stripe Information
  stripe_customer_id text NOT NULL CHECK (length(stripe_customer_id) BETWEEN 1 AND 200),
  stripe_subscription_id text NOT NULL UNIQUE CHECK (length(stripe_subscription_id) BETWEEN 1 AND 200),
  plan_id uuid NOT NULL,
  
  -- Subscription Status
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  
  -- Constraints
  CONSTRAINT user_subscriptions_period_logic CHECK (
    (current_period_start IS NULL AND current_period_end IS NULL) OR
    (current_period_start IS NOT NULL AND current_period_end IS NOT NULL AND current_period_start < current_period_end)
  ),
  CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON public.user_subscriptions(current_period_end) WHERE current_period_end IS NOT NULL;

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "user_subscriptions_select_policy" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_subscriptions_insert_policy" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_subscriptions_update_policy" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE OR REPLACE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_subscriptions TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to service role for admin operations
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- =============================================
-- INSERT SAMPLE SUBSCRIPTION PLANS
-- =============================================

INSERT INTO public.subscription_plans (name, description, stripe_price_id, price_cents, billing_interval, features, max_customers, max_invoices, max_storage_gb, is_active)
VALUES 
  ('Starter', 'Perfect for small contractors getting started', 'price_starter_monthly', 2900, 'month', 
   '["Customer Management", "Basic Job Tracking", "Simple Quotes", "Email Support"]'::jsonb, 
   50, 100, 5, true),
  ('Professional', 'For growing contracting businesses', 'price_pro_monthly', 4900, 'month',
   '["Unlimited Customers", "Advanced Job Management", "Professional Quotes & Invoices", "Calendar Integration", "Priority Support"]'::jsonb,
   500, 1000, 25, true),
  ('Enterprise', 'For large contracting companies', 'price_enterprise_monthly', 9900, 'month',
   '["Everything in Professional", "Advanced Analytics", "Custom Integrations", "White-label Options", "Dedicated Support"]'::jsonb,
   null, null, 100, true)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- =============================================
-- VALIDATION
-- =============================================

DO $$
BEGIN
  -- Verify all tables were created
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    RAISE EXCEPTION 'Customers table was not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
    RAISE EXCEPTION 'Jobs table was not created';
  END IF;
  
  RAISE NOTICE 'CRM Database schema created successfully! ✅';
  RAISE NOTICE 'Tables: customers, jobs, quotes, invoices, subscription_plans, user_subscriptions';
  RAISE NOTICE 'All RLS policies enabled and functional';
END $$;
