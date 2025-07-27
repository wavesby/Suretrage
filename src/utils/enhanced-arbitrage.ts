import { MatchOdds, ArbitrageOpportunity, StakeDistribution, BestOdds, BookmakerInfo } from './arbitrage';

// Enhanced interfaces for advanced arbitrage detection
export interface EnhancedArbitrageOpportunity extends ArbitrageOpportunity {
  marketCombination: string[];
  efficiencyScore: number;
  liquidityScore: number;
  timeDecayFactor: number;
  crossMarketPotential: number;
  optimalWindow: {
    start: Date;
    end: Date;
    confidenceAtWindow: number;
  };
  alternativeStakes?: StakeDistribution[];
  riskMetrics: {
    bookmakerReliability: number;
    marketStability: number;
    executionRisk: number;
    suspensionProbability: number;
  };
}

// Advanced market analysis interface
interface MarketData {
  marketType: string;
  bookmaker: string;
  odds: number[];
  lastUpdate: Date;
  liquidity: number;
  suspensionRisk: number;
  impliedProbabilities: number[];
  marketMargin: number;
}

// Bookmaker reliability scoring
const BOOKMAKER_RELIABILITY: Record<string, number> = {
  'Bet365': 0.95,
  'Pinnacle': 0.98,
  'Betway': 0.90,
  '1xBet': 0.85,
  'SportyBet': 0.82,
  'William Hill': 0.92,
  'MarathonBet': 0.88,
  'Bovada': 0.87,
  'FanDuel': 0.93,
  'DraftKings': 0.94,
  // Default for unknown bookmakers
  'default': 0.75
};

// Market type priority and characteristics
const MARKET_PRIORITIES: Record<string, { priority: number; liquidityMultiplier: number; riskFactor: number }> = {
  'h2h': { priority: 1.0, liquidityMultiplier: 1.0, riskFactor: 0.8 },
  'totals': { priority: 0.9, liquidityMultiplier: 0.85, riskFactor: 0.9 },
  'spreads': { priority: 0.85, liquidityMultiplier: 0.8, riskFactor: 1.0 },
  'btts': { priority: 0.8, liquidityMultiplier: 0.7, riskFactor: 1.1 },
  'correct_score': { priority: 0.6, liquidityMultiplier: 0.5, riskFactor: 1.3 }
};

/**
 * Enhanced arbitrage calculator with advanced algorithms
 * Finds more opportunities using sophisticated market analysis
 */
export class EnhancedArbitrageCalculator {
  private oddsHistory: Map<string, MatchOdds[]> = new Map();
  private marketEfficiency: Map<string, number> = new Map();
  private bookmakerPerformance: Map<string, number> = new Map();

  /**
   * Calculate enhanced arbitrage opportunities with advanced algorithms
   */
  public calculateEnhancedArbitrage(
    odds: MatchOdds[], 
    totalStake: number = 10000,
    options: {
      minProfitPercentage?: number;
      maxRiskLevel?: number;
      timeHorizon?: number; // hours
      enableCrossMarket?: boolean;
      dynamicThresholds?: boolean;
    } = {}
  ): EnhancedArbitrageOpportunity[] {
    const {
      minProfitPercentage = 0.1,
      maxRiskLevel = 0.7,
      timeHorizon = 24,
      enableCrossMarket = true,
      dynamicThresholds = true
    } = options;

    try {
      // Step 1: Preprocess and enrich odds data
      const enrichedOdds = this.enrichOddsData(odds);
      
      // Step 2: Group and analyze markets
      const marketGroups = this.groupMarketsByMatch(enrichedOdds);
      
      // Step 3: Find traditional arbitrage opportunities
      const traditionalOpportunities = this.findTraditionalArbitrage(marketGroups, totalStake, dynamicThresholds);
      
      // Step 4: Find cross-market arbitrage opportunities
      const crossMarketOpportunities = enableCrossMarket 
        ? this.findCrossMarketArbitrage(marketGroups, totalStake)
        : [];
      
      // Step 5: Find value betting opportunities (positive EV)
      const valueOpportunities = this.findValueBets(marketGroups, totalStake);
      
      // Step 6: Combine and optimize all opportunities
      const allOpportunities = [
        ...traditionalOpportunities,
        ...crossMarketOpportunities,
        ...valueOpportunities
      ];
      
      // Step 7: Apply advanced filtering and ranking
      const filteredOpportunities = this.applyAdvancedFiltering(
        allOpportunities, 
        minProfitPercentage, 
        maxRiskLevel, 
        timeHorizon
      );
      
      // Step 8: Optimize stake distribution
      return this.optimizeStakeDistribution(filteredOpportunities, totalStake);
      
    } catch (error) {
      console.error('Error in enhanced arbitrage calculation:', error);
      return [];
    }
  }

