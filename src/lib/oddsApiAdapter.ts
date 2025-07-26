import { MatchOdds } from '@/utils/arbitrage';
import axios from 'axios';

// Define the Odds API data structure
interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    last_update: string;
    markets: {
      key: string;
      last_update: string;
      outcomes: {
        name: string;
        price: number;
        point?: number;
      }[];
    }[];
  }[];
}

// Define bookmaker mapping from Odds API keys to our system
const BOOKMAKER_MAPPING: Record<string, string> = {
  'onexbet': '1xBet',
  '1xbet': '1xBet', 
  'betway': 'Betway',
  'pinnacle': 'Pinnacle',
  'marathonbet': 'MarathonBet',
  'williamhill': 'William Hill',
  'bovada': 'Bovada',
  'sportybet': 'SportyBet',
  'bet365': 'Bet365',
  'fanduel': 'FanDuel',
  'draftkings': 'DraftKings',
  'unibet_uk': 'Unibet',
  'matchbook': 'Matchbook',
  // Add more mappings as needed
};

// Sport mapping for cleaner league names
const SPORT_MAPPING: Record<string, string> = {
  'soccer_epl': 'Premier League',
  'soccer_spain_la_liga': 'La Liga',
  'soccer_germany_bundesliga': 'Bundesliga',
  'soccer_italy_serie_a': 'Serie A',
  'soccer_france_ligue_one': 'Ligue 1',
  'soccer_uefa_champs_league': 'Champions League',
  'basketball_nba': 'NBA',
  'americanfootball_nfl': 'NFL',
  // Add more sport mappings as needed
};

// Default Nigerian bookmakers to use in priority order
export const DEFAULT_NIGERIAN_BOOKMAKERS = ['1xBet', 'SportyBet', 'Betway', 'Bovada'];

