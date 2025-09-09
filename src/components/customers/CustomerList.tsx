import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import { useCustomers } from '../../hooks/useCustomers';
import type { Customer, CustomerListView, CustomerSortField, CustomerSortOrder } from '../../types/customer';

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const getCustomerInitials = (customer: Customer) => {
  return `${customer.first_name[0]}${customer.last_name[0]}`.toUpperCase();
};

const getCustomerDisplayName = (customer: Customer) => {
  return `${customer.first_name} ${customer.last_name}`;
};

interface CustomerListProps {
  onCustomerClick?: (customer: Customer) => void;
}

export function CustomerList({ onCustomerClick }: CustomerListProps) {
  const { customers, loading, error, stats } = useCustomers();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<CustomerListView>('grid');
  const [sortField, setSortField] = useState<CustomerSortField>('created_at');
  const [sortOrder, setSortOrder] = useState<CustomerSortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = customers.filter(customer => 
        customer.first_name.toLowerCase().includes(search) ||
        customer.last_name.toLowerCase().includes(search) ||
        customer.email.toLowerCase().includes(search) ||
        customer.company_name?.toLowerCase().includes(search) ||
        customer.phone?.includes(search)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = `${a.last_name} ${a.first_name}`.toLowerCase();
          bValue = `${b.last_name} ${b.first_name}`.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'company':
          aValue = a.company_name?.toLowerCase() || '';
          bValue = b.company_name?.toLowerCase() || '';
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
  }, [customers, searchTerm, sortField, sortOrder]);

  const handleSort = (field: CustomerSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Use the helper functions from the top of the file instead of redefining them

  // Handle customer click - navigate to detail view
  const handleCustomerClick = (customer: Customer) => {
    if (onCustomerClick) {
      onCustomerClick(customer);
    } else {
      navigate(`/customers/${customer.id}`);
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
          Error Loading Customers
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
            Customers
          </h1>
          {stats && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {stats.total} total • {stats.withCompany} with company • {stats.recentlyAdded} added recently
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          <Link
            to="/customers/import"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
            Import CSV
          </Link>
          <Link
            to="/customers/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Customer
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
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded ${view === 'grid' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
          >
            <Squares2X2Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded ${view === 'list' ? 'bg-white dark:bg-gray-700 shadow' : ''}`}
          >
            <ViewColumnsIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort by
              </label>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as CustomerSortField)}
                className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="company">Company</option>
                <option value="created_at">Date Added</option>
                <option value="updated_at">Last Updated</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as CustomerSortOrder)}
                className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Customer List */}
      {filteredAndSortedCustomers.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Get started by adding your first customer'
            }
          </p>
          {!searchTerm && (
            <Link
              to="/customers/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Your First Customer
            </Link>
          )}
        </div>
      ) : (
        <>
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedCustomers.map((customer) => (
                <CustomerCard 
                  key={customer.id} 
                  customer={customer} 
                  onClick={handleCustomerClick}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <CustomerTable 
                customers={filteredAndSortedCustomers}
                onSort={handleSort}
                sortField={sortField}
                sortOrder={sortOrder}
                onCustomerClick={handleCustomerClick}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Customer Card Component
function CustomerCard({ customer, onClick }: { customer: Customer; onClick?: (customer: Customer) => void }) {
  const handleClick = () => {
    if (onClick) {
      onClick(customer);
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {getCustomerInitials(customer)}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {getCustomerDisplayName(customer)}
              </h3>
              {customer.company_name && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {customer.company_name}
                </p>
              )}
            </div>
          </div>
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <EnvelopeIcon className="h-4 w-4 mr-2" />
            {customer.email}
          </div>
          {customer.phone && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <PhoneIcon className="h-4 w-4 mr-2" />
              {customer.phone}
            </div>
          )}
          {customer.address_street && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPinIcon className="h-4 w-4 mr-2" />
              {customer.address_city}, {customer.address_state}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Added {formatDate(customer.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Customer Table Component
function CustomerTable({ 
  customers, 
  onSort, 
  sortField, 
  sortOrder, 
  onCustomerClick 
}: { 
  customers: Customer[];
  onSort: (field: CustomerSortField) => void;
  sortField: CustomerSortField;
  sortOrder: CustomerSortOrder;
  onCustomerClick?: (customer: Customer) => void;
}) {
  const SortButton = ({ field, children }: { field: CustomerSortField; children: React.ReactNode }) => (
    <button
      onClick={() => onSort(field)}
      className="flex items-center hover:text-gray-900 dark:hover:text-gray-100"
    >
      {children}
      {sortField === field && (
        <span className="ml-1">
          {sortOrder === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <SortButton field="name">Name</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <SortButton field="email">Email</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <SortButton field="company">Company</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <SortButton field="created_at">Added</SortButton>
            </th>
            <th className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {customers.map((customer) => (
            <tr 
              key={customer.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => onCustomerClick?.(customer)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {getCustomerInitials(customer)}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getCustomerDisplayName(customer)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {customer.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {customer.company_name || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {customer.phone || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {formatDate(customer.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <EllipsisVerticalIcon className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CustomerList;
