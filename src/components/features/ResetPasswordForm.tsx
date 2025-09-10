import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [validToken, setValidToken] = useState(false)
  
  const navigate = useNavigate()
  const { updatePassword } = useAuth()

  useEffect(() => {
    // Parse tokens from URL hash (Supabase sends them as hash fragments)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')
    
    if (accessToken && refreshToken && type === 'recovery') {
      // Set the session with the tokens from the URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ error }) => {
        if (error) {
          console.error('Error setting session:', error)
          setError('Invalid reset link. Please request a new password reset.')
        } else {
          setValidToken(true)
          // Clear the hash from URL for cleaner appearance
          window.history.replaceState(null, '', window.location.pathname)
        }
      })
    } else {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Validate passwords
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      await updatePassword(password)
      setSuccessMessage('Password updated successfully! You will be redirected to the dashboard.')
      
      // Redirect to dashboard after successful password reset (user is now authenticated)
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
      
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  // Show loading or error state if token is not valid yet
  if (!validToken && !error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Validating reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="form-error">{error}</div>
            <div className="mt-3">
              <button
                onClick={() => navigate('/')}
                className="btn-primary w-full"
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        {validToken && !error && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="form-label">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="form-label">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="form-error">{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="text-green-700 text-sm">{successMessage}</div>
              <div className="text-green-600 text-xs mt-1">
                Redirecting to dashboard in 2 seconds...
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !!successMessage}
              className="btn-primary w-full"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              Back to Login
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
