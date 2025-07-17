import { MatchOdds } from './arbitrage'

// Constants for market realism
const BOOKMAKER_MARGINS = {
  // Nigerian bookmakers (generally higher margins)
  'Bet9ja': { margin: 7.5, volatility: 0.2 },
  'BetKing': { margin: 8.0, volatility: 0.2 },
  'SportyBet': { margin: 7.2, volatility: 0.2 },
  'NairaBet': { margin: 8.5, volatility: 0.2 },
  'MerryBet': { margin: 9.0, volatility: 0.2 },
  'BangBet': { margin: 8.8, volatility: 0.2 },
  'AccessBet': { margin: 9.5, volatility: 0.2 },
  'SuperBet': { margin: 8.2, volatility: 0.2 },
  'MSport': { margin: 8.3, volatility: 0.2 },
  
  // International bookmakers (lower margins)
  '1xBet': { margin: 5.8, volatility: 0.2 },
  'BetWay': { margin: 5.5, volatility: 0.2 },
  'BetWinner': { margin: 5.9, volatility: 0.2 },
  'Betano': { margin: 5.6, volatility: 0.2 },
  'Parimatch': { margin: 6.0, volatility: 0.2 },
  'LiveScore Bet': { margin: 5.7, volatility: 0.2 }
}

// Market knowledge - estimated fair odds for common scorelines
const MARKET_KNOWLEDGE = {
  // Home win, draw, away win percentages by league
  'Premier League': { home: 45.2, draw: 24.8, away: 30.0 },
  'La Liga': { home: 46.5, draw: 24.5, away: 29.0 },
  'Serie A': { home: 44.0, draw: 26.0, away: 30.0 },
  'Bundesliga': { home: 43.5, draw: 23.5, away: 33.0 },
  'Ligue 1': { home: 45.0, draw: 25.5, away: 29.5 },
  'Champions League': { home: 42.0, draw: 24.0, away: 34.0 },
  'NPFL': { home: 50.0, draw: 27.0, away: 23.0 }, // Higher home advantage in Nigerian league
  'NNL': { home: 52.0, draw: 28.0, away: 20.0 },
  'NBA': { home: 60.0, draw: 0, away: 40.0 }, // No draws in basketball
  'NFL': { home: 57.0, draw: 0.5, away: 42.5 },
  'NHL': { home: 53.0, draw: 0, away: 47.0 }
}

