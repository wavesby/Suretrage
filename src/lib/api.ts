import { MatchOdds } from '@/utils/arbitrage';
import axios from 'axios';

// Define supported bookmakers
export const SUPPORTED_BOOKMAKERS = [
  'Bet9ja',
  '1xBet', 
  'BetKing',
  'SportyBet',
  'NairaBet',
  'Betway',
  'BangBet',
  'Parimatch'
];

// Base URLs for bookmaker APIs
const BASE_URLS = {
  'Bet9ja': import.meta.env?.VITE_BET9JA_API_URL || 'https://odds-api.bet9ja.com',
  '1xBet': import.meta.env?.VITE_ONEXBET_API_URL || 'https://1xbet.ng/service-api',
  'BetKing': import.meta.env?.VITE_BETKING_API_URL || 'https://betking.com/sports-data/api',
  'SportyBet': import.meta.env?.VITE_SPORTYBET_API_URL || 'https://www.sportybet.com/api/ng',
  'NairaBet': 'https://nairabet.com/rest/market/categories',
  'Betway': 'https://www.betway.com.ng/api',
  'BangBet': 'https://bangbet.com/api/v2',
  'Parimatch': 'https://parimatch.ng/api/v2'
};

// API endpoints for each bookmaker's football odds
const API_ENDPOINTS = {
  'Bet9ja': `${BASE_URLS['Bet9ja']}/v1/odds/football/main`,
  '1xBet': `${BASE_URLS['1xBet']}/line/prematch?sport=1&count=500&tf=2200000&tz=3&antisports=188&mode=4&country=132&getEmpty=true&gr=277`,
  'BetKing': `${BASE_URLS['BetKing']}/v2/sports/football/events?market=all&live=false&virtual=false`,
  'SportyBet': `${BASE_URLS['SportyBet']}/football/matches/upcoming?count=100`,
  'NairaBet': `${BASE_URLS['NairaBet']}/events?type=prematch&sport=1&count=200`,
  'Betway': `${BASE_URLS['Betway']}/sports/soccer/matches/upcoming?limit=100`,
  'BangBet': `${BASE_URLS['BangBet']}/football/odds?markets=1x2&upcoming=true`,
  'Parimatch': `${BASE_URLS['Parimatch']}/sports/football/events?limit=150`
};

// Alternative API endpoints (as fallbacks)
const ALTERNATIVE_ENDPOINTS = {
  'Bet9ja': `${BASE_URLS['Bet9ja']}/v1/events/upcoming/football?limit=200`,
  '1xBet': `${BASE_URLS['1xBet']}/sports/line?sport=1&count=500`,
  'BetKing': `${BASE_URLS['BetKing']}/v1/competitions/football/odds`,
  'SportyBet': `${BASE_URLS['SportyBet']}/events/matches?sport=football&limit=100`,
  'NairaBet': `${BASE_URLS['NairaBet']}/football?type=upcoming&limit=200`,
  'Betway': `${BASE_URLS['Betway']}/sportsbook/football/events`,
  'BangBet': `${BASE_URLS['BangBet']}/football/upcoming`,
  'Parimatch': `${BASE_URLS['Parimatch']}/football/markets`
};

