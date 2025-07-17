import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  BarChart3, 
  AlertCircle,
  Percent,
  PieChart
} from 'lucide-react'
import { ArbitrageOpportunity, formatCurrency, getTimeAgo } from '@/utils/arbitrage'

interface OpportunityCardProps {
  opportunity: ArbitrageOpportunity
}

// Bookmaker color mapping with fallbacks
const BOOKMAKER_COLORS: Record<string, string> = {
  'bet9ja': 'bg-green-500',
  'Bet9ja': 'bg-green-500',
  '1xbet': 'bg-blue-500',
  '1xBet': 'bg-blue-500', 
  'betano': 'bg-teal-500',
  'Betano': 'bg-teal-500',
  'betking': 'bg-purple-500',
  'BetKing': 'bg-purple-500',
  'sportybet': 'bg-red-500',
  'SportyBet': 'bg-red-500',
  'nairabet': 'bg-yellow-500',
  'NairaBet': 'bg-yellow-500',
  'merrybet': 'bg-orange-500',
  'MerryBet': 'bg-orange-500',
  'betway': 'bg-black',
  'BetWay': 'bg-black',
  'bangbet': 'bg-pink-500',
  'BangBet': 'bg-pink-500',
  'accessbet': 'bg-emerald-500',
  'AccessBet': 'bg-emerald-500',
  'betwinner': 'bg-cyan-500',
  'BetWinner': 'bg-cyan-500',
  'superbet': 'bg-rose-500',
  'SuperBet': 'bg-rose-500',
  'parimatch': 'bg-amber-500',
  'Parimatch': 'bg-amber-500',
  'livescore': 'bg-indigo-500',
  'LiveScore Bet': 'bg-indigo-500',
  'msport': 'bg-lime-500',
  'MSport': 'bg-lime-500'
}

const OpportunityCardComponent = ({ opportunity }: OpportunityCardProps) => {
  const getBookmakerColor = (bookmaker: string) => {
    return BOOKMAKER_COLORS[bookmaker] || 'bg-gray-500'
  }

  const getRiskBadgeVariant = (riskAssessment?: string) => {
    switch(riskAssessment) {
      case "Low Risk":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "Medium Risk":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
      case "High Risk":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
    }
  }

  const getConfidenceIcon = (score?: number) => {
    if (!score) return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    if (score >= 8) return <ShieldCheck className="h-4 w-4 text-green-500" />;
    if (score >= 5) return <BarChart3 className="h-4 w-4 text-amber-500" />;
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }

  // Check if the event time is in the past
  const isExpired = new Date(opportunity.matchTime) < new Date();

  // Calculate the implied probabilities
  const totalImpliedProbability = opportunity.stakes.reduce((acc, stake) => {
    return acc + (stake.impliedProbability || 0);
  }, 0);

  // Format match time for better readability
  const formatMatchTime = (timeString: string) => {
    const date = new Date(timeString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // If match is today or tomorrow, show relative time
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <Card className={`mb-4 transition-all duration-300 ${
      isExpired ? 'opacity-60' : 'hover:shadow-md'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">
                {opportunity.teamHome} vs {opportunity.teamAway}
              </CardTitle>
              {isExpired && (
                <Badge variant="outline" className="text-muted-foreground">Expired</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{opportunity.league}</span>
              {/* Market type badge */}
              <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800">
                {opportunity.marketType === 'OVER_UNDER' || opportunity.id.includes('-ou') 
                  ? 'Over/Under' 
                  : '1X2'}
              </Badge>
              {opportunity.riskAssessment && (
                <Badge className={getRiskBadgeVariant(opportunity.riskAssessment)}>
                  {opportunity.riskAssessment}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Badge 
              variant="secondary" 
              className={`bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 ${
                opportunity.profitPercentage > 5 ? 'animate-pulse' : ''
              }`}
            >
              +{opportunity.profitPercentage.toFixed(2)}%
            </Badge>
            {opportunity.confidenceScore && (
              <div className="flex items-center mt-1 text-xs">
                <span className="text-muted-foreground mr-1">Confidence:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center gap-1">
                        {getConfidenceIcon(opportunity.confidenceScore)}
                        <span>{Math.round(opportunity.confidenceScore)}/10</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Confidence score based on bookmaker reputation and market stability</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatMatchTime(opportunity.matchTime)}
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            {getTimeAgo(opportunity.lastUpdated)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Visualization of implied probabilities */}
        {totalImpliedProbability > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center">
                <PieChart className="h-3 w-3 mr-1 text-muted-foreground" />
                <span>Market Efficiency</span>
              </span>
              <span>{(totalImpliedProbability * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  totalImpliedProbability < 0.98 ? 'bg-green-500' : 
                  totalImpliedProbability < 1 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(totalImpliedProbability * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Stake Breakdown */}
        <div>
          <h4 className="font-medium mb-2 flex items-center">
            <Percent className="h-4 w-4 mr-1" />
            Stake Distribution
          </h4>
          <div className="space-y-2">
            {opportunity.stakes.map((stake, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded bg-accent/50">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getBookmakerColor(stake.bookmaker)}`} />
                  <span className="text-sm font-medium">{stake.bookmaker}</span>
                  <span className="text-xs text-muted-foreground">({stake.outcome})</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(stake.stake)}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                    <span>Returns: {formatCurrency(stake.potentialReturn)}</span>
                    {stake.impliedProbability && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="h-4 text-[10px]">
                              {(stake.impliedProbability * 100).toFixed(1)}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Implied probability from odds</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profit and Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Profit Summary */}
          <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div>
              <div className="text-sm text-muted-foreground">Guaranteed Profit</div>
              <div className="font-bold text-green-700 dark:text-green-400">
                {formatCurrency(opportunity.guaranteedProfit)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Stake</div>
              <div className="font-medium">{formatCurrency(opportunity.totalStake)}</div>
            </div>
          </div>

          {/* Advanced Metrics */}
          {opportunity.expectedValue && opportunity.volatility && (
            <div className="flex flex-col justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">Expected Value</div>
                <div className="font-medium text-blue-700 dark:text-blue-400">
                  {formatCurrency(opportunity.expectedValue)}
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="text-sm text-muted-foreground">Volatility</div>
                <div className="font-medium">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <Progress 
                            value={Math.min(opportunity.volatility / 100, 100)} 
                            className="w-16 h-2" 
                          />
                          <span className="ml-1 text-xs">
                            {opportunity.volatility.toFixed(0)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Lower volatility means more stable returns</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Odds Display */}
        <div>
          <h4 className="font-medium mb-2">Best Odds</h4>
          <div className="grid grid-cols-3 gap-2">
            {opportunity.bestOdds.map((odd, index) => (
              <div key={index} className="flex flex-col items-center p-2 rounded bg-accent/30 text-center">
                <div className="text-xs text-muted-foreground mb-1">{odd.outcome}</div>
                <div className="font-bold">{odd.odds.toFixed(2)}</div>
                <div className="text-xs mt-1 flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${getBookmakerColor(odd.bookmaker)}`} />
                  <span>{odd.bookmaker}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const OpportunityCard = memo(OpportunityCardComponent);