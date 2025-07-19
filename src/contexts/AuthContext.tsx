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
        if (!isSupabaseConfigured()) {
          console.error("Supabase is not configured. Authentication will not work.");
          toast({
            title: "Authentication Error",
            description: "Authentication system is not configured. Please contact support.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        // Get current Supabase session
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
      
      if (!isSupabaseConfigured()) {
        toast({
          title: "Authentication Error",
          description: "Authentication system is not configured. Please contact support.",
          variant: "destructive"
        });
        throw new Error("Supabase is not configured");
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
      console.error('Sign in error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      if (!isSupabaseConfigured()) {
        toast({
          title: "Authentication Error",
          description: "Authentication system is not configured. Please contact support.",
          variant: "destructive"
        });
        throw new Error("Supabase is not configured");
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
      console.error('Sign up error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      if (!isSupabaseConfigured()) {
        toast({
          title: "Authentication Error",
          description: "Authentication system is not configured. Please contact support.",
          variant: "destructive"
        });
        throw new Error("Supabase is not configured");
      }
      
      // Always clear local data
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error: any) {
      console.error('Sign out error:', error.message);
      // Even if there's an error, we should still clear the local session
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      
      if (!isSupabaseConfigured()) {
        toast({
          title: "Authentication Error",
          description: "Authentication system is not configured. Please contact support.",
          variant: "destructive"
        });
        throw new Error("Supabase is not configured");
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast({
          title: "Error resetting password",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for the password reset link",
      });
    } catch (error: any) {
      console.error('Password reset error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  const updateUserProfile = async (profile: Partial<User>) => {
    try {
      setIsLoading(true);
      
      if (!isSupabaseConfigured()) {
        toast({
          title: "Authentication Error",
          description: "Authentication system is not configured. Please contact support.",
          variant: "destructive"
        });
        throw new Error("Supabase is not configured");
      }
      
      const { data, error } = await supabase.auth.updateUser(profile);
      
      if (error) {
        toast({
          title: "Error updating profile",
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
          description: "Your profile has been successfully updated",
        });
      }
    } catch (error: any) {
      console.error('Profile update error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
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
  );
}