import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useToast } from '@/hooks/use-toast'
import { ArbitrageOpportunity } from '@/utils/arbitrage'

interface NotificationContextType {
  enableNotifications: boolean
  setEnableNotifications: (enabled: boolean) => void
  notifyNewOpportunity: (opportunity: ArbitrageOpportunity) => void
  requestPermission: () => Promise<boolean>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [enableNotifications, setEnableNotifications] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const { toast } = useToast()

  useEffect(() => {
    // Check initial notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission)
      setEnableNotifications(Notification.permission === 'granted')
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive"
      })
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      
      if (permission === 'granted') {
        setEnableNotifications(true)
        toast({
          title: "Notifications enabled",
          description: "You'll now receive alerts for new arbitrage opportunities"
        })
        return true
      } else {
        setEnableNotifications(false)
        toast({
          title: "Notifications denied",
          description: "Please enable notifications in your browser settings",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  const notifyNewOpportunity = (opportunity: ArbitrageOpportunity) => {
    // In-app toast notification
    toast({
      title: "🎯 New Arbitrage Found!",
      description: `${opportunity.matchName} - ${opportunity.profitPercentage.toFixed(2)}% profit`,
      duration: 5000
    })

    // Browser notification if enabled
    if (enableNotifications && permission === 'granted') {
      try {
        new Notification('🎯 New Arbitrage Opportunity!', {
          body: `${opportunity.matchName}\n${opportunity.profitPercentage.toFixed(2)}% profit (₦${opportunity.guaranteedProfit.toLocaleString()})`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `arbitrage-${opportunity.id}`,
          requireInteraction: true
        })
      } catch (error) {
        console.error('Error showing notification:', error)
      }
    }
  }

  const value = {
    enableNotifications,
    setEnableNotifications,
    notifyNewOpportunity,
    requestPermission
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}