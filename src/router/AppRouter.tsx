import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/layout/Layout';
import Dashboard from '../components/layout/Dashboard';
import SimpleLandingPage from '../components/SimpleLandingPage';
import CustomerList from '../components/customers/CustomerList';
import CustomerForm from '../components/customers/CustomerForm';
import CustomerDetail from '../components/customers/CustomerDetail';
import CustomerEdit from '../components/customers/CustomerEdit';
import { CustomerImport } from '../components/customers/CustomerImport';
import JobList from '../components/jobs/JobList';
import JobForm from '../components/jobs/JobForm';
import JobDetail from '../components/jobs/JobDetail';
import RequestList from '../components/requests/RequestList';
import RequestForm from '../components/requests/RequestForm';
import RequestDetail from '../components/requests/RequestDetail';
import RequestEdit from '../components/requests/RequestEdit';
import QuoteList from '../components/quotes/QuoteList';
import QuoteNewPage from '../components/quotes/QuoteNewPage';
import QuoteDetailPage from '../components/quotes/QuoteDetailPage';
import QuoteEditPage from '../components/quotes/QuoteEditPage';
import ProductLibrary from '../components/products/ProductLibrary';
import Calendar from '../components/calendar/Calendar';
import { ResetPasswordForm } from '../components/features/ResetPasswordForm';
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
          <Route path={routes.RESET_PASSWORD} element={<ResetPasswordForm />} />
          
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
            path={routes.CUSTOMERS_IMPORT}
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerImport />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.CUSTOMERS_VIEW}
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.CUSTOMERS_EDIT}
            element={
              <ProtectedRoute>
                <Layout>
                  <CustomerEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.JOBS}
            element={
              <ProtectedRoute>
                <Layout>
                  <JobList />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.JOBS_NEW}
            element={
              <ProtectedRoute>
                <Layout>
                  <JobForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.JOBS_VIEW}
            element={
              <ProtectedRoute>
                <Layout>
                  <JobDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.JOBS_EDIT}
            element={
              <ProtectedRoute>
                <Layout>
                  <JobForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.REQUESTS}
            element={
              <ProtectedRoute>
                <Layout>
                  <RequestList />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.REQUESTS_NEW}
            element={
              <ProtectedRoute>
                <Layout>
                  <RequestForm />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.REQUESTS_VIEW}
            element={
              <ProtectedRoute>
                <Layout>
                  <RequestDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.REQUESTS_EDIT}
            element={
              <ProtectedRoute>
                <Layout>
                  <RequestEdit />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.QUOTES}
            element={
              <ProtectedRoute>
                <Layout>
                  <QuoteList />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.QUOTES_NEW}
            element={
              <ProtectedRoute>
                <Layout>
                  <QuoteNewPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.QUOTES_VIEW}
            element={
              <ProtectedRoute>
                <Layout>
                  <QuoteDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.QUOTES_EDIT}
            element={
              <ProtectedRoute>
                <Layout>
                  <QuoteEditPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path={routes.PRODUCTS}
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductLibrary />
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
                  <Calendar />
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
