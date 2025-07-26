import OddsApiIntegration from './odds-api-integration.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default Nigerian bookmakers to prioritize
const DEFAULT_BOOKMAKERS = ['1xbet', 'betway', 'sportybet'];

// Command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'all';
const bookmakers = args.slice(1).length > 0 ? args.slice(1) : DEFAULT_BOOKMAKERS;

// This script automatically refreshes odds data from The Odds API
async function refreshOddsData(options = {}) {
  const {
    liveOnly = false,
    forceRefresh = false,
    selectedBookmakers = DEFAULT_BOOKMAKERS
  } = options;
  
  console.log(`Starting odds data refresh from The Odds API...`);
  if (liveOnly) console.log('Fetching LIVE odds only');
  if (forceRefresh) console.log('Force refresh enabled');
  console.log(`Selected bookmakers: ${selectedBookmakers.join(', ')}`);
  
  try {
    // Create an instance of the OddsApiIntegration
    const integration = new OddsApiIntegration();
    
    // Make sure target directories exist
    const dataDir = path.join(__dirname, 'odds-data');
    const publicDir = path.join(__dirname, 'public', 'api');
    
    try {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.mkdir(publicDir, { recursive: true });
    } catch (err) {
      console.error('Error creating directories:', err);
    }
    
    // Fetch the appropriate data
    let arbitrageData;
    
    if (liveOnly) {
      console.log('Fetching live odds data only...');
      const liveOddsData = await integration.getLiveOddsForBookmakers(selectedBookmakers);
      arbitrageData = await integration.saveArbitrageData(liveOddsData, true);
    } else {
      console.log('Refreshing all odds data (live and pre-match)...');
      const results = await integration.refreshAllOdds(selectedBookmakers, forceRefresh);
      arbitrageData = results.combined;
    }
    
    // Save the data to a file that will be accessible to the frontend
    const publicFilePath = path.join(publicDir, liveOnly ? 'live-odds-data.json' : 'odds-data.json');
    await fs.writeFile(publicFilePath, JSON.stringify(arbitrageData, null, 2), 'utf-8');
    
    console.log(`Saved ${liveOnly ? 'live ' : ''}odds data to ${publicFilePath}`);
    console.log(`Total events: ${arbitrageData.length}`);
    
    // Display summary by sport and bookmaker
    const sportCounts = {};
    const bookmakerCounts = {};
    const liveCount = arbitrageData.filter(event => event.isLive).length;
    
    arbitrageData.forEach(event => {
      // Count by sport/league
      const league = event.league;
      sportCounts[league] = (sportCounts[league] || 0) + 1;
      
      // Count by bookmaker
      const bookmaker = event.bookmaker;
      bookmakerCounts[bookmaker] = (bookmakerCounts[bookmaker] || 0) + 1;
    });
    
    console.log('\nEvents by sport/league:');
    Object.entries(sportCounts)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .forEach(([sport, count]) => {
      console.log(`- ${sport}: ${count} events`);
    });
    
    console.log('\nEvents by bookmaker:');
    Object.entries(bookmakerCounts)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .forEach(([bookmaker, count]) => {
        console.log(`- ${bookmaker}: ${count} events`);
      });
      
    console.log(`\nLive events: ${liveCount} (${((liveCount / arbitrageData.length) * 100).toFixed(1)}%)`);
    
    return true;
  } catch (error) {
    console.error('Error refreshing odds data:', error);
    return false;
  }
}

// Process command line arguments to determine what to do
async function main() {
  switch (command) {
    case 'live':
      // Refresh live odds only
      await refreshOddsData({
        liveOnly: true,
        forceRefresh: true,
        selectedBookmakers: bookmakers
      });
      break;
      
    case 'force':
      // Force refresh all odds
      await refreshOddsData({
        liveOnly: false,
        forceRefresh: true,
        selectedBookmakers: bookmakers
      });
      break;
      
    case 'bookmakers':
      // Refresh for specific bookmakers
      await refreshOddsData({
        liveOnly: false,
        forceRefresh: false,
        selectedBookmakers: args.slice(1)
      });
      break;
      
    case 'all':
    default:
      // Regular refresh using cache when available
      await refreshOddsData({
        liveOnly: false,
        forceRefresh: false,
        selectedBookmakers: bookmakers
      });
      break;
  }
}

// Execute the script
main().then(() => {
  console.log('Odds data refresh completed');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 