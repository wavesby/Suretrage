import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/contexts/NotificationContext';
import { useData } from '@/contexts/DataContext';
import { 
  Bell, 
  X, 
  BellOff, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle,
  Wifi,
  WifiOff,
  BarChart4,
  RefreshCw
} from 'lucide-react';

export const NotificationCenter = () => {
  const { notifications, clearNotifications, markAsRead, clearAll } = useNotifications();
  const { lastRefreshStatus, connectionStatus, lastUpdated, isRefreshing, refreshOdds } = useData();
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const toggleOpen = () => setOpen(!open);
  
  const toggleMute = () => {
    setMuted(!muted);
    localStorage.setItem('notifications_muted', (!muted).toString());
  };

  const handleRefresh = () => {
    refreshOdds(true);
  };

  // Restore mute preference
  useEffect(() => {
    const mutePref = localStorage.getItem('notifications_muted');
    if (mutePref) {
      setMuted(mutePref === 'true');
    }
  }, []);

  const getStatusIcon = () => {
    if (isRefreshing) return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    
    if (connectionStatus === 'offline') return <WifiOff className="h-4 w-4 text-red-500" />;
    
    if (connectionStatus === 'degraded') return <Wifi className="h-4 w-4 text-amber-500" />;
    
    if (lastRefreshStatus === 'failed') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    
    if (lastRefreshStatus === 'partial') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    
    if (lastRefreshStatus === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    
    return <Wifi className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusMessage = () => {
    if (isRefreshing) return "Refreshing odds data...";
    
    if (connectionStatus === 'offline') return "You are offline";
    
    if (connectionStatus === 'degraded') return "Limited connectivity";
    
    if (!lastUpdated) return "No data available";
    
    if (lastRefreshStatus === 'failed') return "Failed to update odds";
    
    if (lastRefreshStatus === 'partial') return "Partially updated odds";
    
    // Success or default case
    const lastUpdateTime = lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    }) : '';
    
    return `Last updated at ${lastUpdateTime}`;
  };

  return (
    <>
      {/* Notification Button */}
      <Button 
        variant="ghost" 
        size="icon"
        className="relative"
        onClick={toggleOpen}
        aria-label="Notifications"
      >
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
        {muted ? <BellOff className="h-[1.2rem] w-[1.2rem]" /> : <Bell className="h-[1.2rem] w-[1.2rem]" />}
      </Button>
      
      {/* Status Indicator */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={isRefreshing || connectionStatus === 'offline'}
        className="ml-2 h-8 px-2 text-xs flex items-center gap-1.5 rounded-full border border-muted"
      >
        {getStatusIcon()}
        <span className="max-sm:hidden">{getStatusMessage()}</span>
      </Button>

      {/* Notification Panel */}
      {open && (
        <div className="fixed inset-0 bg-black/20 z-50" onClick={() => setOpen(false)}>
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-sm bg-background shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="mute" 
                      checked={muted}
                      onCheckedChange={toggleMute}
                    />
                    <Label htmlFor="mute">Mute</Label>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{notifications.length} Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} unread
                    </Badge>
                  )}
                </div>
                {notifications.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAll}
                    className="h-8 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Data Status Card */}
              <div className="p-4 border-b">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BarChart4 className="h-4 w-4 text-muted-foreground" />
                  Odds Data Status
                </h4>
                
                <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <div>
                      <div className="text-sm font-medium">{getStatusMessage()}</div>
                      <div className="text-xs text-muted-foreground">
                        {connectionStatus === 'online' ? 'Connection is stable' : 
                         connectionStatus === 'degraded' ? 'Some services unavailable' :
                         'Check your internet connection'}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleRefresh}
                    disabled={isRefreshing || connectionStatus === 'offline'}
                    className={isRefreshing ? "opacity-70" : ""}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-[calc(100vh-12rem)]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <BellOff className="h-10 w-10 mb-3 opacity-30" />
                    <p>No notifications yet</p>
                    <p className="text-xs mt-1">New arbitrage opportunities and system alerts will appear here</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`p-4 ${notification.read ? '' : 'bg-primary/5'}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            p-1 rounded-full shrink-0
                            ${notification.type === 'opportunity' ? 'bg-green-100 text-green-700' : 
                              notification.type === 'warning' ? 'bg-amber-100 text-amber-700' : 
                              notification.type === 'error' ? 'bg-red-100 text-red-700' : 
                              'bg-blue-100 text-blue-700'}
                          `}>
                            {notification.icon || 
                              (notification.type === 'opportunity' ? <BarChart4 className="h-4 w-4" /> :
                               notification.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                               notification.type === 'error' ? <AlertTriangle className="h-4 w-4" /> :
                               <MessageSquare className="h-4 w-4" />)
                            }
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-sm">{notification.title}</h5>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotifications([notification.id]);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.timestamp).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              {!notification.read && (
                                <Badge variant="outline" className="text-[10px] h-4 bg-primary/10">New</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </div>
        </div>
      )}
    </>
  );
}; 