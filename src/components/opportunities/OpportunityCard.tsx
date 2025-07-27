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
  Target,
  Activity,
  Timer,
  Star,
  CheckCircle,
  AlertCircle,
  Calculator,
  Eye,
  EyeOff
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
  const currency = '₦'

  const toggleExpanded = () => {
    const newExpandedState = !expanded
    setExpanded(newExpandedState)
    if (onToggleOpen) {
      onToggleOpen(opportunity.id)
    }
  }

  const getProfitGradient = (profit: number) => {
    if (profit >= 5) return 'bg-gradient-to-r from-green-400 to-emerald-500'
    if (profit >= 3) return 'bg-gradient-to-r from-emerald-400 to-green-500'
    if (profit >= 2) return 'bg-gradient-to-r from-lime-400 to-emerald-400'
    if (profit >= 1) return 'bg-gradient-to-r from-yellow-400 to-amber-500'
    if (profit >= 0.5) return 'bg-gradient-to-r from-orange-400 to-red-500'
    return 'bg-gradient-to-r from-red-500 to-pink-500'
  }

  const getConfidenceColor = (confidence: number | undefined) => {
    if (!confidence) return 'text-gray-400'
    if (confidence >= 8) return 'text-green-400'
    if (confidence >= 6) return 'text-emerald-400'
    if (confidence >= 4) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getRiskColor = (risk: string | undefined) => {
    if (!risk) return 'text-gray-400'
    if (risk.toLowerCase().includes('low')) return 'text-green-400'
    if (risk.toLowerCase().includes('medium')) return 'text-yellow-400'
    return 'text-red-400'
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

  const getExecutionWindowStatus = () => {
    if (!opportunity.optimalExecutionWindow) return null
    
    const now = new Date()
    const start = new Date(opportunity.optimalExecutionWindow.start)
    const end = new Date(opportunity.optimalExecutionWindow.end)
    
    if (now >= start && now <= end) {
      return { status: 'optimal', text: 'Optimal', icon: Zap, color: 'text-green-400' }
    } else if (now > end) {
      return { status: 'urgent', text: 'Urgent', icon: Timer, color: 'text-red-400' }
    } else {
      return { status: 'wait', text: 'Pending', icon: Clock, color: 'text-yellow-400' }
    }
  }

  const executionStatus = getExecutionWindowStatus()

  return (
    <TooltipProvider>
      <Card className={`futuristic-card transition-all duration-300 ${
        isExpired 
          ? 'opacity-60 grayscale' 
          : expanded 
            ? 'shadow-glow ring-1 ring-primary/20' 
            : 'hover:shadow-glow'
      } ${opportunity.profitPercentage >= 3 ? 'ring-1 ring-green-400/30' : ''}`}>
        
        {/* Top accent line */}
        <div className={`h-1 w-full ${getProfitGradient(opportunity.profitPercentage)} rounded-t-lg`}></div>
        
        {/* Status indicators */}
        <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
          {isExpired && (
            <Badge variant="destructive" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Expired
            </Badge>
          )}
          {executionStatus && (
            <Badge className={`text-xs glass ${executionStatus.color} border-current`}>
              <executionStatus.icon className="h-3 w-3 mr-1" />
              {executionStatus.text}
            </Badge>
          )}
        </div>
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-3">
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="text-gradient">{opportunity.teamHome}</span>
                <span className="text-muted-foreground text-base">vs</span>
                <span className="text-gradient">{opportunity.teamAway}</span>
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <span className="font-medium">{opportunity.league}</span>
                <span>•</span>
                <span>{new Date(opportunity.matchTime).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          {/* Main metrics row */}
          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex items-center gap-2">
              {/* Profit badge */}
              <Badge className={`${getProfitGradient(opportunity.profitPercentage)} text-white font-bold px-2 py-1 text-sm`}>
                <DollarSign className="h-3 w-3 mr-1" />
                {opportunity.profitPercentage.toFixed(2)}%
              </Badge>
              
              {/* Confidence score */}
              <Badge className={`glass ${getConfidenceColor(opportunity.confidenceScore)} border-current text-xs`}>
                <Star className="h-3 w-3 mr-1" />
                {opportunity.confidenceScore}/10
              </Badge>
              
              {/* Risk assessment */}
              <Badge className={`glass ${getRiskColor(opportunity.riskAssessment)} border-current text-xs`}>
                <Shield className="h-3 w-3 mr-1" />
                {opportunity.riskAssessment?.split(' ')[0]}
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpanded}
              className="text-muted-foreground hover:text-primary transition-colors duration-200"
            >
              {expanded ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Expanded analytics section */}
          {expanded && (
            <div className="space-y-4">
              {/* Analytics panel */}
              <div className="glass p-4 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <h4 className="text-sm font-semibold text-primary mb-3 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Analytics
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Market Efficiency */}
                  {opportunity.efficiencyScore && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-2 glass rounded-lg hover:shadow-glow transition-all duration-200 cursor-help">
                          <div className="flex items-center gap-1 mb-1">
                            {getScoreIcon(opportunity.efficiencyScore)}
                            <span className="text-xs text-muted-foreground">Efficiency</span>
                          </div>
                          <p className={`text-sm font-bold ${getConfidenceColor(opportunity.efficiencyScore * 10)}`}>
                            {formatPercentage(opportunity.efficiencyScore)}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="glass">
                        <p>Market efficiency score</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Liquidity Score */}
                  {opportunity.liquidityScore && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-2 glass rounded-lg hover:shadow-glow transition-all duration-200 cursor-help">
                          <div className="flex items-center gap-1 mb-1">
                            {getScoreIcon(opportunity.liquidityScore)}
                            <span className="text-xs text-muted-foreground">Liquidity</span>
                          </div>
                          <p className={`text-sm font-bold ${getConfidenceColor(opportunity.liquidityScore * 10)}`}>
                            {formatPercentage(opportunity.liquidityScore)}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="glass">
                        <p>Market liquidity score</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Time Decay Factor */}
                  {opportunity.timeDecayFactor && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-2 glass rounded-lg hover:shadow-glow transition-all duration-200 cursor-help">
                          <div className="flex items-center gap-1 mb-1">
                            {getScoreIcon(opportunity.timeDecayFactor)}
                            <span className="text-xs text-muted-foreground">Time Factor</span>
                          </div>
                          <p className={`text-sm font-bold ${getConfidenceColor(opportunity.timeDecayFactor * 10)}`}>
                            {formatPercentage(opportunity.timeDecayFactor)}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="glass">
                        <p>Time decay analysis</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {/* Reliability Score */}
                  {opportunity.bookmakerReliabilityScore && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-2 glass rounded-lg hover:shadow-glow transition-all duration-200 cursor-help">
                          <div className="flex items-center gap-1 mb-1">
                            {getScoreIcon(opportunity.bookmakerReliabilityScore)}
                            <span className="text-xs text-muted-foreground">Reliability</span>
                          </div>
                          <p className={`text-sm font-bold ${getConfidenceColor(opportunity.bookmakerReliabilityScore * 10)}`}>
                            {formatPercentage(opportunity.bookmakerReliabilityScore)}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="glass">
                        <p>Bookmaker reliability</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              
              {/* Execution guidance */}
              {opportunity.optimalExecutionWindow && (
                <div className="glass p-4 rounded-lg border border-green-400/20 bg-gradient-to-br from-green-400/5 to-emerald-400/5">
                  <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Execution Guidance
                  </h4>
                  <p className="text-sm text-green-300 font-medium mb-1">
                    {opportunity.optimalExecutionWindow.recommendedAction}
                  </p>
                  <p className="text-xs text-green-400/70">
                    Window: {new Date(opportunity.optimalExecutionWindow.start).toLocaleTimeString()} - {new Date(opportunity.optimalExecutionWindow.end).toLocaleTimeString()}
                  </p>
                </div>
              )}

              {/* Key metrics grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="glass p-3 rounded-lg text-center hover:shadow-glow transition-all duration-200">
                  <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Guaranteed Profit</p>
                  <p className="text-lg font-bold text-gradient-success">
                    {formatCurrency(opportunity.guaranteedProfit)}
                  </p>
                </div>
                
                <div className="glass p-3 rounded-lg text-center hover:shadow-glow transition-all duration-200">
                  <Percent className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Arbitrage Margin</p>
                  <p className="text-lg font-bold text-gradient">
                    {((1 - opportunity.arbitragePercentage) * 100).toFixed(3)}%
                  </p>
                </div>
                
                <div className="glass p-3 rounded-lg text-center hover:shadow-glow transition-all duration-200">
                  <Target className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Total Stake</p>
                  <p className="text-lg font-bold text-purple-400">
                    {formatCurrency(opportunity.totalStake)}
                  </p>
                </div>
              </div>

              {/* Stakes distribution */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Stake Distribution
                </h4>
                <div className="space-y-2">
                  {opportunity.stakes.map((stake, index) => (
                    <div
                      key={index}
                      className="glass p-3 rounded-lg hover:shadow-glow transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs glass">
                            {stake.outcome}
                          </Badge>
                          <span className="text-sm font-medium text-gradient">{stake.bookmaker}</span>
                          <span className="text-sm text-muted-foreground">@ {stake.odds}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">{formatCurrency(stake.stake)}</p>
                          <p className="text-xs text-muted-foreground">
                            Returns: {formatCurrency(stake.potentialReturn)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Compact view when not expanded */}
          {!expanded && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-center">
                <div className="glass p-2 rounded-lg flex-1 mr-2">
                  <p className="text-xs text-muted-foreground mb-1">Profit</p>
                  <p className="text-lg font-bold text-gradient-success">
                    {formatCurrency(opportunity.guaranteedProfit)}
                  </p>
                </div>
                <div className="glass p-2 rounded-lg flex-1 mx-1">
                  <p className="text-xs text-muted-foreground mb-1">Stake</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(opportunity.totalStake)}
                  </p>
                </div>
                <div className="glass p-2 rounded-lg flex-1 ml-2">
                  <p className="text-xs text-muted-foreground mb-1">Updated</p>
                  <p className="text-sm font-medium text-primary">
                    {getTimeAgo(opportunity.lastUpdated)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 pb-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {showMarketType && opportunity.marketType && (
                <Badge variant="outline" className="text-xs glass">
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
              className="glass hover:shadow-glow transition-all duration-200"
            >
              <Calculator className="h-3 w-3 mr-1" />
              Calculator
            </Button>
          </div>

          {calculatorExpanded && (
            <div className="w-full mt-3 pt-3 border-t border-border/20 animate-slide-in-from-bottom" style={{ transform: 'translateX(-225px)' }}>
              <StakeCalculator opportunity={opportunity} />
            </div>
          )}
        </CardFooter>
      </Card>
    </TooltipProvider>
  )
}