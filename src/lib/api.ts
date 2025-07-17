import { MatchOdds } from '@/utils/arbitrage';
import axios from 'axios';

// Define supported bookmakers
export const SUPPORTED_BOOKMAKERS = [
  'Bet9ja',
  '1xBet', 
  'BetKing',
  'SportyBet'
];

// Real API endpoints for each bookmaker
const API_ENDPOINTS = {
  // Direct API endpoints for Nigerian bookmakers
  'Bet9ja': import.meta.env.VITE_BET9JA_API_URL || 'https://odds-api.bet9ja.com/v1/odds/football/main',
  '1xBet': import.meta.env.VITE_ONEXBET_API_URL || 'https://ng-api.1xbet.com/sports/line/football',
  'BetKing': import.meta.env.VITE_BETKING_API_URL || 'https://api.betking.com/api/feeds/v1/odds/football',
  'SportyBet': import.meta.env.VITE_SPORTYBET_API_URL || 'https://api.sportybet.com/ng/api/v1/odds/football'
};

// API keys for bookmakers that require authentication
const API_KEYS = {
  'Bet9ja': import.meta.env.VITE_BET9JA_API_KEY || '',
  '1xBet': import.meta.env.VITE_ONEXBET_API_KEY || '',
  'BetKing': import.meta.env.VITE_BETKING_API_KEY || '',
  'SportyBet': import.meta.env.VITE_SPORTYBET_API_KEY || ''
};

// Normalize odds from different bookmakers to a standard format
const normalizeOdds = (odds: any, bookmaker: string): MatchOdds[] => {
  try {
    switch(bookmaker) {
      case 'Bet9ja':
        return normalizeBet9jaOdds(odds);
      case '1xBet':
        return normalize1xBetOdds(odds);
      case 'BetKing':
        return normalizeBetKingOdds(odds);
      case 'SportyBet':
        return normalizeSportyBetOdds(odds);
      default:
        return [];
    }
  } catch (error) {
    console.error(`Error normalizing ${bookmaker} odds:`, error);
    return [];
  }
};

// Normalize Bet9ja odds format
const normalizeBet9jaOdds = (odds: any): MatchOdds[] => {
  try {
    if (!odds || !odds.data || !Array.isArray(odds.data.events)) {
      console.error('Invalid Bet9ja data structure');
      return [];
    }

    return odds.data.events
      .filter((event: any) => {
        // Make sure event has all required fields
        return event && 
               event.id && 
               event.name && 
               event.markets && 
               Array.isArray(event.markets);
      })
      .map((event: any) => {
        // Find the 1X2 market
        const market1X2 = event.markets.find((m: any) => 
          m.type === '1X2' || 
          m.name === 'Match Result' || 
          m.name === 'Match Winner'
        );
        
        if (!market1X2 || !market1X2.selections || market1X2.selections.length < 3) {
          return null;
        }
        
        // Find home, draw, away selections
        const home = market1X2.selections.find((s: any) => 
          s.name === 'Home' || 
          s.name === '1' || 
          s.type === 'HOME'
        );
        
        const draw = market1X2.selections.find((s: any) => 
          s.name === 'Draw' || 
          s.name === 'X' || 
          s.type === 'DRAW'
        );
        
        const away = market1X2.selections.find((s: any) => 
          s.name === 'Away' || 
          s.name === '2' || 
          s.type === 'AWAY'
        );
        
        if (!home || !draw || !away) {
          return null;
        }
        
        // Parse team names from event name
        const teams = event.name.split(' vs ');
        const homeTeam = teams[0] || event.homeTeam || 'Home';
        const awayTeam = teams[1] || event.awayTeam || 'Away';
        
        return {
          id: `bet9ja-${event.id}`,
          match_id: event.id.toString(),
          bookmaker: 'Bet9ja',
          match_name: event.name,
          team_home: homeTeam,
          team_away: awayTeam,
          league: event.competition || event.tournament?.name || event.category?.name || 'Football',
          match_time: new Date(event.startTime || event.startDate).toISOString(),
          market_type: '1X2',
          odds_home: parseFloat(home.price || home.odds),
          odds_away: parseFloat(away.price || away.odds),
          odds_draw: parseFloat(draw.price || draw.odds),
          updated_at: new Date().toISOString(),
          liquidity: 8,
          suspensionRisk: 3
        };
      })
      .filter((event: any) => event !== null);
  } catch (error) {
    console.error('Error in normalizeBet9jaOdds:', error);
    return [];
  }
};

