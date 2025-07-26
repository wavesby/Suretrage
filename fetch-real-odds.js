import RealOddsApiManager from './real-odds-api-manager.js';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  try {
    console.log('Real Odds API Manager - Fetching only real data from The Odds API');
    
    // Verify environment
    if (!process.env.ODDS_API_KEY) {
      console.error('ERROR: No API key found. Please add ODDS_API_KEY to your .env file.');
      console.log('You can get an API key from https://the-odds-api.com/');
      process.exit(1);
    }
    
    // Create the manager
    const manager = new RealOddsApiManager();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'all';
    const forceRefresh = args.includes('--force') || args.includes('-f');
    
    // Execute the requested command
    switch (command.toLowerCase()) {
      case 'prematch':
      case 'pre':
      case 'odds':
        console.log('Fetching pre-match odds data...');
        const preMatchData = await manager.fetchFreshOddsData();
        console.log(`Processed ${preMatchData ? preMatchData.length : 0} pre-match events`);
        break;
        
      case 'live':
        console.log('Fetching live odds data...');
        const liveData = await manager.fetchFreshLiveOddsData();
        console.log(`Processed ${liveData ? liveData.length : 0} live events`);
        break;
        
      case 'all':
      case 'both':
        console.log('Refreshing all odds data...');
        const allData = await manager.refreshAllOdds(forceRefresh);
        console.log('Results:');
        console.log(` - ${allData.live.length} live events`);
        console.log(` - ${allData.preMatch.length} pre-match events`);
        console.log(` - ${allData.combined.length} total events`);
        break;
        
      case 'help':
      default:
        showHelp();
        break;
    }
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Error running Real Odds API Manager:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
Usage: node fetch-real-odds.js [command] [options]

Commands:
  prematch, pre, odds   Fetch pre-match odds data
  live                  Fetch live odds data
  all, both             Fetch both pre-match and live odds (default)
  help                  Show this help message

Options:
  --force, -f           Force refresh regardless of cache

Examples:
  node fetch-real-odds.js                  # Fetch all odds data
  node fetch-real-odds.js prematch         # Fetch only pre-match odds
  node fetch-real-odds.js live             # Fetch only live odds
  node fetch-real-odds.js all --force      # Force refresh all odds data
  `);
}

main().catch(console.error); 