// Customer related types for the CRM system

export interface Customer {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  
  // Customer Information
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  
  // Address Information
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  
  // Additional Information
  notes?: string;
}

export interface CustomerInput {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  notes?: string;
}

export interface CustomerUpdate extends Partial<CustomerInput> {
  id: string;
}

export interface CustomerFilters {
  search?: string;
  company?: string;
  state?: string;
  hasPhone?: boolean;
  hasAddress?: boolean;
  sortBy?: 'name' | 'email' | 'company' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CustomerStats {
  total: number;
  withCompany: number;
  withPhone: number;
  withAddress: number;
  recentlyAdded: number; // Added in last 30 days
}

// Form validation schemas
export interface CustomerFormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  notes?: string;
}

// Display helpers
export interface CustomerDisplayData {
  id: string;
  fullName: string;
  displayEmail: string;
  displayPhone: string;
  displayCompany: string;
  displayAddress: string;
  initials: string;
  hasCompleteAddress: boolean;
  jobCount?: number;
  lastJobDate?: string;
  totalRevenue?: number;
}

export type CustomerListView = 'grid' | 'list';
export type CustomerSortField = 'name' | 'email' | 'company' | 'created_at' | 'updated_at';
export type CustomerSortOrder = 'asc' | 'desc';

export interface CustomerListState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  filters: CustomerFilters;
  stats: CustomerStats | null;
  view: CustomerListView;
  selectedCustomers: string[];
}
