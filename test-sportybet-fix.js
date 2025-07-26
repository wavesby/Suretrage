import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API URL
const API_URL = 'http://localhost:3001';

// Function to test the SportyBet API endpoint
async function testSportyBetAPI() {
  console.log('Testing SportyBet API endpoint...');
  
  try {
    const response = await axios.get(`${API_URL}/api/odds/sportybet`);
    const data = response.data;
    
    if (!Array.isArray(data)) {
      console.error('API did not return an array');
      return;
    }
    
    console.log(`Received ${data.length} matches from SportyBet API`);
    
    // Check for ID prefixes
    const idPrefixMatches = data.filter(match => 
      match.home_team.includes('ID:') || 
      match.away_team.includes('ID:') || 
      match.match_name.includes('ID:'));
      
    console.log(`Matches with ID prefixes: ${idPrefixMatches.length}`);
    
    // Check for duplicate team names (home == away)
    const duplicateTeams = data.filter(match => 
      match.home_team === match.away_team);
      
    console.log(`Matches with duplicate teams: ${duplicateTeams.length}`);
    
    // Check for year in match time
    const missingYear = data.filter(match => 
      !match.match_time.toString().match(/\b20\d{2}\b/));
      
    console.log(`Matches missing year in match_time: ${missingYear.length}`);
    
    // Save the data for inspection
    const outputPath = path.join(__dirname, 'api-odds-sportybet.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Saved API response to ${outputPath}`);
    
    // Print first 5 matches
    console.log('\n--- First 5 Matches ---');
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const match = data[i];
      console.log(`Match ${i+1}:`);
      console.log(`  Match Name: ${match.match_name}`);
      console.log(`  Home Team: ${match.home_team}`);
      console.log(`  Away Team: ${match.away_team}`);
      console.log(`  League: ${match.league}`);
      console.log(`  Match Time: ${match.match_time}`);
      console.log(`  Odds: ${match.odds_home} | ${match.odds_draw} | ${match.odds_away}`);
      console.log(`  Updated At: ${match.updated_at}`);
      console.log('-------------------');
    }
    
    return data;
  } catch (error) {
    console.error(`Error testing SportyBet API: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

// Function to test the All Odds API endpoint
async function testAllOddsAPI() {
  console.log('\nTesting All Odds API endpoint...');
  
  try {
    const response = await axios.get(`${API_URL}/api/odds/all`);
    const data = response.data;
    
    if (!Array.isArray(data)) {
      console.error('API did not return an array');
      return;
    }
    
    console.log(`Received ${data.length} matches from All Odds API`);
    
    // Filter by bookmaker
    const sportyBetOdds = data.filter(match => match.bookmaker === 'SportyBet');
    console.log(`SportyBet matches: ${sportyBetOdds.length}`);
    
    // Check for ID prefixes in SportyBet data
    const idPrefixMatches = sportyBetOdds.filter(match => 
      match.home_team.includes('ID:') || 
      match.away_team.includes('ID:') || 
      match.match_name.includes('ID:'));
      
    console.log(`SportyBet matches with ID prefixes: ${idPrefixMatches.length}`);
    
    // Save the data for inspection
    const outputPath = path.join(__dirname, 'api-odds-all.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Saved All Odds API response to ${outputPath}`);
    
    return data;
  } catch (error) {
    console.error(`Error testing All Odds API: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

// Function to create a test report
function createTestReport(sportyBetData, allOddsData) {
  const report = {
    timestamp: new Date().toISOString(),
    sportyBetTest: {
      success: sportyBetData !== null,
      matchCount: sportyBetData ? sportyBetData.length : 0,
      idPrefixCount: sportyBetData ? sportyBetData.filter(match => 
        match.home_team.includes('ID:') || 
        match.away_team.includes('ID:') || 
        match.match_name.includes('ID:')).length : 'N/A',
      duplicateTeamsCount: sportyBetData ? sportyBetData.filter(match => 
        match.home_team === match.away_team).length : 'N/A',
      missingYearCount: sportyBetData ? sportyBetData.filter(match => 
        !match.match_time.toString().match(/\b20\d{2}\b/)).length : 'N/A'
    },
    allOddsTest: {
      success: allOddsData !== null,
      matchCount: allOddsData ? allOddsData.length : 0,
      sportyBetCount: allOddsData ? allOddsData.filter(match => 
        match.bookmaker === 'SportyBet').length : 0,
      sportyBetIdPrefixCount: allOddsData ? allOddsData.filter(match => 
        match.bookmaker === 'SportyBet' && 
        (match.home_team.includes('ID:') || 
         match.away_team.includes('ID:') || 
         match.match_name.includes('ID:'))).length : 'N/A'
    }
  };
  
  // Save the report
  const outputPath = path.join(__dirname, 'api-test-report.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\nTest report saved to ${outputPath}`);
  
  // Print summary
  console.log('\n--- Test Summary ---');
  console.log(`SportyBet API Test: ${report.sportyBetTest.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`All Odds API Test: ${report.allOddsTest.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`SportyBet ID Prefix Issues: ${report.sportyBetTest.idPrefixCount}`);
  console.log(`All Odds SportyBet ID Prefix Issues: ${report.allOddsTest.sportyBetIdPrefixCount}`);
  console.log('-------------------');
}

// Main function
async function main() {
  try {
    // Run the tests
    const sportyBetData = await testSportyBetAPI();
    const allOddsData = await testAllOddsAPI();
    
    // Create test report
    createTestReport(sportyBetData, allOddsData);
  } catch (error) {
    console.error(`Error running tests: ${error.message}`);
  }
}

// Run the main function
main().catch(console.error); 