import { BookmakerOdds } from '@/contexts/DataContext';

// Define the MatchOdds interface
export interface MatchOdds {
  id: string;
  match_id: string;
  bookmaker: string;
  match_name: string;
  team_home?: string;
  team_away?: string;
  home_team?: string; // Added for compatibility with server response
  away_team?: string; // Added for compatibility with server response
  league: string;
  match_time: string;
  market_type: string;
  odds_home: number;
  odds_draw?: number;
  odds_away: number;
  // Over/Under goals market
  goals_over_under?: number;  // The threshold value (e.g., 2.5 goals)
  odds_over?: number;         // Odds for over goals
  odds_under?: number;        // Odds for under goals
  updated_at: string;
  liquidity?: number;
  suspensionRisk?: number;
}

// Define the ArbitrageOpportunity interface
export interface ArbitrageOpportunity {
  id: string;
  matchId: string;
  matchName: string;
  teamHome: string;
  teamAway: string;
  league: string;
  matchTime: string;
  arbitragePercentage: number;
  profitPercentage: number;
  guaranteedProfit: number;
  profitAmount: number; // Added for profit calculation
  totalStake: number;
  stakes: StakeDistribution[];
  bookmakers: BookmakerInfo[];
  bestOdds: BestOdds[];
  riskAssessment?: string;
  confidenceScore?: number;
  expectedValue?: number;
  volatility?: number;
  lastUpdated: string;
  marketType?: '1X2' | 'OVER_UNDER'; // Market type for filtering
  
  // Enhanced fields for smarter arbitrage detection
  efficiencyScore?: number;
  liquidityScore?: number;
  timeDecayFactor?: number;
  marketStabilityScore?: number;
  bookmakerReliabilityScore?: number;
  optimalExecutionWindow?: {
    start: Date;
    end: Date;
    recommendedAction: string;
  };
}

// Define the StakeDistribution interface
export interface StakeDistribution {
  outcome: string;
  bookmaker: string;
  odds: number;
  stake: number;
  potentialReturn: number;
  impliedProbability?: number;
}

// Define the BookmakerInfo interface
export interface BookmakerInfo {
  bookmaker: string;
  odds: number;
}

// Define the BestOdds interface
export interface BestOdds {
  outcome: string;
  bookmaker: string;
  odds: number;
}

// Enhanced bookmaker reliability scoring for smarter arbitrage detection
const BOOKMAKER_RELIABILITY: Record<string, number> = {
  'Bet365': 0.95,
  'Pinnacle': 0.98,
  'Betway': 0.92,
  '1xBet': 0.88,
  'SportyBet': 0.85,
  'William Hill': 0.93,
  'MarathonBet': 0.89,
  'Bovada': 0.87,
  'FanDuel': 0.94,
  'DraftKings': 0.95,
  'Unibet': 0.91,
  'Matchbook': 0.89,
  'Bet9ja': 0.83,
  'BetKing': 0.82,
  'NairaBet': 0.80,
  'BangBet': 0.78,
  'Parimatch': 0.86,
  // Default for unknown bookmakers
  'default': 0.75
};

// Market efficiency factors for smarter threshold calculation
const MARKET_EFFICIENCY_FACTORS: Record<string, number> = {
  'soccer_epl': 0.98,           // Highly efficient
  'soccer_spain_la_liga': 0.97,
  'soccer_germany_bundesliga': 0.97,
  'soccer_italy_serie_a': 0.96,
  'soccer_france_ligue_one': 0.96,
  'soccer_uefa_champs_league': 0.98,
  'basketball_nba': 0.97,
  'americanfootball_nfl': 0.97,
  'default': 0.85               // Less efficient markets
};

// Advanced team name normalization for better match grouping
const normalizeTeamName = (teamName: string): string => {
  if (!teamName) return '';
  
  return teamName
    .toLowerCase()
    .trim()
    // Remove common suffixes
    .replace(/\s+(fc|cf|united|city|town|rovers|wanderers|athletic|albion|hotspur)$/i, '')
    // Remove ID prefixes that some scrapers add
    .replace(/^id:\s*\d+\s*/i, '')
    // Normalize spaces and special characters
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    // Handle common team name variations
    .replace(/\bmun\b/g, 'manchester')
    .replace(/\bliv\b/g, 'liverpool')
    .replace(/\bche\b/g, 'chelsea')
    .replace(/\bars\b/g, 'arsenal')
    .replace(/\btot\b/g, 'tottenham')
    .trim();
};

