import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/layout/Layout';
import Dashboard from '../components/layout/Dashboard';
import SimpleLandingPage from '../components/SimpleLandingPage';
import CustomerList from '../components/customers/CustomerList';
import CustomerForm from '../components/customers/CustomerForm';
import { routes } from './routes';

// Placeholder components for routes that don't exist yet
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="text-center py-12 animate-slideUp">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
      <p className="text-gray-600 dark:text-gray-400">This feature is coming soon!</p>
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path={routes.HOME} element={<SimpleLandingPage />} />
          
          {/* Protected routes */}
          <Route
            path={routes.DASHBOARD}
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.CUSTOMERS}
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerList />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.CUSTOMERS_NEW}
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.JOBS}
            element={
              <ProtectedRoute>
                <Layout>
                  <ComingSoon title="Job Management" />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.QUOTES}
            element={
              <ProtectedRoute>
                <Layout>
                  <ComingSoon title="Quote Management" />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.INVOICES}
            element={
              <ProtectedRoute>
                <Layout>
                  <ComingSoon title="Invoice Management" />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.CALENDAR}
            element={
              <ProtectedRoute>
                <Layout>
                  <ComingSoon title="Calendar & Scheduling" />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.SETTINGS}
            element={
              <ProtectedRoute>
                <Layout>
                  <ComingSoon title="Settings" />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to={routes.DASHBOARD} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRouter;
