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
  Link
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
  const currency = preferences.currency || '₦'

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
    if (confidence >= 80) return 'bg-green-500/20 text-green-600'
    if (confidence >= 60) return 'bg-emerald-500/20 text-emerald-600'
    if (confidence >= 40) return 'bg-amber-500/20 text-amber-600'
    return 'bg-red-500/20 text-red-600'
  }

  const getRiskBadgeColor = (risk: string | undefined) => {
    if (!risk) return 'bg-gray-500/20 text-gray-500'
    if (risk.toLowerCase().includes('low')) return 'bg-green-500/20 text-green-600'
    if (risk.toLowerCase().includes('medium')) return 'bg-amber-500/20 text-amber-600'
    return 'bg-red-500/20 text-red-600'
  }

  const getSourceReliabilityIndicator = (bookmakers: string[]) => {
    // Check for high-quality sources
    const highQualitySources = ['Bet9ja', '1xBet', 'BetKing', 'Betway'];
    const hasHighQualitySource = bookmakers.some(bm => highQualitySources.includes(bm));
    
    // Check for public API sources (less reliable)
    const hasPublicSource = bookmakers.includes('PublicAPI');
    
    if (hasHighQualitySource) {
      return {
        icon: <Shield className="h-4 w-4 text-green-500" />,
        text: 'Verified odds from trusted sources',
        className: 'bg-green-50 text-green-700 border-green-200'
      };
    } else if (hasPublicSource) {
      return {
        icon: <Info className="h-4 w-4 text-amber-500" />,
        text: 'Odds from aggregator API',
        className: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    } else {
      return {
        icon: <Link className="h-4 w-4 text-blue-500" />,
        text: 'Multiple bookmaker sources',
        className: 'bg-blue-50 text-blue-700 border-blue-200'
      };
    }
  };

  // Format date for display
  const formatMatchDate = () => {
    const matchDate = new Date(opportunity.matchTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // If match is today
    if (matchDate >= today && matchDate < tomorrow) {
      return `Today, ${matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If match is tomorrow
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    if (matchDate >= tomorrow && matchDate < dayAfterTomorrow) {
      return `Tomorrow, ${matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Other dates
    return `${matchDate.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Check if odds are very recent (less than 5 minutes old)
  const isRecentUpdate = () => {
    const updateTime = new Date(opportunity.lastUpdated);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    return updateTime > fiveMinutesAgo;
  };

  const sourceInfo = getSourceReliabilityIndicator(opportunity.bookmakers.map(bm => bm.bookmaker));
  
  return (
    <Card className={`mb-4 overflow-hidden transition-all duration-200 ${
      isExpired ? 'opacity-70' : ''
    } ${expanded ? 'border-primary/50 shadow-md' : ''}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold truncate" title={opportunity.matchName}>
              {opportunity.teamHome} vs {opportunity.teamAway}
            </CardTitle>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge variant="outline" className="text-xs font-normal">
                {opportunity.league}
              </Badge>
              
              {showMarketType && opportunity.marketType && (
                <Badge variant="outline" className="text-xs font-normal bg-primary/5">
                  {opportunity.marketType === 'OVER_UNDER' ? 'Over/Under' : '1X2'}
                </Badge>
              )}
              
              <Badge variant="outline" className="flex items-center gap-1 text-xs font-normal">
                <Clock className="h-3 w-3" />
                {formatMatchDate()}
              </Badge>

              {/* Source Reliability Badge */}
              <Badge variant="outline" className={`flex items-center gap-1 text-xs font-normal ${sourceInfo.className}`}>
                {sourceInfo.icon}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        {opportunity.bookmakers.length > 1 
                          ? `${opportunity.bookmakers.length} sources` 
                          : opportunity.bookmakers[0]?.bookmaker || 'Unknown source'}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{sourceInfo.text}</p>
                      <p className="text-xs mt-1">
                        Bookmakers: {opportunity.bookmakers.map(bm => bm.bookmaker).join(', ')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Badge>

              {isRecentUpdate() && (
                <Badge className="bg-green-500 text-white text-xs flex gap-1 items-center">
                  <Zap className="h-3 w-3" />
                  Fresh
                </Badge>
              )}
            </div>
          </div>
          
          <Badge
            className={`text-md font-bold py-1 px-3 ${getBadgeColors(opportunity.profitPercentage)}`}
          >
            <Percent className="h-3 w-3 mr-1" />
            {opportunity.profitPercentage.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={`px-4 pt-0 ${expanded ? 'pb-2' : 'pb-4'}`}>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
            <span>
              Profit: <span className="font-medium">{currency}{formatCurrency(opportunity.guaranteedProfit)}</span>
            </span>
          </div>
          
          <div className="flex items-center">
            <Percent className="h-4 w-4 text-muted-foreground mr-1" />
            <span>
              ROI: <span className="font-medium">{opportunity.profitPercentage.toFixed(2)}%</span>
            </span>
          </div>

          {opportunity.confidenceScore !== undefined && (
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-muted-foreground mr-1" />
              <Badge className={`${getConfidenceBadgeColor(opportunity.confidenceScore)} font-medium`}>
                Confidence: {opportunity.confidenceScore.toFixed(0)}%
              </Badge>
            </div>
          )}

          {opportunity.riskAssessment && (
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mr-1" />
              <Badge className={`${getRiskBadgeColor(opportunity.riskAssessment)} font-medium`}>
                {opportunity.riskAssessment}
              </Badge>
            </div>
          )}
        </div>

        {expanded && (
          <div className="mt-4 border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Best odds by bookmaker:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {opportunity.bestOdds.map((bestOdd, i) => (
                <div key={i} className="bg-muted/30 p-2 rounded-md">
                  <div className="text-xs text-muted-foreground">{bestOdd.outcome}</div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{bestOdd.odds.toFixed(2)}</span>
                    <span className="text-xs">{bestOdd.bookmaker}</span>
                  </div>
                </div>
              ))}
            </div>

            {opportunity.stakes.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Recommended stakes:</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setCalculatorExpanded(!calculatorExpanded)}
                  >
                    {calculatorExpanded ? 'Hide Calculator' : 'Calculate Stakes'}
                  </Button>
                </div>
                
                <div className="space-y-1">
                  {opportunity.stakes.map((stake, i) => (
                    <div key={i} className="grid grid-cols-3 gap-1 text-sm">
                      <div className="text-muted-foreground">{stake.outcome}:</div>
                      <div className="font-medium">{currency}{formatCurrency(stake.stake)}</div>
                      <div className="text-right text-xs text-muted-foreground">
                        @{stake.odds.toFixed(2)} ({stake.bookmaker})
                      </div>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-1 text-sm border-t mt-1 pt-1">
                    <div className="text-muted-foreground">Total Stake:</div>
                    <div className="font-medium">{currency}{formatCurrency(opportunity.totalStake)}</div>
                    <div className="text-right text-xs text-green-600">
                      +{currency}{formatCurrency(opportunity.guaranteedProfit)} profit
                    </div>
                  </div>
                </div>

                {calculatorExpanded && (
                  <div className="mt-3 pt-3 border-t">
                    <StakeCalculator 
                      opportunity={opportunity} 
                      initialStake={initialStake || opportunity.totalStake}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Last updated {getTimeAgo(opportunity.lastUpdated)}</span>
                <span>ID: {opportunity.id.split('-')[0]}-xxx</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-0">
        <Button
          variant="ghost"
          className="w-full rounded-none h-8 text-xs"
          onClick={toggleExpanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" /> Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" /> Show More
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}