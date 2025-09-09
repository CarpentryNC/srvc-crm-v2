import { useAuth } from '../hooks/useAuth'
import { LoginForm } from '../components/features/LoginForm'
import { DashboardContent } from '../components/features/DashboardContent'

export function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <DashboardContent />
}