  /**
   * Enrich odds data with additional market intelligence
   */
  private enrichOddsData(odds: MatchOdds[]): MatchOdds[] {
    return odds.map(odd => {
      const bookmakerReliability = BOOKMAKER_RELIABILITY[odd.bookmaker] || BOOKMAKER_RELIABILITY.default;
      const marketCharacteristics = MARKET_PRIORITIES[odd.market_type] || MARKET_PRIORITIES.h2h;
      
      return {
        ...odd,
        liquidity: this.calculateLiquidity(odd),
        suspensionRisk: this.calculateSuspensionRisk(odd),
        // Add computed fields
        computedReliability: bookmakerReliability,
        marketPriority: marketCharacteristics.priority,
        riskFactor: marketCharacteristics.riskFactor
      } as MatchOdds & {
        computedReliability: number;
        marketPriority: number;
        riskFactor: number;
      };
    });
  }

  /**
   * Group markets by match with enhanced analysis
   */
  private groupMarketsByMatch(odds: MatchOdds[]): Map<string, MatchOdds[]> {
    const groups = new Map<string, MatchOdds[]>();
    
    odds.forEach(odd => {
      // Create a more sophisticated match key that handles team name variations
      const normalizedHome = this.normalizeTeamName(odd.team_home || odd.home_team || '');
      const normalizedAway = this.normalizeTeamName(odd.team_away || odd.away_team || '');
      const matchKey = `${normalizedHome}_vs_${normalizedAway}_${odd.league}`;
      
      if (!groups.has(matchKey)) {
        groups.set(matchKey, []);
      }
      groups.get(matchKey)!.push(odd);
    });
    
    return groups;
  }

  /**
   * Find traditional arbitrage opportunities with dynamic thresholds
   */
  private findTraditionalArbitrage(
    marketGroups: Map<string, MatchOdds[]>, 
    totalStake: number,
    useDynamicThresholds: boolean
  ): EnhancedArbitrageOpportunity[] {
    const opportunities: EnhancedArbitrageOpportunity[] = [];
    
    marketGroups.forEach((matchOdds, matchKey) => {
      // Group by market type
      const marketTypeGroups = this.groupByMarketType(matchOdds);
      
      marketTypeGroups.forEach((marketOdds, marketType) => {
        if (marketOdds.length < 2) return; // Need at least 2 bookmakers
        
        // Calculate dynamic threshold based on market conditions
        const threshold = useDynamicThresholds 
          ? this.calculateDynamicThreshold(marketOdds)
          : 1.02; // Default 2% margin
        
        const arbitrageOpportunity = this.analyzeMarketForArbitrage(
          marketOdds, 
          totalStake, 
          threshold,
          matchKey
        );
        
        if (arbitrageOpportunity) {
          opportunities.push(arbitrageOpportunity);
        }
      });
    });
    
    return opportunities;
  }

