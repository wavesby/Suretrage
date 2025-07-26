#!/usr/bin/env node

/**
 * Test script for SportyBet API endpoint
 * This script verifies that the enhanced-sportybet-scraper.js is working correctly
 * and that the API endpoint is returning valid data.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}=====================================================`);
console.log(`${colors.green}${colors.bright}=== SportyBet API Test Script ===${colors.reset}`);
console.log(`${colors.blue}=====================================================\n${colors.reset}`);

// Check if server is running
function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/health',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            resolve(health);
          } catch (e) {
            reject(new Error(`Invalid health response: ${e.message}`));
          }
        });
      } else {
        reject(new Error(`Server returned status code ${res.statusCode}`));
      }
    });

    req.on('error', reject);
    req.end();
  });
}

// Get SportyBet odds from API
function getSportyBetOdds() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/odds/sportybet',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const odds = JSON.parse(data);
            resolve(odds);
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${e.message}`));
          }
        } else {
          reject(new Error(`API returned status code ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Check if cache file exists
function checkCacheFile() {
  const cachePath = path.join(__dirname, 'cache', 'sportybet_odds.json');
  
  if (fs.existsSync(cachePath)) {
    try {
      const stats = fs.statSync(cachePath);
      const cacheAge = Date.now() - stats.mtimeMs;
      const ageMinutes = Math.floor(cacheAge / 60000);
      
      console.log(`${colors.green}✓ Cache file exists${colors.reset}`);
      console.log(`  - Last modified: ${new Date(stats.mtimeMs).toLocaleString()}`);
      console.log(`  - Age: ${ageMinutes} minutes old`);
      
      // Parse the cache file
      const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      
      if (Array.isArray(cacheData)) {
        console.log(`  - Contains: ${cacheData.length} matches`);
        return { exists: true, age: ageMinutes, count: cacheData.length, data: cacheData };
      } else if (cacheData.data && Array.isArray(cacheData.data)) {
        console.log(`  - Contains: ${cacheData.data.length} matches`);
        return { exists: true, age: ageMinutes, count: cacheData.data.length, data: cacheData.data };
      } else {
        console.log(`${colors.yellow}⚠ Cache file has invalid format${colors.reset}`);
        return { exists: true, age: ageMinutes, count: 0, data: null };
      }
    } catch (e) {
      console.log(`${colors.yellow}⚠ Error reading cache file: ${e.message}${colors.reset}`);
      return { exists: true, error: e.message };
    }
  } else {
    console.log(`${colors.yellow}⚠ Cache file does not exist${colors.reset}`);
    return { exists: false };
  }
}

// Main function
async function main() {
  try {
    // Step 1: Check cache file
    console.log(`${colors.bright}Checking cache file...${colors.reset}`);
    const cacheStatus = checkCacheFile();
    console.log();
    
    // Step 2: Check if server is running
    console.log(`${colors.bright}Checking server status...${colors.reset}`);
    try {
      const health = await checkServer();
      console.log(`${colors.green}✓ Server is running${colors.reset}`);
      console.log(`  - Uptime: ${Math.floor(health.uptime / 60)} minutes`);
    } catch (e) {
      console.log(`${colors.red}✗ Server is not running: ${e.message}${colors.reset}`);
      console.log('  - Starting server...');
      
      // Attempt to start the server
      try {
        execSync('node server.js > server.log 2>&1 &');
        console.log(`${colors.green}✓ Server started${colors.reset}`);
        
        // Wait for server to be ready
        console.log('  - Waiting for server to be ready...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (startError) {
        console.log(`${colors.red}✗ Failed to start server: ${startError.message}${colors.reset}`);
        return;
      }
    }
    console.log();
    
    // Step 3: Fetch odds from API
    console.log(`${colors.bright}Fetching SportyBet odds from API...${colors.reset}`);
    try {
      const odds = await getSportyBetOdds();
      
      if (Array.isArray(odds) && odds.length > 0) {
        console.log(`${colors.green}✓ Successfully received ${odds.length} matches${colors.reset}`);
        
        // Check data quality
        let homeTeamMissing = 0;
        let awayTeamMissing = 0;
        let oddsMissing = 0;
        let dateMissing = 0;
        
        odds.forEach(match => {
          if (!match.home_team && !match.team_home) homeTeamMissing++;
          if (!match.away_team && !match.team_away) awayTeamMissing++;
          if (!match.odds_home || !match.odds_draw || !match.odds_away) oddsMissing++;
          if (!match.match_time) dateMissing++;
        });
        
        // Report data quality
        console.log('  - Data quality check:');
        if (homeTeamMissing === 0 && awayTeamMissing === 0 && oddsMissing === 0 && dateMissing === 0) {
          console.log(`    ${colors.green}✓ All data fields are present${colors.reset}`);
        } else {
          console.log(`    ${colors.yellow}⚠ Some data fields are missing:${colors.reset}`);
          if (homeTeamMissing > 0) console.log(`      - Missing home teams: ${homeTeamMissing}`);
          if (awayTeamMissing > 0) console.log(`      - Missing away teams: ${awayTeamMissing}`);
          if (oddsMissing > 0) console.log(`      - Missing odds: ${oddsMissing}`);
          if (dateMissing > 0) console.log(`      - Missing dates: ${dateMissing}`);
        }
        
        // Display sample matches
        console.log('\n  - Sample matches:');
        odds.slice(0, 5).forEach((match, i) => {
          const home = match.home_team || match.team_home || 'Unknown';
          const away = match.away_team || match.team_away || 'Unknown';
          const league = match.league || 'Unknown';
          const time = match.match_time || 'Unknown';
          const odds = `${match.odds_home || '?'}-${match.odds_draw || '?'}-${match.odds_away || '?'}`;
          
          console.log(`    ${i+1}. ${home} vs ${away} | ${league} | ${time} | Odds: ${odds}`);
        });
      } else {
        console.log(`${colors.red}✗ API returned empty or invalid data${colors.reset}`);
      }
    } catch (e) {
      console.log(`${colors.red}✗ Failed to fetch odds: ${e.message}${colors.reset}`);
    }
    
    console.log(`\n${colors.blue}=====================================================`);
    console.log(`${colors.green}${colors.bright}=== Test Completed ===${colors.reset}`);
    console.log(`${colors.blue}=====================================================\n${colors.reset}`);
    
  } catch (e) {
    console.error(`${colors.red}Error: ${e.message}${colors.reset}`);
  }
}

main().catch(console.error); 