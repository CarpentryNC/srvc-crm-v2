import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { 
  Customer, 
  CustomerInput, 
  CustomerUpdate, 
  CustomerFilters, 
  CustomerStats 
} from '../types/customer';

export function useCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CustomerStats | null>(null);

  // Fetch customers with optional filters
  const fetchCustomers = useCallback(async (filters: CustomerFilters = {}) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id);

      // Apply search filter
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }

      // Apply company filter
      if (filters.company) {
        query = query.ilike('company_name', `%${filters.company}%`);
      }

      // Apply state filter
      if (filters.state) {
        query = query.eq('address_state', filters.state);
      }

      // Apply phone filter
      if (filters.hasPhone !== undefined) {
        if (filters.hasPhone) {
          query = query.not('phone', 'is', null);
        } else {
          query = query.is('phone', null);
        }
      }

      // Apply address filter
      if (filters.hasAddress !== undefined) {
        if (filters.hasAddress) {
          query = query.not('address_street', 'is', null);
        } else {
          query = query.is('address_street', null);
        }
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      
      if (sortBy === 'name') {
        query = query.order('last_name', { ascending: sortOrder === 'asc' })
                    .order('first_name', { ascending: sortOrder === 'asc' });
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }

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

      setCustomers((data || []) as Customer[]);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch customer statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: statsError } = await supabase
        .from('customers')
        .select('id, company_name, phone, address_street, created_at')
        .eq('user_id', user.id);

      if (statsError) throw statsError;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const stats: CustomerStats = {
        total: data?.length || 0,
        withCompany: data?.filter((c: any) => c.company_name?.trim()).length || 0,
        withPhone: data?.filter((c: any) => c.phone?.trim()).length || 0,
        withAddress: data?.filter((c: any) => c.address_street?.trim()).length || 0,
        recentlyAdded: data?.filter((c: any) => new Date(c.created_at) > thirtyDaysAgo).length || 0,
      };

      setStats(stats);
    } catch (err) {
      console.error('Error fetching customer stats:', err);
    }
  }, [user]);

  // Create new customer
  const createCustomer = useCallback(async (customerData: CustomerInput): Promise<Customer | null> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const insertData = {
        ...customerData,
        user_id: user.id,
      };

      const { data, error: createError } = await (supabase as any)
        .from('customers')
        .insert(insertData)
        .select()
        .single();

      if (createError) throw createError;

      // Add to local state
      setCustomers(prev => [data as Customer, ...prev]);
      
      // Refresh stats
      fetchStats();

      return data as Customer;
    } catch (err) {
      console.error('Error creating customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to create customer');
      throw err;
    }
  }, [user, fetchStats]);

  // Update existing customer
  const updateCustomer = useCallback(async (customerUpdate: CustomerUpdate): Promise<Customer | null> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { id, ...updateData } = customerUpdate;

      const { data, error: updateError } = await (supabase as any)
        .from('customers')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update local state
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? data as Customer : customer
        )
      );

      return data as Customer;
    } catch (err) {
      console.error('Error updating customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to update customer');
      throw err;
    }
  }, [user]);

  // Delete customer
  const deleteCustomer = useCallback(async (customerId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Remove from local state
      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
      
      // Refresh stats
      fetchStats();
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
      throw err;
    }
  }, [user, fetchStats]);

  // Get single customer by ID
  const getCustomer = useCallback(async (customerId: string): Promise<Customer | null> => {
    if (!user) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      
      return data as Customer;
    } catch (err) {
      console.error('Error fetching customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customer');
      return null;
    }
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('customers')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'customers',
          filter: `user_id=eq.${user.id}` 
        }, 
        (payload) => {
          console.log('Customer change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setCustomers(prev => [payload.new as Customer, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCustomers(prev => 
              prev.map(customer => 
                customer.id === payload.new.id ? payload.new as Customer : customer
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setCustomers(prev => 
              prev.filter(customer => customer.id !== payload.old.id)
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
  }, [user, fetchStats]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchCustomers();
      fetchStats();
    }
  }, [user, fetchCustomers, fetchStats]);

  return {
    customers,
    loading,
    error,
    stats,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomer,
    refreshStats: fetchStats,
  };
}
