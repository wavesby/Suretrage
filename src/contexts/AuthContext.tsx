import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useToast } from '@/hooks/use-toast'
import { User, Session } from '@supabase/supabase-js'
import { isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase'

// Mock user interface matching Supabase User structure
interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    role?: string;
    name?: string;
  };
  created_at: string;
}

// Mock session interface matching Supabase Session structure
interface MockSession {
  user: MockUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface AuthContextType {
  user: MockUser | null;
  session: MockSession | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (profile: Partial<MockUser>) => Promise<void>;
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
const isUserAdmin = (user: MockUser | null): boolean => {
  if (!user) return false;
  
  // Check for admin role in user metadata
  if (user.user_metadata?.role === 'admin') return true;
  
  // Check for admin email domain
  if (user.email?.endsWith('@admin.sportarbitrage.com')) return true;
  
  // Check for admin email prefix
  if (user.email?.startsWith('admin')) return true;
  
  return false;
}

// Mock user data
const MOCK_USERS = [
  {
    id: '1',
    email: 'user@example.com',
    password: 'password123',
    user_metadata: { name: 'Regular User', role: 'user' },
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    email: 'admin@example.com',
    password: 'admin123',
    user_metadata: { name: 'Admin User', role: 'admin' },
    created_at: new Date().toISOString()
  }
];

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useLocalStorage<MockUser | null>('auth_user', null);
  const [session, setSession] = useLocalStorage<MockSession | null>('auth_session', null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [databaseAvailable, setDatabaseAvailable] = useState(true);
  const { toast } = useToast();
  
  // Check database connection status on load
  useEffect(() => {
    const checkDatabaseConnection = async () => {
      // First check if Supabase is configured properly
      if (!isSupabaseConfigured()) {
        console.warn('Supabase is not configured properly. Using mock authentication.');
        setDatabaseAvailable(false);
      } else {
        // Test the connection
        const isConnected = await testSupabaseConnection();
        setDatabaseAvailable(isConnected);
        
        if (!isConnected) {
          console.warn('Could not connect to Supabase. Using mock authentication.');
          // Show a toast notification about database connection issue
          toast({
            title: "Database connection issue",
            description: "Could not connect to the database. The app will use mock data.",
            variant: "destructive"
          });
        }
      }
    };
    
    checkDatabaseConnection();
  }, []);
  
  // Load session from storage on mount
  useEffect(() => {
    // Check if we have a stored session
    if (session && user) {
      // Check if session is expired
      if (session.expires_at > Date.now()) {
        setIsAdmin(isUserAdmin(user));
      } else {
        // Session expired, clear it
        setUser(null);
        setSession(null);
        setIsAdmin(false);
      }
    }
    
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Check if we should use mock authentication
      if (!databaseAvailable) {
        // Use mock authentication logic
        const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
        
        if (!foundUser) {
          toast({
            title: "Login failed",
            description: "Invalid email or password",
            variant: "destructive"
          });
          throw new Error("Invalid email or password");
        }
        
        // Create mock user without password
        const { password: _, ...userWithoutPassword } = foundUser;
        const mockUser = userWithoutPassword as MockUser;
        
        // Create mock session
        const mockSession: MockSession = {
          user: mockUser,
          access_token: `mock-token-${Date.now()}`,
          refresh_token: `mock-refresh-${Date.now()}`,
          expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
        };
        
        setUser(mockUser);
        setSession(mockSession);
        setIsAdmin(isUserAdmin(mockUser));
        
        toast({
          title: "Welcome back!",
          description: `Successfully logged in as ${isUserAdmin(mockUser) ? 'admin' : 'user'} (mock mode)`
        });
      } else {
        // Real authentication would go here when Supabase is connected
        // For now, still use mock users since we haven't implemented real auth
        const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
        
        if (!foundUser) {
          toast({
            title: "Login failed",
            description: "Invalid email or password",
            variant: "destructive"
          });
          throw new Error("Invalid email or password");
        }
        
        // Create mock user without password
        const { password: _, ...userWithoutPassword } = foundUser;
        const mockUser = userWithoutPassword as MockUser;
        
        // Create mock session
        const mockSession: MockSession = {
          user: mockUser,
          access_token: `mock-token-${Date.now()}`,
          refresh_token: `mock-refresh-${Date.now()}`,
          expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
        };
        
        setUser(mockUser);
        setSession(mockSession);
        setIsAdmin(isUserAdmin(mockUser));
        
        toast({
          title: "Welcome back!",
          description: `Successfully logged in as ${isUserAdmin(mockUser) ? 'admin' : 'user'}`
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
      
      // Check if user already exists
      if (MOCK_USERS.some(u => u.email === email)) {
        toast({
          title: "Registration failed",
          description: "User with this email already exists",
          variant: "destructive"
        });
        throw new Error("User with this email already exists");
      }
      
      // In a real app, we would create the user in the database
      // For this mock implementation, we'll just show a success message
      
      toast({
        title: "Registration successful",
        description: "Your account has been created. You can now sign in.",
      });
      
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
      
      // Clear user and session
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
      toast({
        title: "Signed out",
        description: "You have been successfully logged out"
      });
      
    } catch (error: any) {
      console.error('Sign out error:', error.message);
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      
      // Check if user exists
      const userExists = MOCK_USERS.some(u => u.email === email);
      
      if (!userExists) {
        toast({
          title: "Error",
          description: "No user found with this email",
          variant: "destructive"
        });
        throw new Error("No user found with this email");
      }
      
      // In a real app, we would send a password reset email
      // For this mock implementation, we'll just show a success message
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for a link to reset your password"
      });
      
    } catch (error: any) {
      console.error('Reset password error:', error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  const updateUserProfile = async (profile: Partial<MockUser>) => {
    try {
      setIsLoading(true);
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update your profile",
          variant: "destructive"
        });
        throw new Error("User not logged in");
      }
      
      // Update user data
      const updatedUser = {
        ...user,
        ...profile
      };
      
      setUser(updatedUser);
      
      if (session) {
        setSession({
          ...session,
          user: updatedUser
        });
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated"
      });
      
    } catch (error: any) {
      console.error('Update profile error:', error.message);
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}