import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  session: Session | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Skip Supabase auth - just set loading to false for free login
    setLoading(false)
  }, [])

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setIsAdmin(data.is_admin || false)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      // Mock user for free login - accept any credentials
      const mockUser = {
        id: 'mock-user-' + Math.random().toString(36).substr(2, 9),
        email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
      }
      
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser,
      }
      
      setUser(mockUser as any)
      setSession(mockSession as any)
      setIsAdmin(email.includes('admin')) // Make admin if email contains 'admin'
      
      toast({
        title: "Welcome!",
        description: "Successfully logged in (demo mode)"
      })
    } catch (error) {
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    // Same as sign in for free access
    await signIn(email, password)
  }

  const signOut = async () => {
    try {
      setUser(null)
      setSession(null)
      setIsAdmin(false)
      toast({
        title: "Logged out",
        description: "Successfully logged out"
      })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    session,
    isAdmin,
    signIn,
    signUp,
    signOut,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}