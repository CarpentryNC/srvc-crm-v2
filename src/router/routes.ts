export const routes = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  RESET_PASSWORD: '/reset-password',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  CUSTOMERS: '/customers',
  CUSTOMERS_NEW: '/customers/new',
  CUSTOMERS_IMPORT: '/customers/import',
  CUSTOMERS_EDIT: '/customers/:id/edit',
  CUSTOMERS_VIEW: '/customers/:id',
  
  JOBS: '/jobs',
  JOBS_NEW: '/jobs/new',
  JOBS_EDIT: '/jobs/:id/edit',
  JOBS_VIEW: '/jobs/:id',
  
  REQUESTS: '/requests',
  REQUESTS_NEW: '/requests/new',
  REQUESTS_EDIT: '/requests/:id/edit',
  REQUESTS_VIEW: '/requests/:id',
  
  QUOTES: '/quotes',
  QUOTES_NEW: '/quotes/new',
  QUOTES_EDIT: '/quotes/:id/edit',
  QUOTES_VIEW: '/quotes/:id',
  
  INVOICES: '/invoices',
  INVOICES_NEW: '/invoices/new',
  INVOICES_EDIT: '/invoices/:id/edit',
  INVOICES_VIEW: '/invoices/:id',
  
  CALENDAR: '/calendar',
  SETTINGS: '/settings',
} as const;

export type RouteKeys = keyof typeof routes;
export type RoutePaths = typeof routes[RouteKeys];