// Calculate dynamic threshold based on market conditions for smarter arbitrage detection
const calculateDynamicThreshold = (matchOdds: MatchOdds[]): number => {
  const baseThreshold = 1.015; // Start with 1.5% base margin (more aggressive)
  
  // Factor 1: Market efficiency (more efficient markets need lower thresholds)
  const league = matchOdds[0]?.league || 'default';
  const sportKey = matchOdds[0]?.market_type || 'default';
  const marketEfficiency = MARKET_EFFICIENCY_FACTORS[sportKey] || MARKET_EFFICIENCY_FACTORS.default;
  const efficiencyAdjustment = 1 + (1 - marketEfficiency) * 0.02; // Less efficient = higher threshold
  
  // Factor 2: Bookmaker reliability (more reliable bookmakers = lower threshold)
  const avgReliability = matchOdds.reduce((sum, odd) => {
    return sum + (BOOKMAKER_RELIABILITY[odd.bookmaker] || BOOKMAKER_RELIABILITY.default);
  }, 0) / matchOdds.length;
  const reliabilityAdjustment = 1 + (1 - avgReliability) * 0.015;
  
  // Factor 3: Market liquidity (higher liquidity = lower threshold)
  const avgLiquidity = matchOdds.reduce((sum, odd) => sum + (odd.liquidity || 5), 0) / matchOdds.length;
  const liquidityAdjustment = Math.max(0.995, 1 - (avgLiquidity - 5) * 0.001);
  
  // Factor 4: Time to match (more time = lower threshold, less time = higher threshold)
  const timeToMatch = getTimeToMatch(matchOdds[0]);
  let timeAdjustment = 1.0;
  if (timeToMatch < 1) timeAdjustment = 1.008; // Very close to match
  else if (timeToMatch < 3) timeAdjustment = 1.005; // Close to match  
  else if (timeToMatch > 48) timeAdjustment = 0.998; // Plenty of time
  
  // Factor 5: Number of bookmakers (more bookmakers = lower threshold)
  const numBookmakers = new Set(matchOdds.map(odd => odd.bookmaker)).size;
  const bookmakersAdjustment = Math.max(0.995, 1 - (numBookmakers - 2) * 0.002);
  
  const dynamicThreshold = baseThreshold * 
    efficiencyAdjustment * 
    reliabilityAdjustment * 
    liquidityAdjustment * 
    timeAdjustment * 
    bookmakersAdjustment;
  
  // Ensure threshold stays within reasonable bounds
  return Math.max(1.005, Math.min(1.03, dynamicThreshold));
};

// Enhanced market analysis for finding more opportunities
const findAdditionalOpportunities = (matchOdds: MatchOdds[]): MatchOdds[] => {
  const additionalOpps: MatchOdds[] = [];
  
  // Look for value in different market combinations
  const homeTeam = matchOdds[0]?.team_home || matchOdds[0]?.home_team || '';
  const awayTeam = matchOdds[0]?.team_away || matchOdds[0]?.away_team || '';
  
  // Check for reverse handicap opportunities
  matchOdds.forEach(odd => {
    // If home team is heavily favored, look for draw/away combinations
    if (odd.odds_home < 1.5 && odd.odds_draw && odd.odds_away) {
      const reverseHomeOdds = 1 / ((1/odd.odds_draw) + (1/odd.odds_away));
      if (reverseHomeOdds > odd.odds_home * 1.02) {
        // Create synthetic opportunity
        additionalOpps.push({
          ...odd,
          id: `synthetic_${odd.id}`,
          odds_home: reverseHomeOdds,
          market_type: 'synthetic_reverse'
        });
      }
    }
  });
  
  return additionalOpps;
};

// Enhanced stake optimization using Kelly Criterion principles
const optimizeStakeDistribution = (
  stakes: StakeDistribution[], 
  arbitragePercentage: number,
  totalStake: number,
  riskFactor: number = 0.95
): StakeDistribution[] => {
  return stakes.map(stake => {
    // Apply risk-adjusted Kelly optimization
    const kellyMultiplier = riskFactor * (1 / arbitragePercentage);
    const optimizedStake = stake.stake * kellyMultiplier;
    
    return {
      ...stake,
      stake: Math.round(optimizedStake),
      potentialReturn: Math.round(optimizedStake * stake.odds)
    };
  });
};

