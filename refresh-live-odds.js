import OddsApiIntegration from './odds-api-integration.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
const result = dotenv.config();
if (result.error) {
  console.warn('Warning: .env file not found, using default API key');
}

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default Nigerian bookmakers to prioritize
const DEFAULT_BOOKMAKERS = ['1xbet', 'betway', 'sportybet'];

// Command line arguments
const args = process.argv.slice(2);
const bookmakers = args.length > 0 ? args : DEFAULT_BOOKMAKERS;

// Default refresh intervals
const DEFAULT_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes (increased from 2 minutes)
const refreshInterval = parseInt(process.env.LIVE_ODDS_REFRESH_INTERVAL) || DEFAULT_REFRESH_INTERVAL;

// Statistics
let totalRefreshes = 0;
let successfulRefreshes = 0;
let startTime = Date.now();
let lastApiCallTime = 0;
const MIN_API_CALL_INTERVAL = 5 * 60 * 1000; // Minimum 5 minutes between API calls

// Create integration instance with API key
const integration = new OddsApiIntegration({
  apiKey: process.env.ODDS_API_KEY || '24941339955c373fe2eced8f5c5a0f88'
});

/**
 * Refresh live odds data from The Odds API
 */
async function refreshLiveOdds() {
  totalRefreshes++;
  console.log(`\n[${new Date().toISOString()}] Starting live odds refresh #${totalRefreshes}...`);
  
  try {
    // Make sure target directories exist
    const dataDir = path.join(__dirname, 'odds-data');
    const publicDir = path.join(__dirname, 'public', 'api');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.mkdir(publicDir, { recursive: true });
    } catch (err) {
      console.error('Error creating directories:', err);
    }
    
    // Check if we should use the API or just cached data
    const now = Date.now();
    const timeSinceLastApiCall = now - lastApiCallTime;
    const canMakeApiCall = timeSinceLastApiCall >= MIN_API_CALL_INTERVAL;
    
    if (!canMakeApiCall) {
      console.log(`API call limit protection - last call was ${Math.round(timeSinceLastApiCall/1000/60)} minutes ago. Using cached data.`);
      
      try {
        // Try to read from cache
        const liveCacheFile = path.join(dataDir, 'live-arbitrage-ready.json');
        if (fs.existsSync(liveCacheFile)) {
          const cachedData = await fs.readFile(liveCacheFile, 'utf-8');
          const arbitrageData = JSON.parse(cachedData);
          
          // Save to public API directory for frontend access (even though it's cached)
          const publicFilePath = path.join(publicDir, 'live-odds-data.json');
          await fs.writeFile(publicFilePath, JSON.stringify({
            timestamp: now,
            cachedAt: lastApiCallTime,
            events: arbitrageData,
            stats: {
              total: arbitrageData.length,
              cached: true
            }
          }, null, 2), 'utf-8');
          
          console.log(`Reused ${arbitrageData.length} cached live events`);
          successfulRefreshes++;
          return true;
        } else {
          console.log('No cache file found, need to make API call');
        }
      } catch (error) {
        console.error('Error accessing cache:', error);
      }
    }
    
    // Fetch live odds data - only if we can make API calls
    console.log(`Fetching live odds for bookmakers: ${bookmakers.join(', ')}...`);
    const liveOddsData = await integration.getLiveOddsForBookmakers(bookmakers);
    lastApiCallTime = now; // Update last API call time
    
    // Convert to arbitrage format and save
    const arbitrageData = await integration.saveArbitrageData(liveOddsData, true);
    
    // Save to public API directory for frontend access
    const publicFilePath = path.join(publicDir, 'live-odds-data.json');
    await fs.writeFile(publicFilePath, JSON.stringify({
      timestamp: now,
      events: arbitrageData,
      stats: {
        total: arbitrageData.length,
        byLeague: {},
        byBookmaker: {}
      }
    }, null, 2), 'utf-8');
    
    // Display stats
    console.log(`Saved ${arbitrageData.length} live events to ${publicFilePath}`);
    
    // Count events by type
    const sportCounts = {};
    const bookmakerCounts = {};
    
    arbitrageData.forEach(event => {
      // Count by sport/league
      const league = event.league;
      sportCounts[league] = (sportCounts[league] || 0) + 1;
      
      // Count by bookmaker
      const bookmaker = event.bookmaker;
      bookmakerCounts[bookmaker] = (bookmakerCounts[bookmaker] || 0) + 1;
    });
    
    if (arbitrageData.length > 0) {
      console.log('\nLive events by league:');
      Object.entries(sportCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .forEach(([sport, count]) => {
          console.log(`- ${sport}: ${count} events`);
        });
        
      console.log('\nLive events by bookmaker:');
      Object.entries(bookmakerCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .forEach(([bookmaker, count]) => {
          console.log(`- ${bookmaker}: ${count} events`);
        });
        
      // Update the public data with stats
      const publicData = {
        timestamp: now,
        events: arbitrageData,
        stats: {
          total: arbitrageData.length,
          byLeague: sportCounts,
          byBookmaker: bookmakerCounts
        }
      };
      await fs.writeFile(publicFilePath, JSON.stringify(publicData, null, 2), 'utf-8');
    } else {
      console.log('No live events found at this time.');
    }
    
    successfulRefreshes++;
    return true;
  } catch (error) {
    console.error('Error refreshing live odds data:', error);
    return false;
  }
}

/**
 * Run the live odds refresher continuously
 */
async function runLiveRefresher() {
  console.log(`Starting live odds refresher with ${refreshInterval/1000}s intervals (${refreshInterval/1000/60} minutes)`);
  console.log(`Monitoring bookmakers: ${bookmakers.join(', ')}`);
  console.log(`Using ODDS API key: ${process.env.ODDS_API_KEY || '24941339955c373fe2eced8f5c5a0f88'}`);
  console.log(`API call protection interval: ${MIN_API_CALL_INTERVAL/1000/60} minutes`);
  
  try {
    // Initial refresh
    await refreshLiveOdds();
    
    // Set up interval for continuous refreshes
    setInterval(async () => {
      try {
        await refreshLiveOdds();
        
        // Print running statistics
        const uptime = Math.floor((Date.now() - startTime) / (1000 * 60)); // minutes
        console.log(`\nRunning for ${uptime} minutes`);
        console.log(`Refreshes: ${totalRefreshes} (${successfulRefreshes} successful, ${totalRefreshes - successfulRefreshes} failed)`);
        console.log(`Success rate: ${((successfulRefreshes / totalRefreshes) * 100).toFixed(1)}%`);
        
        // Show API usage status
        try {
          const countFile = path.join(integration.api.cacheDir, 'api_call_count.json');
          if (fs.existsSync(countFile)) {
            const data = await fs.readFile(countFile, 'utf8');
            const countData = JSON.parse(data);
            console.log(`API calls today: ${countData.count}/${integration.api.dailyLimit}`);
          }
        } catch (error) {
          console.error('Error reading API call count:', error);
        }
      } catch (error) {
        console.error('Error in refresh cycle:', error);
      }
    }, refreshInterval);
    
    console.log('Live odds refresher is running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Fatal error in live odds refresher:', error);
    process.exit(1);
  }
}

// Run the live refresher
runLiveRefresher().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
}); 