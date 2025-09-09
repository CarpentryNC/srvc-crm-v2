import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useSearch } from '../../hooks/useSearch';
import type { SearchResult, RecentActivity } from '../../types/search';

interface SmartSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SmartSearch({ isOpen, onClose }: SmartSearchProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    searchTerm,
    setSearchTerm,
    results,
    recentActivity,
    isLoading,
    trackActivity
  } = useSearch();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return <UserIcon className="h-5 w-5" />;
      case 'job':
        return <BriefcaseIcon className="h-5 w-5" />;
      case 'quote':
        return <DocumentTextIcon className="h-5 w-5" />;
      case 'invoice':
        return <ReceiptPercentIcon className="h-5 w-5" />;
      default:
        return <MagnifyingGlassIcon className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'job':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'quote':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
      case 'invoice':
        return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    trackActivity(result);
    navigate(result.url);
    onClose();
    setSearchTerm('');
  };

  const handleRecentClick = (activity: RecentActivity) => {
    navigate(activity.url);
    onClose();
    setSearchTerm('');
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Search Panel */}
      <div className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search customers, jobs, quotes, invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {searchTerm ? (
            // Search Results
            <div className="p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Searching...</span>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${getTypeColor(result.type)}`}>
                        {result.avatar ? (
                          <span className="text-sm font-medium">{result.avatar}</span>
                        ) : (
                          getTypeIcon(result.type)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {result.title}
                          </p>
                          <span className={`ml-2 px-2 py-1 text-xs rounded-full capitalize ${getTypeColor(result.type)}`}>
                            {result.type}
                          </span>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No results found for "{searchTerm}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Recent Activity
            <div className="p-2">
              <div className="flex items-center px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <ClockIcon className="h-4 w-4 mr-2" />
                Recent Activity
              </div>
              {recentActivity.length > 0 ? (
                <div className="space-y-1">
                  {recentActivity.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => handleRecentClick(activity)}
                      className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full mr-3 ${getTypeColor(activity.type)}`}>
                        {getTypeIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {activity.entityTitle}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {formatTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.action} • {activity.type}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No recent activity
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Start by creating or viewing customers
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Type to search across all your data</span>
            <div className="flex items-center space-x-3">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
