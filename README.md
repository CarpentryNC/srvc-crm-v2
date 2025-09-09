# NCC CRM v2 - AI-Powered CRM with Stripe Integration

A modern, clean CRM application built with React, TypeScript, Supabase, and Stripe. This is a fresh start with a well-architected codebase designed for scalability and maintainability.

## 🚀 Features

### Core CRM Features
- **Customer Management** - Complete customer profiles and relationship tracking
- **Job Management** - Schedule, track, and manage jobs with real-time status updates
- **Quote System** - Generate professional quotes with line items and pricing
- **Invoice System** - Create invoices from quotes with integrated payment processing
- **Dashboard** - Overview of business metrics and recent activity
- **Calendar/Scheduling** - Appointment and job scheduling system

### Dual Stripe Integration
- **B2B Subscription Management** - Monthly/yearly plans for CRM users
- **B2C Payment Processing** - Customer payments for deposits and invoices
- **Payment Links** - Send payment requests via email/SMS
- **Recurring Billing** - Automated subscription and maintenance billing

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS with custom component classes
- **Database:** Supabase (PostgreSQL with real-time features)
- **Authentication:** Supabase Auth
- **Payments:** Stripe (subscriptions + customer payments)
- **Icons:** Lucide React
- **Build Tool:** Vite with hot reload

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Supabase account** (free tier available)
- **Stripe account** (test mode for development)

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ncc-crm-v2
npm install
```

### 2. Supabase Setup

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be fully provisioned (this can take a few minutes)

#### Get Your Supabase Credentials
1. In your Supabase dashboard, go to **Settings > API**
2. Copy your **Project URL** and **anon public** key

#### Set Up Database Tables
Run these SQL commands in your Supabase SQL editor (Dashboard > SQL Editor):

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create customers table
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  company_name text,
  address_street text,
  address_city text,
  address_state text,
  address_zip text,
  notes text
);

-- Create jobs table
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  scheduled_date timestamptz,
  estimated_hours numeric,
  actual_hours numeric,
  notes text
);

-- Create quotes table
CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  quote_number text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until timestamptz
);

-- Create invoices table
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES quotes(id),
  invoice_number text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date timestamptz,
  paid_date timestamptz,
  stripe_payment_intent_id text
);

-- Create subscription plans table
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  stripe_price_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_amount integer NOT NULL,
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year')),
  features jsonb NOT NULL DEFAULT '[]',
  max_customers integer,
  max_invoices integer,
  is_active boolean NOT NULL DEFAULT true
);

-- Create user subscriptions table
CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  plan_id uuid REFERENCES subscription_plans(id),
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false
);

-- Enable RLS policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can access own customers" ON customers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own quotes" ON quotes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can access own invoices" ON invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read subscription plans" ON subscription_plans FOR SELECT USING (true);
CREATE POLICY "Users can access own subscription" ON user_subscriptions FOR ALL USING (auth.uid() = user_id);
```

### 3. Stripe Setup

#### Create a Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete account verification (for live payments)
3. Access your Stripe Dashboard

#### Get Your Stripe Keys
1. In Stripe Dashboard, go to **Developers > API keys**
2. Copy your **Publishable key** (starts with `pk_test_` for test mode)
3. Copy your **Secret key** (starts with `sk_test_` for test mode) - keep this secure!

### 4. Environment Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and replace the placeholder values:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key-here
```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## 🧪 Testing the Setup

1. **Start the development server**
2. **Open the app** - you should see the setup status indicators
3. **Create an account** using the sign-up form
4. **Explore the dashboard** - you'll see placeholder data and clean UI

### Configuration Status Indicators

The app will show red/green indicators for:
- ✅ **Supabase Configuration** - Database and auth working
- ✅ **Stripe Configuration** - Payment processing ready

If you see red indicators, double-check your environment variables.

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layout/          # Header, Sidebar, etc.
│   └── features/        # Feature-specific components
├── hooks/               # Custom React hooks (useAuth, etc.)
├── lib/                 # Utilities (supabase, stripe clients)
├── types/               # TypeScript type definitions
├── pages/               # Main page components
└── assets/              # Static assets
```

## 🔐 Security Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Environment Variables** - Sensitive keys stored securely
- **Type Safety** - Full TypeScript coverage
- **Authentication** - Secure auth flow with Supabase
- **Input Validation** - Form validation on all inputs

## 💡 Next Steps

Now that you have a clean, working CRM:

1. **Customize the branding** - Update colors, logos, and copy
2. **Add more features** - Implement customer forms, job creation, etc.
3. **Set up webhooks** - For Stripe payment confirmations
4. **Deploy to production** - Use Vercel, Netlify, or your preferred host
5. **Configure email** - Set up transactional emails for quotes/invoices

## 🐛 Troubleshooting

### Common Issues

**"Cannot connect to Supabase"**
- Verify your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` 
- Check that your Supabase project is fully provisioned
- Ensure your `.env` file is in the project root

**"Stripe configuration error"**  
- Verify your `VITE_STRIPE_PUBLISHABLE_KEY` starts with `pk_`
- Make sure you're using the publishable key, not the secret key
- Check that your Stripe account is activated

**"Build errors"**
- Run `npm install` to ensure all dependencies are installed
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

## 📞 Support

This is a clean, modern codebase built with best practices. The architecture is designed to be:

- **Maintainable** - Clear separation of concerns
- **Scalable** - Modular component structure  
- **Type-safe** - Full TypeScript coverage
- **Secure** - Proper authentication and authorization

---

**Happy coding! 🎉**

This CRM gives you a solid foundation to build upon. The codebase is clean, well-organized, and ready for your business logic.