// Headers required for API requests
const getHeaders = (bookmaker: string) => {
  const commonHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  switch(bookmaker) {
    case 'Bet9ja':
      return {
        ...commonHeaders,
        'Origin': 'https://web.bet9ja.com',
        'Referer': 'https://web.bet9ja.com/',
        'Authorization': `Bearer ${import.meta.env?.VITE_BET9JA_API_KEY || ''}`
      };
    case '1xBet':
      return {
        ...commonHeaders,
        'Origin': 'https://1xbet.ng',
        'Referer': 'https://1xbet.ng/en/line/football',
        'Authorization': `Bearer ${import.meta.env?.VITE_ONEXBET_API_KEY || ''}`
      };
    case 'BetKing':
      return {
        ...commonHeaders,
        'Origin': 'https://betking.com',
        'Referer': 'https://betking.com/sports/football',
        'X-API-Key': import.meta.env?.VITE_BETKING_API_KEY || ''
      };
    case 'SportyBet':
      return {
        ...commonHeaders,
        'Origin': 'https://www.sportybet.com',
        'Referer': 'https://www.sportybet.com/ng/sport/football',
        'Authorization': `Bearer ${import.meta.env?.VITE_SPORTYBET_API_KEY || ''}`
      };
    case 'NairaBet':
      return {
        ...commonHeaders,
        'Origin': 'https://nairabet.com',
        'Referer': 'https://nairabet.com/sports/football'
      };
    case 'Betway':
      return {
        ...commonHeaders,
        'Origin': 'https://www.betway.com.ng',
        'Referer': 'https://www.betway.com.ng/sports/evt/football'
      };
    case 'BangBet':
      return {
        ...commonHeaders,
        'Origin': 'https://bangbet.com',
        'Referer': 'https://bangbet.com/sports'
      };
    case 'Parimatch':
      return {
        ...commonHeaders,
        'Origin': 'https://parimatch.ng',
        'Referer': 'https://parimatch.ng/en/football/europe'
      };
    default:
      return commonHeaders;
  }
};

// Public API or alternative method for fetching odds when direct API fails
// This can be a sports data aggregator or odds comparison site that's more reliable
const PUBLIC_ODDS_API = 'https://api.the-odds-api.com/v4/sports/soccer_epl/odds';
const PUBLIC_API_KEY = import.meta.env?.VITE_ODDS_API_KEY || '';

// Proxy configuration for CORS issues
const PROXY_URL = import.meta.env?.VITE_PROXY_URL || 'https://corsproxy.io/?';

// Web scraping fallback endpoints (public-facing URLs that can be scraped)
const SCRAPE_ENDPOINTS = {
  'Bet9ja': 'https://web.bet9ja.com/Sport/OddsToday.aspx',
  '1xBet': 'https://1xbet.ng/en/line/football',
  'BetKing': 'https://betking.com/sports/football',
  'SportyBet': 'https://www.sportybet.com/ng/sport/football',
  'NairaBet': 'https://nairabet.com/sports/football',
  'Betway': 'https://www.betway.com.ng/sports/evt/football',
  'BangBet': 'https://bangbet.com/sports',
  'Parimatch': 'https://parimatch.ng/en/football/europe'
};

