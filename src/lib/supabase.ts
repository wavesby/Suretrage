import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return (
    supabaseUrl !== 'https://your-supabase-url.supabase.co' &&
    supabaseAnonKey !== 'your-anon-key' &&
    supabaseUrl.includes('.supabase.co') &&
    supabaseAnonKey.length > 20
  )
}

// Helper function to create a new user profile after signup
export const createUserProfile = async (userId: string, userData: any) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email: userData.email,
          full_name: userData.full_name || '',
          avatar_url: userData.avatar_url || '',
          updated_at: new Date(),
          created_at: new Date()
        }
      ])
    
    if (error) {
      console.error('Error creating user profile:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error in createUserProfile:', error)
    return false
  }
}

// Helper function to get a user's profile data
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

// Helper function to update a user's profile data
export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', userId)
    
    if (error) {
      console.error('Error updating user profile:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error in updateUserProfile:', error)
    return false
  }
}

// Helper function to save user preferences
export const saveUserPreferences = async (userId: string, preferences: any) => {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        preferences: preferences,
        updated_at: new Date()
      }, { onConflict: 'user_id' })
    
    if (error) {
      console.error('Error saving user preferences:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error in saveUserPreferences:', error)
    return false
  }
}

// Helper function to get user preferences
export const getUserPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user preferences:', error)
      return null
    }
    
    return data?.preferences
  } catch (error) {
    console.error('Error in getUserPreferences:', error)
    return null
  }
}

// Helper function to check if a user is an admin
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
    
    if (error || !data) {
      console.error('Error checking admin status:', error)
      return false
    }
    
    return data.is_admin === true
  } catch (error) {
    console.error('Error in isUserAdmin:', error)
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