import { MatchOdds } from '@/utils/arbitrage';
import axios from 'axios';
import { fetchOddsApiData, DEFAULT_NIGERIAN_BOOKMAKERS } from './oddsApiAdapter';

// Define supported bookmakers - updated with all available API bookmakers
export const SUPPORTED_BOOKMAKERS = [
  // African/Nigerian bookmakers
  '1xBet',
  'SportyBet',
  'Betway',
  'Betway Africa',
  
  // International bookmakers available in the API
  'Pinnacle',
  'Bet365',
  'MarathonBet',
  'William Hill',
  'Bovada',
  'FanDuel',
  'Matchbook',
  'Unibet',
  'DraftKings',
  
  // Additional bookmakers for future compatibility
  'Bet9ja',
  'BetKing',
  'NairaBet',
  'BangBet',
  'Parimatch',
  'Parimatch Africa'
];

// Proxy server URL - update this with your actual server URL
const PROXY_SERVER = import.meta.env?.VITE_PROXY_SERVER || 
  (import.meta.env.PROD ? '' : 'http://localhost:3001'); // Use relative URLs in production

// Add console logs for debugging
console.log('Using proxy server URL:', PROXY_SERVER);

// Helper function to delay between API calls to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Set up Axios with better error handling for debugging
const apiClient = axios.create({
  baseURL: PROXY_SERVER,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  error => {
    console.error('API Response Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    return Promise.reject(error);
  }
);

// Function to fetch odds from 1xBet via our proxy server
export const fetch1xBetOdds = async (): Promise<MatchOdds[]> => {
  try {
    // First try to get data from The Odds API
    const oddsApiData = await fetchOddsApiData(['1xBet']);
    if (oddsApiData && oddsApiData.length > 0) {
      console.log(`Using Odds API data for 1xBet (${oddsApiData.length} matches)`);
      return oddsApiData;
    }
    
    // Fall back to proxy server if no Odds API data
    console.log('Falling back to proxy server for 1xBet odds...');
    const response = await apiClient.get('/api/odds/1xbet');
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid response format from 1xBet proxy');
      return [];
    }
    
    console.log(`Received ${response.data.length} matches from 1xBet proxy`);
    return response.data;
  } catch (error) {
    console.error('Error fetching 1xBet odds:', error);
    return [];
  }
};

// Function to fetch odds from SportyBet via our proxy server
export const fetchSportyBetOdds = async (): Promise<MatchOdds[]> => {
  try {
    // No SportyBet in The Odds API yet, use proxy server directly
    console.log('Fetching SportyBet odds from proxy server...');
    const response = await apiClient.get('/api/odds/sportybet');
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid response format from SportyBet proxy');
      return [];
    }
    
    console.log(`Received ${response.data.length} matches from SportyBet`);
    return response.data;
  } catch (error) {
    console.error('Error fetching SportyBet odds:', error);
    return [];
  }
};

// Function to fetch Betway odds from The Odds API
export const fetchBetwayOdds = async (): Promise<MatchOdds[]> => {
  try {
    // Get Betway odds from The Odds API
    console.log('Fetching Betway odds from The Odds API...');
    const oddsApiData = await fetchOddsApiData(['Betway']);
    
    console.log(`Received ${oddsApiData.length} matches from Betway via The Odds API`);
    return oddsApiData;
  } catch (error) {
    console.error('Error fetching Betway odds:', error);
    return [];
  }
};

