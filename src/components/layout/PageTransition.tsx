import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  loadingDelay?: number;
}

export function PageTransition({ children, loadingDelay = 150 }: PageTransitionProps) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Start loading state
    setIsLoading(true);
    
    // Small delay to show loading state
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsLoading(false);
    }, loadingDelay);

    return () => clearTimeout(timer);
  }, [location.pathname, children, loadingDelay]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div 
      className="animate-fadeIn"
      key={location.pathname}
    >
      {displayChildren}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}

export function RouteLoader() {
  return (
    <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Loading page...
        </p>
      </div>
    </div>
  );
}

export function SuspenseLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Loading Application
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we prepare your workspace...
          </p>
        </div>
      </div>
    </div>
  );
}

export default PageTransition;
