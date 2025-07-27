import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  Calculator,
  TrendingUp,
  Zap,
  Copy,
  RotateCcw,
  Edit3,
  Check,
  X,
  Brain,
  Target,
  DollarSign,
  Percent,
  Sparkles,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Cpu,
  ShieldCheck,
  Bolt,
  Coins,
  TrendingDown,
  Settings,
  Rocket,
  Star
} from 'lucide-react'
import { 
  calculateImpliedProbability, 
  calculateKelly,
  formatCurrency, 
  type ArbitrageOpportunity
} from '@/utils/arbitrage'
import { useToast } from '@/hooks/use-toast'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'

interface StakeCalculatorProps {
  opportunity: ArbitrageOpportunity
}

export const StakeCalculator = ({ opportunity }: StakeCalculatorProps) => {
  const [customStake, setCustomStake] = useState(opportunity.totalStake)
  const [editingStake, setEditingStake] = useState(false)
  const [calculationType, setCalculationType] = useState<'basic' | 'kelly' | 'custom'>('basic')
  const [isCalculating, setIsCalculating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  // Simulate calculation loading for visual effect
  useEffect(() => {
    if (calculationType !== 'basic') {
      setIsCalculating(true)
      const timer = setTimeout(() => setIsCalculating(false), 800)
      return () => clearTimeout(timer)
    }
  }, [calculationType, customStake])

  // Calculate new distribution based on custom stake
  const getStakeDistribution = () => {
    if (calculationType === 'basic') {
      return opportunity.stakes
    }

    const ratio = customStake / opportunity.totalStake
    
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
    
    // Use the existing stakes structure and apply Kelly weighting
    const totalStake = customStake
    let kellyStakes = opportunity.stakes.map((stake, index) => {
      const impliedProbability = calculateImpliedProbability(stake.odds)
      const kellyFraction = calculateKelly(stake.odds, impliedProbability) * 0.25
      
      return {
        bookmaker: stake.bookmaker,
        outcome: stake.outcome,
        stake: Math.round(totalStake * kellyFraction),
        odds: stake.odds,
        potentialReturn: Math.round(totalStake * kellyFraction * stake.odds)
      }
    })

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
      title: "Neural Data Copied",
      description: "Advanced stake calculations copied to quantum clipboard",
      className: "glass border-primary/50"
    })
  }

  const handleStakeEdit = () => {
    setEditingStake(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleStakeConfirm = () => {
    setEditingStake(false)
    toast({
      title: "Quantum Recalculation Complete",
      description: `Stake optimized to ${formatCurrency(customStake)}`,
      className: "glass border-green-400/50"
    })
  }

  const handleReset = () => {
    setCalculationType('basic')
    setCustomStake(opportunity.totalStake)
    setShowAdvanced(false)
    toast({
      title: "Neural Reset Complete",
      description: "Calculator restored to optimal parameters",
      className: "glass border-blue-400/50"
    })
  }

  const currentTotalStake = getCurrentStakes().reduce((sum, stake) => sum + stake.stake, 0)
  const profitAmount = calculationType === 'basic' 
    ? opportunity.profitAmount 
    : getCalculatedProfit()
  const profitPercentage = (profitAmount / currentTotalStake) * 100

  const getCalculationTypeIcon = () => {
    switch (calculationType) {
      case 'basic': return <Brain className="h-4 w-4" />
      case 'kelly': return <Target className="h-4 w-4" />
      case 'custom': return <Rocket className="h-4 w-4" />
      default: return <Calculator className="h-4 w-4" />
    }
  }

  const getCalculationTypeGradient = () => {
    switch (calculationType) {
      case 'basic': return 'from-blue-400 to-cyan-400'
      case 'kelly': return 'from-purple-400 to-pink-400'
      case 'custom': return 'from-green-400 to-emerald-400'
      default: return 'from-primary to-accent'
    }
  }

  return (
    <TooltipProvider>
      <div className="relative">
        {/* Quantum Calculator Container */}
        <Card className="glass border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 overflow-hidden">
          {/* Animated Top Accent */}
          <div className={`h-1 w-full bg-gradient-to-r ${getCalculationTypeGradient()} relative`}>
            {isCalculating && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
            )}
          </div>

          {/* Neural Header */}
          <CardHeader className="pb-4 relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-2 right-4 w-16 h-16 bg-gradient-primary rounded-full blur-2xl"></div>
              <div className="absolute bottom-2 left-4 w-12 h-12 bg-gradient-success rounded-full blur-xl"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-primary rounded-lg blur-md opacity-50"></div>
                  <div className="relative glass p-2 rounded-lg">
                    <Calculator className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gradient flex items-center gap-2">
                    Quantum Stake Engine
                    {isCalculating && <Cpu className="h-4 w-4 animate-spin text-primary" />}
                  </CardTitle>
                  <CardDescription className="text-sm flex items-center gap-2">
                    <Activity className="h-3 w-3 text-green-400" />
                    Neural-powered optimization algorithms
                  </CardDescription>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="glass hover:shadow-glow transition-all duration-300"
              >
                <Settings className="h-4 w-4 mr-2" />
                {showAdvanced ? 'Simple' : 'Advanced'}
              </Button>
            </div>
          </CardHeader>

          {/* Quantum Tabs */}
          <Tabs value={calculationType} onValueChange={(value) => setCalculationType(value as any)}>
            <div className="px-6 mb-4">
              <TabsList className="glass grid grid-cols-3 p-1 bg-gradient-to-r from-muted/50 to-muted/30 border border-primary/20">
                <TabsTrigger 
                  value="basic" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-400 data-[state=active]:to-cyan-400 data-[state=active]:text-white transition-all duration-300"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Neural
                </TabsTrigger>
                <TabsTrigger 
                  value="kelly"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400 data-[state=active]:to-pink-400 data-[state=active]:text-white transition-all duration-300"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Kelly
                </TabsTrigger>
                <TabsTrigger 
                  value="custom"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-400 data-[state=active]:to-emerald-400 data-[state=active]:text-white transition-all duration-300"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Quantum
                </TabsTrigger>
              </TabsList>
            </div>
            
            <CardContent className="space-y-6">
              {/* Quantum Stake Control */}
            <div className="glass p-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-success rounded-full blur-lg opacity-40"></div>
                  <DollarSign className="relative h-8 w-8 text-green-400" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gradient">Quantum Investment Pool</span>
                    {calculationType !== 'basic' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleStakeEdit}
                        className="glass hover:shadow-glow transition-all duration-300"
                        disabled={editingStake}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Optimize
                      </Button>
                    )}
                  </div>
                  
                  {editingStake ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          ref={inputRef}
                          type="number"
                          value={customStake}
                          onChange={(e) => setCustomStake(parseInt(e.target.value) || 0)}
                          className="glass text-center text-lg font-bold pr-12"
                          placeholder="Enter stake amount"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                          ₦
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={handleStakeConfirm}
                        className="primary-button"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setCustomStake(opportunity.totalStake)
                          setEditingStake(false)
                        }}
                        className="glass"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-gradient-success">
                          {formatCurrency(calculationType === 'basic' ? opportunity.totalStake : customStake)}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Neural-optimized allocation
                        </p>
                      </div>
                      
                      {isCalculating && (
                        <div className="flex items-center gap-2 text-primary">
                          <Activity className="h-4 w-4 animate-pulse" />
                          <span className="text-sm">Processing...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Stake Adjustment */}
            {calculationType === 'custom' && (
              <div className="glass p-4 rounded-xl border border-green-400/20 bg-gradient-to-br from-green-400/5 to-emerald-400/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-green-400 flex items-center gap-2">
                                             <Bolt className="h-4 w-4" />
                      Quantum Adjustment Matrix
                    </span>
                    <Badge className="glass border-green-400/50 text-green-400">
                      {((customStake / opportunity.totalStake) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="glass hover:shadow-glow" 
                      onClick={() => setCustomStake(prev => Math.max(1000, prev - 10000))}
                    >
                      <TrendingDown className="h-3 w-3 mr-1" />
                      -10K
                    </Button>
                    
                    <div className="flex-1 relative">
                      <Slider 
                        value={[customStake]} 
                        min={1000} 
                        max={opportunity.totalStake * 5} 
                        step={1000}
                        onValueChange={(values) => setCustomStake(values[0])}
                        className="relative"
                      />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 glass px-2 py-1 rounded text-xs font-medium border border-primary/20">
                        {formatCurrency(customStake)}
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="glass hover:shadow-glow" 
                      onClick={() => setCustomStake(prev => prev + 10000)}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +10K
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Quantum Results Display */}
            <TabsContent value="basic" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gradient flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Neural Distribution Matrix
                  </h4>
                  <Badge className="glass border-blue-400/50 text-blue-400">
                    Optimized
                  </Badge>
                </div>
                
                <div className="grid gap-3">
                  {opportunity.stakes.map((stake, index) => (
                    <div 
                      key={index}
                      className="group glass p-4 rounded-xl border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-3 h-3 bg-gradient-primary rounded-full"></div>
                            <div className="absolute inset-0 bg-gradient-primary rounded-full blur-sm opacity-50"></div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="glass border-primary/30 text-primary">
                                {stake.bookmaker}
                              </Badge>
                              <span className="text-sm font-medium text-gradient">{stake.outcome}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Allocation: {((stake.stake / opportunity.totalStake) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-1">
                          <p className="text-lg font-bold text-gradient-success">{formatCurrency(stake.stake)}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3" />
                            <span>{formatCurrency(stake.potentialReturn)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-3 w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-primary transition-all duration-1000 ease-out"
                          style={{ width: `${(stake.stake / opportunity.totalStake) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="kelly" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gradient flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Kelly Criterion Optimization
                  </h4>
                  <Badge className="glass border-purple-400/50 text-purple-400">
                    Mathematical
                  </Badge>
                </div>
                
                <div className="glass p-3 rounded-lg border border-purple-400/20 bg-gradient-to-r from-purple-400/5 to-pink-400/5 mb-4">
                  <p className="text-sm text-purple-300 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Conservative Kelly (25% fraction) for optimal risk management
                  </p>
                </div>
                
                <div className="grid gap-3">
                  {getKellyStakes().map((stake, index) => (
                    <div 
                      key={index}
                      className="group glass p-4 rounded-xl border border-purple-400/10 hover:border-purple-400/30 transition-all duration-300 hover:shadow-glow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-sm opacity-50"></div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="glass border-purple-400/30 text-purple-400">
                                {stake.bookmaker}
                              </Badge>
                              <span className="text-sm font-medium text-gradient">{stake.outcome}</span>
                              <Badge variant="outline" className="text-xs glass">
                                @{stake.odds}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Kelly optimized distribution
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-1">
                          <p className="text-lg font-bold text-gradient-success">{formatCurrency(stake.stake)}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3" />
                            <span>{formatCurrency(stake.potentialReturn)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="custom" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gradient flex items-center gap-2">
                    <Rocket className="h-4 w-4" />
                    Quantum Custom Matrix
                  </h4>
                  <Badge className="glass border-green-400/50 text-green-400">
                    Personalized
                  </Badge>
                </div>
                
                <div className="grid gap-3">
                  {getStakeDistribution().map((stake, index) => (
                    <div 
                      key={index}
                      className="group glass p-4 rounded-xl border border-green-400/10 hover:border-green-400/30 transition-all duration-300 hover:shadow-glow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full blur-sm opacity-50"></div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="glass border-green-400/30 text-green-400">
                                {stake.bookmaker}
                              </Badge>
                              <span className="text-sm font-medium text-gradient">{stake.outcome}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Custom scaled allocation
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-1">
                          <p className="text-lg font-bold text-gradient-success">{formatCurrency(stake.stake)}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3" />
                            <span>{formatCurrency(stake.potentialReturn)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>

          {/* Quantum Footer Analytics */}
          <CardFooter className="pt-6 pb-4 border-t border-primary/20 bg-gradient-to-r from-muted/20 to-muted/10">
            <div className="w-full space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass p-4 rounded-xl text-center border border-primary/20 hover:shadow-glow transition-all duration-300">
                  <div className="flex items-center justify-center mb-2">
                    <Coins className="h-6 w-6 text-primary mr-2" />
                    <span className="text-sm font-semibold text-muted-foreground">Total Stake</span>
                  </div>
                  <p className="text-xl font-bold text-gradient">{formatCurrency(currentTotalStake)}</p>
                </div>
                
                <div className="glass p-4 rounded-xl text-center border border-green-400/20 hover:shadow-glow transition-all duration-300">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-6 w-6 text-green-400 mr-2" />
                    <span className="text-sm font-semibold text-muted-foreground">Guaranteed Profit</span>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gradient-success">{formatCurrency(profitAmount)}</p>
                    <p className="text-sm text-green-400">({profitPercentage.toFixed(2)}%)</p>
                  </div>
                </div>
                
                <div className="glass p-4 rounded-xl text-center border border-accent/20 hover:shadow-glow transition-all duration-300">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="h-6 w-6 text-accent mr-2" />
                    <span className="text-sm font-semibold text-muted-foreground">ROI Efficiency</span>
                  </div>
                  <p className="text-xl font-bold text-gradient">
                    {calculationType === 'basic' ? 'Optimal' : 'Enhanced'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline" 
                      className="flex-1 glass hover:shadow-glow transition-all duration-300" 
                      onClick={handleCopyToClipboard}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Export to Quantum Clipboard
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="glass">
                    <p>Copy optimized stakes to clipboard</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      className="flex-1 primary-button"
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Neural Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="glass">
                    <p>Reset to default configuration</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  )
}