// Function to fetch all odds directly from the API server
export const fetchAllOddsFromServer = async (): Promise<MatchOdds[]> => {
  try {
    console.log('Fetching all odds directly from API server...');
    
    // Increase timeout to 15 seconds (from 8)
    const response = await fetch(`${PROXY_SERVER}/api/odds`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      // Add a longer timeout
      signal: AbortSignal.timeout(15000) // 15 seconds
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }
    
    const rawData = await response.json();
    
    if (!rawData) {
      console.error('API server returned empty response');
      return [];
    }
    
    let events = [];
    if (!Array.isArray(rawData)) {
      // Handle case where data is an object with events property
      if (rawData.events && Array.isArray(rawData.events)) {
        console.log(`Received ${rawData.events.length} matches from API server (nested in events property)`);
        events = rawData.events;
      } else {
        console.error('API server returned non-array data:', typeof rawData);
        return [];
      }
    } else {
      events = rawData;
    }
    
    console.log(`Received ${events.length} matches from API server`);
    
    // Convert raw API data to MatchOdds format
    const matchOdds: MatchOdds[] = [];
    
    events.forEach(event => {
      if (event.bookmakers && Array.isArray(event.bookmakers)) {
        event.bookmakers.forEach(bookmaker => {
          if (bookmaker.markets && Array.isArray(bookmaker.markets)) {
            bookmaker.markets.forEach(market => {
              if (market.key === 'h2h' && market.outcomes && Array.isArray(market.outcomes)) {
                const homeOutcome = market.outcomes.find(o => o.name === event.home_team);
                const awayOutcome = market.outcomes.find(o => o.name === event.away_team);
                const drawOutcome = market.outcomes.find(o => o.name === 'Draw');
                
                if (homeOutcome && awayOutcome) {
                  matchOdds.push({
                    id: `${event.id}-${bookmaker.key || bookmaker.title}`,
                    match_id: event.id,
                    bookmaker: bookmaker.title || bookmaker.key,
                    match_name: `${event.home_team} vs ${event.away_team}`,
                    team_home: event.home_team,
                    team_away: event.away_team,
                    league: event.sport_title,
                    match_time: event.commence_time,
                    market_type: '1X2',
                    odds_home: homeOutcome.price,
                    odds_away: awayOutcome.price,
                    odds_draw: drawOutcome?.price,
                    updated_at: market.last_update || new Date().toISOString(),
                    suspensionRisk: 0.1,
                    liquidity: 1000
                  });
                }
              }
            });
          }
        });
      }
    });
    
    console.log(`Converted to ${matchOdds.length} MatchOdds entries`);
    return matchOdds;
  } catch (error: any) {
    console.error('Error fetching all odds from API server:', error);
    
    // More detailed error logging
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      console.error('Request timed out - the server may be slow or unavailable');
    } else if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('No response received from API:', error.request);
    } else {
      console.error('API Request setup error:', error.message);
    }
    
    throw error; // Rethrow to let the caller handle it
  }
};

// Function to fetch all odds from all supported bookmakers
export const fetchAllOdds = async (selectedBookmakers: string[] = SUPPORTED_BOOKMAKERS): Promise<MatchOdds[]> => {
  console.log(`Fetching odds for bookmakers: ${selectedBookmakers.join(', ')}`);
  
  try {
    // First try to get all data directly from our API server
    const serverOdds = await fetchAllOddsFromServer();
    
    if (serverOdds && serverOdds.length > 0) {
      console.log(`Using ${serverOdds.length} matches from API server`);
      
      // Filter by selected bookmakers if needed
      if (selectedBookmakers.length > 0 && selectedBookmakers.length < SUPPORTED_BOOKMAKERS.length) {
        const filteredOdds = serverOdds.filter(odd => 
          selectedBookmakers.includes(odd.bookmaker)
        );
        
        console.log(`Filtered to ${filteredOdds.length} matches for selected bookmakers`);
        return filteredOdds;
      }
      
      return serverOdds;
    }
    
    console.log('No data from API server, falling back to individual sources');
    
    // If server data isn't available, try individual sources
    const allOdds: MatchOdds[] = [];
    
    // First try to get all data from The Odds API
    console.log('Attempting to fetch all odds from The Odds API...');
    const oddsApiData = await fetchOddsApiData(selectedBookmakers);
    
    // Add The Odds API data
    if (oddsApiData.length > 0) {
      allOdds.push(...oddsApiData);
      console.log(`Added ${oddsApiData.length} matches from The Odds API`);
    } else {
      console.log('No data from The Odds API, falling back to scraper sources');
    }
    
    // If we're missing some bookmakers, fetch them individually
    const apiBookmakers = new Set(oddsApiData.map(odd => odd.bookmaker));
    const missingBookmakers = selectedBookmakers.filter(bm => !apiBookmakers.has(bm));
    
    // Fetch 1xBet odds if selected and not already in API data
    if (missingBookmakers.includes('1xBet')) {
      const odds = await fetch1xBetOdds();
      allOdds.push(...odds);
    }
    
    // Fetch SportyBet odds if selected and not already in API data
    if (missingBookmakers.includes('SportyBet')) {
      const odds = await fetchSportyBetOdds();
      allOdds.push(...odds);
    }
    
    // Add delay between requests to avoid overloading
    await delay(1000);
    
    console.log(`Total matches fetched: ${allOdds.length}`);
    return allOdds;
  } catch (error) {
    console.error('Error fetching all odds:', error);
    return [];
  }
};