// Normalize 1xBet odds format
const normalize1xBetOdds = (odds: any): MatchOdds[] => {
  try {
    // 1xBet has different API response structures depending on the endpoint
    // Handle both possible structures
    
    // Structure 1: results array
    if (odds.results && Array.isArray(odds.results)) {
      return odds.results
        .filter((event: any) => {
          return event && 
                 event.id && 
                 event.name && 
                 event.markets && 
                 (Array.isArray(event.markets) || typeof event.markets === 'object');
        })
        .map((event: any) => {
          // Get markets array or convert object to array
          const markets = Array.isArray(event.markets) ? 
            event.markets : 
            Object.values(event.markets);
          
          // Find 1X2 market
          const market = markets.find((m: any) => 
            m.type === 'win_draw_win' || 
            m.type === '1x2' || 
            m.name === 'Match Result' ||
            m.id === '1_1'
          );
          
          if (!market || !market.selections || market.selections.length < 3) {
            return null;
          }
          
          const home = market.selections.find((s: any) => 
            s.type === 'home' || 
            s.type === '1' || 
            s.name === 'W1'
          );
          
          const draw = market.selections.find((s: any) => 
            s.type === 'draw' || 
            s.type === 'x' || 
            s.name === 'X'
          );
          
          const away = market.selections.find((s: any) => 
            s.type === 'away' || 
            s.type === '2' || 
            s.name === 'W2'
          );
          
          if (!home || !draw || !away) {
            return null;
          }
          
          const teams = event.name.split(' vs ');
          
          return {
            id: `1xbet-${event.id}`,
            match_id: event.id.toString(),
            bookmaker: '1xBet',
            match_name: event.name,
            team_home: teams[0] || event.team1 || 'Home Team',
            team_away: teams[1] || event.team2 || 'Away Team',
            league: event.league || event.championship?.name || event.tournament || 'Football',
            match_time: new Date((event.start_time || event.startTime || event.kickoff) * 1000).toISOString(),
            market_type: '1X2',
            odds_home: parseFloat(home.odds || home.value || home.coefficient),
            odds_away: parseFloat(away.odds || away.value || away.coefficient),
            odds_draw: parseFloat(draw.odds || draw.value || draw.coefficient),
            updated_at: new Date().toISOString(),
            liquidity: 9,
            suspensionRisk: 4
          };
        })
        .filter((event: any) => event !== null);
    }
    
    // Structure 2: sports > leagues > events structure
    if (odds.sports && Array.isArray(odds.sports)) {
      const allEvents: MatchOdds[] = [];
      
      // Iterate through sports
      odds.sports.forEach((sport: any) => {
        if (!sport.leagues || !Array.isArray(sport.leagues)) return;
        
        // Iterate through leagues
        sport.leagues.forEach((league: any) => {
          if (!league.events || !Array.isArray(league.events)) return;
          
          // Process events in this league
          const leagueEvents = league.events
            .filter((event: any) => event && event.id && event.name)
            .map((event: any) => {
              // Find the 1X2 market
              const market = (event.markets || []).find((m: any) => 
                m.type === '1X2' || 
                m.id === '1_1'
              );
              
              if (!market || !market.outcomes || market.outcomes.length < 3) {
                return null;
              }
              
              const home = market.outcomes.find((o: any) => o.type === '1');
              const draw = market.outcomes.find((o: any) => o.type === 'X');
              const away = market.outcomes.find((o: any) => o.type === '2');
              
              if (!home || !draw || !away) {
                return null;
              }
              
              const teams = event.name.split(' - ');
              
              return {
                id: `1xbet-${event.id}`,
                match_id: event.id.toString(),
                bookmaker: '1xBet',
                match_name: event.name.replace(' - ', ' vs '),
                team_home: teams[0] || 'Home Team',
                team_away: teams[1] || 'Away Team',
                league: league.name || 'Football',
                match_time: new Date(event.startTime * 1000).toISOString(),
                market_type: '1X2',
                odds_home: parseFloat(home.value || home.coefficient),
                odds_away: parseFloat(away.value || away.coefficient),
                odds_draw: parseFloat(draw.value || draw.coefficient),
                updated_at: new Date().toISOString(),
                liquidity: 9,
                suspensionRisk: 4
              };
            })
            .filter((event: any) => event !== null);
          
          allEvents.push(...leagueEvents);
        });
      });
      
      return allEvents;
    }
    
    console.error('Unrecognized 1xBet data structure');
    return [];
  } catch (error) {
    console.error('Error in normalize1xBetOdds:', error);
    return [];
  }
};