// Function to load data from the backend API
async function loadOddsApiData(): Promise<OddsApiEvent[]> {
  try {
    console.log('🔄 Fetching odds data from backend API...');
    
    // First try the main API endpoint
    const response = await axios.get('/api/odds', {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.data) {
      console.warn('⚠️ No data received from API');
      return [];
    }
    
    // Handle different response formats
    let data = response.data;
    
    // If data is wrapped in an object, extract the events
    if (data.events && Array.isArray(data.events)) {
      data = data.events;
    }
    
    // If data is not an array, try to convert it
    if (!Array.isArray(data)) {
      console.warn('⚠️ API returned non-array data:', typeof data);
      return [];
    }
    
    console.log(`✅ Received ${data.length} events from API`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching odds API data from backend:', error);
    return [];
  }
}

// Fetch odds for a specific bookmaker
async function loadBookmakerOdds(bookmaker: string): Promise<OddsApiEvent[]> {
  try {
    const formattedName = bookmaker.toLowerCase().replace(/\s+/g, '');
    console.log(`🔄 Fetching ${bookmaker} odds from API...`);
    
    const response = await axios.get(`/api/odds/${formattedName}`, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      console.warn(`⚠️ Invalid data format from ${bookmaker} API`);
      return [];
    }
    
    console.log(`✅ Received ${response.data.length} events from ${bookmaker} API`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching odds for ${bookmaker}:`, error);
    return [];
  }
}

// Convert Odds API format to our MatchOdds format with improved error handling
function convertToMatchOdds(oddsApiData: OddsApiEvent[]): MatchOdds[] {
  const matchOdds: MatchOdds[] = [];
  
  if (!Array.isArray(oddsApiData)) {
    console.error('❌ convertToMatchOdds: Input is not an array');
    return [];
  }
  
  oddsApiData.forEach((event, eventIndex) => {
    try {
      // Validate event structure
      if (!event || typeof event !== 'object') {
        console.warn(`⚠️ Skipping invalid event at index ${eventIndex}`);
        return;
      }
      
      // Extract event details with fallbacks
      const eventId = event.id || `event_${Date.now()}_${eventIndex}`;
      const homeTeam = event.home_team || '';
      const awayTeam = event.away_team || '';
      const sportKey = event.sport_key || 'soccer';
      const commenceTime = event.commence_time || new Date().toISOString();
      
      // Skip if we don't have team names
      if (!homeTeam || !awayTeam) {
        console.warn(`⚠️ Skipping event ${eventId}: missing team names`);
        return;
      }
      
      // Get league name from sport mapping
      const league = SPORT_MAPPING[sportKey] || event.sport_title || sportKey;
      const matchName = `${homeTeam} vs ${awayTeam}`;
      
      // Process bookmakers
      if (!event.bookmakers || !Array.isArray(event.bookmakers)) {
        console.warn(`⚠️ Event ${eventId}: no bookmakers data`);
        return;
      }
      
      event.bookmakers.forEach((bookmaker, bmIndex) => {
        try {
          // Map bookmaker name
          const bookmakerKey = bookmaker.key || `bookmaker_${bmIndex}`;
          const bookmakerName = BOOKMAKER_MAPPING[bookmakerKey] || bookmaker.title || bookmakerKey;
          
          // Process markets
          if (!bookmaker.markets || !Array.isArray(bookmaker.markets)) {
            return;
          }
          
          bookmaker.markets.forEach(market => {
            try {
              // Handle h2h (head-to-head) markets
              if (market.key === 'h2h' && market.outcomes && Array.isArray(market.outcomes)) {
                const outcomes = market.outcomes;
                
                // Find home, away, and draw outcomes
                const homeOutcome = outcomes.find(o => 
                  o.name === homeTeam || 
                  o.name.toLowerCase() === homeTeam.toLowerCase() ||
                  o.name.toLowerCase().includes(homeTeam.toLowerCase().split(' ')[0])
                );
                
                const awayOutcome = outcomes.find(o => 
                  o.name === awayTeam || 
                  o.name.toLowerCase() === awayTeam.toLowerCase() ||
                  o.name.toLowerCase().includes(awayTeam.toLowerCase().split(' ')[0])
                );
                
                const drawOutcome = outcomes.find(o => 
                  o.name === 'Draw' || 
                  o.name.toLowerCase() === 'draw' ||
                  o.name.toLowerCase() === 'tie'
                );
                
                // Create match odds if we have at least home and away
                if (homeOutcome && awayOutcome && homeOutcome.price && awayOutcome.price) {
                  const matchOdd: MatchOdds = {
                    id: `${eventId}-${bookmakerKey}-h2h`,
                    match_id: eventId,
                    bookmaker: bookmakerName,
                    match_name: matchName,
                    team_home: homeTeam,
                    team_away: awayTeam,
                    home_team: homeTeam, // For compatibility
                    away_team: awayTeam, // For compatibility
                    league: league,
                    match_time: commenceTime,
                    market_type: '1X2',
                    odds_home: homeOutcome.price,
                    odds_away: awayOutcome.price,
                    odds_draw: drawOutcome?.price || undefined,
                    updated_at: market.last_update || bookmaker.last_update || new Date().toISOString(),
                    liquidity: 0.9, // High liquidity for established bookmakers
                    suspensionRisk: 0.2 // Low suspension risk
                  };
                  
                  matchOdds.push(matchOdd);
                }
              }
              
              // Handle totals (over/under) markets
              else if ((market.key === 'totals' || market.key.includes('total')) && market.outcomes) {
                const outcomes = market.outcomes;
                
                // Group outcomes by point value
                const pointGroups: Record<string, { over?: number, under?: number }> = {};
                
                outcomes.forEach(outcome => {
                  if (outcome.point !== undefined) {
                    const pointKey = outcome.point.toString();
                    if (!pointGroups[pointKey]) {
                      pointGroups[pointKey] = {};
                    }
                    
                    if (outcome.name === 'Over') {
                      pointGroups[pointKey].over = outcome.price;
                    } else if (outcome.name === 'Under') {
                      pointGroups[pointKey].under = outcome.price;
                    }
                  }
                });
                
                // Create match odds for each complete over/under pair
                Object.entries(pointGroups).forEach(([point, odds]) => {
                  if (odds.over && odds.under) {
                    const matchOdd: MatchOdds = {
                      id: `${eventId}-${bookmakerKey}-ou-${point}`,
                      match_id: eventId,
                      bookmaker: bookmakerName,
                      match_name: matchName,
                      team_home: homeTeam,
                      team_away: awayTeam,
                      home_team: homeTeam,
                      away_team: awayTeam,
                      league: league,
                      match_time: commenceTime,
                      market_type: 'OVER_UNDER',
                      odds_home: 0, // Not applicable
                      odds_away: 0, // Not applicable
                      goals_over_under: parseFloat(point),
                      odds_over: odds.over,
                      odds_under: odds.under,
                      updated_at: market.last_update || bookmaker.last_update || new Date().toISOString(),
                      liquidity: 0.8,
                      suspensionRisk: 0.3
                    };
                    
                    matchOdds.push(matchOdd);
                  }
                });
              }
            } catch (marketError) {
              console.warn(`⚠️ Error processing market for ${bookmakerName}:`, marketError);
            }
          });
        } catch (bookmakerError) {
          console.warn(`⚠️ Error processing bookmaker at index ${bmIndex}:`, bookmakerError);
        }
      });
    } catch (eventError) {
      console.warn(`⚠️ Error processing event at index ${eventIndex}:`, eventError);
    }
  });
  
  console.log(`✅ Converted ${matchOdds.length} match odds from ${oddsApiData.length} events`);
  return matchOdds;
}

// Function to get available bookmakers from the match odds data
export function getAvailableBookmakers(matchOdds: MatchOdds[]): string[] {
  const bookmakers = new Set<string>();
  matchOdds.forEach(odd => {
    if (odd.bookmaker) {
      bookmakers.add(odd.bookmaker);
    }
  });
  return Array.from(bookmakers).sort();
}

// Main function to fetch odds from the Odds API with specific bookmakers
export async function fetchOddsApiData(selectedBookmakers: string[] = DEFAULT_NIGERIAN_BOOKMAKERS): Promise<MatchOdds[]> {
  try {
    console.log('🚀 Starting Odds API data fetch...');
    console.log('📊 Selected bookmakers:', selectedBookmakers);
    
    let oddsApiData: OddsApiEvent[] = [];
    
    // Strategy: Try to get all data first, then filter if needed
    try {
      oddsApiData = await loadOddsApiData();
    } catch (error) {
      console.warn('⚠️ Failed to load all odds data, trying individual bookmakers...');
      
      // Fallback: Try individual bookmaker endpoints
      const bookmakerPromises = selectedBookmakers.slice(0, 3).map(bm => // Limit to 3 to avoid overload
        loadBookmakerOdds(bm).catch(err => {
          console.warn(`⚠️ Failed to load ${bm} odds:`, err.message);
          return [];
        })
      );
      
      const bookmakerResults = await Promise.all(bookmakerPromises);
      oddsApiData = bookmakerResults.flat();
    }
    
    if (!oddsApiData || oddsApiData.length === 0) {
      console.warn('⚠️ No odds data received from any source');
      return [];
    }
    
    console.log(`📥 Raw data: ${oddsApiData.length} events received`);
    
    // Convert to our format
    const allOdds = convertToMatchOdds(oddsApiData);
    
    // Filter by selected bookmakers if provided and we have selections
    let filteredOdds = allOdds;
    if (selectedBookmakers.length > 0 && selectedBookmakers.length < 10) {
      filteredOdds = allOdds.filter(odd => selectedBookmakers.includes(odd.bookmaker));
      console.log(`🎯 Filtered to ${filteredOdds.length} odds for selected bookmakers`);
    }
    
    // Log summary
    const bookmakerCounts = filteredOdds.reduce((acc, odd) => {
      acc[odd.bookmaker] = (acc[odd.bookmaker] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📈 Final data summary:');
    console.log('   Total odds:', filteredOdds.length);
    console.log('   Bookmakers:', Object.keys(bookmakerCounts).join(', '));
    console.log('   Distribution:', bookmakerCounts);
    
    return filteredOdds;
  } catch (error) {
    console.error('❌ Critical error in fetchOddsApiData:', error);
    return [];
  }
}

// Function to refresh odds data (useful for admin functionality)
export async function refreshOddsData(): Promise<boolean> {
  try {
    console.log('🔄 Requesting odds data refresh...');
    const response = await axios.post('/api/refresh-odds', {}, { timeout: 30000 });
    const success = response.data && response.data.success === true;
    console.log(success ? '✅ Odds refresh successful' : '❌ Odds refresh failed');
    return success;
  } catch (error) {
    console.error('❌ Failed to refresh odds data:', error);
    return false;
  }
} 