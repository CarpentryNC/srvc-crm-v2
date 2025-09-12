import { Link, useLocation } from 'react-router-dom';

interface MenuItem {
  name: string;
  href: string;
  icon: string;
  count?: number;
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ isOpen = true, setIsOpen }: SidebarProps) {
  const location = useLocation();
  
  const menuItems: MenuItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', count: undefined },
    { name: 'Customers', href: '/customers', icon: '👥', count: 0 },
    { name: 'Requests', href: '/requests', icon: '📝', count: 0 },
    { name: 'Jobs', href: '/jobs', icon: '🔨', count: 0 },
    { name: 'Quotes', href: '/quotes', icon: '📋', count: 0 },
    { name: 'Products', href: '/products', icon: '📦', count: undefined },
    { name: 'Invoices', href: '/invoices', icon: '💰', count: 0 },
    { name: 'Payments', href: '/payments', icon: '💳', count: undefined },
    { name: 'Calendar', href: '/calendar', icon: '📅', count: undefined },
    { name: 'Settings', href: '/settings', icon: '⚙️', count: undefined },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setIsOpen?.(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center h-16 bg-blue-600 dark:bg-blue-700 text-white">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="text-xl font-bold">SRVC CRM</h1>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="flex-1 px-2 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150
                      ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-200'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 border-l-4 border-transparent'
                      }
                    `}
                    onClick={() => setIsOpen?.(false)}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span className="flex-1">{item.name}</span>
                    {item.count !== undefined && (
                      <span
                        className={`
                          ml-3 inline-block py-0.5 px-2 text-xs font-medium rounded-full
                          ${
                            isActive
                              ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                          }
                        `}
                      >
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">?</span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                  SRVC CRM v2.0
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Professional Services
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
