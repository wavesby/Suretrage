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

/**
 * Calculate arbitrage opportunities from a list of odds
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

    // Group odds by match
    const matchGroups: Record<string, MatchOdds[]> = {};
    
    odds.forEach(odd => {
      // Create a normalized match key for grouping
      const matchKey = `${odd.team_home?.toLowerCase() || odd.home_team?.toLowerCase()}-${odd.team_away?.toLowerCase() || odd.away_team?.toLowerCase()}`;
      
      if (!matchGroups[matchKey]) {
        matchGroups[matchKey] = [];
      }
      
      matchGroups[matchKey].push(odd);
    });
    
    const opportunities: ArbitrageOpportunity[] = [];
    
    // Process each match group
    Object.entries(matchGroups).forEach(([matchKey, matchOdds]) => {
      // Skip if we don't have multiple bookmakers (no arbitrage possible)
      if (matchOdds.length < 2) return;
      
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
      
      // Calculate arbitrage percentage (sum of inverse odds)
      let arbitragePercentage: number;
      let stakes: StakeDistribution[] = [];
      let bestOdds: BestOdds[] = [];
      let marketType = '1X2';
      
      // Check for over/under market opportunities
      const overUnderOdds = matchOdds.filter(odd => 
        odd.goals_over_under !== undefined && 
        odd.odds_over !== undefined && 
        odd.odds_under !== undefined
      );
      
      if (overUnderOdds.length >= 2) {
        // Find best odds for over and under outcomes
        // Group by goals threshold (e.g., 2.5)
        const overUnderGroups: Record<string, MatchOdds[]> = {};
        
        overUnderOdds.forEach(odd => {
          const key = `${odd.goals_over_under}`;
          if (!overUnderGroups[key]) {
            overUnderGroups[key] = [];
          }
          overUnderGroups[key].push(odd);
        });
        
        // Check each threshold group for arbitrage
        Object.entries(overUnderGroups).forEach(([threshold, thresholdOdds]) => {
          if (thresholdOdds.length < 2) return; // Need at least 2 bookmakers for comparison
          
          // Find best odds for over and under for this threshold
          const bestOverOdds = thresholdOdds.reduce((best, current) => 
            (current.odds_over ?? 0) > (best.odds_over ?? 0) ? current : best, thresholdOdds[0]);
          
          const bestUnderOdds = thresholdOdds.reduce((best, current) => 
            (current.odds_under ?? 0) > (best.odds_under ?? 0) ? current : best, thresholdOdds[0]);
          
          // Calculate arbitrage percentage for over/under
          const overUnderArbitragePercentage = (1 / (bestOverOdds.odds_over ?? 1)) + 
                                               (1 / (bestUnderOdds.odds_under ?? 1));
          
          // Skip if there's no profitable arbitrage
          if (overUnderArbitragePercentage > 1.02) return;
          
          // Calculate stakes for over/under
          const overStake = (totalStake * (1 / (bestOverOdds.odds_over ?? 1))) / overUnderArbitragePercentage;
          const underStake = (totalStake * (1 / (bestUnderOdds.odds_under ?? 1))) / overUnderArbitragePercentage;
          
          // Create stake distribution
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
          
          // Calculate profit percentage
          const profitPercentage = overUnderArbitragePercentage < 1 
            ? ((1 / overUnderArbitragePercentage) - 1) * 100 
            : 0;
          
          // Calculate guaranteed profit
          const actualTotalStake = overUnderStakes.reduce((sum, stake) => sum + stake.stake, 0);
          const guaranteedProfit = Math.round(overUnderStakes[0].potentialReturn - actualTotalStake);
          
          // Best odds for over/under
          const overUnderBestOdds: BestOdds[] = [
            { 
              outcome: `Over ${threshold} Goals`, 
              bookmaker: bestOverOdds.bookmaker, 
              odds: bestOverOdds.odds_over ?? 0 
            },
            { 
              outcome: `Under ${threshold} Goals`, 
              bookmaker: bestUnderOdds.bookmaker, 
              odds: bestUnderOdds.odds_under ?? 0 
            }
          ];
          
          // Calculate risk assessment
          const riskAssessment = calculateRiskAssessment(thresholdOdds, overUnderArbitragePercentage);
          
          // Calculate confidence score
          const confidenceScore = calculateConfidenceScore(thresholdOdds, overUnderArbitragePercentage);
          
          // Calculate expected value and volatility
          const { expectedValue, volatility } = calculateAdvancedMetrics(overUnderStakes, totalStake);
          
          // Get the reference match for metadata
          const refMatch = thresholdOdds[0];
          
          // Create the arbitrage opportunity
          const overUnderOpportunity: ArbitrageOpportunity = {
            id: `${refMatch.match_id}-ou${threshold}-${Date.now()}`,
            matchId: refMatch.match_id,
            matchName: refMatch.match_name,
            teamHome: refMatch.team_home || refMatch.home_team || '',
            teamAway: refMatch.team_away || refMatch.away_team || '',
            league: refMatch.league,
            matchTime: refMatch.match_time,
            arbitragePercentage: overUnderArbitragePercentage,
            profitPercentage,
            guaranteedProfit,
            totalStake: actualTotalStake,
            stakes: overUnderStakes,
            bookmakers: thresholdOdds.map(odd => ({
              bookmaker: odd.bookmaker,
              odds: odd.odds_over ?? 0 // Just using over odds as a reference
            })),
            bestOdds: overUnderBestOdds,
            riskAssessment,
            confidenceScore,
            expectedValue,
            volatility,
            lastUpdated: new Date().toISOString(),
            marketType: 'OVER_UNDER',
            profitAmount: guaranteedProfit // Add profitAmount property
          };
          
          opportunities.push(overUnderOpportunity);
        });
      }
      
      // Check if we have draw odds (3-way market)
      if (bestDrawOdds && bestDrawOdds.odds_draw && bestDrawOdds.odds_draw > 0) {
        // 3-way market (1X2)
        arbitragePercentage = (1 / bestHomeOdds.odds_home) + 
                              (1 / bestAwayOdds.odds_away) + 
                              (1 / bestDrawOdds.odds_draw);
        
        // Calculate stakes for each outcome
        const homeStake = (totalStake * (1 / bestHomeOdds.odds_home)) / arbitragePercentage;
        const awayStake = (totalStake * (1 / bestAwayOdds.odds_away)) / arbitragePercentage;
        const drawStake = (totalStake * (1 / bestDrawOdds.odds_draw)) / arbitragePercentage;
        
        // Create stake distribution
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
        
        // Add best odds
        bestOdds = [
          { outcome: 'Home', bookmaker: bestHomeOdds.bookmaker, odds: bestHomeOdds.odds_home },
          { outcome: 'Away', bookmaker: bestAwayOdds.bookmaker, odds: bestAwayOdds.odds_away },
          { outcome: 'Draw', bookmaker: bestDrawOdds.bookmaker, odds: bestDrawOdds.odds_draw }
        ];
      } else {
        // 2-way market (no draw)
        arbitragePercentage = (1 / bestHomeOdds.odds_home) + (1 / bestAwayOdds.odds_away);
        
        // Calculate stakes for each outcome
        const homeStake = (totalStake * (1 / bestHomeOdds.odds_home)) / arbitragePercentage;
        const awayStake = (totalStake * (1 / bestAwayOdds.odds_away)) / arbitragePercentage;
        
        // Create stake distribution
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
        
        // Add best odds
        bestOdds = [
          { outcome: 'Home', bookmaker: bestHomeOdds.bookmaker, odds: bestHomeOdds.odds_home },
          { outcome: 'Away', bookmaker: bestAwayOdds.bookmaker, odds: bestAwayOdds.odds_away }
        ];
      }
      
      // Calculate profit percentage
      const profitPercentage = arbitragePercentage < 1 
        ? ((1 / arbitragePercentage) - 1) * 100 
        : 0;
      
      // Calculate guaranteed profit
      const actualTotalStake = stakes.reduce((sum, stake) => sum + stake.stake, 0);
      const guaranteedProfit = Math.round(stakes[0].potentialReturn - actualTotalStake);
      
      // Skip if there's no profit (not an arbitrage)
      // But include value bets with small negative arbitrage (within 2%)
      if (arbitragePercentage > 1.02) return;
      
      // Calculate risk assessment
      const riskAssessment = calculateRiskAssessment(matchOdds, arbitragePercentage);
      
      // Calculate confidence score
      const confidenceScore = calculateConfidenceScore(matchOdds, arbitragePercentage);
      
      // Calculate expected value and volatility
      const { expectedValue, volatility } = calculateAdvancedMetrics(stakes, totalStake);
      
      // Get the reference match for metadata
      const refMatch = matchOdds[0];
      
      // Create the arbitrage opportunity
      const opportunity: ArbitrageOpportunity = {
        id: `${refMatch.match_id}-${Date.now()}`,
        matchId: refMatch.match_id,
        matchName: refMatch.match_name,
        teamHome: refMatch.team_home || refMatch.home_team || '',
        teamAway: refMatch.team_away || refMatch.away_team || '',
        league: refMatch.league,
        matchTime: refMatch.match_time,
        arbitragePercentage,
        profitPercentage,
        guaranteedProfit,
        totalStake: actualTotalStake,
        stakes,
        bookmakers: matchOdds.map(odd => ({
          bookmaker: odd.bookmaker,
          odds: odd.odds_home // Just using home odds as a reference
        })),
        bestOdds,
        riskAssessment,
        confidenceScore,
        expectedValue,
        volatility,
        lastUpdated: new Date().toISOString(),
        marketType: '1X2',
        profitAmount: guaranteedProfit // Add profitAmount property
      };
      
      opportunities.push(opportunity);
    });
    
    // Sort opportunities by profit percentage (highest first)
    return opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);
  } catch (error) {
    console.error('Error calculating arbitrage opportunities:', error);
    return [];
  }
};

/**
 * Calculate risk assessment based on match odds and arbitrage percentage
 * @param matchOdds - List of match odds
 * @param arbitragePercentage - Calculated arbitrage percentage
 * @returns Risk assessment string
 */
