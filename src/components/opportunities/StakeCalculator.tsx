import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'
import type { ArbitrageOpportunity } from '@/utils/arbitrage'

interface StakeCalculatorProps {
  opportunity: ArbitrageOpportunity
}

export const StakeCalculator = ({ opportunity }: StakeCalculatorProps) => {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-profit" />
          <span>Stake Breakdown</span>
        </CardTitle>
        <CardDescription>
          How to distribute your ₦{opportunity.totalStake.toLocaleString()} stake for guaranteed profit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {opportunity.bookmakers.map((bookmaker, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
            >
              <div className="flex items-center space-x-3">
                <Badge variant="outline">{bookmaker.bookmaker}</Badge>
                <span className="text-sm font-medium">{bookmaker.outcome}</span>
                <span className="text-sm text-muted-foreground">@{bookmaker.odds}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">₦{bookmaker.stake.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">
                  {((bookmaker.stake / opportunity.totalStake) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Stake:</span>
            <span className="font-bold">₦{opportunity.totalStake.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-profit">
            <span className="font-medium">Guaranteed Profit:</span>
            <div className="text-right">
              <p className="font-bold">₦{opportunity.profitAmount.toFixed(0)}</p>
              <p className="text-sm">({opportunity.profitPercentage.toFixed(2)}%)</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}