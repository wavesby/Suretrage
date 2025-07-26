import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { fetchArbitrageOpportunities, SUPPORTED_BOOKMAKERS, validateOddsQuality, fetchAllOddsFromServer } from '@/lib/api'
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
  const [isLoading, setIsLoading] = useState(true) // Start with loading state
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
    
    // Track whether we found valid data
    let foundValidData = false;
    
    try {
      // Try all available methods to get odds data
      let newOdds: MatchOdds[] = [];
      
      // Method 1: Try to load data from localStorage first as immediate fallback
      try {
        const cachedOddsStr = localStorage.getItem('bookmakerOdds');
        if (cachedOddsStr) {
          const cachedOdds = JSON.parse(cachedOddsStr);
          if (Array.isArray(cachedOdds) && cachedOdds.length > 0) {
            console.log('Using cached odds from localStorage while fetching fresh data');
            // Use cached odds temporarily while we fetch fresh data
            setOdds(cachedOdds);
            setIsLoading(false); // Show something to the user quickly
          }
        }
      } catch (e) {
        console.error('Error loading cached odds from localStorage', e);
      }
      
      // Method 2: Try to get data directly from the API server (fastest)
      try {
        console.log('Attempting to get data directly from API server...');
        console.log('Trying direct API URL: http://localhost:3001/api/odds');
        newOdds = await fetchAllOddsFromServer();
        console.log('Data fetched successfully, items:', newOdds?.length || 0);
        foundValidData = true;
      } catch (directError: any) {
        console.error('Error using direct API URL:', directError);
        
        // Method 3: Try with relative URL
        try {
          console.log('Trying relative API URL: /api/odds');
          const response = await fetch('/api/odds', { 
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const data = await response.json();
          newOdds = Array.isArray(data) ? data : data.events || [];
          console.log('Data fetched with relative URL, items:', newOdds?.length || 0);
          foundValidData = true;
        } catch (relativeError: any) {
          console.error('Error using relative API URL:', relativeError);
          
          // Method 4: Fetch data for individual bookmakers
          try {
            console.log('Trying individual bookmaker endpoints');
            
            // Get selected bookmakers from local storage
            const storedPrefs = localStorage.getItem('userPreferences');
            let selectedBookmakers = SUPPORTED_BOOKMAKERS.slice(0, 3); // Limit to top 3 by default
            
            if (storedPrefs) {
              try {
                const prefs = JSON.parse(storedPrefs);
                if (prefs.selectedBookmakers && prefs.selectedBookmakers.length > 0) {
                  selectedBookmakers = prefs.selectedBookmakers;
                }
              } catch (e) {
                console.error('Error parsing stored preferences:', e);
              }
            }
            
            console.log(`Fetching odds for bookmakers: ${selectedBookmakers.join(', ')}`);
            
            // Fetch odds for each bookmaker individually
            const bookmakerPromises = selectedBookmakers.map(async (bookmaker) => {
              try {
                const url = `/api/odds/${bookmaker.toLowerCase()}`;
                console.log(`Fetching from ${url}`);
                const response = await fetch(url, { 
                  headers: { 'Accept': 'application/json' },
                  signal: AbortSignal.timeout(8000)
                });
                
                if (!response.ok) return [];
                
                const data = await response.json();
                return Array.isArray(data) ? data : [];
              } catch (error) {
                console.error(`Error fetching ${bookmaker} odds:`, error);
                return [];
              }
            });
            
            const bookmakerResults = await Promise.all(bookmakerPromises);
            newOdds = bookmakerResults.flat();
            console.log('Combined individual bookmaker data, items:', newOdds?.length || 0);
            foundValidData = newOdds.length > 0;
          } catch (individualError) {
            console.error('Error fetching individual bookmaker data:', individualError);
          }
        }
      }
      
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
            description: `Successfully fetched ${newOdds.length} odds events`,
            variant: "default"
          });
        }
        
        // Store in localStorage for offline fallback
        localStorage.setItem('bookmakerOdds', JSON.stringify(newOdds));
      } else if (newOdds.length > 0) {
        // We got some data but it may be lower quality
        console.warn(`Odds data quality issue: ${message}`);
        setOdds(newOdds);
        setLastUpdated(new Date());
        setLastRefreshStatus('partial');
        setConnectionStatus('degraded');
        
        // Store in localStorage for offline fallback
        localStorage.setItem('bookmakerOdds', JSON.stringify(newOdds));
        
        if (showToast) {
          toast({
            title: "Data partially updated",
            description: "Some odds data may be outdated or incomplete",
            variant: "destructive" // Changed from "warning" to "destructive"
          });
        }
      } else if (!foundValidData) {
        // No valid data returned - try to use what's already in state
        console.error("No valid odds data received");
        setLastRefreshStatus('failed');
        setRefreshAttempts(prev => prev + 1);
        setConnectionStatus('degraded');
        
        // Check if we already have data to use
        if (odds.length === 0) {
          // If we have no data at all, show a clear error
          if (showToast) {
            toast({
              title: "No odds data available",
              description: "Please check your connection or try again later.",
              variant: "destructive"
            });
          }
        } else {
          // We have existing data, so just show a warning that it couldn't be refreshed
          if (showToast) {
            toast({
              title: "Refresh failed",
              description: "Using existing odds data. Will retry in background.",
              variant: "destructive"
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Error refreshing odds:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('API Error Response:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.request) {
        console.error('No response received from API:', error.request);
      } else {
        console.error('Request setup error:', error.message);
      }
      
      setLastRefreshStatus('failed');
      setRefreshAttempts(prev => prev + 1);
      
      // Update connection status if there appears to be a network issue
      if (error instanceof Error && 
          (error.message.includes('network') || 
           error.message.includes('timeout') || 
           error.message.includes('connection'))) {
        setConnectionStatus('degraded');
      }
      
      // Show error message to user only if showToast is true and we don't have existing data
      if (showToast && odds.length === 0) {
        toast({
          title: "Refresh failed",
          description: "Failed to fetch odds data. Please check your connection and try again.",
          variant: "destructive"
        });
      } else if (showToast) {
        toast({
          title: "Refresh failed",
          description: "Using existing odds data. Will retry in background.",
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
    // Small delay to allow the UI to render first
    const timer = setTimeout(() => {
      refreshOdds(false); // Don't show toast on initial load
    }, 500);
    
    return () => clearTimeout(timer);
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
};