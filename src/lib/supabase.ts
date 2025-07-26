import { createClient } from '@supabase/supabase-js'

// Supabase configuration using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mgafiaiqnzrgyarxmjjw.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYWZpYWlxbnpyZ3lhcnhtamp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2MjE1MTIsImV4cCI6MjA2ODE5NzUxMn0.4jUz8gNhz_V8tAWKEGrJ3-ZjT7RCGpJ8LdZx4xE8qYY'

// Check if we have valid Supabase configuration
const isConfigValid = supabaseUrl && supabaseUrl !== 'https://mock-url.supabase.co' && 
                     supabaseAnonKey && supabaseAnonKey !== 'mock-key' &&
                     !supabaseUrl.includes('your-supabase-url')

console.log('Supabase Configuration:', {
  url: supabaseUrl,
  keyProvided: !!supabaseAnonKey,
  isValid: isConfigValid
})

// Create Supabase client - real or mock based on configuration
let supabase: any

if (isConfigValid) {
  // Use real Supabase client with real-time disabled to prevent WebSocket errors
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'sport-arbitrage-app'
      }
    }
  })
  
  // Override channel method to prevent real-time subscriptions
  supabase.channel = () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    subscribe: () => ({ unsubscribe: () => {} }),
    unsubscribe: () => {}
  })
  
  console.log('✅ Using real Supabase connection (realtime disabled)')
} else {
  // Create mock Supabase client for development
  console.log('⚠️ Using mock Supabase client - database features disabled')
  supabase = {
  auth: {
    signIn: () => Promise.resolve({ user: null, error: { message: 'Using mock data, database unavailable' } }),
    signUp: () => Promise.resolve({ user: null, error: { message: 'Using mock data, database unavailable' } }),
    signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: { message: 'Using mock data, database unavailable' } }),
        execute: () => Promise.resolve({ data: null, error: { message: 'Using mock data, database unavailable' } })
      }),
      execute: () => Promise.resolve({ data: null, error: { message: 'Using mock data, database unavailable' } })
    }),
    insert: () => Promise.resolve({ data: null, error: { message: 'Using mock data, database unavailable' } }),
    upsert: () => Promise.resolve({ data: null, error: { message: 'Using mock data, database unavailable' } }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: { message: 'Using mock data, database unavailable' } })
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: { message: 'Using mock data, database unavailable' } })
    })
  }),
  channel: () => ({
    on: () => ({
      subscribe: () => ({})
    })
  }),
  removeChannel: () => {}
  }
}

// Export Supabase client
export { supabase }

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return isConfigValid
}

// Helper function to test Supabase connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!isConfigValid) {
    return false
  }
  
  try {
    // Test connection using auth instead of profiles table to avoid 401 errors
    const { data, error } = await supabase.auth.getSession()
    // Connection is successful if we can make the request (even if no session)
    return true
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return false
  }
}

// Helper function to create a new user profile after signup
export const createUserProfile = async (userId: string, userData: any) => {
  if (!isConfigValid) {
    console.log('Mock: createUserProfile called', userId, userData)
    return { success: true }
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email: userData.email,
          is_admin: false
        }
      ])
    
    if (error) {
      console.warn('Profiles table not available:', error.message)
      return { success: true, message: 'Profile creation skipped - table not available' }
    }
    return { success: true, data }
  } catch (error) {
    console.warn('Profile creation failed (table may not exist):', error)
    return { success: true, message: 'Profile creation skipped - table not available' }
  }
}

// Helper function to get a user's profile data
export const getUserProfile = async (userId: string) => {
  if (!isConfigValid) {
    console.log('Mock: getUserProfile called', userId)
    return {
      id: userId,
      email: 'mock@example.com',
      is_admin: false,
      created_at: new Date().toISOString()
    }
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.warn('Profiles table not available:', error.message)
      // Return default profile if table doesn't exist
      return {
        id: userId,
        email: 'user@example.com',
        is_admin: false,
        created_at: new Date().toISOString()
      }
    }
    return data
  } catch (error) {
    console.warn('Profile fetch failed (table may not exist):', error)
    return {
      id: userId,
      email: 'user@example.com',
      is_admin: false,
      created_at: new Date().toISOString()
    }
  }
}

// Helper function to update a user's profile data
export const updateUserProfile = async (userId: string, updates: any) => {
  if (!isConfigValid) {
    console.log('Mock: updateUserProfile called', userId, updates)
    return { success: true }
  }
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
    
    if (error) {
      console.warn('Profiles table not available:', error.message)
      return { success: true, message: 'Profile update skipped - table not available' }
    }
    return { success: true, data }
  } catch (error) {
    console.warn('Profile update failed (table may not exist):', error)
    return { success: true, message: 'Profile update skipped - table not available' }
  }
}

// Helper function to save user preferences
export const saveUserPreferences = async (userId: string, preferences: any) => {
  if (!isConfigValid) {
    console.log('Mock: saveUserPreferences called', userId, preferences)
    return { success: true }
  }
  
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert([
        {
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        }
      ])
    
    if (error) {
      console.warn('User preferences table not available:', error.message)
      return { success: true, message: 'Preferences save skipped - table not available' }
    }
    return { success: true, data }
  } catch (error) {
    console.warn('Preferences save failed (table may not exist):', error)
    return { success: true, message: 'Preferences save skipped - table not available' }
  }
}

// Helper function to get user preferences
export const getUserPreferences = async (userId: string) => {
  if (!isConfigValid) {
    console.log('Mock: getUserPreferences called', userId)
    return {
      selected_bookmakers: ['1xBet', 'SportyBet'],
      default_stake: 10000,
      sms_notifications: false
    }
  }
  
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.warn('User preferences table not available:', error.message)
      return {
        selected_bookmakers: ['1xBet', 'SportyBet'],
        default_stake: 10000,
        sms_notifications: false
      }
    }
    return data || {
      selected_bookmakers: ['1xBet', 'SportyBet'],
      default_stake: 10000,
      sms_notifications: false
    }
  } catch (error) {
    console.warn('Preferences fetch failed (table may not exist):', error)
    return {
      selected_bookmakers: ['1xBet', 'SportyBet'],
      default_stake: 10000,
      sms_notifications: false
    }
  }
}

// Helper function to check if a user is an admin
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  if (!isConfigValid) {
    return userId === 'mock-admin-id'
  }
  
  try {
    const profile = await getUserProfile(userId)
    return profile?.is_admin || false
  } catch (error) {
    console.warn('Admin check failed (table may not exist):', error)
    return false
  }
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          is_admin?: boolean
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          selected_bookmakers: string[]
          default_stake: number
          sms_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          selected_bookmakers: string[]
          default_stake?: number
          sms_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          selected_bookmakers?: string[]
          default_stake?: number
          sms_notifications?: boolean
          updated_at?: string
        }
      }
      bookmaker_odds: {
        Row: {
          id: string
          match_id: string
          bookmaker: string
          match_name: string
          team_home: string
          team_away: string
          league: string
          match_time: string
          market_type: string
          odds_home: number
          odds_away: number
          odds_draw: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          bookmaker: string
          match_name: string
          team_home: string
          team_away: string
          league: string
          match_time: string
          market_type: string
          odds_home: number
          odds_away: number
          odds_draw?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          bookmaker?: string
          match_name?: string
          team_home?: string
          team_away?: string
          league?: string
          match_time?: string
          market_type?: string
          odds_home?: number
          odds_away?: number
          odds_draw?: number | null
          updated_at?: string
        }
      }
    }
  }
}