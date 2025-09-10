import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '../types'
import type { Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string, rememberEmail?: boolean) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  getSavedEmail: () => string
  clearSavedEmail: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ? transformUser(session.user) : null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ? transformUser(session.user) : null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const transformUser = (authUser: any): User => {
    return {
      id: authUser.id,
      email: authUser.email,
      user_metadata: authUser.user_metadata,
    }
  }

  const signUp = async (email: string, password: string) => {
    console.log('SignUp attempt:', { email, passwordLength: password.length })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      console.log('SignUp response:', { data, error })
      if (error) throw error
    } catch (error) {
      console.error('SignUp error:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string, rememberEmail = false) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    
    // Save email to localStorage if rememberEmail is true
    if (rememberEmail) {
      localStorage.setItem('srvc_crm_remembered_email', email)
    } else {
      localStorage.removeItem('srvc_crm_remembered_email')
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  }

  const getSavedEmail = (): string => {
    return localStorage.getItem('srvc_crm_remembered_email') || ''
  }

  const clearSavedEmail = () => {
    localStorage.removeItem('srvc_crm_remembered_email')
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    getSavedEmail,
    clearSavedEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
