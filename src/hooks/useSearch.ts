import { useState, useEffect, useCallback } from 'react';
import type { SearchResult, RecentActivity } from '../types/search';
import type { Customer } from '../types/customer';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useSearch() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Get recent activity from localStorage and database
  const fetchRecentActivity = useCallback(async () => {
    if (!user) return;

    try {
      // Get from localStorage for immediate display
      const localRecent = localStorage.getItem(`recentActivity_${user.id}`);
      if (localRecent) {
        setRecentActivity(JSON.parse(localRecent));
      }

      // Fetch recent customers, jobs, quotes, invoices
      const recentItems: RecentActivity[] = [];

      // Recent customers (only existing table)
      const { data: customers } = await supabase
        .from('customers')
        .select('id, first_name, last_name, company_name, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5) as { data: Customer[] | null };

      if (customers) {
        customers.forEach((customer: Customer) => {
          recentItems.push({
            id: `customer_${customer.id}`,
            type: 'customer',
            entityId: customer.id,
            entityTitle: `${customer.first_name} ${customer.last_name}${customer.company_name ? ` (${customer.company_name})` : ''}`,
            action: 'viewed',
            timestamp: customer.updated_at,
            url: `/customers/${customer.id}`
          });
        });
      }

      // Note: Jobs, quotes, and invoices will be added in future phases
      // For now, we'll only show customers in recent activity

      // Sort by timestamp and take the most recent 8 items
      const sortedRecent = recentItems
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);

      setRecentActivity(sortedRecent);
      
      // Cache in localStorage
      localStorage.setItem(`recentActivity_${user.id}`, JSON.stringify(sortedRecent));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  }, [user]);

  // Search across all entities
  const performSearch = useCallback(async (term: string) => {
    if (!user || !term.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults: SearchResult[] = [];

            // Search customers only (other entities will be added in future phases)
      const { data: customers } = await supabase
        .from('customers')
        .select('id, first_name, last_name, company_name, email, phone, updated_at')
        .eq('user_id', user.id)
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,company_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
        .limit(10) as { data: Customer[] | null };

      if (customers) {
        customers.forEach((customer: Customer) => {
          const initials = `${customer.first_name?.[0] || ''}${customer.last_name?.[0] || ''}`;
          searchResults.push({
            id: customer.id,
            type: 'customer',
            title: `${customer.first_name} ${customer.last_name}`,
            subtitle: customer.company_name || customer.email,
            url: `/customers/${customer.id}`,
            avatar: initials,
            updatedAt: customer.updated_at
          });
        });
      }

      // Sort by relevance and recency
      searchResults.sort((a, b) => {
        // Prioritize exact matches in title
        const aExact = a.title.toLowerCase().includes(term.toLowerCase());
        const bExact = b.title.toLowerCase().includes(term.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Then by recency
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Error performing search:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, performSearch]);

  // Fetch recent activity on mount
  useEffect(() => {
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  // Track recent activity when items are accessed
  const trackActivity = useCallback((result: SearchResult) => {
    if (!user) return;

    const activity: RecentActivity = {
      id: `${result.type}_${result.id}_${Date.now()}`,
      type: result.type,
      entityId: result.id,
      entityTitle: result.title,
      action: 'viewed',
      timestamp: new Date().toISOString(),
      url: result.url
    };

    const updatedActivity = [activity, ...recentActivity.filter(item => 
      !(item.type === result.type && item.entityId === result.id)
    )].slice(0, 8);

    setRecentActivity(updatedActivity);
    localStorage.setItem(`recentActivity_${user.id}`, JSON.stringify(updatedActivity));
  }, [user, recentActivity]);

  return {
    searchTerm,
    setSearchTerm,
    results,
    recentActivity,
    isLoading,
    isOpen,
    setIsOpen,
    trackActivity,
    refreshRecentActivity: fetchRecentActivity
  };
}
