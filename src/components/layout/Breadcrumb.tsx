import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { routes } from '../../router/routes';

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive?: boolean;
}

export function Breadcrumb() {
  const location = useLocation();
  
  // Route label mapping
  const routeLabels: Record<string, string> = {
    [routes.DASHBOARD]: 'Dashboard',
    [routes.CUSTOMERS]: 'Customers',
    [routes.CUSTOMERS_NEW]: 'New Customer',
    [routes.JOBS]: 'Jobs',
    [routes.JOBS_NEW]: 'New Job',
    [routes.QUOTES]: 'Quotes',
    [routes.QUOTES_NEW]: 'New Quote',
    [routes.INVOICES]: 'Invoices',
    [routes.INVOICES_NEW]: 'New Invoice',
    [routes.CALENDAR]: 'Calendar',
    [routes.SETTINGS]: 'Settings',
  };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Dashboard',
        path: routes.DASHBOARD,
        isActive: location.pathname === routes.DASHBOARD
      }
    ];

    // If we're not on dashboard, build breadcrumb trail
    if (location.pathname !== routes.DASHBOARD) {
      let currentPath = '';
      
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === pathSegments.length - 1;
        
        // Get label from route mapping or format segment
        let label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
        
        // Handle dynamic routes (like /customers/:id)
        if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // This is a UUID, so it's likely an ID parameter
          const parentSegment = pathSegments[index - 1];
          if (parentSegment === 'customers') label = 'Customer Details';
          else if (parentSegment === 'jobs') label = 'Job Details';
          else if (parentSegment === 'quotes') label = 'Quote Details';
          else if (parentSegment === 'invoices') label = 'Invoice Details';
          else label = 'Details';
        }
        
        // Handle action segments
        if (segment === 'new') {
          const parentSegment = pathSegments[index - 1];
          if (parentSegment === 'customers') label = 'New Customer';
          else if (parentSegment === 'jobs') label = 'New Job';
          else if (parentSegment === 'quotes') label = 'New Quote';
          else if (parentSegment === 'invoices') label = 'New Invoice';
          else label = `New ${parentSegment?.charAt(0).toUpperCase()}${parentSegment?.slice(1)}`;
        }
        
        if (segment === 'edit') {
          label = 'Edit';
        }

        breadcrumbs.push({
          label,
          path: currentPath,
          isActive: isLast
        });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon 
                className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" 
                aria-hidden="true" 
              />
            )}
            
            {index === 0 ? (
              <Link
                to={crumb.path}
                className={`flex items-center text-sm font-medium transition-colors ${
                  crumb.isActive
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <HomeIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                {crumb.label}
              </Link>
            ) : (
              <>
                {crumb.isActive ? (
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
