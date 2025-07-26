import * as dotenv from 'dotenv';
dotenv.config();
import OddsApiIntegration from './odds-api-integration.js';

async function main() {
  // Check for API key
  if (!process.env.ODDS_API_KEY) {
    console.error('ERROR: No API key found. Please add ODDS_API_KEY to your .env file.');
    console.log('You can get an API key from https://the-odds-api.com/');
    process.exit(1);
  }
  
  // Initialize the integration
  const integration = new OddsApiIntegration();
  
  // Command line args
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  
  switch (command) {
    case 'sports':
      // Get all available sports
      console.log('Fetching all available sports...');
      await integration.fetchAndSaveSports();
      break;
      
    case 'odds':
      // Get odds for all target sports
      console.log('Fetching odds for target sports...');
      await integration.fetchAllOdds();
      break;
      
    case 'bookmakers':
      // Get odds for specific bookmakers
      console.log('Fetching odds for specified bookmakers...');
      const bookmakersList = args.slice(1).length > 0 ? args.slice(1) : ['1xbet', 'sportybet'];
      console.log(`Target bookmakers: ${bookmakersList.join(', ')}`);
      
      const bookmakerOddsData = await integration.getOddsForBookmakers(bookmakersList);
      await integration.saveArbitrageData(bookmakerOddsData);
      break;
      
    case 'arbitrage':
      // Prepare data for arbitrage detection
      console.log('Preparing data for arbitrage detection...');
      
      // First, fetch fresh odds for all bookmakers
      const targetBookmakers = args.slice(1).length > 0 ? args.slice(1) : ['1xbet', 'sportybet'];
      console.log(`Target bookmakers: ${targetBookmakers.join(', ')}`);
      
      const arbitrageOddsData = await integration.getOddsForBookmakers(targetBookmakers);
      const arbitrageData = await integration.saveArbitrageData(arbitrageOddsData);
      
      // Display a summary of the data
      console.log('\n===== Arbitrage Data Summary =====');
      console.log(`Total events: ${arbitrageData.length}`);
      
      // Count events by sport
      const sportCounts = {};
      arbitrageData.forEach(event => {
        const sport = event.sport;
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;
      });
      
      console.log('\nEvents by sport:');
      Object.entries(sportCounts).forEach(([sport, count]) => {
        console.log(`- ${sport}: ${count} events`);
      });
      
      break;
      
    case 'help':
    default:
      console.log(`
Usage: node run-odds-api.js [command] [options]

Commands:
  sports               Fetch and save all available sports
  odds                 Fetch odds for all target sports
  bookmakers [names]   Fetch odds for specified bookmakers (defaults to 1xbet,sportybet)
  arbitrage [names]    Prepare arbitrage data for specified bookmakers (defaults to 1xbet,sportybet)
  help                 Show this help message

Examples:
  node run-odds-api.js sports
  node run-odds-api.js odds
  node run-odds-api.js bookmakers 1xbet sportybet betway
  node run-odds-api.js arbitrage 1xbet sportybet
      `);
      break;
  }
}

main().catch(console.error); 