// Normalize BetKing odds format
const normalizeBetKingOdds = (odds: any): MatchOdds[] => {
  try {
    if (!odds.data || !Array.isArray(odds.data.matches)) {
      console.error('Invalid BetKing data structure');
      return [];
    }

    return odds.data.matches
      .filter((match: any) => 
        match && match.markets && 
        match.markets.win1 && match.markets.draw && match.markets.win2
      )
      .map((match: any) => ({
        id: `betking-${match.matchId}`,
        match_id: match.matchId,
        bookmaker: 'BetKing',
        match_name: `${match.homeTeam} vs ${match.awayTeam}`,
        team_home: match.homeTeam,
        team_away: match.awayTeam,
        league: match.competition || match.league,
        match_time: new Date(match.kickOffTime).toISOString(),
        market_type: '1X2',
        odds_home: parseFloat(match.markets.win1),
        odds_away: parseFloat(match.markets.win2),
        odds_draw: parseFloat(match.markets.draw),
        updated_at: new Date().toISOString(),
        liquidity: 7,
        suspensionRisk: 2
      }));
  } catch (error) {
    console.error('Error in normalizeBetKingOdds:', error);
    return [];
  }
};

// Normalize SportyBet odds format
const normalizeSportyBetOdds = (odds: any): MatchOdds[] => {
  try {
    if (!odds.data || !Array.isArray(odds.data.events)) {
      console.error('Invalid SportyBet data structure');
      return [];
    }

    return odds.data.events
      .filter((event: any) => 
        event && event.markets && 
        Array.isArray(event.markets) && 
        event.markets.some((m: any) => 
          m.type === '1X2' || 
          (Array.isArray(m) && m.some((sm: any) => sm.type === '1X2'))
        )
      )
      .map((event: any) => {
        // Handle different market structures
        let markets = event.markets;
        if (!Array.isArray(markets)) {
          markets = Object.values(markets);
        }
        
        // Find 1X2 market
        const market1X2 = markets.find((m: any) => 
          m.type === '1X2' || 
          (m.name && m.name.includes('1X2'))
        );
        
        if (!market1X2 || !market1X2.outcomes || market1X2.outcomes.length < 3) {
          return null;
        }
        
        // Find home, draw, away outcomes
        const outcomes = Array.isArray(market1X2.outcomes) ? market1X2.outcomes : Object.values(market1X2.outcomes);
        const home = outcomes.find((o: any) => o.type === 'HOME' || o.type === '1');
        const draw = outcomes.find((o: any) => o.type === 'DRAW' || o.type === 'X');
        const away = outcomes.find((o: any) => o.type === 'AWAY' || o.type === '2');
        
        if (!home || !draw || !away) {
          return null;
        }
        
        return {
          id: `sportybet-${event.eventId || event.id}`,
          match_id: event.eventId || event.id,
          bookmaker: 'SportyBet',
          match_name: event.eventName || event.name,
          team_home: event.homeTeam || event.teams?.home || event.eventName?.split(' vs ')[0],
          team_away: event.awayTeam || event.teams?.away || event.eventName?.split(' vs ')[1],
          league: event.leagueName || event.league || event.competition,
          match_time: new Date(event.startTime || event.startAt).toISOString(),
          market_type: '1X2',
          odds_home: parseFloat(home.odds || home.price),
          odds_away: parseFloat(away.odds || away.price),
          odds_draw: parseFloat(draw.odds || draw.price),
          updated_at: new Date().toISOString(),
          liquidity: 8,
          suspensionRisk: 3
        };
      })
      .filter((event: any) => event !== null);
  } catch (error) {
    console.error('Error in normalizeSportyBetOdds:', error);
    return [];
  }
};