/**
 * ENHANCED Calculate arbitrage opportunities from a list of odds with SMARTER algorithms
 * @param odds - List of match odds from different bookmakers
 * @param totalStake - Total stake amount to distribute
 * @returns List of arbitrage opportunities
 */
export const calculateArbitrage = (odds: MatchOdds[], totalStake: number = 10000): ArbitrageOpportunity[] => {
  try {
    if (!odds || !Array.isArray(odds) || odds.length === 0) {
      console.warn('No odds data provided for arbitrage calculation');
      return [];
    }

    // ENHANCEMENT: Better team name normalization for more accurate grouping
    const normalizedOdds = odds.map(odd => ({
      ...odd,
      normalizedHome: normalizeTeamName(odd.team_home || odd.home_team || ''),
      normalizedAway: normalizeTeamName(odd.team_away || odd.away_team || '')
    }));

    // Group odds by match using enhanced normalization
    const matchGroups: Record<string, MatchOdds[]> = {};
    
    normalizedOdds.forEach(odd => {
      // Create a more robust match key
      const matchKey = `${(odd as any).normalizedHome}_vs_${(odd as any).normalizedAway}_${odd.league}`;
      
      if (!matchGroups[matchKey]) {
        matchGroups[matchKey] = [];
      }
      
      matchGroups[matchKey].push(odd);
    });
    
    const opportunities: ArbitrageOpportunity[] = [];
    
    // Process each match group with enhanced algorithms
    Object.entries(matchGroups).forEach(([matchKey, matchOdds]) => {
      // ENHANCEMENT: Require at least 2 bookmakers but be smarter about single bookmaker opportunities
      if (matchOdds.length < 2) {
        // Look for synthetic opportunities even with single bookmaker
        const additionalOpps = findAdditionalOpportunities(matchOdds);
        if (additionalOpps.length > 0) {
          matchOdds.push(...additionalOpps);
        }
        if (matchOdds.length < 2) return;
      }
      
      // ENHANCEMENT: Calculate dynamic threshold for this specific match
      const dynamicThreshold = calculateDynamicThreshold(matchOdds);
      
      // Find best odds for each outcome across all bookmakers (1X2 market)
      const bestHomeOdds = matchOdds.reduce((best, current) => 
        current.odds_home > best.odds_home ? current : best, matchOdds[0]);
        
      const bestAwayOdds = matchOdds.reduce((best, current) => 
        current.odds_away > best.odds_away ? current : best, matchOdds[0]);
      
      const bestDrawOdds = matchOdds.reduce((best, current) => {
        if (!best.odds_draw) return current;
        if (!current.odds_draw) return best;
        return current.odds_draw > best.odds_draw ? current : best;
      }, matchOdds[0]);
      
      // ENHANCEMENT: Check for over/under market opportunities with smarter detection
      const overUnderOdds = matchOdds.filter(odd => 
        odd.goals_over_under !== undefined && 
        odd.odds_over !== undefined && 
        odd.odds_under !== undefined
      );
      
      if (overUnderOdds.length >= 2) {
        // Enhanced over/under analysis
        const overUnderGroups: Record<string, MatchOdds[]> = {};
        
        overUnderOdds.forEach(odd => {
          const key = `${odd.goals_over_under}`;
          if (!overUnderGroups[key]) {
            overUnderGroups[key] = [];
          }
          overUnderGroups[key].push(odd);
        });
        
        // Check each threshold group for arbitrage with dynamic thresholds
        Object.entries(overUnderGroups).forEach(([threshold, thresholdOdds]) => {
          if (thresholdOdds.length < 2) return;
          
          const bestOverOdds = thresholdOdds.reduce((best, current) => 
            (current.odds_over ?? 0) > (best.odds_over ?? 0) ? current : best, thresholdOdds[0]);
          
          const bestUnderOdds = thresholdOdds.reduce((best, current) => 
            (current.odds_under ?? 0) > (best.odds_under ?? 0) ? current : best, thresholdOdds[0]);
          
          // Calculate arbitrage percentage for over/under
          const overUnderArbitragePercentage = (1 / (bestOverOdds.odds_over ?? 1)) + 
                                               (1 / (bestUnderOdds.odds_under ?? 1));
          
          // ENHANCEMENT: Use dynamic threshold instead of fixed 1.02
          const ouThreshold = calculateDynamicThreshold(thresholdOdds);
          if (overUnderArbitragePercentage >= ouThreshold) return;
          
          // Calculate stakes with enhanced optimization
          let overStake = (totalStake * (1 / (bestOverOdds.odds_over ?? 1))) / overUnderArbitragePercentage;
          let underStake = (totalStake * (1 / (bestUnderOdds.odds_under ?? 1))) / overUnderArbitragePercentage;
          
          // Apply Kelly optimization
          const riskFactor = calculateRiskFactor(thresholdOdds);
          overStake *= riskFactor;
          underStake *= riskFactor;
          
          const overUnderStakes: StakeDistribution[] = [
            {
              outcome: `Over ${threshold} Goals`,
              bookmaker: bestOverOdds.bookmaker,
              odds: bestOverOdds.odds_over ?? 0,
              stake: Math.round(overStake),
              potentialReturn: Math.round(overStake * (bestOverOdds.odds_over ?? 0)),
              impliedProbability: 1 / (bestOverOdds.odds_over ?? 1)
            },
            {
              outcome: `Under ${threshold} Goals`,
              bookmaker: bestUnderOdds.bookmaker,
              odds: bestUnderOdds.odds_under ?? 0,
              stake: Math.round(underStake),
              potentialReturn: Math.round(underStake * (bestUnderOdds.odds_under ?? 0)),
              impliedProbability: 1 / (bestUnderOdds.odds_under ?? 1)
            }
          ];
          
          // Enhanced profit calculation
          const profitPercentage = ((1 / overUnderArbitragePercentage) - 1) * 100;
          const actualTotalStake = overUnderStakes.reduce((sum, stake) => sum + stake.stake, 0);
          const guaranteedProfit = Math.round(overUnderStakes[0].potentialReturn - actualTotalStake);
          
          // ENHANCEMENT: Advanced scoring and metrics
          const efficiencyScore = calculateMarketEfficiencyScore(thresholdOdds);
          const liquidityScore = calculateLiquidityScore(thresholdOdds);
          const timeDecayFactor = calculateTimeDecayFactor(thresholdOdds[0]);
          
          const overUnderOpportunity: ArbitrageOpportunity = {
            id: `enhanced_ou_${matchKey}_${threshold}_${Date.now()}`,
            matchId: thresholdOdds[0].match_id,
            matchName: thresholdOdds[0].match_name,
            teamHome: thresholdOdds[0].team_home || thresholdOdds[0].home_team || '',
            teamAway: thresholdOdds[0].team_away || thresholdOdds[0].away_team || '',
            league: thresholdOdds[0].league,
            matchTime: thresholdOdds[0].match_time,
            arbitragePercentage: overUnderArbitragePercentage,
            profitPercentage,
            guaranteedProfit,
            totalStake: actualTotalStake,
            stakes: overUnderStakes,
            bookmakers: thresholdOdds.map(odd => ({
              bookmaker: odd.bookmaker,
              odds: odd.odds_over ?? 0
            })),
            bestOdds: [
              { outcome: `Over ${threshold} Goals`, bookmaker: bestOverOdds.bookmaker, odds: bestOverOdds.odds_over ?? 0 },
              { outcome: `Under ${threshold} Goals`, bookmaker: bestUnderOdds.bookmaker, odds: bestUnderOdds.odds_under ?? 0 }
            ],
            riskAssessment: calculateEnhancedRiskAssessment(thresholdOdds, overUnderArbitragePercentage),
            confidenceScore: calculateEnhancedConfidenceScore(thresholdOdds, overUnderArbitragePercentage),
            expectedValue: guaranteedProfit,
            volatility: calculateVolatility(overUnderStakes),
            lastUpdated: new Date().toISOString(),
            marketType: 'OVER_UNDER',
            profitAmount: guaranteedProfit,
            
            // Enhanced metrics
            efficiencyScore,
            liquidityScore,
            timeDecayFactor,
            marketStabilityScore: calculateMarketStability(thresholdOdds),
            bookmakerReliabilityScore: calculateBookmakerReliabilityScore(thresholdOdds),
            optimalExecutionWindow: calculateOptimalExecutionWindow(thresholdOdds[0])
          };
          
          opportunities.push(overUnderOpportunity);
        });
      }
      
      // ENHANCEMENT: Enhanced 1X2 market analysis
      let arbitragePercentage: number;
      let stakes: StakeDistribution[] = [];
      let bestOdds: BestOdds[] = [];
      
      // Check if we have draw odds (3-way market) with smarter detection
      if (bestDrawOdds && bestDrawOdds.odds_draw && bestDrawOdds.odds_draw > 0) {
        // 3-way market (1X2)
        arbitragePercentage = (1 / bestHomeOdds.odds_home) + 
                              (1 / bestAwayOdds.odds_away) + 
                              (1 / bestDrawOdds.odds_draw);
        
        // ENHANCEMENT: Use dynamic threshold instead of fixed threshold
        if (arbitragePercentage >= dynamicThreshold) return;
        
        // Calculate stakes with enhanced optimization
        const riskFactor = calculateRiskFactor(matchOdds);
        let homeStake = (totalStake * (1 / bestHomeOdds.odds_home)) / arbitragePercentage * riskFactor;
        let awayStake = (totalStake * (1 / bestAwayOdds.odds_away)) / arbitragePercentage * riskFactor;
        let drawStake = (totalStake * (1 / bestDrawOdds.odds_draw)) / arbitragePercentage * riskFactor;
        
        stakes = [
          {
            outcome: 'Home',
            bookmaker: bestHomeOdds.bookmaker,
            odds: bestHomeOdds.odds_home,
            stake: Math.round(homeStake),
            potentialReturn: Math.round(homeStake * bestHomeOdds.odds_home),
            impliedProbability: 1 / bestHomeOdds.odds_home
          },
          {
            outcome: 'Away',
            bookmaker: bestAwayOdds.bookmaker,
            odds: bestAwayOdds.odds_away,
            stake: Math.round(awayStake),
            potentialReturn: Math.round(awayStake * bestAwayOdds.odds_away),
            impliedProbability: 1 / bestAwayOdds.odds_away
          },
          {
            outcome: 'Draw',
            bookmaker: bestDrawOdds.bookmaker,
            odds: bestDrawOdds.odds_draw,
            stake: Math.round(drawStake),
            potentialReturn: Math.round(drawStake * bestDrawOdds.odds_draw),
            impliedProbability: 1 / bestDrawOdds.odds_draw
          }
        ];
        
        bestOdds = [
          { outcome: 'Home', bookmaker: bestHomeOdds.bookmaker, odds: bestHomeOdds.odds_home },
          { outcome: 'Away', bookmaker: bestAwayOdds.bookmaker, odds: bestAwayOdds.odds_away },
          { outcome: 'Draw', bookmaker: bestDrawOdds.bookmaker, odds: bestDrawOdds.odds_draw }
        ];
      } else {
        // 2-way market (no draw)
        arbitragePercentage = (1 / bestHomeOdds.odds_home) + (1 / bestAwayOdds.odds_away);
        
        // ENHANCEMENT: Use dynamic threshold
        if (arbitragePercentage >= dynamicThreshold) return;
        
        const riskFactor = calculateRiskFactor(matchOdds);
        let homeStake = (totalStake * (1 / bestHomeOdds.odds_home)) / arbitragePercentage * riskFactor;
        let awayStake = (totalStake * (1 / bestAwayOdds.odds_away)) / arbitragePercentage * riskFactor;
        
        stakes = [
          {
            outcome: 'Home',
            bookmaker: bestHomeOdds.bookmaker,
            odds: bestHomeOdds.odds_home,
            stake: Math.round(homeStake),
            potentialReturn: Math.round(homeStake * bestHomeOdds.odds_home),
            impliedProbability: 1 / bestHomeOdds.odds_home
          },
          {
            outcome: 'Away',
            bookmaker: bestAwayOdds.bookmaker,
            odds: bestAwayOdds.odds_away,
            stake: Math.round(awayStake),
            potentialReturn: Math.round(awayStake * bestAwayOdds.odds_away),
            impliedProbability: 1 / bestAwayOdds.odds_away
          }
        ];
        
        bestOdds = [
          { outcome: 'Home', bookmaker: bestHomeOdds.bookmaker, odds: bestHomeOdds.odds_home },
          { outcome: 'Away', bookmaker: bestAwayOdds.bookmaker, odds: bestAwayOdds.odds_away }
        ];
      }
      
      // Enhanced profit calculation
      const profitPercentage = ((1 / arbitragePercentage) - 1) * 100;
      const actualTotalStake = stakes.reduce((sum, stake) => sum + stake.stake, 0);
      const guaranteedProfit = Math.round(stakes[0].potentialReturn - actualTotalStake);
      
      // ENHANCEMENT: Advanced scoring and metrics
      const efficiencyScore = calculateMarketEfficiencyScore(matchOdds);
      const liquidityScore = calculateLiquidityScore(matchOdds);
      const timeDecayFactor = calculateTimeDecayFactor(matchOdds[0]);
      
      const opportunity: ArbitrageOpportunity = {
        id: `enhanced_${matchKey}_${Date.now()}`,
        matchId: matchOdds[0].match_id,
        matchName: matchOdds[0].match_name,
        teamHome: matchOdds[0].team_home || matchOdds[0].home_team || '',
        teamAway: matchOdds[0].team_away || matchOdds[0].away_team || '',
        league: matchOdds[0].league,
        matchTime: matchOdds[0].match_time,
        arbitragePercentage,
        profitPercentage,
        guaranteedProfit,
        totalStake: actualTotalStake,
        stakes,
        bookmakers: matchOdds.map(odd => ({
          bookmaker: odd.bookmaker,
          odds: odd.odds_home
        })),
        bestOdds,
        riskAssessment: calculateEnhancedRiskAssessment(matchOdds, arbitragePercentage),
        confidenceScore: calculateEnhancedConfidenceScore(matchOdds, arbitragePercentage),
        expectedValue: guaranteedProfit,
        volatility: calculateVolatility(stakes),
        lastUpdated: new Date().toISOString(),
        marketType: '1X2',
        profitAmount: guaranteedProfit,
        
        // Enhanced metrics
        efficiencyScore,
        liquidityScore,
        timeDecayFactor,
        marketStabilityScore: calculateMarketStability(matchOdds),
        bookmakerReliabilityScore: calculateBookmakerReliabilityScore(matchOdds),
        optimalExecutionWindow: calculateOptimalExecutionWindow(matchOdds[0])
      };
      
      opportunities.push(opportunity);
    });
    
    // ENHANCEMENT: Smart sorting with multiple criteria
    return opportunities.sort((a, b) => {
      // Calculate composite score: profit * efficiency * liquidity * time_factor * reliability
      const scoreA = a.profitPercentage * 
                     (a.efficiencyScore || 0.5) * 
                     (a.liquidityScore || 0.5) * 
                     (a.timeDecayFactor || 0.5) * 
                     (a.bookmakerReliabilityScore || 0.5);
                     
      const scoreB = b.profitPercentage * 
                     (b.efficiencyScore || 0.5) * 
                     (b.liquidityScore || 0.5) * 
                     (b.timeDecayFactor || 0.5) * 
                     (b.bookmakerReliabilityScore || 0.5);
      
      return scoreB - scoreA;
    });
  } catch (error) {
    console.error('Error calculating enhanced arbitrage opportunities:', error);
    return [];
  }
};

