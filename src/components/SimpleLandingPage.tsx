import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

const SimpleLandingPage = () => {
  const { user, signIn, signUp, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log(`Attempting ${isSignUp ? 'signup' : 'signin'} for email:`, email);
      
      if (isSignUp) {
        await signUp(email, password);
        console.log('Signup successful');
        setSuccessMessage('Account created successfully! Please check your email for a confirmation link to complete your registration.');
        // Clear the form
        setEmail('');
        setPassword('');
      } else {
        await signIn(email, password);
        console.log('Signin successful');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error details:', {
        message: errorMessage,
        type: typeof err,
        stringified: JSON.stringify(err, null, 2)
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
        maxWidth: '400px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
            SRVC CRM
          </h1>
          <p style={{ margin: '0', color: '#6b7280' }}>
            Professional service management platform
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => {
                setIsSignUp(false);
                setError('');
                setSuccessMessage('');
              }}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: !isSignUp ? 'white' : 'transparent',
                color: !isSignUp ? '#1f2937' : '#6b7280',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError('');
                setSuccessMessage('');
              }}
              style={{
                flex: 1,
                padding: '0.5rem',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: isSignUp ? 'white' : 'transparent',
                color: isSignUp ? '#1f2937' : '#6b7280',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Sign Up
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              placeholder="Enter your password"
            />
          </div>

          {isSignUp && (
            <div style={{ 
              marginBottom: '1rem',
              padding: '0.75rem', 
              backgroundColor: '#f0f9ff', 
              border: '1px solid #bae6fd',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#0369a1'
            }}>
              💡 You'll receive a confirmation email after signup. Please check your inbox and click the link to activate your account.
            </div>
          )}

          {successMessage && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#f0f9ff', 
              border: '1px solid #0ea5e9',
              borderRadius: '6px',
              color: '#0369a1',
              fontSize: '0.875rem'
            }}>
              {successMessage}
            </div>
          )}

          {error && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#f9fafb', 
          borderRadius: '6px',
          fontSize: '0.875rem',
          color: '#6b7280'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
            Features:
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1rem' }}>
            <li>Client Management</li>
            <li>Job Tracking</li>
            <li>Quote Generation</li>
            <li>Invoice Processing</li>
            <li>Calendar Integration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const LandingPageWithErrorBoundary = () => (
  <ErrorBoundary>
    <SimpleLandingPage />
  </ErrorBoundary>
);

export default LandingPageWithErrorBoundary;