// Cache for consistent mock data
let cachedMockOdds: MatchOdds[] | null = null;
let lastGeneratedTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Generate more realistic mock odds for football leagues
export const generateMockOdds = (): MatchOdds[] => {
  const now = Date.now();
  
  // Return cached data if it exists and is recent
  if (cachedMockOdds && now - lastGeneratedTime < CACHE_DURATION) {
    console.log('Using cached mock odds data');
    return cachedMockOdds;
  }
  
  console.log('Generating new mock odds data');
  const bookmakers = Object.keys(BOOKMAKER_MARGINS);
  const leagues = Object.keys(MARKET_KNOWLEDGE);
  
  // More extensive match list
  const matches = [
    // Premier League
    {
      match_id: 'epl_001',
      match_name: 'Arsenal vs Chelsea',
      team_home: 'Arsenal',
      team_away: 'Chelsea',
      league: 'Premier League',
      match_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.42, draw: 0.28, away: 0.30 },
      over_under_probabilities: { 
        '2.5': { over: 0.58, under: 0.42 },
        '3.5': { over: 0.32, under: 0.68 }
      }
    },
    {
      match_id: 'epl_002', 
      match_name: 'Manchester United vs Liverpool',
      team_home: 'Manchester United',
      team_away: 'Liverpool',
      league: 'Premier League',
      match_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.36, draw: 0.26, away: 0.38 },
      over_under_probabilities: { 
        '2.5': { over: 0.62, under: 0.38 },
        '3.5': { over: 0.35, under: 0.65 }
      }
    },
    {
      match_id: 'epl_003',
      match_name: 'Tottenham vs Newcastle',
      team_home: 'Tottenham',
      team_away: 'Newcastle', 
      league: 'Premier League',
      match_time: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.45, draw: 0.25, away: 0.30 },
      over_under_probabilities: { 
        '2.5': { over: 0.55, under: 0.45 },
        '3.5': { over: 0.30, under: 0.70 }
      }
    },
    {
      match_id: 'epl_004',
      match_name: 'Chelsea vs Leicester',
      team_home: 'Chelsea',
      team_away: 'Leicester', 
      league: 'Premier League',
      match_time: new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.55, draw: 0.23, away: 0.22 },
      over_under_probabilities: { 
        '1.5': { over: 0.80, under: 0.20 },
        '2.5': { over: 0.60, under: 0.40 },
        '3.5': { over: 0.35, under: 0.65 }
      }
    },
    {
      match_id: 'epl_005',
      match_name: 'Brighton vs West Ham',
      team_home: 'Brighton',
      team_away: 'West Ham',
      league: 'Premier League',
      match_time: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.43, draw: 0.28, away: 0.29 }
    },
    
    // Nigerian Premier Football League (NPFL)
    {
      match_id: 'npfl_001',
      match_name: 'Rivers United vs Enyimba',
      team_home: 'Rivers United',
      team_away: 'Enyimba',
      league: 'NPFL',
      match_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.48, draw: 0.30, away: 0.22 }
    },
    {
      match_id: 'npfl_002',
      match_name: 'Kano Pillars vs Shooting Stars',
      team_home: 'Kano Pillars',
      team_away: 'Shooting Stars',
      league: 'NPFL',
      match_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.52, draw: 0.28, away: 0.20 }
    },
    {
      match_id: 'npfl_003',
      match_name: 'Remo Stars vs Akwa United',
      team_home: 'Remo Stars',
      team_away: 'Akwa United',
      league: 'NPFL',
      match_time: new Date(Date.now() + 1.2 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.46, draw: 0.32, away: 0.22 }
    },
    
    // La Liga
    {
      match_id: 'laliga_001',
      match_name: 'Real Madrid vs Barcelona',
      team_home: 'Real Madrid',
      team_away: 'Barcelona',
      league: 'La Liga',
      match_time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.38, draw: 0.25, away: 0.37 }
    },
    {
      match_id: 'laliga_002',
      match_name: 'Atletico Madrid vs Sevilla',
      team_home: 'Atletico Madrid',
      team_away: 'Sevilla',
      league: 'La Liga',
      match_time: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.48, draw: 0.26, away: 0.26 }
    },
    
    // Serie A
    {
      match_id: 'seriea_001',
      match_name: 'Inter Milan vs AC Milan',
      team_home: 'Inter Milan',
      team_away: 'AC Milan',
      league: 'Serie A',
      match_time: new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.42, draw: 0.28, away: 0.30 }
    },
    {
      match_id: 'seriea_002',
      match_name: 'Juventus vs Napoli',
      team_home: 'Juventus',
      team_away: 'Napoli',
      league: 'Serie A',
      match_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.45, draw: 0.27, away: 0.28 }
    },
    
    // Champions League
    {
      match_id: 'ucl_001',
      match_name: 'Bayern Munich vs PSG',
      team_home: 'Bayern Munich',
      team_away: 'PSG',
      league: 'Champions League',
      match_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.48, draw: 0.24, away: 0.28 }
    },
    {
      match_id: 'ucl_002',
      match_name: 'Manchester City vs Real Madrid',
      team_home: 'Manchester City',
      team_away: 'Real Madrid',
      league: 'Champions League',
      match_time: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.45, draw: 0.25, away: 0.30 }
    },
    
    // Bundesliga
    {
      match_id: 'bundesliga_001',
      match_name: 'Bayern Munich vs Borussia Dortmund',
      team_home: 'Bayern Munich',
      team_away: 'Borussia Dortmund',
      league: 'Bundesliga',
      match_time: new Date(Date.now() + 3.2 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.50, draw: 0.22, away: 0.28 }
    },
    
    // Ligue 1
    {
      match_id: 'ligue1_001',
      match_name: 'PSG vs Marseille',
      team_home: 'PSG',
      team_away: 'Marseille',
      league: 'Ligue 1',
      match_time: new Date(Date.now() + 4.5 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.58, draw: 0.22, away: 0.20 }
    },
    
    // NBA
    {
      match_id: 'nba_001',
      match_name: 'Lakers vs Warriors',
      team_home: 'Lakers',
      team_away: 'Warriors',
      league: 'NBA',
      match_time: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.55, draw: 0, away: 0.45 }
    },
  ]

  const mockOdds: MatchOdds[] = []

  // Use a deterministic seed for consistent odds
  const seed = Math.floor(now / CACHE_DURATION);
  const pseudoRandom = (matchId: string, bookmaker: string) => {
    // Simple deterministic hash function
    const str = `${seed}-${matchId}-${bookmaker}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return (Math.abs(hash) % 1000) / 1000; // 0 to 1
  };

  // Generate odds for each match across bookmakers
  matches.forEach(match => {
    const trueProb = match.true_probabilities;
    const overUnderProb = match.over_under_probabilities;
    
    // Convert true probabilities to fair odds
    const fairOdds = {
      home: trueProb.home > 0 ? 1 / trueProb.home : 0,
      draw: trueProb.draw > 0 ? 1 / trueProb.draw : 0,
      away: trueProb.away > 0 ? 1 / trueProb.away : 0
    };
    
    // For each bookmaker, generate slightly different odds
    bookmakers.forEach((bookmaker, index) => {
      // Get bookmaker margin and volatility
      const bmInfo = BOOKMAKER_MARGINS[bookmaker as keyof typeof BOOKMAKER_MARGINS];
      const margin = bmInfo.margin / 100; // Convert to decimal
      const volatility = bmInfo.volatility;
      
      // Apply bookmaker margin and some random variation to the odds
      const variation = {
        home: 1 + (pseudoRandom(match.match_id, `${bookmaker}-home`) * 2 - 1) * volatility,
        draw: 1 + (pseudoRandom(match.match_id, `${bookmaker}-draw`) * 2 - 1) * volatility,
        away: 1 + (pseudoRandom(match.match_id, `${bookmaker}-away`) * 2 - 1) * volatility,
      };
      
      const rawOdds = {
        home: fairOdds.home * (1 - margin) * variation.home,
        draw: fairOdds.draw * (1 - margin) * variation.draw,
        away: fairOdds.away * (1 - margin) * variation.away
      };
      
      // Round to bookmaker precision
      const roundToBookmakerPrecision = (odd: number): number => {
        if (odd <= 2) {
          return Math.round(odd * 100) / 100; // Round to 2 decimal places for small odds
        } else if (odd <= 10) {
          return Math.round(odd * 20) / 20; // Round to 0.05 increments for medium odds
        } else {
          return Math.round(odd * 10) / 10; // Round to 0.1 increments for large odds
        }
      };
      
      const odds = {
        home: roundToBookmakerPrecision(rawOdds.home),
        draw: roundToBookmakerPrecision(rawOdds.draw),
        away: roundToBookmakerPrecision(rawOdds.away)
      };
      
      // Create the 1X2 match odds
      const matchOdds: MatchOdds = {
        id: `${match.match_id}-${bookmaker}-1x2`,
        match_id: match.match_id,
        bookmaker,
        match_name: match.match_name,
        team_home: match.team_home,
        team_away: match.team_away,
        league: match.league,
        match_time: match.match_time,
        market_type: '1X2',
        odds_home: odds.home,
        odds_draw: match.league === 'NBA' ? undefined : odds.draw, // No draw in NBA
        odds_away: odds.away,
        updated_at: new Date().toISOString(),
        liquidity: 10 - (pseudoRandom(match.match_id, `${bookmaker}-liquidity`) * 5), // 5-10 scale
        suspensionRisk: 1 + Math.floor(pseudoRandom(match.match_id, `${bookmaker}-risk`) * 4) // 1-4 scale
      };
      
      mockOdds.push(matchOdds);
      
      // Generate over/under goals odds if available
      if (overUnderProb) {
        Object.entries(overUnderProb).forEach(([threshold, probabilities]) => {
          // Convert true probabilities to fair odds for over/under
          const fairOverUnderOdds = {
            over: probabilities.over > 0 ? 1 / probabilities.over : 0,
            under: probabilities.under > 0 ? 1 / probabilities.under : 0
          };
          
          // Apply bookmaker margin and random variation
          const overUnderVariation = {
            over: 1 + (pseudoRandom(match.match_id, `${bookmaker}-over-${threshold}`) * 2 - 1) * volatility,
            under: 1 + (pseudoRandom(match.match_id, `${bookmaker}-under-${threshold}`) * 2 - 1) * volatility
          };
          
          const rawOverUnderOdds = {
            over: fairOverUnderOdds.over * (1 - margin) * overUnderVariation.over,
            under: fairOverUnderOdds.under * (1 - margin) * overUnderVariation.under
          };
          
          // Round to bookmaker precision
          const overUnderOdds = {
            over: roundToBookmakerPrecision(rawOverUnderOdds.over),
            under: roundToBookmakerPrecision(rawOverUnderOdds.under)
          };
          
          // Create the over/under match odds
          const overUnderMatchOdds: MatchOdds = {
            id: `${match.match_id}-${bookmaker}-ou-${threshold}`,
            match_id: match.match_id,
            bookmaker,
            match_name: match.match_name,
            team_home: match.team_home,
            team_away: match.team_away,
            league: match.league,
            match_time: match.match_time,
            market_type: 'OVER_UNDER',
            odds_home: odds.home, // Including 1X2 odds for reference
            odds_draw: match.league === 'NBA' ? undefined : odds.draw,
            odds_away: odds.away,
            goals_over_under: parseFloat(threshold),
            odds_over: overUnderOdds.over,
            odds_under: overUnderOdds.under,
            updated_at: new Date().toISOString(),
            liquidity: 9 - (pseudoRandom(match.match_id, `${bookmaker}-ou-liquidity`) * 4), // 5-9 scale
            suspensionRisk: 1 + Math.floor(pseudoRandom(match.match_id, `${bookmaker}-ou-risk`) * 3) // 1-3 scale
          };
          
          mockOdds.push(overUnderMatchOdds);
        });
      }
    });
  })

  // Create intentional arbitrage opportunities
  createGuaranteedArbitrageOpportunities(mockOdds);

  // Cache the results
  cachedMockOdds = mockOdds;
  lastGeneratedTime = now;
  
  // Simulate API delay
  return mockOdds;
}

// Helper function to create guaranteed arbitrage opportunities
function createGuaranteedArbitrageOpportunities(mockOdds: MatchOdds[]) {
  // Helper to find a match's odds by ID
  const getMatchOdds = (matchId: string) => {
    return mockOdds.filter(odd => odd.match_id === matchId);
  };
  
  // Helper to calculate arbitrage percentage
  const calculateArbitragePercentage = (odds: number[]): number => {
    return odds.reduce((sum, odd) => sum + (1 / odd), 0);
  };
  
  // 1. Create a realistic 2-way arbitrage on Tottenham vs Newcastle
  const tottenhamMatch = getMatchOdds('epl_003');
  
  if (tottenhamMatch.length > 0) {
    // Find Bet9ja odds
    const bet9jaIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'epl_003' && odd.bookmaker === 'Bet9ja'
    );
    
    // Find 1xBet odds
    const onexbetIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'epl_003' && odd.bookmaker === '1xBet'
    );
    
    // Modify the odds to create an arbitrage
    if (bet9jaIndex >= 0 && onexbetIndex >= 0) {
      // Set Bet9ja to have good home odds
      mockOdds[bet9jaIndex].odds_home = 2.10; // 1/2.10 = 0.476
      mockOdds[bet9jaIndex].odds_away = 1.90;
      
      // Set 1xBet to have good away odds
      mockOdds[onexbetIndex].odds_home = 1.85;
      mockOdds[onexbetIndex].odds_away = 2.20; // 1/2.20 = 0.454
      
      // Combined: 0.476 + 0.454 = 0.93 < 1.0 (good arbitrage)
    }
  }
  
  // 2. Create a realistic 3-way arbitrage on Chelsea vs Leicester
  const chelseaMatch = getMatchOdds('epl_004');
  
  if (chelseaMatch.length > 0) {
    // Find Bet9ja odds
    const bet9jaIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'epl_004' && odd.bookmaker === 'Bet9ja' && odd.market_type === '1X2'
    );
    
    // Find 1xBet odds
    const onexbetIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'epl_004' && odd.bookmaker === '1xBet' && odd.market_type === '1X2'
    );
    
    // Find BetWay odds
    const betwayIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'epl_004' && odd.bookmaker === 'BetWay' && odd.market_type === '1X2'
    );
    
    // Modify the odds to create an arbitrage
    if (bet9jaIndex >= 0 && onexbetIndex >= 0 && betwayIndex >= 0) {
      // Set Bet9ja to have good home odds
      mockOdds[bet9jaIndex].odds_home = 1.85; // 1/1.85 = 0.541
      mockOdds[bet9jaIndex].odds_draw = 3.50;
      mockOdds[bet9jaIndex].odds_away = 4.50;
      
      // Set 1xBet to have good draw odds
      mockOdds[onexbetIndex].odds_home = 1.70;
      mockOdds[onexbetIndex].odds_draw = 4.00; // 1/4.00 = 0.250
      mockOdds[onexbetIndex].odds_away = 4.20;
      
      // Set BetWay to have good away odds
      mockOdds[betwayIndex].odds_home = 1.75;
      mockOdds[betwayIndex].odds_draw = 3.60;
      mockOdds[betwayIndex].odds_away = 5.00; // 1/5.00 = 0.200
      
      // Combined: 0.541 + 0.250 + 0.200 = 0.991 < 1.0 (good arbitrage)
    }
  }
  
  // 3. Create a realistic over/under arbitrage on Manchester United vs Liverpool
  const manUtdMatch = getMatchOdds('epl_002');
  
  if (manUtdMatch.length > 0) {
    // Find BetWay over 2.5 goals odds
    const betwayOverIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'epl_002' && 
      odd.bookmaker === 'BetWay' && 
      odd.market_type === 'OVER_UNDER' && 
      odd.goals_over_under === 2.5
    );
    
    // Find Bet9ja under 2.5 goals odds
    const bet9jaUnderIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'epl_002' && 
      odd.bookmaker === 'Bet9ja' && 
      odd.market_type === 'OVER_UNDER' && 
      odd.goals_over_under === 2.5
    );
    
    // Modify the odds to create an over/under arbitrage
    if (betwayOverIndex >= 0 && bet9jaUnderIndex >= 0) {
      // Set BetWay to have good over odds
      mockOdds[betwayOverIndex].odds_over = 1.95; // 1/1.95 = 0.513
      
      // Set Bet9ja to have good under odds
      mockOdds[bet9jaUnderIndex].odds_under = 2.10; // 1/2.10 = 0.476
      
      // Combined: 0.513 + 0.476 = 0.989 < 1.0 (good arbitrage)
    }
  }
}

// Function to seed the database with mock data
export const seedMockOdds = async () => {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Clear existing odds
    await supabase.from('bookmaker_odds').delete().gte('id', '0')
    
    // Insert mock odds
    const mockOdds = generateMockOdds()
    const { error } = await supabase.from('bookmaker_odds').insert(mockOdds)
    
    if (error) {
      console.error('Error seeding mock odds:', error)
      return false
    }
    
    console.log(`Successfully seeded ${mockOdds.length} mock odds`)
    return true
  } catch (error) {
    console.error('Error in seedMockOdds:', error)
    return false
  }
}