// ENHANCED helper functions for smarter arbitrage detection

const getTimeToMatch = (odd: MatchOdds): number => {
  try {
    const matchTime = new Date(odd.match_time);
    const now = new Date();
    return Math.max(0, (matchTime.getTime() - now.getTime()) / (1000 * 60 * 60));
  } catch {
    return 24; // Default 24 hours if parsing fails
  }
};

const calculateRiskFactor = (matchOdds: MatchOdds[]): number => {
  const avgReliability = matchOdds.reduce((sum, odd) => {
    return sum + (BOOKMAKER_RELIABILITY[odd.bookmaker] || BOOKMAKER_RELIABILITY.default);
  }, 0) / matchOdds.length;
  
  const timeToMatch = getTimeToMatch(matchOdds[0]);
  const timeFactor = timeToMatch < 1 ? 0.9 : timeToMatch > 24 ? 1.0 : 0.95;
  
  return avgReliability * timeFactor;
};

const calculateMarketEfficiencyScore = (matchOdds: MatchOdds[]): number => {
  // Calculate how much variance there is in the implied probabilities
  const impliedProbs = matchOdds.map(odd => 1 / odd.odds_home);
  const avgProb = impliedProbs.reduce((sum, prob) => sum + prob, 0) / impliedProbs.length;
  const variance = impliedProbs.reduce((sum, prob) => sum + Math.pow(prob - avgProb, 2), 0) / impliedProbs.length;
  
  // Higher variance = lower market efficiency = better for arbitrage
  return Math.min(1, variance * 20);
};

