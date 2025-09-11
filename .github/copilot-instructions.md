# SRVC CRM v2 - AI Coding Assistant Instructions

## Project Architecture

**Modern React TypeScript CRM** with Supabase backend featuring customer management, job tracking, quotes/invoices, and dual Stripe integration.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS + Supabase + Stripe  
**Status:** Phase 2 Complete (Customer Management) → Phase 3 Next (Jobs Management)

## Critical Development Patterns

### Authentication Flow (useAuth Hook Pattern)
```typescript
// All components requiring auth MUST use this pattern
const { user, loading, signIn, signOut } = useAuth();
if (loading) return <LoadingSpinner />;
if (!user) return <LoginForm />;
```

- **Context Provider:** `src/hooks/useAuth.tsx` wraps entire app
- **Protected Routes:** Use `<ProtectedRoute>` wrapper in `AppRouter.tsx`
- **User State:** Always check `loading` before `user` to prevent auth flashes

### Database Hook Architecture (Critical Pattern)
```typescript
// All data hooks follow this exact structure - see useCustomers.ts
export function useCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Real-time subscriptions for live updates
  useEffect(() => {
    if (!user) return;
    const subscription = supabase
      .channel('customers')
      .on('postgres_changes', { ... })
      .subscribe();
    return () => subscription.unsubscribe();
  }, [user]);
}
```

**Key Requirements:**
- Always include `user` dependency checks
- Use Supabase real-time subscriptions for live data
- Follow consistent error handling patterns
- Include RLS-aware queries with `user_id` filters

### Type Safety Architecture
```typescript
// Database types are SOURCE OF TRUTH - never modify manually
// Generate via: supabase gen types typescript --project-id=xxx
export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInput = Database['public']['Tables']['customers']['Insert'];
```

- **Database Types:** `src/types/database.ts` (auto-generated from Supabase)
- **Feature Types:** `src/types/customer.ts`, `src/types/csvImport.ts` (business logic)
- **Always use `optional` for nullable DB fields** (e.g., `email?: string`)

### Component Structure (Critical Organization)
```bash
src/components/
├── layout/              # Layout components (Dashboard, Sidebar, Header)
├── customers/           # Customer feature components
│   ├── CustomerList.tsx       # Main listing with grid/table views
│   ├── CustomerForm.tsx       # Create/edit forms with validation
│   ├── CustomerDetail.tsx     # Detail view with comprehensive info
│   └── CustomerImport.tsx     # Multi-step CSV import workflow
└── ui/                  # Reusable UI components
```

**Component Conventions:**
- Export default component function (not arrow functions)
- Use TypeScript interfaces for all props
- Include loading and error states
- Follow dark mode patterns with `dark:` classes

## Supabase Integration Patterns

### Row Level Security (RLS) - CRITICAL
```sql
-- ALL tables MUST include user_id and RLS policies
CREATE POLICY "Users can access own data" ON customers 
  FOR ALL USING (auth.uid() = user_id);
```

- **Database queries:** Always filter by `user_id = user.id`
- **Migrations:** Use numbered format `YYYYMMDDHHMMSS_description.sql`
- **Edge Functions:** Use service role key to bypass RLS for bulk operations

### Local Database Management (Critical for Development)

**Migration Application (Docker Method - REQUIRED):**
```bash
# Standard migration format
cd "/Users/ncme/VS Code/SRVC Base v 1.5"
docker exec -i supabase_db_SRVC_Base_v_1.5 psql -U postgres -d postgres < supabase/migrations/YYYYMMDDHHMMSS_description.sql

# Examples:
docker exec -i supabase_db_SRVC_Base_v_1.5 psql -U postgres -d postgres < supabase/migrations/20250910220000_create_email_tracking_system.sql
```

**Why Docker Method:**
- `supabase db push` is unreliable in this project environment
- Docker exec provides direct PostgreSQL access
- Ensures migrations are applied correctly to local instance
- Maintains consistency with production deployment patterns

### CSV Import Architecture (Reference Implementation)
```typescript
// Multi-step workflow: upload → mapping → preview → processing → results
// Frontend: CustomerImport.tsx (FormData upload)
// Backend: supabase/functions/import-customers/index.ts (multipart processing)
```

**Key Features:**
- Multipart/form-data file uploads via Edge Functions
- Auto-mapping of common CSV fields
- Real-time validation with detailed error reporting
- Batch processing (500 rows) for performance

## Development Commands

### Essential Development Workflow
```bash
# Local development with hot reload
npm run dev                    # Start Vite dev server (port 5174)

# Supabase local development
supabase start                 # Start local Supabase (API: 54321, Studio: 54323)
supabase status               # Check service status

# Database migration operations (LOCAL ONLY - use Docker method)
# NOTE: supabase db push doesn't work reliably in this project
# Use Docker exec method for local migrations:
docker exec -i supabase_db_SRVC_Base_v_1.5 psql -U postgres -d postgres < supabase/migrations/MIGRATION_FILE.sql

# Edge Functions deployment
supabase functions deploy FUNCTION_NAME  # Deploy specific function
supabase functions deploy send-email     # Deploy email function

# Database operations
supabase db reset             # Reset local DB with migrations (if needed)

# Build and deployment
npm run build                 # TypeScript compilation + Vite build
npm run preview               # Preview production build
```

### Environment Configuration
```bash
# Required environment variables (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Current Implementation Status

### ✅ Completed Features
- **Customer Management:** Full CRUD with search, filtering, grid/table views
- **CSV Import:** Professional multi-step import with Edge Function processing
- **Authentication:** Supabase Auth with protected routes and session management
- **Dashboard:** Responsive layout with stats, navigation, and dark mode
- **Real-time Updates:** Live data synchronization across all components

### � Next Phase (Jobs Management)
- Create `useJobs.ts` hook following `useCustomers.ts` pattern
- Build job CRUD components in `src/components/jobs/`
- Link jobs to customers via `customer_id` foreign key
- Implement job status workflow (pending → in_progress → completed)

## Critical Development Rules

1. **Always use hooks for data:** Never call Supabase directly in components
2. **Type everything:** Use generated database types + feature-specific interfaces
3. **Include loading states:** Every data operation needs loading/error handling
4. **Test auth flows:** Verify protected routes and user state management
5. **Follow RLS patterns:** All database access must be user-scoped
6. **Use real-time subscriptions:** For live data updates across components
7. **Local migration workflow:** Use Docker exec method for applying migrations locally - `supabase db push` is unreliable in this environment

## File Import Reference
- **Edge Function deployment:** `supabase functions deploy import-customers`
- **Multipart processing:** See `getCsvBuffer()` in import-customers/index.ts
- **Frontend upload:** FormData with Bearer token authentication
- **Email optional:** Recent schema change allows null emails in customers table