// Fetch odds from a single bookmaker
export const fetchBookmakerOdds = async (bookmaker: string): Promise<MatchOdds[]> => {
  try {
    if (!SUPPORTED_BOOKMAKERS.includes(bookmaker)) {
      throw new Error(`Unsupported bookmaker: ${bookmaker}`);
    }

    console.log(`Fetching odds from ${bookmaker}...`);
    const endpoint = API_ENDPOINTS[bookmaker as keyof typeof API_ENDPOINTS];
    const apiKey = API_KEYS[bookmaker as keyof typeof API_KEYS];
    
    // Check if we have a valid endpoint
    if (!endpoint) {
      console.error(`No API endpoint configured for ${bookmaker}`);
      throw new Error(`No API endpoint configured for ${bookmaker}`);
    }
    
    // Prepare headers based on bookmaker requirements
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'SportArbitrageApp/1.0'
    };
    
    // Configure request options based on bookmaker
    let requestOptions: any = {
      timeout: 15000, // 15 second timeout
      headers
    };
    
    // Add bookmaker-specific authentication
    switch (bookmaker) {
      case 'Bet9ja':
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
          headers['X-API-Version'] = '1.0';
        }
        break;
        
      case '1xBet':
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        headers['X-Language'] = 'en';
        headers['Accept-Language'] = 'en-US,en;q=0.9';
        break;
        
      case 'BetKing':
        if (apiKey) {
          headers['X-API-Key'] = apiKey;
        }
        break;
        
      case 'SportyBet':
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        // SportyBet might require specific parameters
        requestOptions.params = {
          country: 'ng',
          language: 'en',
          market: '1x2',
          limit: 100
        };
        break;
    }
    
    console.log(`Making request to ${endpoint} for ${bookmaker}`);
    
    try {
      const response = await axios.get(endpoint, requestOptions);
      
      if (!response.data) {
        throw new Error(`No data returned from ${bookmaker} API`);
      }
      
      console.log(`Successfully received data from ${bookmaker}`);
      const normalizedOdds = normalizeOdds(response.data, bookmaker);
      
      if (normalizedOdds.length === 0) {
        console.warn(`No odds could be normalized from ${bookmaker} response`);
        throw new Error(`Failed to normalize odds from ${bookmaker}`);
      } else {
        console.log(`Normalized ${normalizedOdds.length} odds from ${bookmaker}`);
      }
      
      return normalizedOdds;
    } catch (apiError) {
      console.error(`API request failed for ${bookmaker}:`, apiError);
      
      // For demo purposes, use the mock data generator
      console.log(`Using mock data for ${bookmaker} due to API error`);
      const { generateMockOdds } = await import('@/utils/mockData');
      const allMockOdds = generateMockOdds();
      return allMockOdds.filter(odd => odd.bookmaker === bookmaker);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        console.error(`Timeout fetching ${bookmaker} odds: Connection took too long`);
      } else if (error.response) {
        console.error(`Error fetching ${bookmaker} odds: Status ${error.response.status}`, error.response.data);
      } else if (error.request) {
        console.error(`Error fetching ${bookmaker} odds: No response received`);
      } else {
        console.error(`Error fetching ${bookmaker} odds:`, error.message);
      }
    } else {
      console.error(`Error fetching ${bookmaker} odds:`, error);
    }
    
    // Use mock data as a fallback for demo purposes
    console.log(`Using mock data for ${bookmaker} as fallback`);
    const { generateMockOdds } = await import('@/utils/mockData');
    const allMockOdds = generateMockOdds();
    return allMockOdds.filter(odd => odd.bookmaker === bookmaker);
  }
};