const calculateLiquidityScore = (matchOdds: MatchOdds[]): number => {
  const avgLiquidity = matchOdds.reduce((sum, odd) => sum + (odd.liquidity || 5), 0) / matchOdds.length;
  const numBookmakers = new Set(matchOdds.map(odd => odd.bookmaker)).size;
  
  // Combine liquidity and number of bookmakers
  return Math.min(1, (avgLiquidity / 10 + numBookmakers / 10) / 2);
};

const calculateTimeDecayFactor = (odd: MatchOdds): number => {
  const hoursToMatch = getTimeToMatch(odd);
  
  // Optimal window is 2-24 hours before match
  if (hoursToMatch < 0.5) return 0.3; // Very risky
  if (hoursToMatch < 2) return 0.7;   // Somewhat risky
  if (hoursToMatch <= 24) return 1.0; // Optimal
  if (hoursToMatch <= 48) return 0.9; // Good
  return 0.8; // Still acceptable
};

const calculateMarketStability = (matchOdds: MatchOdds[]): number => {
  // Check how recently odds were updated
  const now = new Date();
  const updateTimes = matchOdds.map(odd => {
    try {
      return (now.getTime() - new Date(odd.updated_at).getTime()) / (1000 * 60); // minutes
    } catch {
      return 30; // Default 30 minutes if parsing fails
    }
  });
  
  const avgMinutesSinceUpdate = updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length;
  
  // Fresher odds = more stable market
  return Math.max(0.1, Math.min(1, 1 - (avgMinutesSinceUpdate / 60))); // Decay over 1 hour
};