// Helper function to delay between API calls to avoid rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to extract and normalize data from HTML for web scraping fallback
const extractOddsFromHTML = async (html: string, bookmaker: string): Promise<any> => {
  try {
    // This would typically use a DOM parser like cheerio in Node.js
    // For browser, we can use DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract data based on bookmaker's HTML structure
    // This is a simplified placeholder - actual implementation would be more complex
    // and specific to each bookmaker's website structure
    switch(bookmaker) {
      case 'Bet9ja':
        // Extract data from Bet9ja HTML structure
        // Return in a format that can be processed by the normalizer
        break;
      case '1xBet':
        // Extract data from 1xBet HTML structure
        break;
      // Add cases for other bookmakers
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error extracting data from ${bookmaker} HTML:`, error);
    return null;
  }
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
      case 'NairaBet':
        return normalizeNairaBetOdds(odds);
      case 'Betway':
        return normalizeBetwayOdds(odds);
      case 'BangBet':
        return normalizeBangBetOdds(odds);
      case 'Parimatch':
        return normalizeParimatchOdds(odds);
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

// Add new normalizer functions for additional bookmakers
const normalizeNairaBetOdds = (odds: any): MatchOdds[] => {
  try {
    if (!odds || !odds.data || !Array.isArray(odds.data.events)) {
      console.error('Invalid NairaBet data structure');
      return [];
    }

    return odds.data.events
      .filter((event: any) => {
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
          id: `nairabet-${event.id}`,
          match_id: event.id.toString(),
          bookmaker: 'NairaBet',
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
          liquidity: 7,
          suspensionRisk: 3
        };
      })
      .filter((event: any) => event !== null);
  } catch (error) {
    console.error('Error in normalizeNairaBetOdds:', error);
    return [];
  }
};

const normalizeBetwayOdds = (odds: any): MatchOdds[] => {
  try {
    if (!odds || !odds.events || !Array.isArray(odds.events)) {
      console.error('Invalid Betway data structure');
      return [];
    }

    return odds.events
      .filter((event: any) => {
        return event && 
               event.id && 
               event.name && 
               event.markets && 
               Array.isArray(event.markets);
      })
      .map((event: any) => {
        // Find the 1X2 market
        const market1X2 = event.markets.find((m: any) => 
          m.type === 'match_result' || 
          m.name === '1X2' || 
          m.key === 'three_way_result'
        );
        
        if (!market1X2 || !market1X2.outcomes || market1X2.outcomes.length < 3) {
          return null;
        }
        
        const home = market1X2.outcomes.find((o: any) => o.type === '1');
        const draw = market1X2.outcomes.find((o: any) => o.type === 'X');
        const away = market1X2.outcomes.find((o: any) => o.type === '2');
        
        if (!home || !draw || !away) {
          return null;
        }
        
        // Parse team information
        const teams = event.name.split(' v ');
        const homeTeam = teams[0] || event.participants?.find((p: any) => p.type === 'home')?.name || 'Home';
        const awayTeam = teams[1] || event.participants?.find((p: any) => p.type === 'away')?.name || 'Away';
        
        return {
          id: `betway-${event.id}`,
          match_id: event.id.toString(),
          bookmaker: 'Betway',
          match_name: event.name,
          team_home: homeTeam,
          team_away: awayTeam,
          league: event.competition?.name || event.category?.name || 'Football',
          match_time: new Date(event.start_time || event.scheduled_start).toISOString(),
          market_type: '1X2',
          odds_home: parseFloat(home.price || home.odds),
          odds_away: parseFloat(away.price || away.odds),
          odds_draw: parseFloat(draw.price || draw.odds),
          updated_at: new Date().toISOString(),
          liquidity: 8,
          suspensionRisk: 2
        };
      })
      .filter((event: any) => event !== null);
  } catch (error) {
    console.error('Error in normalizeBetwayOdds:', error);
    return [];
  }
};

const normalizeBangBetOdds = (odds: any): MatchOdds[] => {
  try {
    if (!odds || !odds.data || !Array.isArray(odds.data.matches)) {
      console.error('Invalid BangBet data structure');
      return [];
    }

    return odds.data.matches
      .filter((match: any) => {
        return match && 
               match.id && 
               match.name && 
               match.markets && 
               Array.isArray(match.markets);
      })
      .map((match: any) => {
        // Find the 1X2 market
        const market1X2 = match.markets.find((m: any) => 
          m.type === '1x2' || 
          m.name === 'Match Result'
        );
        
        if (!market1X2 || !market1X2.selections || market1X2.selections.length < 3) {
          return null;
        }
        
        const home = market1X2.selections.find((s: any) => s.type === 'home');
        const draw = market1X2.selections.find((s: any) => s.type === 'draw');
        const away = market1X2.selections.find((s: any) => s.type === 'away');
        
        if (!home || !draw || !away) {
          return null;
        }
        
        return {
          id: `bangbet-${match.id}`,
          match_id: match.id.toString(),
          bookmaker: 'BangBet',
          match_name: match.name,
          team_home: match.home_team || match.teams?.home?.name || 'Home',
          team_away: match.away_team || match.teams?.away?.name || 'Away',
          league: match.competition?.name || match.tournament || 'Football',
          match_time: new Date(match.start_time || match.scheduled_start).toISOString(),
          market_type: '1X2',
          odds_home: parseFloat(home.odds || home.price),
          odds_away: parseFloat(away.odds || away.price),
          odds_draw: parseFloat(draw.odds || draw.price),
          updated_at: new Date().toISOString(),
          liquidity: 6,
          suspensionRisk: 4
        };
      })
      .filter((match: any) => match !== null);
  } catch (error) {
    console.error('Error in normalizeBangBetOdds:', error);
    return [];
  }
};

const normalizeParimatchOdds = (odds: any): MatchOdds[] => {
  try {
    if (!odds || !odds.data || !Array.isArray(odds.data.events)) {
      console.error('Invalid Parimatch data structure');
      return [];
    }

    return odds.data.events
      .filter((event: any) => {
        return event && 
               event.id && 
               event.name && 
               event.markets && 
               Array.isArray(event.markets);
      })
      .map((event: any) => {
        // Find the 1X2 market
        const market1X2 = event.markets.find((m: any) => 
          m.type === '1x2' || 
          m.name === 'Match Result' || 
          m.key === 'three_way'
        );
        
        if (!market1X2 || !market1X2.selections || market1X2.selections.length < 3) {
          return null;
        }
        
        const home = market1X2.selections.find((s: any) => s.type === '1');
        const draw = market1X2.selections.find((s: any) => s.type === 'X');
        const away = market1X2.selections.find((s: any) => s.type === '2');
        
        if (!home || !draw || !away) {
          return null;
        }
        
        // Parse team names from event name
        const teams = event.name.split(' vs ');
        
        return {
          id: `parimatch-${event.id}`,
          match_id: event.id.toString(),
          bookmaker: 'Parimatch',
          match_name: event.name,
          team_home: teams[0] || event.home_team || 'Home',
          team_away: teams[1] || event.away_team || 'Away',
          league: event.league?.name || event.tournament?.name || 'Football',
          match_time: new Date(event.start_time || event.scheduled_start).toISOString(),
          market_type: '1X2',
          odds_home: parseFloat(home.odds || home.price),
          odds_away: parseFloat(away.odds || away.price),
          odds_draw: parseFloat(draw.odds || draw.price),
          updated_at: new Date().toISOString(),
          liquidity: 7,
          suspensionRisk: 3
        };
      })
      .filter((event: any) => event !== null);
  } catch (error) {
    console.error('Error in normalizeParimatchOdds:', error);
    return [];
  }
};

// Improved function to fetch odds from a bookmaker with multiple retry strategies
export const fetchBookmakerOdds = async (bookmaker: string): Promise<MatchOdds[]> => {
  console.log(`Fetching odds for ${bookmaker}...`);
  let attempts = 0;
  const maxAttempts = 3;
  
  while (attempts < maxAttempts) {
    attempts++;
    try {
      // Strategy 1: Direct API call
      const endpoint = attempts === 1 ? API_ENDPOINTS[bookmaker] : ALTERNATIVE_ENDPOINTS[bookmaker];
      const headers = getHeaders(bookmaker);
      
      const response = await axios.get(endpoint, { 
        headers,
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status < 500 // Accept any status below 500
      });
      
      if (response.status === 200 && response.data) {
        console.log(`Successfully fetched ${bookmaker} odds (Attempt ${attempts})`);
        return normalizeOdds(response.data, bookmaker);
      }
      
      // If we got a response but it's not 200, or data is invalid
      console.warn(`Invalid response from ${bookmaker} (Attempt ${attempts}): Status ${response.status}`);
      
      // Strategy 2: Try with proxy if direct call failed
      if (attempts === 2) {
        const proxyResponse = await axios.get(`${PROXY_URL}${encodeURIComponent(endpoint)}`, {
          headers: {
            ...headers,
            'X-Requested-With': 'XMLHttpRequest'
          },
          timeout: 15000
        });
        
        if (proxyResponse.status === 200 && proxyResponse.data) {
          console.log(`Successfully fetched ${bookmaker} odds via proxy`);
          return normalizeOdds(proxyResponse.data, bookmaker);
        }
      }
      
      // Strategy 3: Try web scraping as last resort
      if (attempts === 3 && SCRAPE_ENDPOINTS[bookmaker]) {
        const scrapeUrl = SCRAPE_ENDPOINTS[bookmaker];
        const scrapeResponse = await axios.get(`${PROXY_URL}${encodeURIComponent(scrapeUrl)}`, {
          headers: {
            ...getHeaders(bookmaker),
            'Accept': 'text/html'
          },
          timeout: 20000
        });
        
        if (scrapeResponse.status === 200 && scrapeResponse.data) {
          const extractedData = await extractOddsFromHTML(scrapeResponse.data, bookmaker);
          if (extractedData) {
            console.log(`Successfully scraped ${bookmaker} odds`);
            return normalizeOdds(extractedData, bookmaker);
          }
        }
      }
      
      // Wait before next attempt
      await delay(1000);
      
    } catch (error: any) {
      console.error(`Error fetching ${bookmaker} odds (Attempt ${attempts}):`, 
        error.response ? `Status: ${error.response.status}` : error.message);
      
      // Wait longer before retry
      await delay(2000 * attempts);
    }
  }
  
  console.error(`All attempts to fetch ${bookmaker} odds failed`);
  // Return empty array if all attempts fail - no more mock fallback
  return [];
};

// Fallback function to fetch odds from the public API
const fetchFromPublicAPI = async (): Promise<MatchOdds[]> => {
  try {
    if (!PUBLIC_API_KEY) {
      console.warn('No public API key provided');
      return [];
    }
    
    const response = await axios.get(`${PUBLIC_ODDS_API}?apiKey=${PUBLIC_API_KEY}&regions=uk,eu,us&markets=h2h`);
    
    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }
    
    // Normalize the public API data
    return response.data.map((event: any) => {
      const homeTeam = event.home_team;
      const awayTeam = event.away_team;
      
      // Find best odds across all bookmakers in the response
      let bestHomeOdds = 0;
      let bestDrawOdds = 0;
      let bestAwayOdds = 0;
      let bookmaker = '';
      
      event.bookmakers.forEach((bk: any) => {
        const market = bk.markets.find((m: any) => m.key === 'h2h');
        if (!market) return;
        
        market.outcomes.forEach((outcome: any) => {
          if (outcome.name === homeTeam && outcome.price > bestHomeOdds) {
            bestHomeOdds = outcome.price;
            bookmaker = bk.title;
          } else if (outcome.name === 'Draw' && outcome.price > bestDrawOdds) {
            bestDrawOdds = outcome.price;
          } else if (outcome.name === awayTeam && outcome.price > bestAwayOdds) {
            bestAwayOdds = outcome.price;
          }
        });
      });
      
      return {
        id: `public-api-${event.id}`,
        match_id: event.id,
        bookmaker: 'PublicAPI',
        match_name: `${homeTeam} vs ${awayTeam}`,
        team_home: homeTeam,
        team_away: awayTeam,
        league: event.sport_title || 'Football',
        match_time: new Date(event.commence_time).toISOString(),
        market_type: '1X2',
        odds_home: bestHomeOdds,
        odds_away: bestAwayOdds,
        odds_draw: bestDrawOdds,
        updated_at: new Date().toISOString(),
        liquidity: 7,
        suspensionRisk: 2
      };
    }).filter((event: any) => 
      event.odds_home > 1 && event.odds_away > 1 && event.odds_draw > 1
    );
  } catch (error) {
    console.error('Error fetching from public API:', error);
    return [];
  }
};

// Improved function to fetch odds from all selected bookmakers with parallel processing
export const fetchAllOdds = async (selectedBookmakers: string[] = SUPPORTED_BOOKMAKERS): Promise<MatchOdds[]> => {
  console.log(`Fetching odds for ${selectedBookmakers.length} bookmakers: ${selectedBookmakers.join(', ')}`);
  
  // Split bookmakers into batches to avoid overwhelming the network
  const batchSize = 2; // Process 2 bookmakers at a time
  const batches = [];
  
  for (let i = 0; i < selectedBookmakers.length; i += batchSize) {
    batches.push(selectedBookmakers.slice(i, i + batchSize));
  }
  
  let allOdds: MatchOdds[] = [];
  let failedBookmakers: string[] = [];
  
  // Process batches sequentially
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(async bookmaker => {
        try {
          const odds = await fetchBookmakerOdds(bookmaker);
          return { bookmaker, odds, success: odds.length > 0 };
        } catch (error) {
          console.error(`Failed to fetch odds from ${bookmaker}:`, error);
          return { bookmaker, odds: [], success: false };
        }
      })
    );
    
    // Add successful results to allOdds
    batchResults.forEach(result => {
      if (result.success) {
        allOdds = [...allOdds, ...result.odds];
      } else {
        failedBookmakers.push(result.bookmaker);
      }
    });
    
    // Small delay between batches
    await delay(500);
  }
  
  // If we have failed bookmakers and no odds at all, try the public API
  if (failedBookmakers.length > 0) {
    console.warn(`Failed to fetch odds from ${failedBookmakers.join(', ')}`);
    
    if (allOdds.length === 0) {
      console.log('Attempting to fetch from public odds API...');
      const publicOdds = await fetchFromPublicAPI();
      allOdds = [...allOdds, ...publicOdds];
    }
  }
  
  // If we still have no odds, return empty array - no more mock fallback
  if (allOdds.length === 0) {
    console.warn('No odds fetched from any source.');
    return [];
  }
  
  console.log(`Successfully fetched ${allOdds.length} odds records from ${selectedBookmakers.length - failedBookmakers.length} bookmakers`);
  return allOdds;
};

// Helper function to match events across different bookmakers
export const matchEvents = (odds: MatchOdds[]): Record<string, MatchOdds[]> => {
  const matches: Record<string, MatchOdds[]> = {};
  
  odds.forEach(odd => {
    // Normalize team names for more accurate matching
    const homeTeam = odd.team_home.toLowerCase().trim();
    const awayTeam = odd.team_away.toLowerCase().trim();
    
    // Create various key formats to improve matching
    const keys = [
      `${homeTeam}-${awayTeam}`,
      `${homeTeam.replace(/\s/g, '')}-${awayTeam.replace(/\s/g, '')}`,
      `${homeTeam.slice(0, 5)}-${awayTeam.slice(0, 5)}`
    ];
    
    // Try to find a match with any key format
    let matched = false;
    for (const key of keys) {
      if (matches[key]) {
        matches[key].push(odd);
        matched = true;
        break;
      }
    }
    
    // If no match found, create a new entry with the first key
    if (!matched) {
      matches[keys[0]] = [odd];
    }
  });
  
  return matches;
};

// Main function to fetch arbitrage opportunities
export const fetchArbitrageOpportunities = async (selectedBookmakers: string[]): Promise<MatchOdds[]> => {
  try {
    // Validate input
    if (!selectedBookmakers || selectedBookmakers.length === 0) {
      console.warn('No bookmakers selected, using all supported bookmakers');
      selectedBookmakers = SUPPORTED_BOOKMAKERS;
    }
    
    // Filter to only include supported bookmakers
    const validBookmakers = selectedBookmakers.filter(bm => 
      SUPPORTED_BOOKMAKERS.includes(bm)
    );
    
    if (validBookmakers.length === 0) {
      console.warn('No valid bookmakers specified, using all supported bookmakers');
      validBookmakers.push(...SUPPORTED_BOOKMAKERS);
    }
    
    // Fetch odds from all selected bookmakers
    const allOdds = await fetchAllOdds(validBookmakers);
    
    // Return the odds
    return allOdds;
    
  } catch (error) {
    console.error('Error fetching arbitrage opportunities:', error);
    return [];
  }
};

// Function to validate if odds are real and not stale
export const validateOddsQuality = (odds: MatchOdds[]): { valid: boolean, message: string } => {
  if (!odds || odds.length === 0) {
    return { valid: false, message: 'No odds data available' };
  }
  
  // Check for stale data
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
  
  const staleOdds = odds.filter(odd => {
    const updateTime = new Date(odd.updated_at);
    return updateTime < oneHourAgo;
  });
  
  if (staleOdds.length / odds.length > 0.5) {
    return { valid: false, message: 'More than 50% of odds data is stale (older than 1 hour)' };
  }
  
  // Check for invalid odds values
  const invalidOdds = odds.filter(odd => 
    !odd.odds_home || odd.odds_home <= 1 || 
    !odd.odds_away || odd.odds_away <= 1 ||
    (odd.odds_draw !== undefined && odd.odds_draw <= 1)
  );
  
  if (invalidOdds.length / odds.length > 0.1) {
    return { valid: false, message: 'More than 10% of odds have invalid values' };
  }
  
  return { valid: true, message: 'Odds data is valid' };
}; 