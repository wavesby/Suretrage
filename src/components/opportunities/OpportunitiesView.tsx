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
  Percent,
  Clock,
  Settings2,
  Gauge,
  WifiOff,
  Sparkles,
  Zap,
  Target,
  Activity,
  Brain,
  Cpu,
  HelpCircle,
  Info,
  TrendingUp,
  Users,
  BarChart3
} from 'lucide-react'
import { OpportunityCard } from './OpportunityCard'
import { ArbitrageOpportunity, MatchOdds, calculateArbitrage, hasArbitrageExpired, formatCurrency } from '@/utils/arbitrage'
import { useData } from '@/contexts/DataContext'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useUserPreferences } from '@/contexts/UserPreferencesContext'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'

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
    <TooltipProvider>
      <div className="container mx-auto p-4 pb-24">
        {/* Optimized header card */}
        <Card className="futuristic-card mb-6">
          <div className="h-1 w-full bg-gradient-primary rounded-t-lg"></div>
          
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-gradient flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  Neural Arbitrage Engine
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {lastUpdated ? (
                    <>
                      <Activity className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-medium">{getLastUpdateText()}</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4 text-muted-foreground animate-spin-slow" />
                      <span>Initializing...</span>
                    </>
                  )}
                </CardDescription>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                  className="glass hover:shadow-glow transition-all duration-300"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
                  {isLoading || isRefreshing ? 'Syncing...' : 'Refresh'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="glass hover:shadow-glow transition-all duration-300"
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Config
                </Button>
              </div>
            </div>
          </CardHeader>

          {error && (
            <CardContent className="pt-0 pb-4">
              <Alert variant="destructive" className="glass border-red-400/30 bg-red-400/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>System Alert</AlertTitle>
                <AlertDescription className="flex items-center">
                  <WifiOff className="h-4 w-4 mr-2" /> {error}
                </AlertDescription>
              </Alert>
            </CardContent>
          )}

          <CardContent className="space-y-4">
            {/* Simplified stake input */}
            <div className="glass p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label htmlFor="stake" className="text-sm font-semibold text-gradient mb-2 block">
                    Stake Amount (₦)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="stake"
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => handleStakeChange(Number(e.target.value))}
                      className="glass text-center"
                      placeholder="Enter stake amount"
                    />
                    <Button 
                      size="sm" 
                      onClick={saveStakePreference}
                      className="primary-button"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced search and filters with hints */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  type="search"
                  placeholder="Search teams, leagues, or bookmakers..."
                  className="glass pl-10 pr-4"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="glass hover:shadow-glow transition-all duration-300">
                          <Filter className="h-4 w-4 mr-2" />
                          Filters
                          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                          {(riskFilter !== 'all' || marketTypeFilter !== 'all') && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass w-56">
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Risk Assessment Filters
                        </DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setRiskFilter('all')}>
                          <Users className="h-4 w-4 mr-2" />
                          All Risk Levels {riskFilter === 'all' && "✓"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRiskFilter('low')}>
                          <div className="w-4 h-4 mr-2 bg-green-400 rounded-full"></div>
                          Low Risk Only {riskFilter === 'low' && "✓"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRiskFilter('medium')}>
                          <div className="w-4 h-4 mr-2 bg-yellow-400 rounded-full"></div>
                          Medium Risk {riskFilter === 'medium' && "✓"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRiskFilter('high')}>
                          <div className="w-4 h-4 mr-2 bg-red-400 rounded-full"></div>
                          High Risk {riskFilter === 'high' && "✓"}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Market Type Filters
                        </DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setMarketTypeFilter('all')}>
                          <Target className="h-4 w-4 mr-2" />
                          All Markets {marketTypeFilter === 'all' && "✓"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMarketTypeFilter('1x2')}>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Win/Draw/Lose {marketTypeFilter === '1x2' && "✓"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setMarketTypeFilter('over/under')}>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Over/Under Goals {marketTypeFilter === 'over/under' && "✓"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent className="glass">
                    <p className="text-sm">Filter opportunities by risk level and market type</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="glass hover:shadow-glow transition-all duration-300">
                          <SlidersHorizontal className="h-4 w-4 mr-2" />
                          Sort
                          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass w-48">
                        <DropdownMenuLabel className="flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Sort Opportunities
                        </DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSortBy('profit')}>
                          <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
                          By Profit {sortBy === 'profit' && "✓"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('date')}>
                          <Clock className="h-4 w-4 mr-2 text-blue-400" />
                          By Date {sortBy === 'date' && "✓"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('league')}>
                          <Users className="h-4 w-4 mr-2 text-purple-400" />
                          By League {sortBy === 'league' && "✓"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('confidence')}>
                          <Brain className="h-4 w-4 mr-2 text-orange-400" />
                          By Confidence {sortBy === 'confidence' && "✓"}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={toggleSortDirection}>
                          <SlidersHorizontal className="h-4 w-4 mr-2" />
                          {sortOrder === 'desc' ? '⬇ Highest First ✓' : '⬆ Lowest First ✓'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent className="glass">
                    <p className="text-sm">Sort opportunities by different criteria</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Simplified tabs */}
            <Tabs defaultValue="all" value={activeView} onValueChange={setActiveView} className="w-full">
              <TabsList className="glass grid grid-cols-5 mb-4 p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="all">All</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="glass">
                    <p className="text-sm">Show all available opportunities</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="guaranteed">Guaranteed</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="glass">
                    <p className="text-sm">Show only guaranteed arbitrage profits</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="high-profit">High Yield</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="glass">
                    <p className="text-sm">Show opportunities with 2%+ profit</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="today">Today</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="glass">
                    <p className="text-sm">Show matches happening today</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="active">Live</TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent className="glass">
                    <p className="text-sm">Show active, non-expired opportunities</p>
                  </TooltipContent>
                </Tooltip>
              </TabsList>
              
              {/* Simplified filter controls */}
              <div className="glass p-4 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Min Profit (%)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="glass">
                          <p className="text-sm">Filter opportunities with minimum profit percentage</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={0}
                        max={10}
                        step={0.5}
                        value={[minProfit]}
                        onValueChange={(values) => setMinProfit(values[0])}
                        className="flex-1"
                      />
                      <Badge className="profit-badge min-w-[50px] justify-center">
                        {minProfit}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Min Confidence
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="glass">
                          <p className="text-sm">Filter by AI confidence score (1-10)</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[minConfidence]}
                        onValueChange={(values) => setMinConfidence(values[0])}
                        className="flex-1"
                      />
                      <Badge className="glass border-primary/50 text-primary min-w-[50px] justify-center">
                        {minConfidence}/10
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Tabs>

            {/* Results summary */}
            <div className="glass p-3 rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Analysis: {filteredOpportunities.length} of {opportunities.length} opportunities
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Live</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optimized opportunities display */}
        {isLoading || isRefreshing ? (
          <div className="glass p-8 rounded-xl text-center">
            <div className="mx-auto w-12 h-12 mb-4">
              <Cpu className="w-12 h-12 text-primary animate-spin-slow mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gradient mb-2">Processing...</h3>
            <p className="text-muted-foreground">Analyzing arbitrage patterns...</p>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="glass p-8 rounded-xl text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Patterns Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {opportunities.length > 0 
                ? "Adjust filters to discover more patterns" 
                : "No arbitrage opportunities detected"}
            </p>
            <Button onClick={handleRefresh} variant="outline" className="primary-button">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOpportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}