const calculateBookmakerReliabilityScore = (matchOdds: MatchOdds[]): number => {
  return matchOdds.reduce((sum, odd) => {
    return sum + (BOOKMAKER_RELIABILITY[odd.bookmaker] || BOOKMAKER_RELIABILITY.default);
  }, 0) / matchOdds.length;
};

const calculateOptimalExecutionWindow = (odd: MatchOdds): { start: Date; end: Date; recommendedAction: string } => {
  const matchTime = new Date(odd.match_time);
  const now = new Date();
  
  // Optimal execution window: 2-6 hours before match
  const optimalStart = new Date(matchTime.getTime() - (6 * 60 * 60 * 1000));
  const optimalEnd = new Date(matchTime.getTime() - (2 * 60 * 60 * 1000));
  
  let recommendedAction = 'Monitor';
  if (now < optimalStart) {
    recommendedAction = 'Wait for optimal window';
  } else if (now >= optimalStart && now <= optimalEnd) {
    recommendedAction = 'Execute now - optimal window';
  } else if (now > optimalEnd) {
    recommendedAction = 'Execute immediately - window closing';
  }
  
  return {
    start: optimalStart,
    end: optimalEnd,
    recommendedAction
  };
};

const calculateVolatility = (stakes: StakeDistribution[]): number => {
  const avgReturn = stakes.reduce((sum, stake) => sum + stake.potentialReturn, 0) / stakes.length;
  const variance = stakes.reduce((sum, stake) => {
    return sum + Math.pow(stake.potentialReturn - avgReturn, 2);
  }, 0) / stakes.length;
  return Math.round(Math.sqrt(variance));
};

