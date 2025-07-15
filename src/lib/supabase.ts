import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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