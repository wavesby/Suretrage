import axios from 'axios';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
dotenv.config();

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class OddsApiProvider {
  constructor(apiKey = null) {
    // Explicitly set the API key or use the one from env
    this.apiKey = apiKey || process.env.ODDS_API_KEY;
    if (!this.apiKey) {
      throw new Error('ODDS API key is required');
    }
    console.log('ODDS API initialized with key');
    
    this.baseUrl = 'https://api.the-odds-api.com/v4';
    this.cacheDir = path.join(__dirname, 'odds-data');
    
    // More aggressive caching to conserve API calls - increased from minutes to hours
    this.liveDataCacheDuration = 15 * 60 * 1000; // 15 minutes for live data (increased from 5)
    this.regularCacheDuration = 6 * 60 * 60 * 1000; // 6 hours for regular data (increased from 30 minutes)
    
    // More conservative request throttling to avoid hitting rate limits
    this.lastRequestTime = 0;
    this.minRequestInterval = 5000; // 5 seconds between requests (increased from 1 second)
    
    // Track API call count
    this.apiCallsToday = 0;
    this.dailyLimit = 100; // Conservative limit to avoid reaching the real limit
    this.loadApiCallCount();
    
    // Ensure cache directory exists
    this.initializeCache();
  }
  
  async initializeCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log('Cache directory ready');
    } catch (error) {
      console.error('Error creating cache directory:', error.message);
    }
  }
  
  async loadApiCallCount() {
    try {
      const countFile = path.join(this.cacheDir, 'api_call_count.json');
      if (existsSync(countFile)) {
        const data = await fs.readFile(countFile, 'utf8');
        const countData = JSON.parse(data);
        const today = new Date().toISOString().split('T')[0];
        
        if (countData.date === today) {
          this.apiCallsToday = countData.count;
          console.log(`Loaded API call count for today: ${this.apiCallsToday}`);
        } else {
          // New day, reset count
          this.apiCallsToday = 0;
          this.saveApiCallCount();
        }
      }
    } catch (error) {
      console.error('Error loading API call count:', error);
      this.apiCallsToday = 0;
    }
  }
  
  async saveApiCallCount() {
    try {
      const countFile = path.join(this.cacheDir, 'api_call_count.json');
      const today = new Date().toISOString().split('T')[0];
      await fs.writeFile(countFile, JSON.stringify({ 
        date: today, 
        count: this.apiCallsToday 
      }), 'utf8');
    } catch (error) {
      console.error('Error saving API call count:', error);
    }
  }
  
  async checkApiCallLimit() {
    if (this.apiCallsToday >= this.dailyLimit) {
      console.error(`API call limit reached (${this.apiCallsToday}/${this.dailyLimit}). Using cached data only.`);
      return false;
    }
    return true;
  }
  
  incrementApiCallCount(cost = 1) {
    this.apiCallsToday += cost;
    this.saveApiCallCount();
    console.log(`API call count: ${this.apiCallsToday}/${this.dailyLimit}`);
  }
  
  /**
   * Get a list of all available sports
   */
  async getSports() {
    try {
      // Check cache first
      const cacheFile = path.join(this.cacheDir, `sports.json`);
      try {
        const cachedData = await fs.readFile(cacheFile, 'utf-8');
        const { timestamp, data } = JSON.parse(cachedData);
        
        // Sports data can be cached longer (24 hours)
        const cacheAge = (Date.now() - timestamp) / (1000 * 60);
        if (cacheAge < 1440) { // 24 hours
          console.log(`Using cached sports data (${cacheAge.toFixed(1)} minutes old)`);
          return data;
        }
      } catch (error) {
        // Cache miss or invalid cache, continue to API request
      }
      
      await this.throttleRequest();
      const response = await axios.get(`${this.baseUrl}/sports`, {
        params: {
          apiKey: this.apiKey,
          all: true
        }
      });
      
      this.logApiUsage(response);
      
      // Cache the result
      await fs.writeFile(cacheFile, JSON.stringify({
        timestamp: Date.now(),
        data: response.data
      }), 'utf-8');
      
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getSports');
      return [];
    }
  }
  
  /**
   * Get odds for a specific sport
   * @param {string} sportKey - The sport key
   * @param {string[]} regions - Array of regions to query (e.g., ['eu', 'uk'])
   * @param {string[]} markets - Array of markets to query (e.g., ['h2h', 'spreads'])
   * @param {boolean} useCache - Whether to use cached data if available
   * @param {boolean} isLive - Whether to request live odds (reduces cache time)
   */
  async getOdds(sportKey, regions = ['eu'], markets = ['h2h'], useCache = true, isLive = false) {
    const cacheFile = path.join(this.cacheDir, `${sportKey}-${regions.join('-')}-${markets.join('-')}${isLive ? '-live' : ''}.json`);
    const cacheDuration = isLive ? this.liveDataCacheDuration : this.regularCacheDuration;
    
    // Always check cache first
    try {
      const cachedData = await fs.readFile(cacheFile, 'utf-8');
      const { timestamp, data } = JSON.parse(cachedData);
      
      const cacheAge = (Date.now() - timestamp) / 1000;
      const cacheAgeMinutes = Math.round(cacheAge / 60);
      
      // Use cache for longer periods now to conserve API calls
      if (cacheAge < cacheDuration / 1000) {
        console.log(`Using cached ${isLive ? 'live' : ''} data for ${sportKey} (${cacheAgeMinutes} minutes old)`);
        return data;
      }
      
      // If we're over our API limit, use even stale cache data rather than failing
      if (!await this.checkApiCallLimit()) {
        console.log(`Using stale cached data for ${sportKey} due to API limit (${cacheAgeMinutes} minutes old)`);
        return data;
      }
    } catch (error) {
      // Cache miss or invalid cache
      if (!await this.checkApiCallLimit()) {
        console.error(`No cache available for ${sportKey} and API limit reached`);
        return [];
      }
    }
    
    // If we reach here, we need to make an API call
    try {
      await this.throttleRequest();
      const params = {
        apiKey: this.apiKey,
        regions: regions.join(','),
        markets: markets.join(','),
        oddsFormat: 'decimal'
      };
      
      // Add live parameter if requesting live odds
      if (isLive) {
        params.live = 'true';
      }
      
      const response = await axios.get(`${this.baseUrl}/sports/${sportKey}/odds`, { params });
      
      // Track API call
      this.incrementApiCallCount(parseInt(response.headers['x-requests-last'] || '1'));
      this.logApiUsage(response);
      
      // Cache the result with timestamp
      await fs.writeFile(cacheFile, JSON.stringify({
        timestamp: Date.now(),
        data: response.data
      }), 'utf-8');
      
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getOdds', sportKey);
      
      // Try to return cached data even if it's older than preferred
      try {
        const cachedData = await fs.readFile(cacheFile, 'utf-8');
        const { data } = JSON.parse(cachedData);
        console.log(`Using older cached data for ${sportKey} after API error`);
        return data;
      } catch {
        return [];
      }
    }
  }
  
  /**
   * Get live odds for a specific sport - completely reworked to be more efficient
   */
  async getLiveOdds(sportKey, regions = ['eu'], markets = ['h2h']) {
    // First check if we've exceeded our API call limit
    if (!await this.checkApiCallLimit()) {
      // Try to load from cache if available, even if stale
      try {
        const cacheFile = path.join(this.cacheDir, `${sportKey}-${regions.join('-')}-${markets.join('-')}-live.json`);
        const cachedData = await fs.readFile(cacheFile, 'utf-8');
        const { data } = JSON.parse(cachedData);
        console.log(`Using stale cached live data for ${sportKey} due to API limit`);
        return data;
      } catch (error) {
        console.error(`No live cache available for ${sportKey} and API limit reached`);
        return [];
      }
    }
    
    // Use the regular getOdds method with live flag
    return this.getOdds(sportKey, regions, markets, true, true);
  }
  
  /**
   * Transform API odds data to match your application's expected format
   */
  transformOddsData(apiData, bookmakerFilter = null) {
    const transformedData = [];
    
    for (const event of apiData) {
      // Filter bookmakers if specified
      const relevantBookmakers = bookmakerFilter
        ? event.bookmakers.filter(bm => bookmakerFilter.includes(bm.key))
        : event.bookmakers;
      
      if (relevantBookmakers.length === 0) continue;
      
      // Check if event is live
      const startTime = new Date(event.commence_time);
      const now = new Date();
      const isLive = startTime <= now;
      
      const matchData = {
        id: event.id,
        sport: event.sport_key,
        league: event.sport_title,
        startTime: event.commence_time,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        isLive: isLive,
        bookmakers: relevantBookmakers.map(bm => ({
          name: bm.title,
          key: bm.key,
          lastUpdate: bm.last_update,
          markets: bm.markets.map(market => ({
            type: market.key,
            outcomes: market.outcomes.map(outcome => ({
              name: outcome.name,
              price: outcome.price,
              point: outcome.point || null,
              description: outcome.description || null
            }))
          }))
        }))
      };
      
      transformedData.push(matchData);
    }
    
    return transformedData;
  }
  
  /**
   * Transform data to match the MatchOdds format expected by the arbitrage calculator
   */
  transformToMatchOdds(apiData) {
    const matchOddsArray = [];
    
    for (const event of apiData) {
      // Check if event is live
      const startTime = new Date(event.commence_time);
      const now = new Date();
      const isLive = startTime <= now;
      
      if (!event.bookmakers || event.bookmakers.length === 0) {
        continue;
      }
      
      // Process each bookmaker
      for (const bookmaker of event.bookmakers) {
        // Process each market
        for (const market of bookmaker.markets) {
          if (market.type === 'h2h') {
            // Handle head-to-head (1X2) market
            const homeOutcome = market.outcomes.find(o => 
              o.name === event.home_team || 
              o.name.toLowerCase() === event.home_team.toLowerCase()
            );
            
            const awayOutcome = market.outcomes.find(o => 
              o.name === event.away_team || 
              o.name.toLowerCase() === event.away_team.toLowerCase()
            );
            
            const drawOutcome = market.outcomes.find(o => 
              o.name === 'Draw' || o.name.toLowerCase() === 'draw'
            );
            
            if (homeOutcome && awayOutcome) {
              const matchOdd = {
                id: `${event.id}-${bookmaker.key}-h2h`,
                match_id: event.id,
                bookmaker: bookmaker.title,
                match_name: `${event.home_team} vs ${event.away_team}`,
                team_home: event.home_team,
                team_away: event.away_team,
                home_team: event.home_team,
                away_team: event.away_team,
                league: event.sport_title,
                match_time: event.commence_time,
                market_type: '1X2',
                odds_home: homeOutcome.price,
                odds_away: awayOutcome.price,
                odds_draw: drawOutcome?.price,
                updated_at: bookmaker.last_update || new Date().toISOString(),
                isLive: isLive,
                liquidity: isLive ? 0.7 : 0.9,
                suspensionRisk: isLive ? 0.5 : 0.2
              };
              
              matchOddsArray.push(matchOdd);
            }
          } else if (market.type === 'totals' || market.type === 'outrights') {
            // Handle over/under markets
            for (const outcome of market.outcomes) {
              if (outcome.point !== undefined && 
                  (outcome.name === 'Over' || outcome.name === 'Under' || 
                   outcome.name.toLowerCase() === 'over' || outcome.name.toLowerCase() === 'under')) {
                
                const isOver = outcome.name.toLowerCase() === 'over';
                
                const matchOdd = {
                  id: `${event.id}-${bookmaker.key}-ou-${outcome.point}`,
                  match_id: event.id,
                  bookmaker: bookmaker.title,
                  match_name: `${event.home_team} vs ${event.away_team}`,
                  team_home: event.home_team,
                  team_away: event.away_team,
                  home_team: event.home_team,
                  away_team: event.away_team,
                  league: event.sport_title,
                  match_time: event.commence_time,
                  market_type: 'OVER_UNDER',
                  odds_home: 0,
                  odds_away: 0,
                  goals_over_under: outcome.point,
                  odds_over: isOver ? outcome.price : undefined,
                  odds_under: !isOver ? outcome.price : undefined,
                  updated_at: bookmaker.last_update || new Date().toISOString(),
                  isLive: isLive,
                  liquidity: isLive ? 0.6 : 0.8,
                  suspensionRisk: isLive ? 0.6 : 0.3
                };
                
                matchOddsArray.push(matchOdd);
              }
            }
          }
        }
      }
    }
    
    return matchOddsArray;
  }
  
  /**
   * Get odds and transform them to your application format
   * @param {string} sportKey - Sport key to fetch odds for
   * @param {string[]} bookmakers - Array of bookmaker keys to filter by
   * @param {boolean} liveOnly - Whether to fetch only live events
   */
  async getTransformedOdds(sportKey, bookmakers = null, liveOnly = false) {
    // Get all regions to maximize bookmaker coverage
    const regions = ['eu', 'uk', 'us', 'au'];
    const markets = ['h2h', 'totals']; // Include over/under markets
    
    // Get both live and pre-match odds if needed
    let oddsData = [];
    
    if (liveOnly) {
      // Get only live odds
      const liveOdds = await this.getLiveOdds(sportKey, regions, markets);
      oddsData = liveOdds;
    } else {
      // Get both live and pre-match odds
      const [liveOdds, preMatchOdds] = await Promise.all([
        this.getLiveOdds(sportKey, regions, markets),
        this.getOdds(sportKey, regions, markets)
      ]);
      
      // Combine odds, marking live ones
      liveOdds.forEach(event => {
        event.live = true;
      });
      
      // Combine and deduplicate by ID
      const eventMap = new Map();
      [...liveOdds, ...preMatchOdds].forEach(event => {
        // Live events take precedence
        if (!eventMap.has(event.id) || event.live) {
          eventMap.set(event.id, event);
        }
      });
      
      oddsData = Array.from(eventMap.values());
    }
    
    // Transform data to our application format
    const transformedData = this.transformOddsData(oddsData, bookmakers);
    
    // Also transform to MatchOdds format for arbitrage calculator
    const matchOddsFormat = this.transformToMatchOdds(transformedData);
    
    return {
      transformedData,
      matchOddsFormat
    };
  }
  
  /**
   * List all available bookmakers from a specific sport
   */
  async listBookmakers(sportKey) {
    const oddsData = await this.getOdds(sportKey, ['eu', 'uk', 'us', 'au'], ['h2h'], false);
    
    // Extract all unique bookmakers
    const bookmakers = new Set();
    for (const event of oddsData) {
      for (const bookmaker of event.bookmakers) {
        bookmakers.add(JSON.stringify({
          key: bookmaker.key,
          name: bookmaker.title
        }));
      }
    }
    
    return Array.from(bookmakers).map(bm => JSON.parse(bm));
  }
  
  /**
   * Log API usage information
   */
  logApiUsage(response) {
    console.log('\nAPI Usage:');
    console.log('Requests remaining:', response.headers['x-requests-remaining']);
    console.log('Requests used:', response.headers['x-requests-used']);
    console.log('Last request cost:', response.headers['x-requests-last']);
  }
  
  /**
   * Handle API errors
   */
  handleApiError(error, method, param = '') {
    console.error(`Error in ${method}${param ? ` for ${param}` : ''}:`, error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      if (error.response.status === 429) {
        console.error('Rate limit exceeded. Please wait before making more requests.');
      }
    }
  }
  
  /**
   * Throttle requests to avoid hitting rate limits
   */
  async throttleRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }
}

export default OddsApiProvider; 