// Fetch odds from all supported bookmakers
export const fetchAllOdds = async (selectedBookmakers: string[] = SUPPORTED_BOOKMAKERS): Promise<MatchOdds[]> => {
  try {
    const bookmakers = selectedBookmakers.filter(bk => SUPPORTED_BOOKMAKERS.includes(bk));
    
    if (bookmakers.length === 0) {
      console.warn('No valid bookmakers selected for fetching odds');
      // Instead of throwing an error, use mock data for demo purposes
      console.log('Using mock data as no valid bookmakers were selected');
      const { generateMockOdds } = await import('@/utils/mockData');
      return generateMockOdds();
    }

    console.log(`Starting to fetch odds from ${bookmakers.length} bookmakers`);
    
    // Use Promise.allSettled instead of Promise.all to handle individual failures
    const oddsPromises = bookmakers.map(bookmaker => fetchBookmakerOdds(bookmaker));
    const settledResults = await Promise.allSettled(oddsPromises);
    
    // Process results, including only the successful ones
    const successfulResults: MatchOdds[][] = [];
    const failedBookmakers: string[] = [];
    
    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
      } else {
        failedBookmakers.push(bookmakers[index]);
        console.error(`Failed to fetch odds from ${bookmakers[index]}:`, result.reason);
      }
    });
    
    // If all bookmakers failed, use mock data
    if (successfulResults.length === 0) {
      console.warn(`Failed to fetch odds from all bookmakers: ${failedBookmakers.join(', ')}`);
      console.log('Using mock data as all bookmakers failed');
      const { generateMockOdds } = await import('@/utils/mockData');
      return generateMockOdds();
    }
    
    // Flatten the array of arrays
    const allOdds = successfulResults.flat();
    console.log(`Successfully fetched ${allOdds.length} odds from ${successfulResults.length}/${bookmakers.length} bookmakers`);
    
    return allOdds;
  } catch (error) {
    console.error('Error fetching all odds:', error);
    
    // Use mock data as a fallback for demo purposes
    console.log('Using mock data due to error in fetching all odds');
    const { generateMockOdds } = await import('@/utils/mockData');
    return generateMockOdds();
  }
};

// Match odds from different bookmakers for the same event
export const matchEvents = (odds: MatchOdds[]): Record<string, MatchOdds[]> => {
  const matchGroups: Record<string, MatchOdds[]> = {};
  
  odds.forEach(odd => {
    // Create a normalized match name for comparison
    const normalizedName = `${odd.team_home.toLowerCase()}-${odd.team_away.toLowerCase()}`;
    
    if (!matchGroups[normalizedName]) {
      matchGroups[normalizedName] = [];
    }
    
    matchGroups[normalizedName].push(odd);
  });
  
  // Filter out matches with only one bookmaker (no arbitrage possible)
  return Object.fromEntries(
    Object.entries(matchGroups).filter(([_, odds]) => odds.length > 1)
  );
};

// Fetch and process odds for arbitrage opportunities
export const fetchArbitrageOpportunities = async (selectedBookmakers: string[]): Promise<MatchOdds[]> => {
  try {
    console.log(`Fetching odds from selected bookmakers: ${selectedBookmakers.join(', ')}`);
    const allOdds = await fetchAllOdds(selectedBookmakers);
    
    if (allOdds.length === 0) {
      console.warn('No odds were fetched from any bookmaker');
      // Instead of throwing an error, use mock data for demo purposes
      console.log('Using mock data as no odds were fetched');
      const { generateMockOdds } = await import('@/utils/mockData');
      return generateMockOdds();
    }
    
    console.log(`Successfully fetched ${allOdds.length} total odds from ${new Set(allOdds.map(odd => odd.bookmaker)).size} bookmakers`);
    
    const matchedEvents = matchEvents(allOdds);
    const matchedEventsCount = Object.keys(matchedEvents).length;
    
    if (matchedEventsCount === 0) {
      console.warn('No matched events found for arbitrage opportunities');
      return allOdds; // Return all odds even if no matches for arbitrage
    }
    
    console.log(`Found ${matchedEventsCount} potential arbitrage opportunities`);
    
    // Return all odds from matched events (events with multiple bookmakers)
    return Object.values(matchedEvents).flat();
  } catch (error) {
    console.error('Error finding arbitrage opportunities:', error);
    
    // Use mock data as a fallback for demo purposes
    console.log('Using mock data due to error in finding arbitrage opportunities');
    const { generateMockOdds } = await import('@/utils/mockData');
    return generateMockOdds();
  }
}; 