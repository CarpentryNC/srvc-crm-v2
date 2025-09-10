import type { Database } from './database';

// Database types
export type Job = Database['public']['Tables']['jobs']['Row'];
export type JobInput = Database['public']['Tables']['jobs']['Insert'];
export type JobUpdate = Partial<JobInput> & { id: string };

// Job status types
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// Extended job type with customer information
export type JobWithCustomer = Job & {
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    company_name?: string;
    email?: string;
    phone?: string;
  };
};

// Job filters for searching and filtering
export interface JobFilters {
  search?: string;
  status?: JobStatus;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'created_at' | 'updated_at' | 'scheduled_date' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Job statistics
export interface JobStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  scheduledToday: number;
  overdue: number;
  thisWeek: number;
  thisMonth: number;
}

// Job creation input with customer reference
export interface CreateJobInput {
  customer_id: string;
  title: string;
  description?: string;
  scheduled_date?: string;
  estimated_hours?: number;
  notes?: string;
  request_id?: string;
  quote_id?: string;
}

// Job status update input
export interface JobStatusUpdate {
  id: string;
  status: JobStatus;
  actual_hours?: number;
  notes?: string;
}

// Job time tracking
export interface JobTimeEntry {
  start_time: string;
  end_time?: string;
  hours: number;
  description?: string;
}

// Form data for creating/editing jobs
export interface JobFormData {
  customer_id: string;
  title: string;
  description: string;
  scheduled_date: string;
  estimated_hours: number | null;
  notes: string;
}