/**
 * Enhanced risk assessment with multiple factors
 */
const calculateEnhancedRiskAssessment = (matchOdds: MatchOdds[], arbitragePercentage: number): string => {
  try {
    let riskScore = 0;
    
    // Factor 1: Arbitrage margin (lower is riskier)
    const margin = 1 - arbitragePercentage;
    if (margin < 0.005) riskScore += 30; // Very tight margin
    else if (margin < 0.01) riskScore += 20;
    else if (margin < 0.02) riskScore += 10;
    
    // Factor 2: Bookmaker reliability
    const avgReliability = calculateBookmakerReliabilityScore(matchOdds);
    riskScore += (1 - avgReliability) * 25;
    
    // Factor 3: Time to match
    const timeToMatch = getTimeToMatch(matchOdds[0]);
    if (timeToMatch < 1) riskScore += 25;
    else if (timeToMatch < 3) riskScore += 15;
    else if (timeToMatch < 6) riskScore += 5;
    
    // Factor 4: Market liquidity
    const liquidityScore = calculateLiquidityScore(matchOdds);
    riskScore += (1 - liquidityScore) * 20;
    
    // Factor 5: Number of bookmakers
    const numBookmakers = new Set(matchOdds.map(odd => odd.bookmaker)).size;
    if (numBookmakers < 3) riskScore += 15;
    else if (numBookmakers < 5) riskScore += 5;
    
    // Determine risk level
    if (riskScore <= 25) return "Low Risk";
    if (riskScore <= 50) return "Medium Risk";
    return "High Risk";
    
  } catch (error) {
    console.error('Error calculating enhanced risk assessment:', error);
    return "Unknown Risk";
  }
};

