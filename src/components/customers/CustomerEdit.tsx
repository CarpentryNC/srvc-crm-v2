import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomers } from '../../hooks/useCustomers';
import CustomerForm from './CustomerForm';
import type { Customer } from '../../types/customer';

export function CustomerEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer } = useCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleSuccess = (updatedCustomer: Customer) => {
    navigate(`/customers/${updatedCustomer.id}`);
  };

  const handleCancel = () => {
    navigate(`/customers/${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
          Unable to load customer for editing.
        </p>
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <CustomerForm
      customer={customer}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}

export default CustomerEdit;
