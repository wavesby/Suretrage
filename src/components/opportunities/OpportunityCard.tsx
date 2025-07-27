import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArbitrageOpportunity, 
  StakeDistribution,
  formatCurrency, 
  getTimeAgo, 
  hasArbitrageExpired
} from '@/utils/arbitrage'
import { StakeCalculator } from './StakeCalculator'
import { 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  DollarSign, 
  Percent, 
  Shield, 
  AlertTriangle, 
  Zap, 
  Info,
  Link,
  Target,
  TrendingUp,
  Activity,
  Timer,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { useUserPreferences } from '@/contexts/UserPreferencesContext'

interface OpportunityCardProps {
  opportunity: ArbitrageOpportunity
  initialStake?: number
  onToggleOpen?: (id: string) => void
  isOpen?: boolean
  showMarketType?: boolean
}

export const OpportunityCard = ({ 
  opportunity, 
  initialStake, 
  onToggleOpen,
  isOpen = false,
  showMarketType = true
}: OpportunityCardProps) => {
  const [expanded, setExpanded] = useState(isOpen)
  const [calculatorExpanded, setCalculatorExpanded] = useState(false)
  const isExpired = hasArbitrageExpired(opportunity.matchTime)
  const { preferences } = useUserPreferences()
  const currency = '₦' // Default currency symbol

  const toggleExpanded = () => {
    const newExpandedState = !expanded
    setExpanded(newExpandedState)
    if (onToggleOpen) {
      onToggleOpen(opportunity.id)
    }
  }

  const getBadgeColors = (profit: number) => {
    if (profit >= 5) return 'bg-green-500/90 hover:bg-green-500 text-white'
    if (profit >= 3) return 'bg-emerald-500/90 hover:bg-emerald-500 text-white'
    if (profit >= 2) return 'bg-lime-500/90 hover:bg-lime-500 text-white'
    if (profit >= 1) return 'bg-amber-500/90 hover:bg-amber-500 text-white'
    if (profit >= 0.5) return 'bg-orange-500/90 hover:bg-orange-500 text-white'
    return 'bg-red-500/90 hover:bg-red-500 text-white'
  }

  const getConfidenceBadgeColor = (confidence: number | undefined) => {
    if (!confidence) return 'bg-gray-500/20 text-gray-500'
    if (confidence >= 8) return 'bg-green-500/20 text-green-600'
    if (confidence >= 6) return 'bg-emerald-500/20 text-emerald-600'
    if (confidence >= 4) return 'bg-amber-500/20 text-amber-600'
    return 'bg-red-500/20 text-red-600'
  }

  const getRiskBadgeColor = (risk: string | undefined) => {
    if (!risk) return 'bg-gray-500/20 text-gray-500'
    if (risk.toLowerCase().includes('low')) return 'bg-green-500/20 text-green-600'
    if (risk.toLowerCase().includes('medium')) return 'bg-amber-500/20 text-amber-600'
    return 'bg-red-500/20 text-red-600'
  }

  // Enhanced scoring visualization
  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-400'
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-emerald-600'
    if (score >= 0.4) return 'text-amber-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number | undefined) => {
    if (!score) return <AlertCircle className="h-3 w-3" />
    if (score >= 0.8) return <CheckCircle className="h-3 w-3" />
    if (score >= 0.6) return <Target className="h-3 w-3" />
    return <AlertTriangle className="h-3 w-3" />
  }

  const formatPercentage = (value: number | undefined) => {
    if (!value) return 'N/A'
    return `${(value * 100).toFixed(1)}%`
  }

  const getExecutionWindowBadge = () => {
    if (!opportunity.optimalExecutionWindow) return null
    
    const { recommendedAction } = opportunity.optimalExecutionWindow
    const now = new Date()
    const start = new Date(opportunity.optimalExecutionWindow.start)
    const end = new Date(opportunity.optimalExecutionWindow.end)
    
    if (now >= start && now <= end) {
      return (
        <Badge className="bg-green-500/90 hover:bg-green-500 text-white text-xs">
          <Zap className="h-3 w-3 mr-1" />
          Optimal Window
        </Badge>
      )
    } else if (now > end) {
      return (
        <Badge className="bg-red-500/90 hover:bg-red-500 text-white text-xs">
          <Timer className="h-3 w-3 mr-1" />
          Act Fast
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-amber-500/90 hover:bg-amber-500 text-white text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Wait for Window
        </Badge>
      )
    }
  }

  const getSourceReliabilityIndicator = (bookmakers: string[]) => {
    // Check for high-quality sources
    const highQualitySources = ['Bet365', 'Pinnacle', 'William Hill', 'Betway', 'DraftKings'];
    const mediumQualitySources = ['1xBet', 'SportyBet', 'Unibet', 'MarathonBet'];
    
    const hasHighQualitySource = bookmakers.some(bm => highQualitySources.includes(bm));
    const hasMediumQualitySource = bookmakers.some(bm => mediumQualitySources.includes(bm));
    
    if (hasHighQualitySource) {
      return {
        icon: <Shield className="h-4 w-4 text-green-500" />,
        text: 'Premium bookmaker odds',
        className: 'bg-green-50 text-green-700 border-green-200'
      };
    } else if (hasMediumQualitySource) {
      return {
        icon: <Shield className="h-4 w-4 text-blue-500" />,
        text: 'Reliable bookmaker odds',
        className: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    } else {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        text: 'Standard bookmaker odds',
        className: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
  }

  const bookmakerNames = opportunity.stakes.map(stake => stake.bookmaker)
  const sourceReliability = getSourceReliabilityIndicator(bookmakerNames)

  return (
    <TooltipProvider>
      <Card className={`relative transition-all duration-300 hover:shadow-lg ${
        isExpired 
          ? 'opacity-60 border-gray-300' 
          : expanded 
            ? 'border-primary shadow-md' 
            : 'border-border hover:border-primary/50'
      }`}>
        {isExpired && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="destructive" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Expired
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-foreground">
                {opportunity.teamHome} vs {opportunity.teamAway}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {opportunity.league} • {new Date(opportunity.matchTime).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Enhanced metrics badges */}
              {opportunity.efficiencyScore && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className={`${getScoreColor(opportunity.efficiencyScore)} bg-purple-50 border-purple-200 text-xs`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {formatPercentage(opportunity.efficiencyScore)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Market Efficiency Score - Lower is better for arbitrage</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              {getExecutionWindowBadge()}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <Badge className={`${getBadgeColors(opportunity.profitPercentage)} text-sm font-semibold`}>
                <DollarSign className="h-4 w-4 mr-1" />
                {opportunity.profitPercentage.toFixed(2)}% profit
              </Badge>
              
              <Badge className={`${getConfidenceBadgeColor(opportunity.confidenceScore)} text-xs`}>
                <Star className="h-3 w-3 mr-1" />
                {opportunity.confidenceScore}/10
              </Badge>
              
              <Badge className={`${getRiskBadgeColor(opportunity.riskAssessment)} text-xs`}>
                <Shield className="h-3 w-3 mr-1" />
                {opportunity.riskAssessment}
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="text-muted-foreground hover:text-foreground"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Enhanced metrics panel when expanded */}
          {expanded && (
            <div className="space-y-4">
              {/* Smart Analytics Section */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200/50">
                <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Smart Analytics
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Market Efficiency */}
                  {opportunity.efficiencyScore && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-2 bg-white/60 rounded">
                          {getScoreIcon(opportunity.efficiencyScore)}
                          <div>
                            <p className="text-xs text-gray-600">Market Efficiency</p>
                            <p className={`text-sm font-medium ${getScoreColor(opportunity.efficiencyScore)}`}>
                              {formatPercentage(opportunity.efficiencyScore)}
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Market inefficiency score - higher values indicate better arbitrage potential</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Liquidity Score */}
                  {opportunity.liquidityScore && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-2 bg-white/60 rounded">
                          {getScoreIcon(opportunity.liquidityScore)}
                          <div>
                            <p className="text-xs text-gray-600">Liquidity</p>
                            <p className={`text-sm font-medium ${getScoreColor(opportunity.liquidityScore)}`}>
                              {formatPercentage(opportunity.liquidityScore)}
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Market liquidity score - higher values indicate safer execution</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Time Decay Factor */}
                  {opportunity.timeDecayFactor && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-2 bg-white/60 rounded">
                          {getScoreIcon(opportunity.timeDecayFactor)}
                          <div>
                            <p className="text-xs text-gray-600">Time Factor</p>
                            <p className={`text-sm font-medium ${getScoreColor(opportunity.timeDecayFactor)}`}>
                              {formatPercentage(opportunity.timeDecayFactor)}
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Time decay factor - optimal window scoring for execution timing</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Bookmaker Reliability */}
                  {opportunity.bookmakerReliabilityScore && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-2 bg-white/60 rounded">
                          {getScoreIcon(opportunity.bookmakerReliabilityScore)}
                          <div>
                            <p className="text-xs text-gray-600">Reliability</p>
                            <p className={`text-sm font-medium ${getScoreColor(opportunity.bookmakerReliabilityScore)}`}>
                              {formatPercentage(opportunity.bookmakerReliabilityScore)}
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Average bookmaker reliability score - higher values indicate more trustworthy bookmakers</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              
              {/* Execution Guidance */}
              {opportunity.optimalExecutionWindow && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200/50">
                  <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Execution Guidance
                  </h4>
                  <p className="text-sm text-green-600">
                    <strong>{opportunity.optimalExecutionWindow.recommendedAction}</strong>
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    Optimal window: {new Date(opportunity.optimalExecutionWindow.start).toLocaleTimeString()} - {new Date(opportunity.optimalExecutionWindow.end).toLocaleTimeString()}
                  </p>
                </div>
              )}

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-700">Guaranteed Profit</p>
                  <p className="text-lg font-bold text-green-800">
                    {formatCurrency(opportunity.guaranteedProfit)}
                  </p>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <Percent className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-700">Arbitrage Margin</p>
                  <p className="text-lg font-bold text-blue-800">
                    {((1 - opportunity.arbitragePercentage) * 100).toFixed(3)}%
                  </p>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-700">Total Stake</p>
                  <p className="text-lg font-bold text-purple-800">
                    {formatCurrency(opportunity.totalStake)}
                  </p>
                </div>
              </div>

              {/* Stakes Distribution */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Stake Distribution
                </h4>
                <div className="space-y-2">
                  {opportunity.stakes.map((stake, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {stake.outcome}
                        </Badge>
                        <span className="text-sm font-medium">{stake.bookmaker}</span>
                        <span className="text-sm text-muted-foreground">@ {stake.odds}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(stake.stake)}</p>
                        <p className="text-xs text-muted-foreground">
                          Returns: {formatCurrency(stake.potentialReturn)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Reliability */}
              <div className={`p-3 rounded-lg border ${sourceReliability.className}`}>
                <div className="flex items-center gap-2">
                  {sourceReliability.icon}
                  <span className="text-sm font-medium">{sourceReliability.text}</span>
                </div>
              </div>
            </div>
          )}

          {/* Compact view when not expanded */}
          {!expanded && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Guaranteed Profit</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(opportunity.guaranteedProfit)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Stake</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(opportunity.totalStake)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Updated</p>
                  <p className="text-sm font-medium">
                    {getTimeAgo(opportunity.lastUpdated)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {showMarketType && opportunity.marketType && (
                <Badge variant="outline" className="text-xs">
                  {opportunity.marketType}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {opportunity.stakes.length} bookmakers
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCalculatorExpanded(!calculatorExpanded)}
              className="text-xs"
            >
              <DollarSign className="h-3 w-3 mr-1" />
              Stake Calculator
            </Button>
          </div>

          {calculatorExpanded && (
            <div className="w-full mt-4 pt-4 border-t">
              <StakeCalculator
                opportunity={opportunity}
              />
            </div>
          )}
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}