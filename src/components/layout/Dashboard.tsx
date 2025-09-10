import { useAuth } from '../../hooks/useAuth';
import { useCustomers } from '../../hooks/useCustomers';
import { useJobs } from '../../hooks/useJobs';
import { useMemo } from 'react';

// Helper functions
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

function getJobActivityTitle(status: string): string {
  switch (status) {
    case 'pending': return 'Job created';
    case 'in_progress': return 'Job started';
    case 'completed': return 'Job completed';
    case 'cancelled': return 'Job cancelled';
    default: return 'Job updated';
  }
}

function getJobStatusIcon(status: string): string {
  switch (status) {
    case 'pending': return '📋';
    case 'in_progress': return '🔨';
    case 'completed': return '✅';
    case 'cancelled': return '❌';
    default: return '📄';
  }
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
}

function StatCard({ title, value, icon, change, changeType = 'neutral' }: StatCardProps) {
  const changeColor = {
    increase: 'text-green-600 dark:text-green-400',
    decrease: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  }[changeType];

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-2xl">{icon}</span>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${changeColor}`}>
                    {change}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecentActivityItem {
  id: string;
  type: 'customer' | 'job' | 'quote' | 'invoice';
  title: string;
  description: string;
  time: string;
  icon: string;
}

function RecentActivity({ customers, jobs }: { customers: any[], jobs: any[] }) {
  // Combine and sort recent items by created_at
  const recentItems = useMemo(() => {
    const items: (RecentActivityItem & { timestamp: Date })[] = [];
    
    // Add recent customers (sorted by most recent)
    [...customers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .forEach(customer => {
        items.push({
          id: `customer-${customer.id}`,
          type: 'customer',
          title: 'New customer added',
          description: `${customer.first_name} ${customer.last_name}`,
          time: formatRelativeTime(customer.created_at),
          icon: '👥',
          timestamp: new Date(customer.created_at)
        });
      });
    
    // Add recent jobs (sorted by most recent updates)
    [...jobs]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3)
      .forEach(job => {
        const customer = customers.find(c => c.id === job.customer_id);
        items.push({
          id: `job-${job.id}`,
          type: 'job',
          title: getJobActivityTitle(job.status),
          description: `${job.title}${customer ? ` for ${customer.first_name} ${customer.last_name}` : ''}`,
          time: formatRelativeTime(job.updated_at),
          icon: getJobStatusIcon(job.status),
          timestamp: new Date(job.updated_at)
        });
      });
    
    // Sort by timestamp and take top 5, then remove timestamp property
    return items
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5)
      .map(({ timestamp, ...item }) => item);
  }, [customers, jobs]);

  // Fallback activities when no data
  const fallbackActivities: RecentActivityItem[] = [
    {
      id: '1',
      type: 'customer',
      title: 'Welcome to SRVC CRM!',
      description: 'Add your first customer to get started.',
      time: 'Get started',
      icon: '👥'
    },
    {
      id: '2',
      type: 'job',
      title: 'Job system ready',
      description: 'Create and track jobs for your customers.',
      time: 'Available now',
      icon: '🔨'
    },
    {
      id: '3',
      type: 'quote',
      title: 'Quote builder available',
      description: 'Generate professional quotes for your services.',
      time: 'Coming soon',
      icon: '📋'
    }
  ];

  const activities = recentItems.length > 0 ? recentItems : fallbackActivities;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
          Recent Activity
        </h3>
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full">
                      <span className="text-lg">{activity.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{activity.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        <time>{activity.time}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    {
      name: 'Add Customer',
      description: 'Create a new customer profile',
      href: '/customers/new',
      icon: '👥',
      color: 'bg-blue-500'
    },
    {
      name: 'Create Job',
      description: 'Start a new job',
      href: '/jobs/new',
      icon: '🔨',
      color: 'bg-green-500'
    },
    {
      name: 'New Quote',
      description: 'Generate a quote',
      href: '/quotes/new',
      icon: '📋',
      color: 'bg-purple-500'
    },
    {
      name: 'Schedule',
      description: 'View calendar',
      href: '/calendar',
      icon: '📅',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="relative group bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm transition-all duration-150"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-white text-lg">{action.icon}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{action.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { customers } = useCustomers();
  const { jobs } = useJobs();
  
  // Calculate real-time statistics
  const stats = useMemo(() => {
    const activeJobs = jobs.filter(job => job.status === 'in_progress').length;
    const pendingJobs = jobs.filter(job => job.status === 'pending').length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const totalJobs = jobs.length;
    
    return [
      {
        title: 'Total Customers',
        value: customers.length,
        icon: '👥',
        change: customers.length === 0 ? 'Start by adding customers' : `${customers.length} customer${customers.length === 1 ? '' : 's'}`,
        changeType: 'neutral' as const
      },
      {
        title: 'Active Jobs',
        value: activeJobs,
        icon: '🔨',
        change: activeJobs === 0 ? (totalJobs === 0 ? 'Create your first job' : 'No active jobs') : `${activeJobs} in progress`,
        changeType: activeJobs > 0 ? 'increase' as const : 'neutral' as const
      },
      {
        title: 'Pending Jobs',
        value: pendingJobs,
        icon: '📋',
        change: pendingJobs === 0 ? 'No pending jobs' : `${pendingJobs} awaiting start`,
        changeType: 'neutral' as const
      },
      {
        title: 'Completed Jobs',
        value: completedJobs,
        icon: '✅',
        change: completedJobs === 0 ? 'No completed jobs yet' : `${completedJobs} finished`,
        changeType: completedJobs > 0 ? 'increase' as const : 'neutral' as const
      }
    ];
  }, [customers, jobs]);

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-5">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Welcome to SRVC CRM!
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Hello {user?.email}, let's get your service business organized.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            changeType={stat.changeType}
          />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <QuickActions />
        <RecentActivity customers={customers} jobs={jobs} />
      </div>

      {/* Jobs Overview Section */}
      {jobs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                Jobs Overview
              </h3>
              <a
                href="/jobs"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                View all jobs →
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {jobs.filter(job => job.status === 'pending').length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {jobs.filter(job => job.status === 'in_progress').length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {jobs.filter(job => job.status === 'completed').length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {jobs.filter(job => job.status === 'cancelled').length}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Cancelled</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Getting started section */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-2xl">🚀</span>
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                Ready to get started?
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                <p>Your CRM is set up and ready to go! Here's what you can do next:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Add your first customer</li>
                  <li>Create a service job</li>
                  <li>Generate a professional quote</li>
                  <li>Set up your calendar</li>
                </ul>
              </div>
              <div className="mt-4">
                <a
                  href="/customers/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors duration-150"
                >
                  Add Your First Customer
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
