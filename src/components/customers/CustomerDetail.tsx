import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  MapPinIcon,
  DocumentTextIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BriefcaseIcon,
  ClockIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { useCustomers } from '../../hooks/useCustomers';
import type { Customer } from '../../types/customer';

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer, deleteCustomer } = useCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!id) {
        setError('Customer ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const customerData = await getCustomer(id);
        if (customerData) {
          setCustomer(customerData);
        } else {
          setError('Customer not found');
        }
      } catch (err) {
        console.error('Error fetching customer:', err);
        setError('Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, getCustomer]);

  // Handle delete customer
  const handleDelete = async () => {
    if (!customer) return;

    try {
      await deleteCustomer(customer.id);
      navigate('/customers');
    } catch (err) {
      console.error('Error deleting customer:', err);
      // Error is handled by the hook
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCustomerInitials = (customer: Customer) => {
    return `${customer.first_name[0]}${customer.last_name[0]}`.toUpperCase();
  };

  const getCustomerDisplayName = (customer: Customer) => {
    return `${customer.first_name} ${customer.last_name}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-red-600">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {error || 'Customer not found'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The customer you're looking for might have been deleted or doesn't exist.
        </p>
        <Link
          to="/customers"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/customers"
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Customer Details
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to={`/customers/${customer.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Customer Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                {getCustomerInitials(customer)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {getCustomerDisplayName(customer)}
                </h2>
                {customer.company_name && (
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    {customer.company_name}
                  </p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Customer since {formatDate(customer.created_at)}
                </p>
              </div>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded">
              <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Contact Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <EnvelopeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{customer.email}</p>
              </div>
            </div>

            {/* Phone */}
            {customer.phone && (
              <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <PhoneIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Phone</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{customer.phone}</p>
                </div>
              </div>
            )}

            {/* Company */}
            {customer.company_name && (
              <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Company</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{customer.company_name}</p>
                </div>
              </div>
            )}

            {/* Address */}
            {customer.address_street && (
              <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <MapPinIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Address</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {customer.address_street}
                    {customer.address_city && (
                      <><br />{customer.address_city}, {customer.address_state} {customer.address_zip}</>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <DocumentTextIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notes</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {customer.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Job History Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              Job History
            </h3>
            <Link
              to={`/jobs/new?customer=${customer.id}`}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BriefcaseIcon className="h-4 w-4 mr-1" />
              New Job
            </Link>
          </div>
          
          {/* Placeholder for job history - will be implemented when jobs are ready */}
          <div className="text-center py-8">
            <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No jobs yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Jobs will appear here once the job management system is implemented
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <BriefcaseIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">$0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <ClockIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">-</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Job</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Recent Activity
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Customer created on {formatDate(customer.created_at)}
              </span>
            </div>
            {customer.updated_at !== customer.created_at && (
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Profile updated on {formatDate(customer.updated_at)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Delete Customer
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete {getCustomerDisplayName(customer)}? 
              This action cannot be undone and will also delete all associated jobs, quotes, and invoices.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDetail;
