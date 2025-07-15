import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, TrendingUp } from 'lucide-react'
import { ArbitrageOpportunity, formatCurrency, getTimeAgo } from '@/utils/arbitrage'

interface OpportunityCardProps {
  opportunity: ArbitrageOpportunity
}

export const OpportunityCard = ({ opportunity }: OpportunityCardProps) => {
  const getBookmakerColor = (bookmaker: string) => {
    const colors = {
      'bet9ja': 'bg-green-500',
      '1xbet': 'bg-blue-500', 
      'betano': 'bg-orange-500',
      'betking': 'bg-red-500',
      'sportybet': 'bg-purple-500'
    }
    return colors[bookmaker.toLowerCase() as keyof typeof colors] || 'bg-gray-500'
  }

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">
              {opportunity.teamHome} vs {opportunity.teamAway}
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              {opportunity.league}
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            +{opportunity.profitPercentage.toFixed(2)}%
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {new Date(opportunity.matchTime).toLocaleString()}
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            {getTimeAgo(opportunity.lastUpdated)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stake Breakdown */}
        <div>
          <h4 className="font-medium mb-2">Stake Distribution</h4>
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
                  <div className="text-xs text-muted-foreground">
                    Returns: {formatCurrency(stake.potentialReturn)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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

        {/* Odds Display */}
        <div>
          <h4 className="font-medium mb-2">Best Odds</h4>
          <div className="grid grid-cols-2 gap-2">
            {opportunity.bookmakers.map((bookie, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getBookmakerColor(bookie.bookmaker)}`} />
                  <span className="text-sm">{bookie.bookmaker}</span>
                </div>
                <div className="font-bold">{bookie.odds.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}