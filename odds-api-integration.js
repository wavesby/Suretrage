import OddsApiProvider from './odds-api-provider.js';
import * as fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
dotenv.config();

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * OddsApiIntegration - Manages the integration between The Odds API
 * and our application's arbitrage detection system
 */
class OddsApiIntegration {
  constructor(config = {}) {
    // Ensure API key is available
    const apiKey = config.apiKey || process.env.ODDS_API_KEY;
    if (!apiKey) {
      throw new Error('ODDS API key is required');
    }
    
    this.api = new OddsApiProvider(apiKey);
    this.outputDir = config.outputDir || path.join(__dirname, 'odds-data');
    
    // Mapping of our bookmaker names to API bookmaker keys
    this.bookmakerMapping = config.bookmakerMapping || {
      // Updated mappings based on our testing
      '1xbet': ['1xbet', 'onexbet'], // 1xBet can be identified as either in the API
      'sportybet': ['sportybet'], 
      'bet9ja': ['bet9ja'],
      'betking': ['betking'],
      'nairabet': ['nairabet'],
      'betway': ['betway', 'betway_africa'], // Include African variant
      'bangbet': ['bangbet'],
      'parimatch': ['parimatch', 'parimatch_africa'],
      // Additional bookmakers that may be useful
      'pinnacle': ['pinnacle'],
      'betfair': ['betfair_ex_uk', 'betfair_ex_eu', 'betfair_sb_uk'],
      'williamhill': ['williamhill'],
      'marathonbet': ['marathonbet'],
      'bovada': ['bovada']
    };
    
    // CONSERVATION STRATEGY: Reduce the number of sports we're tracking to conserve API calls
    // The sports we're interested in - reduced list to save API calls
    this.targetSports = config.targetSports || [
      'soccer_epl',                  // Premier League - highest priority
      'soccer_spain_la_liga',        // La Liga - high priority
      'soccer_uefa_champs_league',   // Champions League - high priority if in season
      'basketball_nba'               // NBA - high priority if in season
    ];
    
    // Even more focused list for live odds to conserve API calls
    this.livePrioritySports = [
      'soccer_epl',
      'soccer_spain_la_liga'
    ];
    
    // Extended refresh intervals to conserve API calls
    this.liveDataRefreshInterval = config.liveDataRefreshInterval || 15 * 60 * 1000; // 15 minutes (increased from 5)
    this.preMatchDataRefreshInterval = config.preMatchDataRefreshInterval || 6 * 60 * 60 * 1000; // 6 hours (increased from 30 minutes)
    this.liveDataLastFetch = 0;
    this.preMatchDataLastFetch = 0;
    
    // Initialize
    this._setupDirectory();
  }
  