  /**
   * Find cross-market arbitrage opportunities (e.g., 1X2 vs Asian Handicap)
   */
  private findCrossMarketArbitrage(
    marketGroups: Map<string, MatchOdds[]>, 
    totalStake: number
  ): EnhancedArbitrageOpportunity[] {
    const opportunities: EnhancedArbitrageOpportunity[] = [];
    
    marketGroups.forEach((matchOdds, matchKey) => {
      const marketTypes = this.groupByMarketType(matchOdds);
      
      // Look for cross-market opportunities between compatible markets
      const compatiblePairs = [
        ['h2h', 'spreads'],
        ['totals', 'btts'],
        ['h2h', 'correct_score']
      ];
      
      compatiblePairs.forEach(([market1, market2]) => {
        const odds1 = marketTypes.get(market1);
        const odds2 = marketTypes.get(market2);
        
        if (odds1 && odds2 && odds1.length > 0 && odds2.length > 0) {
          const crossOpportunity = this.analyzeCrossMarketArbitrage(
            odds1, 
            odds2, 
            totalStake, 
            matchKey
          );
          
          if (crossOpportunity) {
            opportunities.push(crossOpportunity);
          }
        }
      });
    });
    
    return opportunities;
  }

  /**
   * Find value betting opportunities (positive expected value)
   */
  private findValueBets(
    marketGroups: Map<string, MatchOdds[]>, 
    totalStake: number
  ): EnhancedArbitrageOpportunity[] {
    const opportunities: EnhancedArbitrageOpportunity[] = [];
    
    marketGroups.forEach((matchOdds, matchKey) => {
      // Calculate market consensus probabilities
      const consensusProbabilities = this.calculateConsensusProbs(matchOdds);
      
      matchOdds.forEach(odd => {
        const impliedProb = 1 / odd.odds_home;
        const consensusProb = consensusProbabilities.home;
        
        // Look for significant discrepancies indicating value
        if (consensusProb > impliedProb * 1.05) { // 5% edge
          const valueOpportunity = this.createValueBetOpportunity(
            odd, 
            consensusProb, 
            impliedProb,
            totalStake,
            matchKey
          );
          
          if (valueOpportunity) {
            opportunities.push(valueOpportunity);
          }
        }
      });
    });
    
    return opportunities;
  }

  /**
   * Calculate dynamic threshold based on market conditions
   */
  private calculateDynamicThreshold(marketOdds: MatchOdds[]): number {
    const baseThreshold = 1.02; // 2% base margin
    
    // Adjust based on market liquidity
    const avgLiquidity = marketOdds.reduce((sum, odd) => sum + (odd.liquidity || 5), 0) / marketOdds.length;
    const liquidityAdjustment = Math.max(0.995, 1 - (avgLiquidity - 5) * 0.002);
    
    // Adjust based on bookmaker reliability
    const avgReliability = marketOdds.reduce((sum, odd) => {
      const reliability = BOOKMAKER_RELIABILITY[odd.bookmaker] || BOOKMAKER_RELIABILITY.default;
      return sum + reliability;
    }, 0) / marketOdds.length;
    const reliabilityAdjustment = Math.max(0.995, avgReliability);
    
    // Adjust based on time to match
    const timeToMatch = this.getTimeToMatch(marketOdds[0]);
    const timeAdjustment = timeToMatch < 2 ? 1.01 : (timeToMatch > 24 ? 0.998 : 1.0);
    
    return baseThreshold * liquidityAdjustment * reliabilityAdjustment * timeAdjustment;
  }

