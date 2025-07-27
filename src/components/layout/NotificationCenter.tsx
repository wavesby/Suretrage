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
  RefreshCw,
  Sparkles,
  Zap,
  Activity,
  Settings,
  Trash2,
  Filter,
  Clock,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const NotificationCenter = () => {
  const { notifications, markAsRead, clearAll } = useNotifications();
  const { lastRefreshStatus, connectionStatus, lastUpdated, isRefreshing, refreshOdds } = useData();
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'system'>('all');
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
    if (isRefreshing) {
      return <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />;
    }
    
    if (connectionStatus === 'offline') {
      return <WifiOff className="h-3.5 w-3.5 text-destructive" />;
    }
    
    if (lastRefreshStatus === 'success') {
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    }
    
    if (lastRefreshStatus === 'failed') {
      return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    }
    
    return <Wifi className="h-3.5 w-3.5 text-primary" />;
  };

  const getStatusMessage = () => {
    if (isRefreshing) return 'Syncing...';
    if (connectionStatus === 'offline') return 'Offline';
    if (lastRefreshStatus === 'success') return 'Live';
    if (lastRefreshStatus === 'failed') return 'Error';
    return 'Ready';
  };

  const getStatusColor = () => {
    if (isRefreshing) return 'border-primary/50 bg-primary/10 text-primary';
    if (connectionStatus === 'offline') return 'border-destructive/50 bg-destructive/10 text-destructive';
    if (lastRefreshStatus === 'success') return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500';
    if (lastRefreshStatus === 'failed') return 'border-destructive/50 bg-destructive/10 text-destructive';
    return 'border-primary/50 bg-primary/10 text-primary';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'system':
        return <Settings className="h-4 w-4 text-blue-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'error':
        return <X className="h-4 w-4 text-red-400" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'system') return notification.type === 'info' || notification.type === 'warning';
    return true;
  });

  const markAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markAsRead(notification.id);
      }
    });
  };

  return (
    <TooltipProvider>
      {/* Enhanced Notification Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="relative glass hover:shadow-glow transition-all duration-300"
            onClick={toggleOpen}
            aria-label="Notifications"
          >
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-400 to-pink-400 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {muted ? (
              <BellOff className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
            ) : (
              <Bell className="h-[1.2rem] w-[1.2rem] text-primary" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="glass">
          <p>Notifications {unreadCount > 0 && `(${unreadCount} unread)`}</p>
        </TooltipContent>
      </Tooltip>
      
      {/* Enhanced Status Indicator */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || connectionStatus === 'offline'}
            className={`ml-2 h-8 px-3 text-xs flex items-center gap-2 rounded-full border transition-all duration-300 glass hover:shadow-glow ${getStatusColor()}`}
          >
            {getStatusIcon()}
            <span className="max-sm:hidden font-medium">{getStatusMessage()}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="glass">
          <p>
            {isRefreshing 
              ? 'Refreshing data...' 
              : connectionStatus === 'offline' 
                ? 'Connection offline' 
                : lastRefreshStatus === 'success' 
                  ? 'System running smoothly' 
                  : 'Click to refresh data'
            }
          </p>
        </TooltipContent>
      </Tooltip>

      {/* Enhanced Notification Panel */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-fade-in" 
          onClick={() => setOpen(false)}
        >
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl animate-slide-in-from-right glass border-l border-primary/20"
            onClick={e => e.stopPropagation()}
          >
            {/* Enhanced Header */}
            <CardHeader className="pb-3 border-b border-border/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-primary rounded-lg blur-md opacity-50"></div>
                    <div className="relative glass p-2 rounded-lg">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gradient">
                      Neural Alerts
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {filteredNotifications.length} notifications
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setOpen(false)}
                    className="glass hover:shadow-glow transition-all duration-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Enhanced Controls */}
              <div className="flex items-center justify-between mt-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="mute" 
                      checked={muted}
                      onCheckedChange={toggleMute}
                      className="data-[state=checked]:bg-primary"
                    />
                    <Label htmlFor="mute" className="text-sm font-medium">
                      {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </Label>
                  </div>
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="h-7 px-2 text-xs"
                  >
                    All
                  </Button>
                  <Button
                    variant={filter === 'unread' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('unread')}
                    className="h-7 px-2 text-xs"
                  >
                    Unread
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              {filteredNotifications.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  {unreadCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={markAllAsRead}
                      className="glass hover:shadow-glow transition-all duration-300"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Mark All Read
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    className="glass hover:shadow-glow transition-all duration-300 text-destructive border-destructive/30"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-gradient-primary rounded-full blur-xl opacity-20"></div>
                      <BellOff className="relative h-12 w-12 opacity-30" />
                    </div>
                    <h3 className="font-semibold mb-2">No Notifications</h3>
                    <p className="text-sm">
                      {filter === 'unread' 
                        ? 'All notifications have been read' 
                        : 'New arbitrage opportunities and system alerts will appear here'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/20">
                    {filteredNotifications.map((notification, index) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 transition-all duration-300 hover:bg-primary/5 cursor-pointer ${
                          notification.read ? '' : 'bg-gradient-to-r from-primary/10 to-accent/5 border-l-2 border-primary'
                        } ${index === 0 ? 'animate-slide-in-from-top' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-semibold text-sm text-foreground">
                                {notification.title}
                              </h5>
                                                             <Button
                                 variant="ghost"
                                 size="icon"
                                 className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   // Individual clear not available - mark as read instead
                                   markAsRead(notification.id);
                                 }}
                               >
                                 <X className="h-3 w-3" />
                               </Button>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {new Date(notification.timestamp).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                                                             <div className="flex items-center gap-2">
                                 {notification.type === 'success' && (
                                   <Badge variant="outline" className="text-[10px] h-4 bg-green-400/10 text-green-400 border-green-400/30">
                                     <Sparkles className="h-2 w-2 mr-1" />
                                     Profit
                                   </Badge>
                                 )}
                                 {!notification.read && (
                                   <Badge variant="outline" className="text-[10px] h-4 bg-primary/10 text-primary border-primary/30">
                                     <Zap className="h-2 w-2 mr-1" />
                                     New
                                   </Badge>
                                 )}
                               </div>
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
    </TooltipProvider>
  );
}; 