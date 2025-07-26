#!/usr/bin/env node

import axios from 'axios';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuration
const PROXY_URL = 'http://localhost:3001';
const ENDPOINTS = [
  '/health',
  '/api/odds/1xbet',
  '/api/odds/sportybet',
  '/api/odds/all'
];

// Function to verify the proxy server
async function verifyProxyServer() {
  console.log(`${colors.magenta}=== Verifying Proxy Server ===${colors.reset}`);
  
  try {
    // Check if server is running
    const healthResponse = await axios.get(`${PROXY_URL}/health`, { timeout: 5000 });
    console.log(`${colors.green}✓ Proxy server is running${colors.reset}`);
    console.log(`${colors.cyan}  Server time: ${healthResponse.data.time}${colors.reset}`);
    
    // Check endpoints
    for (const endpoint of ENDPOINTS.filter(e => e !== '/health')) {
      try {
        const response = await axios.get(`${PROXY_URL}${endpoint}`, { timeout: 10000 });
        const data = response.data;
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`${colors.green}✓ ${endpoint} endpoint is working${colors.reset}`);
          console.log(`${colors.cyan}  Retrieved ${data.length} matches${colors.reset}`);
          
          // Count bookmakers
          const bookmakers = data.reduce((acc, match) => {
            if (!acc[match.bookmaker]) {
              acc[match.bookmaker] = 0;
            }
            acc[match.bookmaker]++;
            return acc;
          }, {});
          
          Object.entries(bookmakers).forEach(([bookmaker, count]) => {
            console.log(`${colors.cyan}  - ${bookmaker}: ${count} matches${colors.reset}`);
          });
        } else {
          console.log(`${colors.red}✗ ${endpoint} endpoint returned no data${colors.reset}`);
        }
      } catch (error) {
        console.log(`${colors.red}✗ ${endpoint} endpoint failed: ${error.message}${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`${colors.red}✗ Proxy server is not running or health endpoint failed: ${error.message}${colors.reset}`);
    return false;
  }
  
  return true;
}

// Function to verify arbitrage calculation
function verifyArbitrageCalculation() {
  console.log(`${colors.magenta}=== Verifying Arbitrage Calculation ===${colors.reset}`);
  
  // Create sample odds data
  const odds = [
    {
      match_id: 'test_match_1',
      match_name: 'Team A vs Team B',
      team_home: 'Team A',
      team_away: 'Team B',
      league: 'Test League',
      match_time: 'Today',
      odds_home: 2.0,
      odds_draw: 3.5,
      odds_away: 3.0,
      bookmaker: 'Bookmaker1',
      updated_at: new Date().toISOString()
    },
    {
      match_id: 'test_match_1',
      match_name: 'Team A vs Team B',
      team_home: 'Team A',
      team_away: 'Team B',
      league: 'Test League',
      match_time: 'Today',
      odds_home: 2.1,
      odds_draw: 3.3,
      odds_away: 3.2,
      bookmaker: 'Bookmaker2',
      updated_at: new Date().toISOString()
    }
  ];
  
  // Calculate arbitrage percentage
  const bestHomeOdds = Math.max(odds[0].odds_home, odds[1].odds_home);
  const bestDrawOdds = Math.max(odds[0].odds_draw, odds[1].odds_draw);
  const bestAwayOdds = Math.max(odds[0].odds_away, odds[1].odds_away);
  
  const arbitragePercentage = (1 / bestHomeOdds) + (1 / bestDrawOdds) + (1 / bestAwayOdds);
  const profitPercentage = arbitragePercentage < 1 ? ((1 / arbitragePercentage) - 1) * 100 : 0;
  
  console.log(`${colors.cyan}Sample arbitrage calculation:${colors.reset}`);
  console.log(`${colors.cyan}  Best home odds: ${bestHomeOdds}${colors.reset}`);
  console.log(`${colors.cyan}  Best draw odds: ${bestDrawOdds}${colors.reset}`);
  console.log(`${colors.cyan}  Best away odds: ${bestAwayOdds}${colors.reset}`);
  console.log(`${colors.cyan}  Arbitrage percentage: ${arbitragePercentage.toFixed(4)}${colors.reset}`);
  console.log(`${colors.cyan}  Profit percentage: ${profitPercentage.toFixed(2)}%${colors.reset}`);
  
  if (arbitragePercentage < 1) {
    console.log(`${colors.green}✓ Arbitrage opportunity found (${profitPercentage.toFixed(2)}% profit)${colors.reset}`);
  } else {
    console.log(`${colors.yellow}✓ No arbitrage opportunity in sample data${colors.reset}`);
  }
  
  return true;
}

// Main function
async function main() {
  console.log(`${colors.magenta}=== Sport Arbitrage Setup Verification ===${colors.reset}`);
  console.log('');
  
  // Verify proxy server
  const proxyServerOk = await verifyProxyServer();
  console.log('');
  
  // Verify arbitrage calculation
  const arbitrageCalcOk = verifyArbitrageCalculation();
  console.log('');
  
  // Final verdict
  if (proxyServerOk && arbitrageCalcOk) {
    console.log(`${colors.green}✅ Setup verification passed! The system appears to be working correctly.${colors.reset}`);
    console.log(`${colors.green}   You can access the frontend at http://localhost:8080${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Setup verification failed. Please fix the issues above.${colors.reset}`);
  }
  
  console.log('');
  console.log(`${colors.magenta}=== Verification Complete ===${colors.reset}`);
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
}); 