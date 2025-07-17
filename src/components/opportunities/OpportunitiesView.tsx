import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { 
  RefreshCw, 
  Search, 
  AlertCircle, 
  Filter, 
  SlidersHorizontal, 
  ChevronDown, 
  ArrowUpDown, 
  Percent,
  Clock,
  BarChart3,
  Settings2,
  Gauge,
  WifiOff
} from 'lucide-react'
import { OpportunityCard } from './OpportunityCard'
import { ArbitrageOpportunity, MatchOdds, calculateArbitrage, hasArbitrageExpired, formatCurrency } from '@/utils/arbitrage'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useUserPreferences } from '@/contexts/UserPreferencesContext'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export const OpportunitiesView = () => {
  // Context hooks
  const { odds, refreshOdds, isLoading, lastUpdated, refreshInterval, setRefreshInterval, isRefreshing } = useData()
  const { user } = useAuth()
  const { notifyNewOpportunity } = useNotifications()
  const { preferences } = useUserPreferences()
  const { toast } = useToast()

  // State
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [filteredOpportunities, setFilteredOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [stakeAmount, setStakeAmount] = useState(preferences.defaultStake || 10000)
  const [searchTerm, setSearchTerm] = useState('')
  const [previousOpportunityIds, setPreviousOpportunityIds] = useState<Set<string>>(new Set())
  const [showSettings, setShowSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const selectedBookmakersRef = useRef<string[]>(preferences.selectedBookmakers || [])

  // Filter state
  const [activeView, setActiveView] = useState('all')
  const [sortBy, setSortBy] = useState<'profit' | 'date' | 'league' | 'confidence'>('profit')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [minProfit, setMinProfit] = useState(0)
  const [minConfidence, setMinConfidence] = useState(0)
  const [selectedBookmakers, setSelectedBookmakers] = useState<string[]>([])
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([])
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [marketTypeFilter, setMarketTypeFilter] = useState<'all' | '1x2' | 'over/under'>('all')

  // Load initial preferences
  useEffect(() => {
    if (preferences.selectedBookmakers) {
      setSelectedBookmakers(preferences.selectedBookmakers)
      selectedBookmakersRef.current = preferences.selectedBookmakers
    }
  }, [])

  // Check if bookmaker selection has changed
  useEffect(() => {
    const storedPrefs = localStorage.getItem('userPreferences')
    if (storedPrefs) {
      const prefs = JSON.parse(storedPrefs)
      if (prefs.selectedBookmakers) {
        const currentBookmakers = prefs.selectedBookmakers
        
        // Check if the bookmaker selection has changed
        const hasChanged = currentBookmakers.length !== selectedBookmakersRef.current.length || 
          currentBookmakers.some(bm => !selectedBookmakersRef.current.includes(bm))
        
        if (hasChanged) {
          console.log('Bookmaker selection changed, refreshing data...')
          selectedBookmakersRef.current = currentBookmakers
          setSelectedBookmakers(currentBookmakers)
          refreshOdds(false) // Refresh without toast notification
        }
      }
    }
  }, [preferences])

  // Calculate opportunities when odds change
  useEffect(() => {
    if (odds.length > 0) {
      loadOpportunities()
      setError(null) // Clear any previous errors when we have data
      setIsInitialLoad(false)
    } else if (odds.length === 0 && !isLoading && retryCount > 0) {
      setError('No odds data available. Please check your connection or selected bookmakers.')
    }
  }, [odds])

  // Apply filters when opportunities or filter criteria change
  useEffect(() => {
    applyFilters()
  }, [opportunities, searchTerm, activeView, minProfit, minConfidence, selectedLeagues, riskFilter, sortBy, sortOrder, marketTypeFilter])

  const loadOpportunities = useCallback(() => {
    if (!odds || odds.length === 0) {
      if (!isLoading) {
        setRetryCount(prev => prev + 1)
      }
      return
    }
    
    try {
      // Filter odds to only include user's selected bookmakers if they have any
      const filteredOdds = selectedBookmakersRef.current.length > 0 
        ? odds.filter(odd => selectedBookmakersRef.current.includes(odd.bookmaker))
        : odds

      if (filteredOdds.length === 0) {
        setError('No odds found for selected bookmakers. Please select different bookmakers.')
        setOpportunities([])
        return
      }

      // Calculate arbitrage opportunities
      const arbOpportunities = calculateArbitrage(filteredOdds as MatchOdds[], stakeAmount)
      
      // Check for new opportunities and notify
      const currentOpportunityIds = new Set(arbOpportunities.map(opp => opp.id))
      const newOpportunities = arbOpportunities.filter(opp => !previousOpportunityIds.has(opp.id))
      
      // Notify about new opportunities (but not on first load)
      if (previousOpportunityIds.size > 0 && !isInitialLoad) {
        newOpportunities.forEach(opportunity => {
          notifyNewOpportunity(opportunity)
        })
        
        // Show toast for new opportunities
        if (newOpportunities.length > 0) {
          toast({
            title: `${newOpportunities.length} New Opportunities`,
            description: `Found ${newOpportunities.length} new arbitrage opportunities`,
            variant: "default"
          })
        }
      }
      
      setPreviousOpportunityIds(currentOpportunityIds)
      setOpportunities(arbOpportunities)
      setError(null) // Clear any previous errors
    } catch (error) {
      console.error('Error calculating opportunities:', error)
      setError('Failed to calculate arbitrage opportunities. Please try again.')
      toast({
        title: "Calculation Failed",
        description: "Failed to calculate arbitrage opportunities",
        variant: "destructive"
      })
    }
  }, [odds, stakeAmount, isInitialLoad])

  const handleRefresh = () => {
    setError(null) // Clear any previous errors
    refreshOdds(true) // Show toast on manual refresh
  }

  const applyFilters = useCallback(() => {
    let filtered = [...opportunities];

    // Text search filter
    if (searchTerm) {
      filtered = filtered.filter(opp =>
        opp.matchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.teamHome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.teamAway.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.league.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.bookmakers.some(b => b.bookmaker.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // View filter (all, high-profit, today, active)
    if (activeView === 'high-profit') {
      filtered = filtered.filter(opp => opp.profitPercentage >= 2)
    } else if (activeView === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      filtered = filtered.filter(opp => {
        const matchDate = new Date(opp.matchTime)
        return matchDate >= today && matchDate < tomorrow
      })
    } else if (activeView === 'active') {
      filtered = filtered.filter(opp => !hasArbitrageExpired(opp.matchTime))
    } else if (activeView === 'guaranteed') {
      // Only show true arbitrage opportunities (not value bets)
      filtered = filtered.filter(opp => opp.arbitragePercentage > 0)
    }

    // Minimum profit filter
    if (minProfit > 0) {
      filtered = filtered.filter(opp => opp.profitPercentage >= minProfit)
    }
    
    // Minimum confidence filter
    if (minConfidence > 0) {
      filtered = filtered.filter(opp => (opp.confidenceScore || 0) >= minConfidence)
    }

    // League filter
    if (selectedLeagues.length > 0) {
      filtered = filtered.filter(opp => selectedLeagues.includes(opp.league))
    }
    
    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(opp => {
        if (!opp.riskAssessment) return false;
        
        switch(riskFilter) {
          case 'low':
            return opp.riskAssessment === 'Low Risk';
          case 'medium':
            return opp.riskAssessment === 'Medium Risk';
          case 'high':
            return opp.riskAssessment === 'High Risk';
          default:
            return true;
        }
      });
    }

    // We've already implemented the market type filter above

    // Market type filter
    if (marketTypeFilter !== 'all') {
      filtered = filtered.filter(opp => {
        if (marketTypeFilter === 'over/under') {
          return opp.marketType === 'OVER_UNDER' || opp.id.includes('-ou');
        } else if (marketTypeFilter === '1x2') {
          return opp.marketType === '1X2' || (!opp.marketType && !opp.id.includes('-ou'));
        }
        return true;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'profit') {
        comparison = a.profitPercentage - b.profitPercentage;
      } else if (sortBy === 'date') {
        comparison = new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime();
      } else if (sortBy === 'league') {
        comparison = a.league.localeCompare(b.league);
      } else if (sortBy === 'confidence') {
        comparison = (a.confidenceScore || 0) - (b.confidenceScore || 0);
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredOpportunities(filtered)
  }, [opportunities, searchTerm, activeView, minProfit, minConfidence, selectedLeagues, riskFilter, sortBy, sortOrder, marketTypeFilter])

  const saveStakePreference = () => {
    // Store in localStorage directly instead of using context
    localStorage.setItem('userPreferences', JSON.stringify({
      ...preferences,
      defaultStake: stakeAmount
    }));
    toast({
      title: "Stake Saved",
      description: `Default stake set to ₦${stakeAmount.toLocaleString()}`
    })
  }

  // Recalculate opportunities when stake changes
  const handleStakeChange = (value: number) => {
    setStakeAmount(value)
    // We don't need to recalculate immediately as stake changes
    // This will be done when user clicks "Save" or refreshes data
  }

  // Extract unique leagues for filtering
  const availableLeagues = Array.from(new Set(opportunities.map(opp => opp.league)));

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };
  
  // Format the last update time
  const getLastUpdateText = () => {
    if (!lastUpdated) return 'Never updated';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdated.getTime();
    
    // If less than a minute, show seconds
    if (diff < 60000) {
      return `Updated ${Math.floor(diff / 1000)}s ago`;
    }
    
    // If less than an hour, show minutes
    if (diff < 3600000) {
      return `Updated ${Math.floor(diff / 60000)}m ago`;
    }
    
    // Otherwise show hours
    return `Updated ${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Arbitrage Opportunities</CardTitle>
              <CardDescription>
                {lastUpdated ? (
                  <span className="flex items-center">
                    <Clock className="mr-1 h-3 w-3" /> {getLastUpdateText()}
                  </span>
                ) : 'No data loaded yet'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
                {isLoading || isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings2 className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>

        {error && (
          <CardContent className="pt-0 pb-3">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="flex items-center">
                <WifiOff className="h-4 w-4 mr-2" /> {error}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        <CardContent>
          {/* Stake input */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="stake" className="text-sm font-medium">
                Stake Amount (₦)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="stake"
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => handleStakeChange(Number(e.target.value))}
                  className="w-full"
                />
                <Button size="sm" onClick={saveStakePreference}>Save</Button>
              </div>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search opportunities..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Risk Level</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setRiskFilter('all')}>
                  All Risks
                  {riskFilter === 'all' && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRiskFilter('low')}>
                  Low Risk Only
                  {riskFilter === 'low' && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRiskFilter('medium')}>
                  Medium Risk Only
                  {riskFilter === 'medium' && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRiskFilter('high')}>
                  High Risk Only
                  {riskFilter === 'high' && " ✓"}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Market Type</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setMarketTypeFilter('all')}>
                  All Markets
                  {marketTypeFilter === 'all' && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMarketTypeFilter('1x2')}>
                  1X2 Markets Only
                  {marketTypeFilter === '1x2' && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMarketTypeFilter('over/under')}>
                  Over/Under Markets Only
                  {marketTypeFilter === 'over/under' && " ✓"}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Leagues</DropdownMenuLabel>
                {availableLeagues.length === 0 ? (
                  <DropdownMenuItem disabled>No leagues available</DropdownMenuItem>
                ) : (
                  availableLeagues.slice(0, 10).map(league => (
                    <DropdownMenuItem 
                      key={league}
                      onClick={() => {
                        if (selectedLeagues.includes(league)) {
                          setSelectedLeagues(selectedLeagues.filter(l => l !== league));
                        } else {
                          setSelectedLeagues([...selectedLeagues, league]);
                        }
                      }}
                    >
                      {league}
                      {selectedLeagues.includes(league) && " ✓"}
                    </DropdownMenuItem>
                  ))
                )}
                
                {availableLeagues.length > 10 && (
                  <DropdownMenuItem disabled>
                    + {availableLeagues.length - 10} more...
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Sort</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSortBy('profit')}>
                  Profit {sortBy === 'profit' && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('date')}>
                  Match Date {sortBy === 'date' && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('league')}>
                  League {sortBy === 'league' && " ✓"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('confidence')}>
                  Confidence Score {sortBy === 'confidence' && " ✓"}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={toggleSortDirection}>
                  {sortOrder === 'desc' ? 'Descending ✓' : 'Ascending ✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="all" value={activeView} onValueChange={setActiveView} className="mb-4">
            <TabsList className="grid grid-cols-5 mb-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="guaranteed">Guaranteed</TabsTrigger>
              <TabsTrigger value="high-profit">High Profit</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
            </TabsList>
            
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="min-profit" className="text-sm">Min Profit %</Label>
                <Slider
                  id="min-profit"
                  min={0}
                  max={10}
                  step={0.5}
                  value={[minProfit]}
                  onValueChange={(values) => setMinProfit(values[0])}
                  className="w-24"
                />
                <Badge variant="outline" className="text-xs">
                  <Percent className="h-3 w-3 mr-1" />
                  {minProfit}%
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Label htmlFor="min-confidence" className="text-sm">Min Confidence</Label>
                <Slider
                  id="min-confidence"
                  min={0}
                  max={10}
                  step={1}
                  value={[minConfidence]}
                  onValueChange={(values) => setMinConfidence(values[0])}
                  className="w-24"
                />
                <Badge variant="outline" className="text-xs">
                  <Gauge className="h-3 w-3 mr-1" />
                  {minConfidence}/10
                </Badge>
              </div>
            </div>
          </Tabs>

          {/* Results count */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredOpportunities.length} of {opportunities.length} opportunities
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities list */}
      {isLoading || isRefreshing ? (
        <div className="flex justify-center items-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-lg text-muted-foreground">Loading opportunities...</span>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No opportunities found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {opportunities.length > 0 
              ? "Try adjusting your filters to see more results" 
              : "No arbitrage opportunities are currently available"}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard 
              key={opportunity.id} 
              opportunity={opportunity}
            />
          ))}
        </div>
      )}
    </div>
  )
}