  /**
   * Analyze market for arbitrage with enhanced metrics
   */
  private analyzeMarketForArbitrage(
    marketOdds: MatchOdds[], 
    totalStake: number, 
    threshold: number,
    matchKey: string
  ): EnhancedArbitrageOpportunity | null {
    
    // Find best odds for each outcome
    const bestHome = marketOdds.reduce((best, current) => 
      current.odds_home > best.odds_home ? current : best);
    const bestAway = marketOdds.reduce((best, current) => 
      current.odds_away > best.odds_away ? current : best);
    
    let bestDraw: MatchOdds | null = null;
    const drawOdds = marketOdds.filter(odd => odd.odds_draw && odd.odds_draw > 0);
    if (drawOdds.length > 0) {
      bestDraw = drawOdds.reduce((best, current) => 
        (current.odds_draw || 0) > (best.odds_draw || 0) ? current : best);
    }
    
    // Calculate arbitrage percentage
    const arbitragePercentage = bestDraw 
      ? (1/bestHome.odds_home) + (1/bestAway.odds_away) + (1/(bestDraw.odds_draw || 1))
      : (1/bestHome.odds_home) + (1/bestAway.odds_away);
    
    // Check if this is a profitable arbitrage
    if (arbitragePercentage >= threshold) return null;
    
    // Calculate stakes and returns
    const stakes = this.calculateOptimalStakes(
      [bestHome, bestAway, ...(bestDraw ? [bestDraw] : [])],
      arbitragePercentage,
      totalStake
    );
    
    const profitPercentage = ((1 / arbitragePercentage) - 1) * 100;
    const guaranteedProfit = stakes[0].potentialReturn - stakes.reduce((sum, s) => sum + s.stake, 0);
    
    // Enhanced risk metrics
    const riskMetrics = this.calculateRiskMetrics(marketOdds, arbitragePercentage);
    const efficiencyScore = this.calculateMarketEfficiency(marketOdds);
    const liquidityScore = this.calculateLiquidityScore(marketOdds);
    
    return {
      id: `enhanced_${matchKey}_${Date.now()}`,
      matchId: marketOdds[0].match_id,
      matchName: marketOdds[0].match_name,
      teamHome: marketOdds[0].team_home || marketOdds[0].home_team || '',
      teamAway: marketOdds[0].team_away || marketOdds[0].away_team || '',
      league: marketOdds[0].league,
      matchTime: marketOdds[0].match_time,
      arbitragePercentage,
      profitPercentage,
      guaranteedProfit,
      profitAmount: guaranteedProfit,
      totalStake: stakes.reduce((sum, s) => sum + s.stake, 0),
      stakes,
      bookmakers: marketOdds.map(odd => ({ bookmaker: odd.bookmaker, odds: odd.odds_home })),
      bestOdds: [
        { outcome: 'Home', bookmaker: bestHome.bookmaker, odds: bestHome.odds_home },
        { outcome: 'Away', bookmaker: bestAway.bookmaker, odds: bestAway.odds_away },
        ...(bestDraw ? [{ outcome: 'Draw', bookmaker: bestDraw.bookmaker, odds: bestDraw.odds_draw || 0 }] : [])
      ],
      lastUpdated: new Date().toISOString(),
      marketType: '1X2',
      
      // Enhanced fields
      marketCombination: [marketOdds[0].market_type],
      efficiencyScore,
      liquidityScore,
      timeDecayFactor: this.calculateTimeDecayFactor(marketOdds[0]),
      crossMarketPotential: 0,
      optimalWindow: this.calculateOptimalWindow(marketOdds[0]),
      riskMetrics,
      riskAssessment: riskMetrics.executionRisk < 0.3 ? 'Low Risk' : 
                     riskMetrics.executionRisk < 0.6 ? 'Medium Risk' : 'High Risk',
      confidenceScore: Math.round((1 - riskMetrics.executionRisk) * 10),
      expectedValue: guaranteedProfit,
      volatility: this.calculateVolatility(stakes)
    };
  }

  /**
   * Calculate optimal stakes using advanced optimization
   */
  private calculateOptimalStakes(
    bestOdds: MatchOdds[], 
    arbitragePercentage: number, 
    totalStake: number
  ): StakeDistribution[] {
    const stakes: StakeDistribution[] = [];
    
    // Kelly-optimized stake distribution
    bestOdds.forEach((odd, index) => {
      const odds = index === 0 ? odd.odds_home : 
                   index === 1 ? odd.odds_away : 
                   odd.odds_draw || 0;
      
      if (odds > 0) {
        const optimalStake = (totalStake * (1 / odds)) / arbitragePercentage;
        const kellyAdjustedStake = this.applyKellyOptimization(optimalStake, odds, arbitragePercentage);
        
        stakes.push({
          outcome: index === 0 ? 'Home' : index === 1 ? 'Away' : 'Draw',
          bookmaker: odd.bookmaker,
          odds,
          stake: Math.round(kellyAdjustedStake),
          potentialReturn: Math.round(kellyAdjustedStake * odds),
          impliedProbability: 1 / odds
        });
      }
    });
    
    return stakes;
  }

