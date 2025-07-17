import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useToast } from '@/hooks/use-toast'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { User, Session, AuthError } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  isAdmin: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (profile: Partial<User>) => Promise<void>
}

interface DemoUser {
  id: string
  email: string
  created_at: string
  updated_at: string
  email_confirmed_at: string
  name?: string
  avatar_url?: string
  user_metadata?: { role?: string } // Added for mock user metadata
}

interface DemoSession {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: DemoUser
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// Helper function to determine if a user is an admin
const isUserAdmin = (user: User | null): boolean => {
  if (!user) return false;
  
  // Check for admin role in user metadata
  if (user.user_metadata?.role === 'admin') return true;
  
  // Check for admin email domain
  if (user.email?.endsWith('@admin.sportarbitrage.com')) return true;
  
  // Check for admin email prefix
  if (user.email?.startsWith('admin')) return true;
  
  return false;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  
  // Load session from storage on mount
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        // Check for mock data in localStorage first
        const mockUser = localStorage.getItem('sportarb_mock_user');
        const mockSession = localStorage.getItem('sportarb_mock_session');
        
        if (mockUser && mockSession) {
          const parsedUser = JSON.parse(mockUser);
          const parsedSession = JSON.parse(mockSession);
          
          setUser(parsedUser as any);
          setSession(parsedSession as any);
          setIsAdmin(isUserAdmin(parsedUser as any));
          setIsLoading(false);
          return;
        }
        
        // If no mock data, try to get current Supabase session
        if (isSupabaseConfigured()) {
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            return;
          }
          
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            setIsAdmin(isUserAdmin(currentSession.user));
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          setIsAdmin(isUserAdmin(newSession.user));
        } else {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
        }
        
        setIsLoading(false);
      }
    );
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Check if Supabase is properly configured, if not use mock auth
      if (!isSupabaseConfigured()) {
        useMockAuth(email);
        return;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        setIsAdmin(isUserAdmin(data.user));
        
        toast({
          title: "Welcome back!",
          description: `Successfully logged in as ${isUserAdmin(data.user) ? 'admin' : 'user'}`
        });
      }
    } catch (error: any) {
      // If Supabase is not configured or there are connection issues, fall back to mock auth
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') || 
          error.message?.includes('Invalid login credentials') ||
          error.message?.includes('API URL')) {
        useMockAuth(email);
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Check if Supabase is properly configured, if not use mock auth
      if (!isSupabaseConfigured()) {
        useMockAuth(email);
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Registration successful",
        description: "Please check your email to confirm your account",
      });
      
      // If email confirmation is not required, set the user
      if (data.user && !data.user.identities?.[0]?.identity_data?.email_verified) {
        setUser(data.user);
        setSession(data.session);
        setIsAdmin(isUserAdmin(data.user));
      }
    } catch (error: any) {
      // If Supabase is not configured or there are connection issues, fall back to mock auth
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('NetworkError') || 
          error.message?.includes('Invalid login credentials') ||
          error.message?.includes('API URL')) {
        useMockAuth(email);
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Clear mock data from localStorage
      localStorage.removeItem('sportarb_mock_user');
      localStorage.removeItem('sportarb_mock_session');
      
      // If using real Supabase, sign out there too
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          toast({
            title: "Sign out failed",
            description: error.message,
            variant: "destructive"
          });
          throw error;
        }
      }
      
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out"
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password"
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const updateUserProfile = async (profile: Partial<User>) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.updateUser({
        data: profile
      });
      
      if (error) {
        toast({
          title: "Profile update failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      if (data.user) {
        setUser(data.user);
        setIsAdmin(isUserAdmin(data.user));
        
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated"
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Mock authentication for development when Supabase is not available
  const useMockAuth = (email: string) => {
    // Create mock user with default values if email is empty
    const safeEmail = email || 'demo@example.com';
    
    // Determine if user is admin based on email
    const userIsAdmin = safeEmail.includes('admin');
    
    // Create mock user
    const mockUser: DemoUser = {
      id: 'mock-user-' + Math.random().toString(36).substring(2, 9),
      email: safeEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(),
      name: safeEmail.split('@')[0],
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(safeEmail)}`,
    }
    
    // Add admin metadata if applicable
    if (userIsAdmin) {
      mockUser.user_metadata = { role: 'admin' };
    }
    
    const mockSession: DemoSession = {
      access_token: 'mock-token-' + Math.random().toString(36).substring(2, 9),
      refresh_token: 'mock-refresh-' + Math.random().toString(36).substring(2, 9),
      expires_in: 3600,
      token_type: 'bearer',
      user: mockUser,
    }
    
    // Set state
    setUser(mockUser as any);
    setSession(mockSession as any);
    setIsAdmin(userIsAdmin);
    
    // Store in localStorage for persistence
    localStorage.setItem('sportarb_mock_user', JSON.stringify(mockUser));
    localStorage.setItem('sportarb_mock_session', JSON.stringify(mockSession));
    
    toast({
      title: "Welcome!",
      description: `Successfully logged in as ${userIsAdmin ? 'admin' : 'user'} (demo mode)`
    });
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAdmin,
      isLoading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}