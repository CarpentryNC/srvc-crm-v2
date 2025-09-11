import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  BriefcaseIcon,
  MagnifyingGlassIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useJobs } from '../../hooks/useJobs';
import type { JobWithCustomer, JobStatus } from '../../types/job';

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const getStatusColor = (status: JobStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getStatusIcon = (status: JobStatus) => {
  switch (status) {
    case 'pending':
      return <ClockIcon className="h-4 w-4" />;
    case 'in_progress':
      return <PlayCircleIcon className="h-4 w-4" />;
    case 'completed':
      return <CheckCircleIcon className="h-4 w-4" />;
    case 'cancelled':
      return <XCircleIcon className="h-4 w-4" />;
    default:
      return <ClockIcon className="h-4 w-4" />;
  }
};

const getCustomerDisplayName = (job: JobWithCustomer) => {
  return `${job.customer.first_name} ${job.customer.last_name}`;
};

const isOverdue = (job: JobWithCustomer) => {
  if (!job.scheduled_date || job.status === 'completed' || job.status === 'cancelled') return false;
  return new Date(job.scheduled_date) < new Date();
};

interface JobListProps {
  onJobClick?: (job: JobWithCustomer) => void;
}

type ViewType = 'grid' | 'table';
type SortField = 'created_at' | 'updated_at' | 'scheduled_date' | 'title' | 'status';
type SortOrder = 'asc' | 'desc';

export function JobList({ onJobClick }: JobListProps) {
  const { jobs, loading, error, stats } = useJobs();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<ViewType>('grid');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = jobs.filter(job => 
        job.title.toLowerCase().includes(search) ||
        job.description?.toLowerCase().includes(search) ||
        getCustomerDisplayName(job).toLowerCase().includes(search) ||
        job.customer.company_name?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'scheduled_date':
          aValue = a.scheduled_date ? new Date(a.scheduled_date) : new Date(0);
          bValue = b.scheduled_date ? new Date(b.scheduled_date) : new Date(0);
          break;
        case 'created_at':
        case 'updated_at':
          aValue = new Date(a[sortField]);
          bValue = new Date(b[sortField]);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [jobs, searchTerm, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleJobClick = (job: JobWithCustomer) => {
    if (onJobClick) {
      onJobClick(job);
    } else {
      navigate(`/jobs/${job.id}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-red-600">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Error Loading Jobs
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Jobs
          </h1>
          {stats && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {stats.total} total • {stats.pending} pending • {stats.inProgress} in progress • {stats.completed} completed
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Link
            to="/jobs/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Job
          </Link>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'all')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded ${view === 'grid' 
              ? 'bg-white dark:bg-gray-700 shadow-sm' 
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Squares2X2Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-2 rounded ${view === 'table' 
              ? 'bg-white dark:bg-gray-700 shadow-sm' 
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <ViewColumnsIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Jobs Display */}
      {filteredAndSortedJobs.length === 0 ? (
        <div className="text-center py-12">
          <BriefcaseIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No jobs found' : 'No jobs yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'Get started by creating your first job.'
            }
          </p>
          {(!searchTerm && statusFilter === 'all') && (
            <Link
              to="/jobs/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Job
            </Link>
          )}
        </div>
      ) : view === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => handleJobClick(job)}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow ${
                isOverdue(job) ? 'border-l-4 border-l-red-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {getCustomerDisplayName(job)}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status as JobStatus)}`}>
                  {getStatusIcon(job.status as JobStatus)}
                  <span className="ml-1 capitalize">{job.status.replace('_', ' ')}</span>
                </span>
              </div>

              {job.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {job.description}
                </p>
              )}

              <div className="space-y-2">
                {job.scheduled_date && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span className={isOverdue(job) ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                      {formatDateTime(job.scheduled_date)}
                      {isOverdue(job) && ' (Overdue)'}
                    </span>
                  </div>
                )}
                
                {job.estimated_hours && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>{job.estimated_hours}h estimated</span>
                    {job.actual_hours && (
                      <span className="ml-2">• {job.actual_hours}h actual</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th 
                    onClick={() => handleSort('title')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Job Title
                    {sortField === 'title' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Status
                    {sortField === 'status' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    onClick={() => handleSort('scheduled_date')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Scheduled
                    {sortField === 'scheduled_date' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Hours
                  </th>
                  <th 
                    onClick={() => handleSort('created_at')}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Created
                    {sortField === 'created_at' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedJobs.map((job) => (
                  <tr 
                    key={job.id}
                    onClick={() => handleJobClick(job)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      isOverdue(job) ? 'bg-red-50 dark:bg-red-900/20' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {job.title}
                        </div>
                        {job.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {job.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getCustomerDisplayName(job)}
                      </div>
                      {job.customer.company_name && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {job.customer.company_name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status as JobStatus)}`}>
                        {getStatusIcon(job.status as JobStatus)}
                        <span className="ml-1 capitalize">{job.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {job.scheduled_date ? (
                        <div className={`text-sm ${isOverdue(job) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-gray-100'}`}>
                          {formatDateTime(job.scheduled_date)}
                          {isOverdue(job) && (
                            <div className="text-xs text-red-600 dark:text-red-400">Overdue</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Not scheduled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {job.estimated_hours && (
                        <div>{job.estimated_hours}h est.</div>
                      )}
                      {job.actual_hours && (
                        <div className="text-gray-500 dark:text-gray-400">{job.actual_hours}h actual</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(job.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobList;
