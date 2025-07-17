import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { fetchArbitrageOpportunities, SUPPORTED_BOOKMAKERS } from '@/lib/api'
import { MatchOdds } from '@/utils/arbitrage'
import { useToast } from '@/hooks/use-toast'

export interface BookmakerOdds {
  id: string
  match_name: string
  sport: string
  league: string
  team_home: string
  team_away: string
  bookmaker: string
  market_type: string
  outcome: string
  odds: number
  match_time: string
  created_at: string
  updated_at: string
}

interface DataContextType {
  odds: MatchOdds[]
  refreshOdds: (showToast?: boolean) => void
  isLoading: boolean
  lastUpdated: Date | null
  refreshInterval: number
  setRefreshInterval: (interval: number) => void
  supportedBookmakers: string[]
  isRefreshing: boolean
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}

interface DataProviderProps {
  children: ReactNode
}

export const DataProvider = ({ children }: DataProviderProps) => {
  const [odds, setOdds] = useLocalStorage<MatchOdds[]>('bookmakerOdds', [])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshInterval, setRefreshInterval] = useLocalStorage<number>('refreshInterval', 30000)
  const { toast } = useToast()

  const refreshOdds = async (showToast = true) => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      console.log('Refresh already in progress, skipping...')
      return
    }
    
    setIsLoading(true)
    setIsRefreshing(true)
    
    try {
      // Get selected bookmakers from local storage
      const storedPrefs = localStorage.getItem('userPreferences')
      let selectedBookmakers = SUPPORTED_BOOKMAKERS
      
      if (storedPrefs) {
        const prefs = JSON.parse(storedPrefs)
        if (prefs.selectedBookmakers && prefs.selectedBookmakers.length > 0) {
          selectedBookmakers = prefs.selectedBookmakers
        }
      }
      
      // Fetch real-time odds for arbitrage opportunities
      const newOdds = await fetchArbitrageOpportunities(selectedBookmakers)
      
      // Update the odds with the new data
      setOdds(newOdds)
      
      // Only show success toast on manual refresh if showToast is true
      if (showToast) {
        toast({
          title: "Data updated",
          description: `Successfully fetched odds from ${selectedBookmakers.length} bookmakers`,
          variant: "default"
        })
      }
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error refreshing odds:', error)
      
      // Show error message to user only if showToast is true
      if (showToast) {
        toast({
          title: "Refresh failed",
          description: "Failed to fetch odds data. Please check your connection and try again.",
          variant: "destructive"
        })
      }
      
      // Keep using existing odds if we have them
      if (odds.length === 0 && showToast) {
        toast({
          title: "No data available",
          description: "Unable to fetch odds data. Please check your network connection.",
          variant: "destructive"
        })
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Load initial data if empty
  useEffect(() => {
    if (odds.length === 0) {
      refreshOdds(false) // Don't show toast on initial load
    } else {
      // Set last updated time from cached data
      const latestOdd = odds.reduce((latest, odd) => {
        const oddDate = new Date(odd.updated_at)
        const latestDate = latest ? new Date(latest.updated_at) : new Date(0)
        return oddDate > latestDate ? odd : latest
      }, null as MatchOdds | null)
      
      if (latestOdd) {
        setLastUpdated(new Date(latestOdd.updated_at))
      }
    }
  }, [])

  return (
    <DataContext.Provider value={{
      odds,
      refreshOdds,
      isLoading,
      lastUpdated,
      refreshInterval,
      setRefreshInterval,
      supportedBookmakers: SUPPORTED_BOOKMAKERS,
      isRefreshing
    }}>
      {children}
    </DataContext.Provider>
  )
}