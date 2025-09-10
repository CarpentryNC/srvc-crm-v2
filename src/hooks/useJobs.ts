import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { 
  Job, 
  JobInput, 
  JobUpdate, 
  JobFilters, 
  JobStats,
  JobWithCustomer,
  CreateJobInput,
  JobStatusUpdate
} from '../types/job';

export function useJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<JobStats | null>(null);

  // Fetch jobs with optional filters and customer information
  const fetchJobs = useCallback(async (filters: JobFilters = {}) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('jobs')
        .select(`
          *,
          customer:customers(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone
          )
        `)
        .eq('user_id', user.id);

      // Apply search filter
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply status filter
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply customer filter
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte('scheduled_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('scheduled_date', filters.dateTo);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
        if (filters.offset) {
          query = query.range(filters.offset, filters.offset + filters.limit - 1);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch job statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: statsError } = await supabase
        .from('jobs')
        .select('id, status, scheduled_date, created_at')
        .eq('user_id', user.id);

      if (statsError) throw statsError;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: JobStats = {
        total: data?.length || 0,
        pending: data?.filter((j: any) => j.status === 'pending').length || 0,
        inProgress: data?.filter((j: any) => j.status === 'in_progress').length || 0,
        completed: data?.filter((j: any) => j.status === 'completed').length || 0,
        cancelled: data?.filter((j: any) => j.status === 'cancelled').length || 0,
        scheduledToday: data?.filter((j: any) => {
          if (!j.scheduled_date) return false;
          const scheduled = new Date(j.scheduled_date);
          return scheduled.toDateString() === today.toDateString();
        }).length || 0,
        overdue: data?.filter((j: any) => {
          if (!j.scheduled_date || j.status === 'completed' || j.status === 'cancelled') return false;
          const scheduled = new Date(j.scheduled_date);
          return scheduled < today;
        }).length || 0,
        thisWeek: data?.filter((j: any) => new Date(j.created_at) >= weekStart).length || 0,
        thisMonth: data?.filter((j: any) => new Date(j.created_at) >= monthStart).length || 0,
      };

      setStats(stats);
    } catch (err) {
      console.error('Error fetching job stats:', err);
    }
  }, [user]);

  // Helper function to create calendar event for job
  const createJobCalendarEvent = useCallback(async (job: Job, customer?: any) => {
    if (!job.scheduled_date) return;

    try {
      // Calculate end time based on estimated hours
      const startDate = new Date(job.scheduled_date);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + (job.estimated_hours || 4));

      // Create calendar event
      const { error: calendarError } = await supabase
        .from('calendar_events')
        .insert({
          user_id: user?.id,
          title: job.title,
          description: `Job: ${job.description || 'Scheduled job work'}`,
          start_datetime: job.scheduled_date,
          end_datetime: endDate.toISOString(),
          event_type: 'job',
          source_type: 'job',
          source_id: job.id,
          customer_id: job.customer_id,
          status: 'scheduled',
          priority: job.priority === 'urgent' ? 'urgent' : 'medium',
          color: '#10B981', // Green for jobs
          reminder_minutes: [15, 60], // 15 min and 1 hour reminders
          notes: `Job ID: ${job.id}${customer ? ` - Customer: ${customer.first_name} ${customer.last_name}` : ''}`
        });

      if (calendarError) {
        console.warn('Failed to create calendar event for job:', calendarError);
      }
    } catch (error) {
      console.warn('Error creating calendar event for job:', error);
    }
  }, [user]);

  // Create new job
  const createJob = useCallback(async (jobData: CreateJobInput): Promise<Job | null> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const insertData: JobInput = {
        ...jobData,
        user_id: user.id,
        status: 'pending',
      };

      const { data, error: createError } = await (supabase as any)
        .from('jobs')
        .insert(insertData)
        .select(`
          *,
          customer:customers(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone
          )
        `)
        .single();

      if (createError) throw createError;

      // Create calendar event if job is scheduled
      if (data.scheduled_date) {
        await createJobCalendarEvent(data, data.customer);
      }

      // Add to local state
      setJobs(prev => [data as JobWithCustomer, ...prev]);
      
      // Refresh stats
      fetchStats();

      return data as Job;
    } catch (err) {
      console.error('Error creating job:', err);
      setError(err instanceof Error ? err.message : 'Failed to create job');
      throw err;
    }
  }, [user, fetchStats, createJobCalendarEvent]);

  // Create job from quote (simple wrapper for clarity)
  const createJobFromQuote = useCallback(async (quoteId: string, jobData: Omit<CreateJobInput, 'quote_id'>): Promise<Job | null> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      // Create the job with quote_id
      const job = await createJob({
        ...jobData,
        quote_id: quoteId
      });

      // TODO: Add workflow tracking once types are updated
      console.log(`Job created from quote ${quoteId}:`, job?.id);

      return job;
    } catch (err) {
      console.error('Error creating job from quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to create job from quote');
      throw err;
    }
  }, [user, createJob]);

  // Update existing job
  const updateJob = useCallback(async (jobUpdate: JobUpdate): Promise<Job | null> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { id, ...updateData } = jobUpdate;

      const { data, error: updateError } = await (supabase as any)
        .from('jobs')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select(`
          *,
          customer:customers(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone
          )
        `)
        .single();

      if (updateError) throw updateError;

      // Create calendar event if job is newly scheduled
      if (updateData.scheduled_date && data.scheduled_date) {
        await createJobCalendarEvent(data, data.customer);
      }

      // Update local state
      setJobs(prev => 
        prev.map(job => 
          job.id === id ? data as JobWithCustomer : job
        )
      );

      // Refresh stats
      fetchStats();

      return data as Job;
    } catch (err) {
      console.error('Error updating job:', err);
      setError(err instanceof Error ? err.message : 'Failed to update job');
      throw err;
    }
  }, [user, fetchStats, createJobCalendarEvent]);

  // Update job status
  const updateJobStatus = useCallback(async (statusUpdate: JobStatusUpdate): Promise<Job | null> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const updateData: Partial<JobInput> = {
        status: statusUpdate.status,
        updated_at: new Date().toISOString(),
      };

      // Add actual hours if provided
      if (statusUpdate.actual_hours !== undefined) {
        updateData.actual_hours = statusUpdate.actual_hours;
      }

      // Append notes if provided
      if (statusUpdate.notes) {
        const { data: currentJob } = await (supabase as any)
          .from('jobs')
          .select('notes')
          .eq('id', statusUpdate.id)
          .eq('user_id', user.id)
          .single();

        const existingNotes = currentJob?.notes || '';
        const timestamp = new Date().toLocaleString();
        updateData.notes = existingNotes 
          ? `${existingNotes}\n\n[${timestamp}] Status changed to ${statusUpdate.status}: ${statusUpdate.notes}`
          : `[${timestamp}] Status changed to ${statusUpdate.status}: ${statusUpdate.notes}`;
      }

      const { data, error: updateError } = await (supabase as any)
        .from('jobs')
        .update(updateData)
        .eq('id', statusUpdate.id)
        .eq('user_id', user.id)
        .select(`
          *,
          customer:customers(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone
          )
        `)
        .single();

      if (updateError) throw updateError;

      // Update local state
      setJobs(prev => 
        prev.map(job => 
          job.id === statusUpdate.id ? data as JobWithCustomer : job
        )
      );

      // Refresh stats
      fetchStats();

      return data as Job;
    } catch (err) {
      console.error('Error updating job status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update job status');
      throw err;
    }
  }, [user, fetchStats]);

  // Delete job
  const deleteJob = useCallback(async (jobId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Remove from local state
      setJobs(prev => prev.filter(job => job.id !== jobId));
      
      // Refresh stats
      fetchStats();
    } catch (err) {
      console.error('Error deleting job:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete job');
      throw err;
    }
  }, [user, fetchStats]);

  // Get single job by ID
  const getJob = useCallback(async (jobId: string): Promise<JobWithCustomer | null> => {
    if (!user) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:customers(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone
          )
        `)
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      
      return data;
    } catch (err) {
      console.error('Error fetching job:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch job');
      return null;
    }
  }, [user]);

  // Get jobs for a specific customer
  const getJobsForCustomer = useCallback(async (customerId: string): Promise<JobWithCustomer[]> => {
    if (!user) return [];

    try {
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:customers(
            id,
            first_name,
            last_name,
            company_name,
            email,
            phone
          )
        `)
        .eq('customer_id', customerId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      return data || [];
    } catch (err) {
      console.error('Error fetching customer jobs:', err);
      return [];
    }
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('jobs')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'jobs',
          filter: `user_id=eq.${user.id}` 
        }, 
        (payload) => {
          console.log('Job change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // For inserts, we need to fetch the full job with customer data
            fetchJobs();
          } else if (payload.eventType === 'UPDATE') {
            // For updates, we need to fetch the full job with customer data
            fetchJobs();
          } else if (payload.eventType === 'DELETE') {
            setJobs(prev => 
              prev.filter(job => job.id !== payload.old.id)
            );
          }
          
          // Refresh stats on any change
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchJobs, fetchStats]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchStats();
    }
  }, [user, fetchJobs, fetchStats]);

  return {
    jobs,
    loading,
    error,
    stats,
    fetchJobs,
    createJob,
    createJobFromQuote,
    updateJob,
    updateJobStatus,
    deleteJob,
    getJob,
    getJobsForCustomer,
    refreshStats: fetchStats,
  };
}