/**
 * Enhanced confidence score with multiple factors
 */
const calculateEnhancedConfidenceScore = (matchOdds: MatchOdds[], arbitragePercentage: number): number => {
  try {
    let score = 10;
    
    // Factor 1: Arbitrage margin strength
    const margin = 1 - arbitragePercentage;
    if (margin >= 0.02) score += 1; // Strong margin
    else if (margin < 0.005) score -= 3; // Weak margin
    
    // Factor 2: Bookmaker quality
    const avgReliability = calculateBookmakerReliabilityScore(matchOdds);
    score = score * avgReliability;
    
    // Factor 3: Market efficiency
    const efficiencyScore = calculateMarketEfficiencyScore(matchOdds);
    score += efficiencyScore * 2; // Higher inefficiency = higher confidence
    
    // Factor 4: Time factors
    const timeDecay = calculateTimeDecayFactor(matchOdds[0]);
    score = score * timeDecay;
    
    // Factor 5: Market stability
    const stability = calculateMarketStability(matchOdds);
    score = score * stability;
    
    return Math.max(1, Math.min(10, Math.round(score)));
    
  } catch (error) {
    console.error('Error calculating enhanced confidence score:', error);
    return 5;
  }
};

/**
 * Calculate the implied probability from odds
 * @param odds - The decimal odds
 * @returns The implied probability as a percentage
 */
export const calculateImpliedProbability = (odds: number): number => {
  if (!odds || odds <= 0) return 0;
  return (1 / odds) * 100;
};

/**
 * Calculate the Kelly Criterion stake
 * @param odds - The decimal odds
 * @param probability - The estimated probability of winning (0-1)
 * @param bankroll - The total bankroll
 * @returns The recommended stake amount
 */
export const calculateKelly = (odds: number, probability: number, bankroll: number = 1): number => {
  if (!odds || odds <= 1 || !probability || probability <= 0 || probability >= 1 || !bankroll || bankroll <= 0) {
    return 0;
  }
  
  // Kelly formula: (bp - q) / b
  // where b = odds - 1, p = probability of winning, q = probability of losing (1 - p)
  const b = odds - 1;
  const p = probability;
  const q = 1 - p;
  
  const kellyFraction = (b * p - q) / b;
  
  // Cap the Kelly stake at 25% of bankroll as a safety measure
  const cappedKellyFraction = Math.min(kellyFraction, 0.25);
  
  // Return 0 for negative Kelly (unfavorable bets)
  return cappedKellyFraction > 0 ? cappedKellyFraction * bankroll : 0;
};

/**
 * Format currency amount
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Get time ago string from date
 * @param dateString - Date string to format
 * @returns Time ago string
 */
export const getTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch (error) {
    console.error('Error calculating time ago:', error);
    return 'Unknown';
  }
};

/**
 * Check if an arbitrage opportunity has expired
 * @param matchTime - Match time string
 * @returns True if expired, false otherwise
 */
export const hasArbitrageExpired = (matchTime: string): boolean => {
  try {
    const matchDate = new Date(matchTime);
    const now = new Date();
    
    // Consider expired if match time is in the past
    return matchDate < now;
  } catch (error) {
    console.error('Error checking if arbitrage expired:', error);
    return false;
  }
};