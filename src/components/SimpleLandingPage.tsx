import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import { LoginForm } from './features/LoginForm';

const SimpleLandingPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              backgroundColor: '#10b981', 
              borderRadius: '50%', 
              margin: '0 auto 1rem auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="32" height="32" fill="white" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.875rem', fontWeight: '700', color: '#1f2937' }}>
              Welcome to SRVC CRM!
            </h1>
            <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '1rem' }}>
              Successfully signed in as <strong>{user.email}</strong>
            </p>
          </div>

          <div style={{ 
            padding: '1.5rem', 
            backgroundColor: '#f9fafb', 
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#374151' 
            }}>
              🚀 Ready to get started?
            </h3>
            <p style={{ 
              margin: '0 0 1rem 0', 
              color: '#6b7280', 
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}>
              Your CRM dashboard will be available here soon. You now have access to:
            </p>
            <ul style={{ 
              margin: '0', 
              paddingLeft: '1.25rem', 
              color: '#6b7280',
              fontSize: '0.875rem'
            }}>
              <li style={{ marginBottom: '0.25rem' }}>👥 Client Management</li>
              <li style={{ marginBottom: '0.25rem' }}>📋 Job Tracking</li>
              <li style={{ marginBottom: '0.25rem' }}>💰 Quote Generation</li>
              <li style={{ marginBottom: '0.25rem' }}>🧾 Invoice Processing</li>
              <li style={{ marginBottom: '0.25rem' }}>📅 Calendar Integration</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                flex: 1,
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Enter CRM Dashboard
            </button>
            <button
              onClick={signOut}
              style={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show the enhanced login form
  return <LoginForm />;
};

const LandingPageWithErrorBoundary = () => (
  <ErrorBoundary>
    <SimpleLandingPage />
  </ErrorBoundary>
);

export default LandingPageWithErrorBoundary;
