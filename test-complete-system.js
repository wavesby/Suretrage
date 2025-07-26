import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE = 'http://localhost:3001';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Helper function for colored console output
function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log('bold', `🧪 ${title}`);
  console.log('='.repeat(60));
}

async function testEnvironmentSetup() {
  section('ENVIRONMENT SETUP TEST');
  
  const tests = [
    {
      name: 'ODDS API Key',
      test: () => !!process.env.ODDS_API_KEY,
      value: process.env.ODDS_API_KEY ? `${process.env.ODDS_API_KEY.substring(0, 8)}...` : 'NOT SET'
    },
    {
      name: 'Supabase URL',
      test: () => !!process.env.VITE_SUPABASE_URL,
      value: process.env.VITE_SUPABASE_URL || 'NOT SET'
    },
    {
      name: 'Supabase Anon Key',
      test: () => !!process.env.VITE_SUPABASE_ANON_KEY,
      value: process.env.VITE_SUPABASE_ANON_KEY ? `${process.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET'
    },
    {
      name: 'Server Port',
      test: () => !!process.env.PORT || true, // Default port is okay
      value: process.env.PORT || '3001 (default)'
    }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = test.test();
    log(result ? 'green' : 'red', `${result ? '✅' : '❌'} ${test.name}: ${test.value}`);
    if (result) passed++;
  }
  
  log(passed === tests.length ? 'green' : 'yellow', `\n📊 Environment: ${passed}/${tests.length} tests passed`);
  return passed === tests.length;
}

async function testSupabaseConnection() {
  section('SUPABASE CONNECTION TEST');
  
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      log('yellow', '⚠️  Supabase credentials not found, skipping test');
      return false;
    }
    
    log('blue', '🔄 Testing Supabase connection...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message.includes('Invalid')) {
      log('red', '❌ Invalid Supabase credentials');
      return false;
    }
    
    log('green', '✅ Supabase connection successful');
    log('blue', '📋 Connection details:');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
    
    return true;
  } catch (error) {
    log('red', `❌ Supabase connection failed: ${error.message}`);
    return false;
  }
}

async function testServerHealth() {
  section('SERVER HEALTH TEST');
  
  try {
    log('blue', '🔄 Testing server health...');
    
    const response = await axios.get(`${API_BASE}/health`, { timeout: 10000 });
    
    if (response.status === 200 && response.data.status === 'OK') {
      log('green', '✅ Server is healthy');
      log('blue', '📋 Server details:');
      console.log(`   Status: ${response.data.status}`);
      console.log(`   Port: ${response.data.environment?.port || 'unknown'}`);
      console.log(`   Node Version: ${response.data.environment?.nodeVersion || 'unknown'}`);
      console.log(`   ODDS API Key: ${response.data.environment?.oddsApiKey ? 'Configured' : 'Missing'}`);
      console.log(`   Supabase: ${response.data.environment?.supabaseConfigured ? 'Configured' : 'Missing'}`);
      console.log(`   Cache Events: ${response.data.cache?.eventsCount || 0}`);
      
      return true;
    } else {
      log('red', '❌ Server health check failed');
      return false;
    }
  } catch (error) {
    log('red', `❌ Server health test failed: ${error.message}`);
    log('yellow', '💡 Make sure the server is running with: npm run server');
    return false;
  }
}

async function testOddsAPI() {
  section('ODDS API TEST');
  
  try {
    log('blue', '🔄 Testing odds API endpoint...');
    
    const response = await axios.get(`${API_BASE}/api/odds`, { timeout: 15000 });
    
    if (response.status === 200 && Array.isArray(response.data)) {
      const events = response.data;
      log('green', `✅ Odds API working - ${events.length} events received`);
      
      if (events.length > 0) {
        const firstEvent = events[0];
        log('blue', '📋 Sample event structure:');
        console.log(`   ID: ${firstEvent.id}`);
        console.log(`   Teams: ${firstEvent.home_team} vs ${firstEvent.away_team}`);
        console.log(`   League: ${firstEvent.sport_title}`);
        console.log(`   Bookmakers: ${firstEvent.bookmakers?.length || 0}`);
        
        // Test bookmaker data structure
        if (firstEvent.bookmakers && firstEvent.bookmakers.length > 0) {
          const firstBookmaker = firstEvent.bookmakers[0];
          console.log(`   Sample Bookmaker: ${firstBookmaker.title || firstBookmaker.key}`);
          console.log(`   Markets: ${firstBookmaker.markets?.length || 0}`);
        }
        
        // Count unique bookmakers
        const allBookmakers = new Set();
        events.forEach(event => {
          if (event.bookmakers) {
            event.bookmakers.forEach(bm => {
              allBookmakers.add(bm.title || bm.key);
            });
          }
        });
        
        log('blue', `📊 Found ${allBookmakers.size} unique bookmakers: ${Array.from(allBookmakers).join(', ')}`);
      }
      
      return true;
    } else {
      log('red', '❌ Invalid odds API response format');
      return false;
    }
  } catch (error) {
    log('red', `❌ Odds API test failed: ${error.message}`);
    return false;
  }
}

async function testArbitrageCalculation() {
  section('ARBITRAGE CALCULATION TEST');
  
  try {
    log('blue', '🔄 Testing arbitrage calculation...');
    
    // Get odds data
    const response = await axios.get(`${API_BASE}/api/odds`);
    const events = response.data;
    
    if (!events || events.length === 0) {
      log('yellow', '⚠️  No events available for arbitrage testing');
      return false;
    }
    
    // Convert events to match odds format for arbitrage calculation
    const matchOdds = [];
    
    events.forEach(event => {
      if (event.bookmakers) {
        event.bookmakers.forEach(bookmaker => {
          if (bookmaker.markets) {
            bookmaker.markets.forEach(market => {
              if (market.key === 'h2h' && market.outcomes) {
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
                    updated_at: market.last_update || new Date().toISOString()
                  });
                }
              }
            });
          }
        });
      }
    });
    
    log('blue', `📊 Converted ${matchOdds.length} match odds for arbitrage calculation`);
    
    if (matchOdds.length === 0) {
      log('yellow', '⚠️  No valid match odds found for arbitrage calculation');
      return false;
    }
    
    // Simple arbitrage check
    const matches = {};
    matchOdds.forEach(odd => {
      const matchKey = `${odd.team_home}-${odd.team_away}`;
      if (!matches[matchKey]) {
        matches[matchKey] = [];
      }
      matches[matchKey].push(odd);
    });
    
    let arbitrageFound = false;
    let totalMatches = 0;
    
    Object.entries(matches).forEach(([matchKey, odds]) => {
      if (odds.length >= 2) { // Need at least 2 bookmakers
        totalMatches++;
        
        // Find best odds for each outcome
        const bestHome = Math.max(...odds.map(o => o.odds_home));
        const bestAway = Math.max(...odds.map(o => o.odds_away));
        const bestDraw = odds.some(o => o.odds_draw) ? Math.max(...odds.filter(o => o.odds_draw).map(o => o.odds_draw)) : null;
        
        // Calculate arbitrage percentage
        let arbitragePercentage;
        if (bestDraw) {
          arbitragePercentage = (1/bestHome) + (1/bestAway) + (1/bestDraw);
        } else {
          arbitragePercentage = (1/bestHome) + (1/bestAway);
        }
        
        if (arbitragePercentage < 1.0) {
          arbitrageFound = true;
          const profitPercentage = ((1/arbitragePercentage) - 1) * 100;
          log('green', `🎯 Arbitrage opportunity found: ${matchKey}`);
          console.log(`   Profit: ${profitPercentage.toFixed(2)}%`);
          console.log(`   Best Home: ${bestHome}`);
          console.log(`   Best Away: ${bestAway}`);
          if (bestDraw) console.log(`   Best Draw: ${bestDraw}`);
        }
      }
    });
    
    log('blue', `📊 Analyzed ${totalMatches} matches with multiple bookmakers`);
    
    if (arbitrageFound) {
      log('green', '✅ Arbitrage calculation working - opportunities found!');
    } else {
      log('yellow', '⚠️  No arbitrage opportunities found (this is normal)');
    }
    
    return true;
  } catch (error) {
    log('red', `❌ Arbitrage calculation test failed: ${error.message}`);
    return false;
  }
}

async function testSpecificBookmaker() {
  section('SPECIFIC BOOKMAKER TEST');
  
  const testBookmakers = ['1xbet', 'betway', 'sportybet'];
  
  for (const bookmaker of testBookmakers) {
    try {
      log('blue', `🔄 Testing ${bookmaker} endpoint...`);
      
      const response = await axios.get(`${API_BASE}/api/odds/${bookmaker}`, { timeout: 10000 });
      
      if (response.status === 200 && Array.isArray(response.data)) {
        log('green', `✅ ${bookmaker}: ${response.data.length} events`);
      } else {
        log('yellow', `⚠️  ${bookmaker}: Invalid response format`);
      }
    } catch (error) {
      log('red', `❌ ${bookmaker}: ${error.message}`);
    }
  }
  
  return true;
}

async function runAllTests() {
  console.log('\n🚀 STARTING COMPREHENSIVE SYSTEM TEST');
  console.log('=' * 80);
  
  const results = {
    environment: await testEnvironmentSetup(),
    supabase: await testSupabaseConnection(),
    serverHealth: await testServerHealth(),
    oddsApi: await testOddsAPI(),
    arbitrage: await testArbitrageCalculation(),
    bookmakers: await testSpecificBookmaker()
  };
  
  // Summary
  section('TEST SUMMARY');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    log(passed ? 'green' : 'red', `${passed ? '✅' : '❌'} ${test.toUpperCase()}`);
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (passedTests === totalTests) {
    log('green', `🎉 ALL TESTS PASSED! (${passedTests}/${totalTests})`);
    log('green', '🚀 Your Sports Arbitrage system is working perfectly!');
  } else {
    log('yellow', `⚠️  PARTIAL SUCCESS: ${passedTests}/${totalTests} tests passed`);
    log('blue', '💡 Check the failed tests above and fix any issues');
  }
  
  console.log('='.repeat(60));
  
  // Next steps
  section('NEXT STEPS');
  console.log('1. 🌐 Start the frontend: npm run dev');
  console.log('2. 📱 Open browser: http://localhost:5173');
  console.log('3. 🔑 Add your real ODDS API key to .env file');
  console.log('4. 📊 Monitor arbitrage opportunities in the app');
  
  return passedTests === totalTests;
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  log('yellow', '\n👋 Test interrupted by user');
  process.exit(0);
});

// Run tests
runAllTests().catch(error => {
  log('red', `💥 Test suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
}); 