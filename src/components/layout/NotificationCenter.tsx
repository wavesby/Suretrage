import { useState } from 'react'
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  Settings, 
  AlertTriangle, 
  Info,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BellRing
} from 'lucide-react'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import { useNotifications, Notification } from '@/contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    preferences,
    updatePreferences,
    subscribeToPushNotifications,
    isSubscribedToPush
  } = useNotifications()

  const [open, setOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const navigate = useNavigate()

  const getNotificationIcon = (type: Notification['type']) => {
    switch(type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-amber-600" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <BellRing className="h-4 w-4 text-muted-foreground" />
    }
  }

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    
    if (notification.link) {
      navigate(notification.link)
      setOpen(false)
    }
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (e) {
      return 'recently'
    }
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="icon" variant="ghost" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="end">
          {showSettings ? (
            <div className="space-y-4 p-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Notification Settings</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">In-App Notifications</div>
                    <div className="text-xs text-muted-foreground">Show notifications in app</div>
                  </div>
                  <Switch 
                    checked={preferences.inApp} 
                    onCheckedChange={(checked) => updatePreferences({ inApp: checked })} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-xs text-muted-foreground">
                      {isSubscribedToPush ? 'Browser notifications enabled' : 'Enable browser notifications'}
                    </div>
                  </div>
                  <Switch 
                    checked={preferences.push && isSubscribedToPush} 
                    onCheckedChange={(checked) => {
                      if (checked && !isSubscribedToPush) {
                        subscribeToPushNotifications();
                      } else {
                        updatePreferences({ push: checked });
                      }
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-xs text-muted-foreground">Receive email alerts</div>
                  </div>
                  <Switch 
                    checked={preferences.email} 
                    onCheckedChange={(checked) => updatePreferences({ email: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">SMS Notifications</div>
                    <div className="text-xs text-muted-foreground">Receive SMS alerts</div>
                  </div>
                  <Switch 
                    checked={preferences.sms} 
                    onCheckedChange={(checked) => updatePreferences({ sms: checked })}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <div className="font-medium mb-2">Minimum Profit Threshold</div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[preferences.minProfitThreshold]}
                      min={0.5}
                      max={10}
                      step={0.5}
                      onValueChange={(value) => updatePreferences({ minProfitThreshold: value[0] })}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {preferences.minProfitThreshold}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only notify for opportunities with profit above this threshold
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-medium">Notifications</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={markAllAsRead} title="Mark all as read">
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={clearAll} title="Clear all">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} title="Settings">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No notifications yet</p>
                    <p className="text-xs mt-1">New arbitrage opportunities will appear here</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-3 border-b hover:bg-accent/50 transition-colors cursor-pointer ${
                          notification.read ? '' : 'bg-accent/20'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 pt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="font-medium text-sm">{notification.title}</div>
                            <div className="text-sm">{notification.message}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(notification.timestamp)}
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="flex-shrink-0">
                              <div className="h-2 w-2 rounded-full bg-primary"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-2 border-t">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto text-xs"
                      onClick={() => setShowSettings(true)}
                    >
                      Notification settings
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
} 