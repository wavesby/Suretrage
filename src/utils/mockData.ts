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
      true_probabilities: { home: 0.42, draw: 0.28, away: 0.30 }
    },
    {
      match_id: 'epl_002', 
      match_name: 'Manchester United vs Liverpool',
      team_home: 'Manchester United',
      team_away: 'Liverpool',
      league: 'Premier League',
      match_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.36, draw: 0.26, away: 0.38 }
    },
    {
      match_id: 'epl_003',
      match_name: 'Tottenham vs Newcastle',
      team_home: 'Tottenham',
      team_away: 'Newcastle', 
      league: 'Premier League',
      match_time: new Date(Date.now() + 1.5 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.45, draw: 0.25, away: 0.30 }
    },
    {
      match_id: 'epl_004',
      match_name: 'Chelsea vs Leicester',
      team_home: 'Chelsea',
      team_away: 'Leicester', 
      league: 'Premier League',
      match_time: new Date(Date.now() + 3.5 * 24 * 60 * 60 * 1000).toISOString(),
      true_probabilities: { home: 0.55, draw: 0.23, away: 0.22 }
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
    
    // Convert true probabilities to fair odds
    const fairOdds = {
      home: 1 / trueProb.home,
      draw: trueProb.draw > 0 ? 1 / trueProb.draw : 0,
      away: 1 / trueProb.away
    };
    
    // Apply variance across bookmakers to create inefficiencies
    bookmakers.forEach(bookmaker => {
      const { margin, volatility } = BOOKMAKER_MARGINS[bookmaker as keyof typeof BOOKMAKER_MARGINS];
      
      // Create individual bookmaker variance using deterministic pseudo-random
      const homeVariance = (pseudoRandom(match.match_id, `${bookmaker}-home`) * 2 - 1) * volatility;
      const drawVariance = (pseudoRandom(match.match_id, `${bookmaker}-draw`) * 2 - 1) * volatility;
      const awayVariance = (pseudoRandom(match.match_id, `${bookmaker}-away`) * 2 - 1) * volatility;
      
      // Apply margin to fair odds with variance
      // Margin distributed according to market expectations (more on favorites)
      const marginFactor = 1 + margin / 100;
      
      // Some bookmakers favor certain outcomes more
      const favorHome = bookmaker === 'BetKing' || bookmaker === 'NairaBet';
      const favorAway = bookmaker === '1xBet' || bookmaker === 'BetWay';
      
      // Distribute margin unevenly
      const homeMarginDistribution = favorHome ? 0.8 : favorAway ? 1.2 : 1.0;
      const drawMarginDistribution = 1.0;
      const awayMarginDistribution = favorAway ? 0.8 : favorHome ? 1.2 : 1.0;
      
      // Calculate final odds with margins and variance
      const finalOdds = {
        home: fairOdds.home / ((marginFactor - 1) * homeMarginDistribution * 0.33 + 1) * (1 + homeVariance),
        draw: fairOdds.draw > 0 ? fairOdds.draw / ((marginFactor - 1) * drawMarginDistribution * 0.33 + 1) * (1 + drawVariance) : 0,
        away: fairOdds.away / ((marginFactor - 1) * awayMarginDistribution * 0.33 + 1) * (1 + awayVariance)
      };
      
      // Round odds to realistic precision (bookmakers usually round to 0.05 or 0.01)
      const roundToBookmakerPrecision = (odd: number): number => {
        // Different rounding patterns based on odds range
        if (odd < 2) {
          return Math.round(odd * 100) / 100; // Round to 0.01
        } else if (odd < 3) {
          return Math.round(odd * 20) / 20; // Round to 0.05
        } else if (odd < 5) {
          return Math.round(odd * 10) / 10; // Round to 0.1
        } else {
          return Math.round(odd * 5) / 5; // Round to 0.2
        }
      };
      
      mockOdds.push({
        id: `${match.match_id}_${bookmaker.toLowerCase().replace(/\s/g, '')}`,
        match_id: match.match_id,
        bookmaker: bookmaker,
        match_name: match.match_name,
        team_home: match.team_home,
        team_away: match.team_away,
        league: match.league,
        match_time: match.match_time,
        market_type: '1X2',
        odds_home: roundToBookmakerPrecision(finalOdds.home),
        odds_away: roundToBookmakerPrecision(finalOdds.away),
        odds_draw: finalOdds.draw > 0 ? roundToBookmakerPrecision(finalOdds.draw) : undefined,
        updated_at: new Date().toISOString(),
        
        // Adding liquidity and suspension risk factors
        liquidity: 5 + pseudoRandom(match.match_id, `${bookmaker}-liquidity`) * 5,
        suspensionRisk: bookmaker === 'BetWay' || bookmaker === '1xBet' ? 
          pseudoRandom(match.match_id, `${bookmaker}-risk`) * 3 : 
          pseudoRandom(match.match_id, `${bookmaker}-risk`) * 5
      })
    })
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
    // Find different bookmakers
    const betkingIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'epl_004' && odd.bookmaker === 'BetKing'
    );
    
    const sportybetIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'epl_004' && odd.bookmaker === 'SportyBet'
    );
    
    const nairabetIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'epl_004' && odd.bookmaker === 'NairaBet'
    );
    
    if (betkingIndex >= 0 && sportybetIndex >= 0 && nairabetIndex >= 0) {
      // BetKing has good home odds
      mockOdds[betkingIndex].odds_home = 1.85; // 1/1.85 = 0.54
      mockOdds[betkingIndex].odds_away = 4.10;
      mockOdds[betkingIndex].odds_draw = 4.00;
      
      // SportyBet has good away odds
      mockOdds[sportybetIndex].odds_home = 1.75;
      mockOdds[sportybetIndex].odds_away = 4.50; // 1/4.50 = 0.22
      mockOdds[sportybetIndex].odds_draw = 3.80;
      
      // NairaBet has good draw odds
      mockOdds[nairabetIndex].odds_home = 1.80;
      mockOdds[nairabetIndex].odds_away = 4.30;
      mockOdds[nairabetIndex].odds_draw = 4.75; // 1/4.75 = 0.21
      
      // Combined: 0.54 + 0.22 + 0.21 = 0.97 < 1.0 (good arbitrage)
    }
  }
  
  // 3. Create a high-profit arbitrage on Brighton vs West Ham
  const brightonMatch = getMatchOdds('epl_005');
  
  if (brightonMatch.length > 0) {
    const betwayIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'epl_005' && odd.bookmaker === 'BetWay'
    );
    
    const onexbetIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'epl_005' && odd.bookmaker === '1xBet'
    );
    
    if (betwayIndex >= 0 && onexbetIndex >= 0) {
      // BetWay has high home odds
      mockOdds[betwayIndex].odds_home = 2.30; // 1/2.30 = 0.435
      mockOdds[betwayIndex].odds_away = 3.10;
      mockOdds[betwayIndex].odds_draw = 3.50;
      
      // 1xBet has high away odds
      mockOdds[onexbetIndex].odds_home = 2.15;
      mockOdds[onexbetIndex].odds_away = 3.40; // 1/3.40 = 0.294
      mockOdds[onexbetIndex].odds_draw = 3.30;
      
      // Combined: 0.435 + 0.294 = 0.729 < 1.0 (high profit arbitrage ~27%)
    }
  }
  
  // 4. Create Nigerian league arbitrage opportunity
  const npflMatch = getMatchOdds('npfl_003');
  
  if (npflMatch.length > 0) {
    const bet9jaIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'npfl_003' && odd.bookmaker === 'Bet9ja'
    );
    
    const accessbetIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'npfl_003' && odd.bookmaker === 'AccessBet'
    );
    
    const msportIndex = mockOdds.findIndex(odd => 
      odd.match_id === 'npfl_003' && odd.bookmaker === 'MSport'
    );
    
    if (bet9jaIndex >= 0 && accessbetIndex >= 0 && msportIndex >= 0) {
      // Bet9ja has good home odds
      mockOdds[bet9jaIndex].odds_home = 2.00; // 1/2.00 = 0.50
      mockOdds[bet9jaIndex].odds_away = 3.60;
      mockOdds[bet9jaIndex].odds_draw = 3.20;
      
      // AccessBet has good away odds
      mockOdds[accessbetIndex].odds_home = 1.85;
      mockOdds[accessbetIndex].odds_away = 3.90; // 1/3.90 = 0.256
      mockOdds[accessbetIndex].odds_draw = 3.30;
      
      // MSport has good draw odds
      mockOdds[msportIndex].odds_home = 1.90;
      mockOdds[msportIndex].odds_away = 3.70;
      mockOdds[msportIndex].odds_draw = 3.95; // 1/3.95 = 0.253
      
      // Combined: 0.50 + 0.256 + 0.253 = ~1.01 (tiny margin, close to arbitrage)
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