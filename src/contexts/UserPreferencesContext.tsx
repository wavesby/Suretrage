import { createContext, useContext, ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export interface UserPreferences {
  selectedBookmakers: string[]
  defaultStake: number
  notificationsEnabled: boolean
}

interface UserPreferencesContextType {
  preferences: UserPreferences
  updateSelectedBookmakers: (bookmakers: string[]) => void
  updateDefaultStake: (stake: number) => void
  toggleNotifications: () => void
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext)
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider')
  }
  return context
}

interface UserPreferencesProviderProps {
  children: ReactNode
}

export const UserPreferencesProvider = ({ children }: UserPreferencesProviderProps) => {
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>('userPreferences', {
    selectedBookmakers: [],
    defaultStake: 10000,
    notificationsEnabled: true
  })

  const updateSelectedBookmakers = (bookmakers: string[]) => {
    setPreferences(prev => ({ ...prev, selectedBookmakers: bookmakers }))
  }

  const updateDefaultStake = (stake: number) => {
    setPreferences(prev => ({ ...prev, defaultStake: stake }))
  }

  const toggleNotifications = () => {
    setPreferences(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))
  }

  return (
    <UserPreferencesContext.Provider value={{
      preferences,
      updateSelectedBookmakers,
      updateDefaultStake,
      toggleNotifications
    }}>
      {children}
    </UserPreferencesContext.Provider>
  )
}