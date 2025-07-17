import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  TrendingUp,
  ArrowRight,
  Copy,
  RefreshCw,
  Pencil,
  Check,
  X,
  CalculatorIcon
} from 'lucide-react'
import { 
  calculateImpliedProbability, 
  calculateKelly,
  formatCurrency, 
  type ArbitrageOpportunity
} from '@/utils/arbitrage'
import { useToast } from '@/hooks/use-toast'

interface StakeCalculatorProps {
  opportunity: ArbitrageOpportunity
}

export const StakeCalculator = ({ opportunity }: StakeCalculatorProps) => {
  const [customStake, setCustomStake] = useState(opportunity.totalStake)
  const [editingStake, setEditingStake] = useState(false)
  const [calculationType, setCalculationType] = useState<'basic' | 'kelly' | 'custom'>('basic')
  const { toast } = useToast()

  // Calculate new distribution based on custom stake
  const getStakeDistribution = () => {
    if (calculationType === 'basic') {
      return opportunity.stakes
    }

    // Calculate the ratio from original stakes
    const ratio = customStake / opportunity.totalStake
    
    // Apply ratio to each stake
    return opportunity.stakes.map(stake => ({
      ...stake,
      stake: Math.round(stake.stake * ratio),
      potentialReturn: Math.round(stake.potentialReturn * ratio)
    }))
  }

  // Get the guaranteed profit based on current calculation
  const getCalculatedProfit = () => {
    if (calculationType === 'basic') {
      return opportunity.profitAmount
    }

    const ratio = customStake / opportunity.totalStake
    return Math.round(opportunity.profitAmount * ratio)
  }

  // Calculate stake distribution using Kelly Criterion
  const getKellyStakes = () => {
    if (calculationType !== 'kelly') {
      return opportunity.stakes
    }
    
    // Calculate implied probabilities and Kelly stakes
    const totalStake = customStake
    let kellyStakes = opportunity.bookmakers.map(bookmaker => {
      const impliedProbability = calculateImpliedProbability(bookmaker.odds)
      // We use a conservative Kelly approach (quarter Kelly)
      const kellyFraction = calculateKelly(bookmaker.odds, impliedProbability) * 0.25
      
      return {
        bookmaker: bookmaker.bookmaker,
        outcome: bookmaker.outcome === 'home' 
          ? `${opportunity.teamHome} Win` 
          : bookmaker.outcome === 'away' 
            ? `${opportunity.teamAway} Win` 
            : 'Draw',
        stake: Math.round(totalStake * kellyFraction),
        odds: bookmaker.odds,
        potentialReturn: Math.round(totalStake * kellyFraction * bookmaker.odds)
      }
    })

    // Adjust stakes to ensure profit
    const totalKellyStake = kellyStakes.reduce((sum, stake) => sum + stake.stake, 0)
    const adjustmentFactor = totalStake / totalKellyStake
    
    return kellyStakes.map(stake => ({
      ...stake,
      stake: Math.round(stake.stake * adjustmentFactor),
      potentialReturn: Math.round(stake.potentialReturn * adjustmentFactor)
    }))
  }
  
  // Get the current stakes based on selected calculation method
  const getCurrentStakes = () => {
    switch (calculationType) {
      case 'basic':
        return opportunity.stakes
      case 'kelly':
        return getKellyStakes()
      case 'custom':
        return getStakeDistribution()
      default:
        return opportunity.stakes
    }
  }

  const handleCopyToClipboard = () => {
    const stakes = getCurrentStakes()
    const stakesText = stakes
      .map(stake => `${stake.bookmaker}: ${formatCurrency(stake.stake)} on "${stake.outcome}"`)
      .join('\n')
    
    const text = `Arbitrage Opportunity for ${opportunity.matchName}\n` +
      `Profit: ${formatCurrency(getCalculatedProfit())} (${opportunity.profitPercentage.toFixed(2)}%)\n\n` +
      stakesText
    
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "Stake distribution copied to clipboard"
    })
  }

  // Calculate the current total stake
  const currentTotalStake = getCurrentStakes().reduce((sum, stake) => sum + stake.stake, 0)
  
  // Calculate the current profit amount
  const profitAmount = calculationType === 'basic' 
    ? opportunity.profitAmount 
    : customStake - currentTotalStake
  
  // Calculate the profit percentage
  const profitPercentage = (profitAmount / currentTotalStake) * 100

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <span>Stake Calculator</span>
        </CardTitle>
        <CardDescription>
          Optimize your stake distribution for guaranteed profit
        </CardDescription>
      </CardHeader>
      
      <Tabs value={calculationType} onValueChange={(value) => setCalculationType(value as any)}>
        <div className="px-6">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="kelly">Kelly</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="space-y-4">
          {/* Stake amount control */}
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <CalculatorIcon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <span className="text-sm font-medium">Total Investment</span>
              {editingStake ? (
                <div className="flex items-center mt-1 space-x-2">
                  <Input
                    type="number"
                    value={customStake}
                    onChange={(e) => setCustomStake(parseInt(e.target.value))}
                    className="h-8"
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingStake(false)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                    setCustomStake(opportunity.totalStake);
                    setEditingStake(false);
                  }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-1">
                  <span className="font-bold">{formatCurrency(calculationType === 'basic' ? opportunity.totalStake : customStake)}</span>
                  {calculationType !== 'basic' && (
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingStake(true)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {calculationType === 'custom' && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
              <label className="text-sm font-medium">Adjust Stake Amount</label>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7" 
                  onClick={() => setCustomStake(prev => Math.max(1000, prev - 5000))}
                >
                  -5,000
                </Button>
                <Slider 
                  value={[customStake]} 
                  min={1000} 
                  max={opportunity.totalStake * 3} 
                  step={1000}
                  onValueChange={(values) => setCustomStake(values[0])}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7" 
                  onClick={() => setCustomStake(prev => prev + 5000)}
                >
                  +5,000
                </Button>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {formatCurrency(customStake)}
              </div>
            </div>
          )}

          <TabsContent value="basic" className="mt-0 space-y-4">
            <div className="grid gap-3">
              {opportunity.stakes.map((stake, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{stake.bookmaker}</Badge>
                    <span className="text-sm font-medium">{stake.outcome}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(stake.stake)}</p>
                    <p className="text-xs text-muted-foreground">
                      {((stake.stake / opportunity.totalStake) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="kelly" className="mt-0 space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              Kelly criterion optimizes stakes based on odds and implied probability
            </div>
            <div className="grid gap-3">
              {getKellyStakes().map((stake, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{stake.bookmaker}</Badge>
                    <span className="text-sm font-medium">{stake.outcome}</span>
                    <span className="text-xs text-muted-foreground">@{stake.odds}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(stake.stake)}</p>
                    <p className="text-xs text-muted-foreground">
                      Returns: {formatCurrency(stake.potentialReturn)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="mt-0 space-y-4">
            <div className="grid gap-3">
              {getStakeDistribution().map((stake, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{stake.bookmaker}</Badge>
                    <span className="text-sm font-medium">{stake.outcome}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(stake.stake)}</p>
                    <p className="text-xs text-muted-foreground">
                      Returns: {formatCurrency(stake.potentialReturn)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>

      <CardFooter className="flex flex-col border-t pt-4 gap-3">
        <div className="w-full flex items-center justify-between">
          <span className="font-medium">Total Stake:</span>
          <span className="font-bold">{formatCurrency(currentTotalStake)}</span>
        </div>
        <div className="w-full flex items-center justify-between text-green-600">
          <span className="font-medium">Guaranteed Profit:</span>
          <div className="text-right">
            <p className="font-bold">{formatCurrency(profitAmount)}</p>
            <p className="text-sm">({profitPercentage.toFixed(2)}%)</p>
          </div>
        </div>

        <div className="flex gap-2 w-full mt-2">
          <Button
            variant="outline" 
            className="flex-1" 
            onClick={handleCopyToClipboard}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Stakes
          </Button>
          <Button 
            className="flex-1"
            onClick={() => {
              setCalculationType('basic');
              setCustomStake(opportunity.totalStake);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}