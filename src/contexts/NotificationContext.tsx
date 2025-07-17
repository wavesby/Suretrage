import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useToast } from '@/hooks/use-toast'
import { ArbitrageOpportunity } from '@/utils/arbitrage'
import { useAuth } from './AuthContext'
import { supabase } from '@/lib/supabase'

// Types for notifications
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  timestamp: string
  link?: string
  opportunityId?: string
}

interface NotificationPreferences {
  inApp: boolean
  push: boolean
  email: boolean
  sms: boolean
  minProfitThreshold: number
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  notifyNewOpportunity: (opportunity: ArbitrageOpportunity) => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  preferences: NotificationPreferences
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void
  subscribeToPushNotifications: () => Promise<boolean>
  isSubscribedToPush: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', [])
  const [preferences, setPreferences] = useLocalStorage<NotificationPreferences>('notificationPreferences', {
    inApp: true,
    push: false,
    email: false,
    sms: false,
    minProfitThreshold: 1.0 // Minimum profit percentage to trigger notification
  })
  const [isSubscribedToPush, setIsSubscribedToPush] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  // Check for push notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setIsSubscribedToPush(Notification.permission === 'granted')
    }
  }, [])

  // Setup real-time notification channel with Supabase
  useEffect(() => {
    if (!user) return

    // Subscribe to user-specific notification channel
    const channel = supabase.channel(`user_notifications:${user.id}`)
      .on('broadcast', { event: 'notification' }, (payload) => {
        if (payload.payload && typeof payload.payload === 'object') {
          const { title, message, type = 'info', link } = payload.payload as any
          addNotification({ title, message, type, link })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Handle push notification permission
  const subscribeToPushNotifications = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: 'Push Notifications Not Supported',
        description: 'Your browser does not support push notifications',
        variant: 'destructive'
      })
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      const granted = permission === 'granted'
      
      setIsSubscribedToPush(granted)
      setPreferences(prev => ({ ...prev, push: granted }))
      
      if (granted) {
        // Register service worker for push notifications
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready
          
          // Here you would normally register with a push service
          // This is a simplified implementation
          console.log('Service worker ready for push notifications', registration)
          
          toast({
            title: 'Push Notifications Enabled',
            description: 'You will now receive alerts for new opportunities'
          })
        }
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Push notification permission was denied',
          variant: 'destructive'
        })
      }
      
      return granted
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      toast({
        title: 'Notification Error',
        description: 'Failed to enable push notifications',
        variant: 'destructive'
      })
      return false
    }
  }

  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false
    }
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 100)) // Keep only last 100 notifications
    
    // Show toast for new notification
    if (preferences.inApp) {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default'
      })
    }
    
    // Send push notification if enabled
    if (preferences.push && isSubscribedToPush && 'Notification' in window) {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        })
      } catch (error) {
        console.error('Error sending push notification:', error)
      }
    }
  }

  // Notify about a new arbitrage opportunity
  const notifyNewOpportunity = (opportunity: ArbitrageOpportunity) => {
    // Only notify if profit is above threshold
    if (opportunity.profitPercentage < preferences.minProfitThreshold) {
      return
    }
    
    const profitFormatted = opportunity.profitPercentage.toFixed(2)
    const title = `New ${profitFormatted}% Profit Opportunity`
    const message = `${opportunity.matchName} - ${opportunity.bookmakers.map(b => b.bookmaker).join(' vs ')} - Profit: ${profitFormatted}%`
    
    addNotification({
      title,
      message,
      type: opportunity.profitPercentage > 3 ? 'success' : 'info',
      link: `/?opportunity=${opportunity.id}`,
      opportunityId: opportunity.id
    })
  }

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  // Clear all notifications
  const clearAll = () => {
    setNotifications([])
  }

  // Update notification preferences
  const updatePreferences = (prefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }))
    
    // If user is enabling push notifications but hasn't granted permission yet
    if (prefs.push && !isSubscribedToPush && 'Notification' in window) {
      subscribeToPushNotifications()
    }
    
    // Save preferences to database if user is logged in
    if (user) {
      try {
        const updatedPrefs = { ...preferences, ...prefs }
        
        // Save to Supabase if available
        supabase.from('user_preferences')
          .upsert({
            user_id: user.id,
            preferences: {
              ...updatedPrefs,
              notifications: updatedPrefs
            }
          })
          .then(({ error }) => {
            if (error) console.error('Error saving notification preferences:', error)
          })
      } catch (error) {
        console.error('Error saving preferences:', error)
      }
    }
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearAll,
      notifyNewOpportunity,
      addNotification,
      preferences,
      updatePreferences,
      subscribeToPushNotifications,
      isSubscribedToPush
    }}>
      {children}
    </NotificationContext.Provider>
  )
}