const calculateRiskAssessment = (matchOdds: MatchOdds[], arbitragePercentage: number): string => {
  try {
    // Calculate average liquidity and suspension risk
    const avgLiquidity = matchOdds.reduce((sum, odd) => sum + (odd.liquidity || 5), 0) / matchOdds.length;
    const avgSuspensionRisk = matchOdds.reduce((sum, odd) => sum + (odd.suspensionRisk || 3), 0) / matchOdds.length;
    
    // Calculate time to event
    const matchTime = new Date(matchOdds[0].match_time);
    const now = new Date();
    const hoursToMatch = (matchTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Calculate risk score (0-100)
    let riskScore = 0;
    
    // Arbitrage percentage factor (lower is better)
    if (arbitragePercentage < 0.95) riskScore += 0;
    else if (arbitragePercentage < 0.97) riskScore += 10;
    else if (arbitragePercentage < 0.99) riskScore += 20;
    else if (arbitragePercentage < 1.0) riskScore += 30;
    else riskScore += 50; // Not a true arbitrage
    
    // Liquidity factor (higher is better)
    riskScore -= Math.min(20, avgLiquidity * 2);
    
    // Suspension risk factor (lower is better)
    riskScore += Math.min(20, avgSuspensionRisk * 4);
    
    // Time to event factor (more time is better)
    if (hoursToMatch < 1) riskScore += 20;
    else if (hoursToMatch < 3) riskScore += 10;
    else if (hoursToMatch < 12) riskScore += 5;
    
    // Number of bookmakers factor (more is better)
    const uniqueBookmakers = new Set(matchOdds.map(odd => odd.bookmaker)).size;
    riskScore -= Math.min(10, uniqueBookmakers * 2);
    
    // Clamp risk score
    riskScore = Math.max(0, Math.min(100, riskScore));
    
    // Convert to risk assessment
    if (riskScore < 30) return "Low Risk";
    if (riskScore < 60) return "Medium Risk";
    return "High Risk";
  } catch (error) {
    console.error('Error calculating risk assessment:', error);
    return "Unknown Risk";
  }
};

/**
 * Calculate confidence score based on match odds and arbitrage percentage
 * @param matchOdds - List of match odds
 * @param arbitragePercentage - Calculated arbitrage percentage
 * @returns Confidence score (0-10)
 */
const calculateConfidenceScore = (matchOdds: MatchOdds[], arbitragePercentage: number): number => {
  try {
    // Base score
    let score = 10;
    
    // Arbitrage percentage factor
    if (arbitragePercentage > 1) {
      score -= Math.min(5, (arbitragePercentage - 1) * 10);
    }
    
    // Bookmaker reputation factor
    const premiumBookmakers = ['Bet9ja', 'BetKing', '1xBet', 'BetWay'];
    const hasPremiumBookmaker = matchOdds.some(odd => 
      premiumBookmakers.includes(odd.bookmaker)
    );
    
    if (!hasPremiumBookmaker) score -= 2;
    
    // Time since update factor
    const latestUpdate = new Date(Math.max(...matchOdds.map(odd => new Date(odd.updated_at).getTime())));
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - latestUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate > 30) score -= 3;
    else if (minutesSinceUpdate > 15) score -= 2;
    else if (minutesSinceUpdate > 5) score -= 1;
    
    // Clamp score
    return Math.max(1, Math.min(10, Math.round(score)));
  } catch (error) {
    console.error('Error calculating confidence score:', error);
    return 5; // Default middle score
  }
};

/**
 * Calculate advanced metrics for an arbitrage opportunity
 * @param stakes - Stake distribution
 * @param totalStake - Total stake amount
 * @returns Expected value and volatility
 */
const calculateAdvancedMetrics = (stakes: StakeDistribution[], totalStake: number) => {
  try {
    // Calculate expected value (weighted average of returns)
    const expectedValue = stakes.reduce((sum, stake) => {
      const probability = stake.impliedProbability || 0;
      return sum + (stake.potentialReturn * probability);
    }, 0);
    
    // Calculate volatility (standard deviation of returns)
    const meanReturn = expectedValue;
    const variance = stakes.reduce((sum, stake) => {
      const probability = stake.impliedProbability || 0;
      const deviation = stake.potentialReturn - meanReturn;
      return sum + (deviation * deviation * probability);
    }, 0);
    
    const volatility = Math.sqrt(variance);
    
    return { 
      expectedValue: Math.round(expectedValue), 
      volatility: Math.round(volatility) 
    };
  } catch (error) {
    console.error('Error calculating advanced metrics:', error);
    return { expectedValue: 0, volatility: 0 };
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