  async _setupDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Error creating output directory:', error.message);
    }
  }
  
  /**
   * Fetch all available sports and save to a file
   */
  async fetchAndSaveSports() {
    try {
      const sports = await this.api.getSports();
      await this._saveData('all-sports.json', sports);
      console.log(`Saved ${sports.length} sports to all-sports.json`);
      return sports;
    } catch (error) {
      console.error('Error fetching sports:', error.message);
      return [];
    }
  }
  
  /**
   * Fetch odds for all target sports
   * @param {boolean} liveOnly - Whether to fetch only live odds
   */
  async fetchAllOdds(liveOnly = false) {
    const results = {};
    const sportsList = liveOnly ? this.livePrioritySports : this.targetSports;
    
    for (const sportKey of sportsList) {
      try {
        console.log(`Fetching ${liveOnly ? 'live' : ''} odds for ${sportKey}...`);
        let odds;
        
        if (liveOnly) {
          odds = await this.api.getLiveOdds(sportKey, ['eu', 'uk', 'us', 'au'], ['h2h', 'totals']);
        } else {
          odds = await this.api.getOdds(sportKey, ['eu', 'uk', 'us', 'au'], ['h2h', 'totals']);
        }
        
        if (odds && odds.length > 0) {
          results[sportKey] = odds;
          console.log(`- Found ${odds.length} ${liveOnly ? 'live' : ''} events for ${sportKey}`);
          
          // Save individual sport data
          await this._saveData(`odds-${liveOnly ? 'live-' : ''}${sportKey}.json`, odds);
        } else {
          console.log(`- No ${liveOnly ? 'live' : ''} events found for ${sportKey}`);
        }
      } catch (error) {
        console.error(`Error fetching ${liveOnly ? 'live' : ''} odds for ${sportKey}:`, error.message);
      }
      
      // Add a small delay to avoid hitting rate limits
      await this._delay(1000);
    }
    
    // Save all odds together
    const filename = liveOnly ? 'live-odds.json' : 'all-odds.json';
    await this._saveData(filename, results);
    return results;
  }
  
  /**
   * Fetch live odds for all priority sports
   */
  async fetchLiveOdds() {
    return this.fetchAllOdds(true);
  }
  
  /**
   * Get odds for a specific set of bookmakers
   * @param {string[]} bookmakerNames - Our internal bookmaker names
   * @param {boolean} liveOnly - Whether to fetch only live odds
   */
  async getOddsForBookmakers(bookmakerNames = [], liveOnly = false) {
    // Convert our bookmaker names to API bookmaker keys
    const apiBookmakerKeys = this._getApiBookmakerKeys(bookmakerNames);
    
    const results = {};
    let totalEvents = 0;
    
    // Determine which sports list to use
    const sportsList = liveOnly ? this.livePrioritySports : this.targetSports;
    
    for (const sportKey of sportsList) {
      try {
        console.log(`Fetching ${liveOnly ? 'live' : ''} ${sportKey} odds for selected bookmakers...`);
        
        // Get odds - either live or regular
        let allOdds;
        if (liveOnly) {
          allOdds = await this.api.getLiveOdds(sportKey, ['eu', 'uk', 'us', 'au'], ['h2h', 'totals']);
        } else {
          allOdds = await this.api.getOdds(sportKey, ['eu', 'uk', 'us', 'au'], ['h2h', 'totals']);
        }
        
        if (!allOdds || allOdds.length === 0) {
          console.log(`- No ${liveOnly ? 'live' : ''} events found for ${sportKey}`);
          continue;
        }
        
        // Filter events to only include events with our target bookmakers
        const filteredEvents = allOdds.map(event => {
          const filteredBookmakers = event.bookmakers.filter(bm => 
            apiBookmakerKeys.includes(bm.key)
          );
          
          return {
            ...event,
            bookmakers: filteredBookmakers
          };
        }).filter(event => event.bookmakers.length > 0);
        
        if (filteredEvents.length > 0) {
          results[sportKey] = filteredEvents;
          totalEvents += filteredEvents.length;
          console.log(`- Found ${filteredEvents.length} ${liveOnly ? 'live' : ''} events with selected bookmakers`);
          
          // Save filtered data by sport
          const filename = `filtered-${liveOnly ? 'live-' : ''}odds-${sportKey}.json`;
          await this._saveData(filename, filteredEvents);
        } else {
          console.log(`- No ${liveOnly ? 'live' : ''} events with selected bookmakers for ${sportKey}`);
        }
      } catch (error) {
        console.error(`Error processing ${sportKey}:`, error.message);
      }
      
      // Add a small delay to avoid hitting rate limits
      await this._delay(1000);
    }
    
    // Save all filtered odds together
    const filename = liveOnly ? 'filtered-live-odds.json' : 'filtered-all-odds.json';
    await this._saveData(filename, results);
    console.log(`Total ${liveOnly ? 'live' : ''} events with selected bookmakers: ${totalEvents}`);
    
    return results;
  }
  
  /**
   * Get live odds for a specific set of bookmakers
   * OPTIMIZATION: Modified to be more conservative with API calls
   */
  async getLiveOddsForBookmakers(bookmakerNames = []) {
    console.log('Fetching live odds for bookmakers:', bookmakerNames);
    const results = {};
    let totalEvents = 0;
    
    // Check if we're allowed to make API calls or if we should rely on cache
    const canMakeApiCalls = await this.api.checkApiCallLimit();
    if (!canMakeApiCalls) {
      console.log('API call limit reached, using cached data only');
      
      // Try to load from cache
      try {
        const liveCacheFile = path.join(this.outputDir, 'live-arbitrage-ready.json');
        const data = await fs.readFile(liveCacheFile, 'utf-8');
        const cachedEvents = JSON.parse(data);
        console.log(`Using cached data with ${cachedEvents.length} events`);
        
        // Organize by sport for consistent return format
        if (cachedEvents && cachedEvents.length > 0) {
          // Group by sport
          cachedEvents.forEach(event => {
            const sport = event.sport || 'unknown';
            if (!results[sport]) {
              results[sport] = [];
            }
            results[sport].push(event);
            totalEvents++;
          });
        }
        return results;
      } catch (error) {
        console.error('Error loading cached live data:', error.message);
        return {};
      }
    }
    
    // Get live odds for each sport - only if API calls are allowed
    for (const sportKey of this.livePrioritySports) {
      try {
        console.log(`Fetching live ${sportKey} odds for selected bookmakers...`);
        const liveOdds = await this.api.getLiveOdds(sportKey, ['eu', 'uk', 'us', 'au'], ['h2h', 'totals']);
        
        if (!liveOdds || liveOdds.length === 0) {
          console.log(`- No live events found for ${sportKey}`);
          continue;
        }
        
        // Transform the data to our format
        const transformedData = this.api.transformToMatchOdds(liveOdds);
        
        // Filter for our bookmakers
        const apiBookmakerKeys = this._getApiBookmakerKeys(bookmakerNames);
        const filteredEvents = transformedData.filter(event => {
          const bookmakerKey = event.bookmaker?.toLowerCase();
          return apiBookmakerKeys.some(key => key.toLowerCase() === bookmakerKey);
        });
        
        if (filteredEvents.length > 0) {
          results[sportKey] = filteredEvents;
          totalEvents += filteredEvents.length;
          console.log(`- Found ${filteredEvents.length} live events with selected bookmakers`);
        }
      } catch (error) {
        console.error(`Error fetching live odds for ${sportKey}:`, error.message);
      }
    }
    
    console.log(`Total live events with selected bookmakers: ${totalEvents}`);
    return results;
  }
  
  /**
   * Save the formatted data for arbitrage detection
   * @param {Object} oddsData - Data from getOddsForBookmakers
   * @param {boolean} isLive - Whether this is live data
   */
  async saveArbitrageData(oddsData, isLive = false) {
    // Flatten the nested structure by sport
    const allEvents = [];
    Object.values(oddsData).forEach(sportEvents => {
      if (Array.isArray(sportEvents)) {
        allEvents.push(...sportEvents);
      }
    });
    
    // Filter out non-live events if we're only interested in live events
    const filteredEvents = isLive ? allEvents.filter(event => event.isLive) : allEvents;
    
    // Save the data
    const filename = isLive ? 'live-arbitrage-ready.json' : 'arbitrage-ready.json';
    await this._saveData(filename, filteredEvents);
    console.log(`Saved ${filteredEvents.length} ${isLive ? 'live' : ''} events ready for arbitrage detection`);
    return filteredEvents;
  }
  
  /**
   * Save combined live and pre-match data for arbitrage detection
   */
  async saveCombinedArbitrageData(oddsData) {
    // Flatten the nested structure by sport
    const allEvents = [];
    Object.values(oddsData).forEach(sportEvents => {
      if (Array.isArray(sportEvents)) {
        allEvents.push(...sportEvents);
      }
    });
    
    // Group events by match ID to avoid duplicates
    const eventMap = new Map();
    allEvents.forEach(event => {
      const existingEvent = eventMap.get(event.match_id);
      // Live events take precedence
      if (!existingEvent || event.isLive) {
        eventMap.set(event.match_id, event);
      }
    });
    
    const combinedEvents = Array.from(eventMap.values());
    
    // Save the data
    await this._saveData('combined-arbitrage-ready.json', combinedEvents);
    console.log(`Saved ${combinedEvents.length} combined events ready for arbitrage detection`);
    return combinedEvents;
  }
  
  /**
   * Refresh all odds data (live and pre-match) - OPTIMIZED for fewer API calls
   */
  async refreshAllOdds(bookmakerNames = [], forceRefresh = false) {
    const now = Date.now();
    const results = {
      live: [],
      preMatch: [],
      combined: []
    };
    
    // Check if we're allowed to make API calls
    const canMakeApiCalls = await this.api.checkApiCallLimit();
    
    // Check if we need to refresh live data
    const shouldRefreshLive = forceRefresh || 
                             (now - this.liveDataLastFetch) > this.liveDataRefreshInterval;
                             
    if (shouldRefreshLive) {
      if (canMakeApiCalls) {
        console.log('Refreshing live odds data...');
        
        // Get live odds (limited to fewer sports to save API calls)
        const liveOddsData = await this.getLiveOddsForBookmakers(bookmakerNames);
        
        // Save for arbitrage detection
        const liveArbitrageData = await this.saveArbitrageData(liveOddsData, true);
        
        // Update timestamp
        this.liveDataLastFetch = now;
        
        results.live = liveArbitrageData;
      } else {
        console.log('Using cached live odds data due to API limits');
        
        // Load from cache
        try {
          const cachedData = await fs.readFile(path.join(this.outputDir, 'live-arbitrage-ready.json'), 'utf-8');
          results.live = JSON.parse(cachedData);
        } catch (error) {
          console.error('Error loading cached live data:', error.message);
          results.live = [];
        }
      }
    } else {
      console.log('Using cached live odds data (within refresh interval)');
      
      // Load from cache
      try {
        const cachedData = await fs.readFile(path.join(this.outputDir, 'live-arbitrage-ready.json'), 'utf-8');
        results.live = JSON.parse(cachedData);
      } catch (error) {
        console.error('Error loading cached live data:', error.message);
        results.live = [];
      }
    }
    
    // Check if we need to refresh pre-match data
    const shouldRefreshPreMatch = forceRefresh || 
                                 (now - this.preMatchDataLastFetch) > this.preMatchDataRefreshInterval;
                                 
    if (shouldRefreshPreMatch) {
      if (canMakeApiCalls) {
        console.log('Refreshing pre-match odds data...');
        
        // Get pre-match odds
        const preMatchOddsData = await this.getOddsForBookmakers(bookmakerNames, false);
        
        // Save for arbitrage detection
        const preMatchArbitrageData = await this.saveArbitrageData(preMatchOddsData, false);
        
        // Update timestamp
        this.preMatchDataLastFetch = now;
        
        results.preMatch = preMatchArbitrageData;
      } else {
        console.log('Using cached pre-match odds data due to API limits');
        
        // Load from cache
        try {
          const cachedData = await fs.readFile(path.join(this.outputDir, 'arbitrage-ready.json'), 'utf-8');
          results.preMatch = JSON.parse(cachedData);
        } catch (error) {
          console.error('Error loading cached pre-match data:', error.message);
          results.preMatch = [];
        }
      }
    } else {
      console.log('Using cached pre-match odds data (within refresh interval)');
      
      // Load from cache
      try {
        const cachedData = await fs.readFile(path.join(this.outputDir, 'arbitrage-ready.json'), 'utf-8');
        results.preMatch = JSON.parse(cachedData);
      } catch (error) {
        console.error('Error loading cached pre-match data:', error.message);
        results.preMatch = [];
      }
    }
    
    // Combine data as before
    const combinedMap = new Map();
    
    // Add live data first (priority)
    results.live.forEach(event => {
      event.isLive = true;
      combinedMap.set(event.match_id, event);
    });
    
    // Add pre-match data where there's no live data
    results.preMatch.forEach(event => {
      if (!combinedMap.has(event.match_id)) {
        event.isLive = false;
        combinedMap.set(event.match_id, event);
      }
    });
    
    // Convert map to array
    results.combined = Array.from(combinedMap.values());
    
    // Save combined data
    await this._saveData('combined-arbitrage-ready.json', results.combined);
    console.log(`Saved ${results.combined.length} combined events for arbitrage detection`);
    
    return results;
  }
  
  /**
   * Convert our bookmaker names to API bookmaker keys
   */
  _getApiBookmakerKeys(bookmakerNames) {
    const keys = [];
    
    bookmakerNames.forEach(name => {
      const mappedKeys = this.bookmakerMapping[name.toLowerCase()] || [];
      keys.push(...mappedKeys);
    });
    
    return keys;
  }
  
  /**
   * Update our bookmaker mapping with new API keys
   */
  updateBookmakerMapping(mapping) {
    this.bookmakerMapping = {
      ...this.bookmakerMapping,
      ...mapping
    };
  }
  
  /**
   * Save data to a file
   */
  async _saveData(filename, data) {
    try {
      const filePath = path.join(this.outputDir, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error(`Error saving ${filename}:`, error.message);
    }
  }
  
  /**
   * Simple delay function
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default OddsApiIntegration; 