import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  UserIcon,
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useJobs } from '../../hooks/useJobs';
import type { JobWithCustomer, JobStatus } from '../../types/job';

export function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getJob, deleteJob, updateJobStatus } = useJobs();
  const [job, setJob] = useState<JobWithCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // Fetch job data
  useEffect(() => {
    const fetchJob = async () => {
      if (!id) {
        setError('Job ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const jobData = await getJob(id);
        if (jobData) {
          setJob(jobData);
        } else {
          setError('Job not found');
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, getJob]);

  // Handle delete job
  const handleDelete = async () => {
    if (!job) return;

    try {
      await deleteJob(job.id);
      navigate('/jobs');
    } catch (err) {
      console.error('Error deleting job:', err);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: JobStatus) => {
    if (!job) return;

    try {
      setStatusUpdateLoading(true);
      const updatedJob = await updateJobStatus({
        id: job.id,
        status: newStatus,
        notes: `Status updated to ${newStatus.replace('_', ' ')}`
      });
      
      if (updatedJob) {
        // Refresh the job data
        const refreshedJob = await getJob(job.id);
        if (refreshedJob) {
          setJob(refreshedJob);
        }
      }
    } catch (err) {
      console.error('Error updating job status:', err);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
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

  const isOverdue = (job: JobWithCustomer) => {
    if (!job.scheduled_date || job.status === 'completed' || job.status === 'cancelled') return false;
    return new Date(job.scheduled_date) < new Date();
  };

  const getCustomerDisplayName = (job: JobWithCustomer) => {
    return `${job.customer.first_name} ${job.customer.last_name}`;
  };

  const getAvailableStatusTransitions = (currentStatus: JobStatus): JobStatus[] => {
    switch (currentStatus) {
      case 'pending':
        return ['in_progress', 'cancelled'];
      case 'in_progress':
        return ['completed', 'cancelled'];
      case 'completed':
        return []; // Completed jobs can't be changed
      case 'cancelled':
        return ['pending']; // Cancelled jobs can be reactivated
      default:
        return [];
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-600">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {error || 'Job not found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The job you're looking for doesn't exist or couldn't be loaded.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/jobs"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {job.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Job Details
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to={`/jobs/${job.id}/edit`}
            className="inline-flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-3 py-2 text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Job Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              Job Information
            </h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status as JobStatus)}`}>
              {getStatusIcon(job.status as JobStatus)}
              <span className="ml-2 capitalize">{job.status.replace('_', ' ')}</span>
            </span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Update Buttons */}
          {getAvailableStatusTransitions(job.status as JobStatus).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Update Status
              </h3>
              <div className="flex flex-wrap gap-2">
                {getAvailableStatusTransitions(job.status as JobStatus).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={statusUpdateLoading}
                    className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {statusUpdateLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                    ) : (
                      getStatusIcon(status)
                    )}
                    <span className="ml-1 capitalize">Mark as {status.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Warning */}
          {isOverdue(job) && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                  This job is overdue
                </span>
              </div>
            </div>
          )}

          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {job.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Description
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {job.description}
                  </p>
                </div>
              )}

              {job.scheduled_date && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Scheduled Date
                  </h3>
                  <div className="flex items-center text-gray-900 dark:text-gray-100">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    <span className={isOverdue(job) ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                      {formatDateTime(job.scheduled_date)}
                    </span>
                  </div>
                </div>
              )}

              {(job.estimated_hours || job.actual_hours) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    Hours
                  </h3>
                  <div className="space-y-1">
                    {job.estimated_hours && (
                      <div className="flex items-center text-gray-900 dark:text-gray-100">
                        <ClockIcon className="h-5 w-5 mr-2" />
                        <span>{job.estimated_hours}h estimated</span>
                      </div>
                    )}
                    {job.actual_hours && (
                      <div className="flex items-center text-gray-900 dark:text-gray-100">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        <span>{job.actual_hours}h actual</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Created
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatDate(job.created_at)}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Last Updated
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatDate(job.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {job.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Notes
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {job.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Customer Information
          </h2>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {getCustomerDisplayName(job)}
                </h3>
                {job.customer.company_name && (
                  <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    {job.customer.company_name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.customer.email && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    <a 
                      href={`mailto:${job.customer.email}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {job.customer.email}
                    </a>
                  </div>
                )}

                {job.customer.phone && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    <a 
                      href={`tel:${job.customer.phone}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {job.customer.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Link
              to={`/customers/${job.customer.id}`}
              className="ml-4 inline-flex items-center px-3 py-2 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              View Customer
            </Link>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Delete Job
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this job? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetail;