  /**
   * Apply Kelly Criterion optimization to stakes
   */
  private applyKellyOptimization(stake: number, odds: number, arbitragePercentage: number): number {
    // For arbitrage, we know the probability is 1 (guaranteed), so Kelly suggests maximum stake
    // But we apply conservative adjustment for execution risk
    const conservativeKelly = stake * 0.95; // 5% reduction for execution risk
    return Math.max(conservativeKelly, stake * 0.8); // Minimum 80% of calculated stake
  }

  // Helper methods for enhanced calculations
  private normalizeTeamName(teamName: string): string {
    return teamName.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/fc$|cf$|united$|city$/g, '');
  }

  private groupByMarketType(odds: MatchOdds[]): Map<string, MatchOdds[]> {
    const groups = new Map<string, MatchOdds[]>();
    odds.forEach(odd => {
      const market = odd.market_type || 'h2h';
      if (!groups.has(market)) groups.set(market, []);
      groups.get(market)!.push(odd);
    });
    return groups;
  }

  private calculateLiquidity(odd: MatchOdds): number {
    // Enhanced liquidity calculation based on bookmaker and market type
    const baseReliability = BOOKMAKER_RELIABILITY[odd.bookmaker] || BOOKMAKER_RELIABILITY.default;
    const marketMultiplier = MARKET_PRIORITIES[odd.market_type]?.liquidityMultiplier || 1.0;
    return (baseReliability * 10) * marketMultiplier;
  }

  private calculateSuspensionRisk(odd: MatchOdds): number {
    const timeToMatch = this.getTimeToMatch(odd);
    const baseRisk = timeToMatch < 1 ? 0.8 : timeToMatch < 6 ? 0.4 : 0.2;
    const marketRisk = MARKET_PRIORITIES[odd.market_type]?.riskFactor || 1.0;
    return Math.min(1.0, baseRisk * marketRisk);
  }

  private getTimeToMatch(odd: MatchOdds): number {
    try {
      const matchTime = new Date(odd.match_time);
      const now = new Date();
      return Math.max(0, (matchTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    } catch {
      return 24; // Default 24 hours if time parsing fails
    }
  }

  private calculateRiskMetrics(marketOdds: MatchOdds[], arbitragePercentage: number) {
    const avgReliability = marketOdds.reduce((sum, odd) => {
      return sum + (BOOKMAKER_RELIABILITY[odd.bookmaker] || BOOKMAKER_RELIABILITY.default);
    }, 0) / marketOdds.length;

    const avgLiquidity = marketOdds.reduce((sum, odd) => sum + (odd.liquidity || 5), 0) / marketOdds.length;
    const marketStability = Math.max(0, 1 - Math.abs(arbitragePercentage - 0.95));
    const avgSuspensionRisk = marketOdds.reduce((sum, odd) => sum + (odd.suspensionRisk || 0.3), 0) / marketOdds.length;

    return {
      bookmakerReliability: avgReliability,
      marketStability,
      executionRisk: 1 - ((avgReliability + marketStability + (avgLiquidity / 10)) / 3),
      suspensionProbability: avgSuspensionRisk
    };
  }

  private calculateMarketEfficiency(marketOdds: MatchOdds[]): number {
    // Calculate how efficient the market is (lower is better for arbitrage)
    const impliedProbs = marketOdds.map(odd => 1 / odd.odds_home);
    const avgProb = impliedProbs.reduce((sum, prob) => sum + prob, 0) / impliedProbs.length;
    const variance = impliedProbs.reduce((sum, prob) => sum + Math.pow(prob - avgProb, 2), 0) / impliedProbs.length;
    return Math.max(0, Math.min(1, variance * 10)); // Higher variance = lower efficiency = better for arbitrage
  }

  private calculateLiquidityScore(marketOdds: MatchOdds[]): number {
    const avgLiquidity = marketOdds.reduce((sum, odd) => sum + (odd.liquidity || 5), 0) / marketOdds.length;
    return Math.min(1, avgLiquidity / 10);
  }

  private calculateTimeDecayFactor(odd: MatchOdds): number {
    const hoursToMatch = this.getTimeToMatch(odd);
    // Opportunities decay as we get closer to match time
    return Math.max(0.1, Math.min(1, hoursToMatch / 24));
  }

  private calculateOptimalWindow(odd: MatchOdds): { start: Date; end: Date; confidenceAtWindow: number } {
    const matchTime = new Date(odd.match_time);
    const optimalStart = new Date(matchTime.getTime() - (4 * 60 * 60 * 1000)); // 4 hours before
    const optimalEnd = new Date(matchTime.getTime() - (30 * 60 * 1000)); // 30 minutes before
    
    return {
      start: optimalStart,
      end: optimalEnd,
      confidenceAtWindow: 0.85
    };
  }

  private calculateVolatility(stakes: StakeDistribution[]): number {
    const avgReturn = stakes.reduce((sum, stake) => sum + stake.potentialReturn, 0) / stakes.length;
    const variance = stakes.reduce((sum, stake) => {
      return sum + Math.pow(stake.potentialReturn - avgReturn, 2);
    }, 0) / stakes.length;
    return Math.sqrt(variance);
  }

  // Placeholder methods for complex features
  private analyzeCrossMarketArbitrage(odds1: MatchOdds[], odds2: MatchOdds[], totalStake: number, matchKey: string): EnhancedArbitrageOpportunity | null {
    // This would implement sophisticated cross-market analysis
    // For now, return null to focus on main arbitrage improvements
    return null;
  }

  private calculateConsensusProbs(matchOdds: MatchOdds[]): { home: number; away: number; draw?: number } {
    const homeProbs = matchOdds.map(odd => 1 / odd.odds_home);
    const awayProbs = matchOdds.map(odd => 1 / odd.odds_away);
    
    return {
      home: homeProbs.reduce((sum, prob) => sum + prob, 0) / homeProbs.length,
      away: awayProbs.reduce((sum, prob) => sum + prob, 0) / awayProbs.length
    };
  }

  private createValueBetOpportunity(odd: MatchOdds, consensusProb: number, impliedProb: number, totalStake: number, matchKey: string): EnhancedArbitrageOpportunity | null {
    // This would implement value betting logic
    // For now, return null to focus on arbitrage improvements
    return null;
  }

  private applyAdvancedFiltering(opportunities: EnhancedArbitrageOpportunity[], minProfit: number, maxRisk: number, timeHorizon: number): EnhancedArbitrageOpportunity[] {
    return opportunities.filter(opp => {
      return opp.profitPercentage >= minProfit &&
             opp.riskMetrics.executionRisk <= maxRisk &&
             opp.timeDecayFactor > 0.2; // Must have reasonable time left
    });
  }

  private optimizeStakeDistribution(opportunities: EnhancedArbitrageOpportunity[], totalStake: number): EnhancedArbitrageOpportunity[] {
    // Advanced portfolio optimization could be implemented here
    // For now, just sort by profit percentage and efficiency
    return opportunities.sort((a, b) => {
      const scoreA = a.profitPercentage * a.efficiencyScore * a.liquidityScore;
      const scoreB = b.profitPercentage * b.efficiencyScore * b.liquidityScore;
      return scoreB - scoreA;
    });
  }
}

/**
 * Enhanced arbitrage calculation function that uses the new calculator
 */
export const calculateEnhancedArbitrage = (
  odds: MatchOdds[], 
  totalStake: number = 10000,
  options?: any
): EnhancedArbitrageOpportunity[] => {
  const calculator = new EnhancedArbitrageCalculator();
  return calculator.calculateEnhancedArbitrage(odds, totalStake, options);
}; 