// Function to match events across different bookmakers
export const matchEvents = (odds: MatchOdds[]): Record<string, MatchOdds[]> => {
  const matchGroups: Record<string, MatchOdds[]> = {};
  
  odds.forEach(odd => {
    // Create a normalized match key for grouping
    const homeTeam = odd.team_home || odd.home_team || '';
    const awayTeam = odd.team_away || odd.away_team || '';
    
    if (!homeTeam || !awayTeam) {
      console.warn('Skipping odds entry with missing team information', odd);
      return;
    }
    
    const matchKey = `${homeTeam.toLowerCase()}-${awayTeam.toLowerCase()}`;
    
    if (!matchGroups[matchKey]) {
      matchGroups[matchKey] = [];
    }
    
    matchGroups[matchKey].push(odd);
  });
  
  return matchGroups;
};

// Main function to fetch arbitrage opportunities
export const fetchArbitrageOpportunities = async (selectedBookmakers: string[]): Promise<MatchOdds[]> => {
  try {
    console.log('Fetching arbitrage opportunities...');
    
    // Default to recommended bookmakers if none selected
    const bookmakers = selectedBookmakers.length > 0 
      ? selectedBookmakers 
      : DEFAULT_NIGERIAN_BOOKMAKERS;
    
    // Get odds from all selected bookmakers
    const allOdds = await fetchAllOdds(bookmakers);
    
    if (allOdds.length === 0) {
      console.warn('No odds data received from any bookmaker');
      return [];
    }
    
    // Return the odds for arbitrage calculation
    return allOdds;
  } catch (error) {
    console.error('Error fetching arbitrage opportunities:', error);
    return [];
  }
};

/**
 * Validates the quality of odds data
 */
export const validateOddsQuality = (odds: MatchOdds[]): { valid: boolean, message: string } => {
  // Check if we have any data
  if (!odds || odds.length === 0) {
    return { valid: false, message: 'No odds data available' };
  }
  
  // Count unique bookmakers
  const bookmakers = new Set(odds.map(odd => odd.bookmaker));
  
  // Check if we have multiple bookmakers - more lenient approach
  if (bookmakers.size < 2) {
    // Even with one bookmaker, consider the data valid
    return { 
      valid: true, 
      message: `Have ${odds.length} events from 1 bookmaker (${Array.from(bookmakers)[0]}). Limited comparison possible.` 
    };
  }
  
  // For smaller datasets, validate if we have comparable events
  if (odds.length < 5) {
    // Check if we have events that can be compared (same match from different bookmakers)
    const matchCount = new Map();
    
    // Count events by match
    odds.forEach(odd => {
      let matchKey;
      
      // Support different field naming conventions
      if (odd.match_name) {
        matchKey = odd.match_name.toLowerCase();
      } else if (odd.home_team && odd.away_team) {
        matchKey = `${odd.home_team}-${odd.away_team}`.toLowerCase();
      } else {
        // Use any available identifier
        matchKey = `match-${odd.id || Math.random()}`;
      }
      
      matchCount.set(matchKey, (matchCount.get(matchKey) || 0) + 1);
    });
    
    // See if we have any matches with multiple bookmakers
    const comparableMatches = Array.from(matchCount.values()).filter(count => count > 1);
    
    if (comparableMatches.length === 0) {
      return { 
        valid: false, 
        message: `No comparable events found across bookmakers` 
      };
    }
  }
  
  return { valid: true, message: `Data quality good: ${odds.length} events from ${bookmakers.size} bookmakers` };
}; 