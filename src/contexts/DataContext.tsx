import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { fetchArbitrageOpportunities, SUPPORTED_BOOKMAKERS, validateOddsQuality } from '@/lib/api'
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
  lastRefreshStatus: 'success' | 'partial' | 'failed' | null
  connectionStatus: 'online' | 'offline' | 'degraded'
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
  const [refreshAttempts, setRefreshAttempts] = useState(0)
  const [lastRefreshStatus, setLastRefreshStatus] = useState<'success' | 'partial' | 'failed' | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'degraded'>('online')
  const { toast } = useToast()

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh odds on interval
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      if (!isRefreshing && connectionStatus !== 'offline') {
        console.log(`Auto-refreshing odds (interval: ${refreshInterval / 1000}s)`);
        refreshOdds(false);
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, isRefreshing, connectionStatus]);

  // Retry mechanism for failed refreshes
  useEffect(() => {
    if (lastRefreshStatus === 'failed' && refreshAttempts < 3) {
      const retryDelay = Math.min(2000 * (refreshAttempts + 1), 10000);
      
      const retryTimer = setTimeout(() => {
        console.log(`Retry attempt ${refreshAttempts + 1} after failed refresh`);
        refreshOdds(false);
      }, retryDelay);

      return () => clearTimeout(retryTimer);
    }
  }, [lastRefreshStatus, refreshAttempts]);

  const refreshOdds = async (showToast = true) => {
    // Prevent multiple simultaneous refreshes
    if (isRefreshing) {
      console.log('Refresh already in progress, skipping...');
      return;
    }
    
    // Check connection
    if (connectionStatus === 'offline') {
      if (showToast) {
        toast({
          title: "Unable to refresh",
          description: "You appear to be offline. Please check your connection.",
          variant: "destructive"
        });
      }
      return;
    }
    
    setIsLoading(true);
    setIsRefreshing(true);
    
    try {
      // Get selected bookmakers from local storage
      const storedPrefs = localStorage.getItem('userPreferences');
      let selectedBookmakers = SUPPORTED_BOOKMAKERS;
      
      if (storedPrefs) {
        const prefs = JSON.parse(storedPrefs);
        if (prefs.selectedBookmakers && prefs.selectedBookmakers.length > 0) {
          selectedBookmakers = prefs.selectedBookmakers;
        }
      }
      
      console.log(`Fetching odds for bookmakers: ${selectedBookmakers.join(', ')}`);
      
      // Fetch real-time odds for arbitrage opportunities
      const newOdds = await fetchArbitrageOpportunities(selectedBookmakers);
      
      // Validate the quality of the odds data
      const { valid, message } = validateOddsQuality(newOdds);
      
      if (valid && newOdds.length > 0) {
        // Update the odds with the new valid data
        setOdds(newOdds);
        setLastUpdated(new Date());
        setLastRefreshStatus('success');
        setRefreshAttempts(0);
        setConnectionStatus('online');
        
        // Only show success toast on manual refresh if showToast is true
        if (showToast) {
          toast({
            title: "Data updated",
            description: `Successfully fetched odds from ${selectedBookmakers.length} bookmakers`,
            variant: "default"
          });
        }
      } else if (newOdds.length > 0) {
        // We got some data but it may be lower quality
        console.warn(`Odds data quality issue: ${message}`);
        setOdds(newOdds);
        setLastUpdated(new Date());
        setLastRefreshStatus('partial');
        setConnectionStatus('degraded');
        
        if (showToast) {
          toast({
            title: "Data partially updated",
            description: "Some odds data may be outdated or incomplete",
            variant: "warning"
          });
        }
      } else {
        // No valid data returned
        console.error("No valid odds data received");
        setLastRefreshStatus('failed');
        setRefreshAttempts(prev => prev + 1);
        setConnectionStatus('degraded');
        
        // Only show error toast on manual refresh
        if (showToast) {
          toast({
            title: "Refresh failed",
            description: "Failed to fetch odds data. Retrying in background.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing odds:', error);
      setLastRefreshStatus('failed');
      setRefreshAttempts(prev => prev + 1);
      
      // Update connection status if there appears to be a network issue
      if (error instanceof Error && 
          (error.message.includes('network') || 
           error.message.includes('timeout') || 
           error.message.includes('connection'))) {
        setConnectionStatus('degraded');
      }
      
      // Show error message to user only if showToast is true
      if (showToast) {
        toast({
          title: "Refresh failed",
          description: "Failed to fetch odds data. Please check your connection and try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load initial data on mount
  useEffect(() => {
    refreshOdds(false); // Don't show toast on initial load
  }, []);

  return (
    <DataContext.Provider value={{
      odds,
      refreshOdds,
      isLoading,
      lastUpdated,
      refreshInterval,
      setRefreshInterval,
      supportedBookmakers: SUPPORTED_BOOKMAKERS,
      isRefreshing,
      lastRefreshStatus,
      connectionStatus
    }}>
      {children}
    </DataContext.Provider>
  );
}