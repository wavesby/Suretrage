import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { generateMockOdds } from '@/utils/mockData'

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
  odds: BookmakerOdds[]
  refreshOdds: () => void
  seedMockData: () => void
  isLoading: boolean
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
  const [odds, setOdds] = useLocalStorage<BookmakerOdds[]>('bookmakerOdds', [])
  const [isLoading, setIsLoading] = useState(false)

  const refreshOdds = () => {
    setIsLoading(true)
    // Simulate API call delay
    setTimeout(() => {
      const newOdds = generateMockOdds()
      setOdds(newOdds as any)
      setIsLoading(false)
    }, 1000)
  }

  const seedMockData = () => {
    setIsLoading(true)
    setTimeout(() => {
      const mockOdds = generateMockOdds()
      setOdds(mockOdds as any)
      setIsLoading(false)
    }, 500)
  }

  // Auto-refresh odds every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (odds.length > 0) {
        const newOdds = generateMockOdds()
        setOdds(newOdds as any)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [odds.length, setOdds])

  // Load initial data if empty
  useEffect(() => {
    if (odds.length === 0) {
      seedMockData()
    }
  }, [])

  return (
    <DataContext.Provider value={{
      odds,
      refreshOdds,
      seedMockData,
      isLoading
    }}>
      {children}
    </DataContext.Provider>
  )
}