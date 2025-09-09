import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  BriefcaseIcon,
  UserIcon, 
  CalendarIcon,
  DocumentTextIcon,
  XMarkIcon,
  CheckIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useJobs } from '../../hooks/useJobs';
import { useCustomers } from '../../hooks/useCustomers';
import type { CreateJobInput, JobFormData, JobWithCustomer } from '../../types/job';
import type { Customer } from '../../types/customer';

interface JobFormProps {
  job?: JobWithCustomer; // For editing existing jobs
  initialCustomerId?: string; // For pre-selecting customer
  onSuccess?: (job: JobWithCustomer) => void;
  onCancel?: () => void;
}

interface JobFormErrors {
  customer_id?: string;
  title?: string;
  description?: string;
  scheduled_date?: string;
  estimated_hours?: string;
  notes?: string;
}

export function JobForm({ job, initialCustomerId, onSuccess, onCancel }: JobFormProps) {
  const navigate = useNavigate();
  const params = useParams();
  const { createJob, updateJob, getJob } = useJobs();
  const { customers, fetchCustomers } = useCustomers();
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [currentJob, setCurrentJob] = useState<JobWithCustomer | undefined>(job);
  const [errors, setErrors] = useState<JobFormErrors>({});
  
  // Smart search state
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<JobFormData>({
    customer_id: job?.customer_id || initialCustomerId || '',
    title: job?.title || '',
    description: job?.description || '',
    scheduled_date: job?.scheduled_date ? new Date(job.scheduled_date).toISOString().slice(0, 16) : '',
    estimated_hours: job?.estimated_hours || null,
    notes: job?.notes || '',
  });

  const isEditing = !!currentJob || !!params.id;

  // Get customer display name - defined early to be used in effects
  const getCustomerDisplayName = (customer: Customer) => {
    const name = `${customer.first_name} ${customer.last_name}`;
    return customer.company_name ? `${name} (${customer.company_name})` : name;
  };

  // Load job for editing from URL parameter
  useEffect(() => {
    if (params.id && !job) {
      setLoadingJob(true);
      getJob(params.id)
        .then((fetchedJob) => {
          if (fetchedJob) {
            setCurrentJob(fetchedJob);
            setFormData({
              customer_id: fetchedJob.customer_id,
              title: fetchedJob.title,
              description: fetchedJob.description || '',
              scheduled_date: fetchedJob.scheduled_date ? new Date(fetchedJob.scheduled_date).toISOString().slice(0, 16) : '',
              estimated_hours: fetchedJob.estimated_hours || null,
              notes: fetchedJob.notes || '',
            });
          }
        })
        .catch((error) => {
          console.error('Error loading job:', error);
          navigate('/jobs');
        })
        .finally(() => setLoadingJob(false));
    }
  }, [params.id, job, getJob, navigate]);

  // Load customers on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Initialize selected customer when editing or pre-selecting
  useEffect(() => {
    const customerId = currentJob?.customer_id || initialCustomerId || formData.customer_id;
    if (customerId && customers.length > 0) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setCustomerSearch(getCustomerDisplayName(customer));
      }
    }
  }, [currentJob, initialCustomerId, formData.customer_id, customers]);

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => {
    if (!customerSearch.trim()) return true;
    const searchLower = customerSearch.toLowerCase();
    const customerName = getCustomerDisplayName(customer).toLowerCase();
    const company = customer.company_name?.toLowerCase() || '';
    const email = customer.email?.toLowerCase() || '';
    const phone = customer.phone?.toLowerCase() || '';
    
    return customerName.includes(searchLower) || 
           company.includes(searchLower) || 
           email.includes(searchLower) || 
           phone.includes(searchLower);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(getCustomerDisplayName(customer));
    setFormData(prev => ({ ...prev, customer_id: customer.id }));
    setIsCustomerDropdownOpen(false);
    setHighlightedIndex(-1);
    setErrors(prev => ({ ...prev, customer_id: undefined }));
  };

  // Handle customer search input
  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    setIsCustomerDropdownOpen(true);
    setHighlightedIndex(-1);
    
    // Clear selection if search doesn't match current customer
    if (selectedCustomer && !getCustomerDisplayName(selectedCustomer).toLowerCase().includes(value.toLowerCase())) {
      setSelectedCustomer(null);
      setFormData(prev => ({ ...prev, customer_id: '' }));
    }
  };

  // Handle keyboard navigation
  const handleCustomerKeyDown = (e: React.KeyboardEvent) => {
    if (!isCustomerDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsCustomerDropdownOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredCustomers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCustomers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredCustomers[highlightedIndex]) {
          handleCustomerSelect(filteredCustomers[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsCustomerDropdownOpen(false);
        setHighlightedIndex(-1);
        customerInputRef.current?.blur();
        break;
    }
  };

  // Clear customer selection
  const clearCustomerSelection = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setFormData(prev => ({ ...prev, customer_id: '' }));
    setIsCustomerDropdownOpen(false);
    customerInputRef.current?.focus();
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: JobFormErrors = {};

    // Required fields
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Job title must be 200 characters or less';
    }

    // Optional field validations
    if (formData.description && formData.description.length > 5000) {
      newErrors.description = 'Description must be 5000 characters or less';
    }

    if (formData.estimated_hours && (formData.estimated_hours < 0 || formData.estimated_hours > 9999)) {
      newErrors.estimated_hours = 'Estimated hours must be between 0 and 9999';
    }

    if (formData.notes && formData.notes.length > 2000) {
      newErrors.notes = 'Notes must be 2000 characters or less';
    }

    // Date validation
    if (formData.scheduled_date) {
      const scheduledDate = new Date(formData.scheduled_date);
      const now = new Date();
      if (scheduledDate < now && !isEditing) {
        newErrors.scheduled_date = 'Scheduled date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      let result: any;

      const jobData: CreateJobInput = {
        customer_id: formData.customer_id,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        scheduled_date: formData.scheduled_date || undefined,
        estimated_hours: formData.estimated_hours || undefined,
        notes: formData.notes?.trim() || undefined,
      };

      if (isEditing && (currentJob || job)) {
        const jobToUpdate = currentJob || job!;
        result = await updateJob({
          id: jobToUpdate.id,
          ...jobData,
        });
      } else {
        result = await createJob(jobData);
      }

      if (result) {
        if (onSuccess) {
          // For success callback, we need the full job with customer data
          // The hook should return the complete job data
          onSuccess(result as JobWithCustomer);
        } else {
          navigate('/jobs');
        }
      }
    } catch (err) {
      console.error('Error saving job:', err);
      // Error is handled by the hook
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof JobFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof JobFormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/jobs');
    }
  };

  // Show loading state when fetching job for editing
  if (loadingJob) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit Job' : 'Create New Job'}
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Selection */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Customer
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer *
              </label>
              <div className="relative" ref={customerDropdownRef}>
                <div className="relative">
                  <input
                    ref={customerInputRef}
                    type="text"
                    value={customerSearch}
                    onChange={(e) => handleCustomerSearchChange(e.target.value)}
                    onKeyDown={handleCustomerKeyDown}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    placeholder={isEditing ? (selectedCustomer ? getCustomerDisplayName(selectedCustomer) : "Customer cannot be changed") : "Type to search customers..."}
                    disabled={isEditing}
                    className={`w-full px-3 py-2 pl-10 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.customer_id ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                    } ${isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {!isEditing && (
                    <>
                      {selectedCustomer && (
                        <button
                          type="button"
                          onClick={clearCustomerSelection}
                          className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                      <ChevronDownIcon 
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${
                          isCustomerDropdownOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </>
                  )}
                </div>

                {/* Dropdown */}
                {isCustomerDropdownOpen && !isEditing && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.length > 0 ? (
                      <>
                        {filteredCustomers.map((customer, index) => (
                          <div
                            key={customer.id}
                            onClick={() => handleCustomerSelect(customer)}
                            className={`px-4 py-3 cursor-pointer transition-colors ${
                              index === highlightedIndex
                                ? 'bg-blue-50 dark:bg-blue-900/50'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            } ${index === 0 ? 'rounded-t-lg' : ''} ${
                              index === filteredCustomers.length - 1 ? 'rounded-b-lg' : 'border-b border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                  {customer.first_name} {customer.last_name}
                                </div>
                                {customer.company_name && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {customer.company_name}
                                  </div>
                                )}
                                <div className="text-sm text-gray-500 dark:text-gray-500">
                                  {customer.email} {customer.phone && `• ${customer.phone}`}
                                </div>
                              </div>
                              {selectedCustomer?.id === customer.id && (
                                <CheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                        {customerSearch.trim() ? 'No customers found matching your search' : 'No customers available'}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.customer_id && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
              )}
            </div>
          </div>

          {/* Job Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <BriefcaseIcon className="h-5 w-5 mr-2" />
              Job Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter job title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Describe the job details..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Scheduling Information */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Scheduling
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.scheduled_date ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.scheduled_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.scheduled_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="9999"
                  value={formData.estimated_hours || ''}
                  onChange={(e) => handleInputChange('estimated_hours', e.target.value ? parseFloat(e.target.value) : null)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.estimated_hours ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0.0"
                />
                {errors.estimated_hours && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimated_hours}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Additional Information
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.notes ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Additional notes or special instructions..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Job' : 'Create Job'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobForm;
