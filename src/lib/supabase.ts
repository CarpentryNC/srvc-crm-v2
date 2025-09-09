import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Use environment variables for configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fallback to production if env vars are missing (shouldn't happen in proper setup)
const finalUrl = supabaseUrl || 'https://lrvzqxyqrrjusvwazaak.supabase.co'
const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxydnpxeHlxcnJqdXN2d2F6YWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyODM3NTUsImV4cCI6MjA3Mjg1OTc1NX0.fGa3ojCVJeSxfK7CJjswS4NchPbtRuzuOJIB6tME97o'

// Debug logging 
console.log('Supabase Configuration:')
console.log('URL:', finalUrl)
console.log('Key prefix:', finalKey.substring(0, 20) + '...')
console.log('Environment check:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing',
  env_mode: import.meta.env.MODE,
  env_dev: import.meta.env.DEV
})

export const supabase = createClient<Database>(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return (
    finalUrl.includes('supabase') &&
    finalKey.length > 20
  )
}

// Auth helpers
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}
