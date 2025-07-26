import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

// Constants
const SERVER_URL = 'http://localhost:3001';
const TIMEOUT_MS = 10000; // 10 seconds

async function testRealOddsAPI() {
  console.log('Testing Real Odds API...');
  console.log('======================\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${SERVER_URL}/health`, { timeout: TIMEOUT_MS });
    console.log('Health endpoint response:', healthResponse.data);
    console.log('✅ Health check passed\n');
    
    // Test all odds endpoint
    console.log('2. Testing /api/odds endpoint...');
    const oddsResponse = await axios.get(`${SERVER_URL}/api/odds`, { timeout: TIMEOUT_MS });
    const allOdds = oddsResponse.data;
    
    if (!Array.isArray(allOdds)) {
      throw new Error('Expected array of odds but received: ' + typeof allOdds);
    }
    
    console.log(`Retrieved ${allOdds.length} events`);
    
    if (allOdds.length > 0) {
      console.log('Sample event:', JSON.stringify(allOdds[0], null, 2));
      console.log('✅ All odds endpoint passed\n');
    } else {
      console.log('⚠️ Warning: No odds data returned, but endpoint works\n');
    }
    
    // Test bookmaker-specific endpoint
    const bookmaker = '1xbet';
    console.log(`3. Testing /api/odds/${bookmaker} endpoint...`);
    const bookmakerResponse = await axios.get(`${SERVER_URL}/api/odds/${bookmaker}`, { timeout: TIMEOUT_MS });
    const bookmakerOdds = bookmakerResponse.data;
    
    if (!Array.isArray(bookmakerOdds)) {
      throw new Error(`Expected array of odds for ${bookmaker} but received: ${typeof bookmakerOdds}`);
    }
    
    console.log(`Retrieved ${bookmakerOdds.length} events for ${bookmaker}`);
    
    if (bookmakerOdds.length > 0) {
      console.log(`Sample ${bookmaker} event:`, JSON.stringify(bookmakerOdds[0], null, 2));
      console.log(`✅ ${bookmaker} odds endpoint passed\n`);
    } else {
      console.log(`⚠️ Warning: No ${bookmaker} odds data returned, but endpoint works\n`);
    }
    
    // Test live odds endpoint
    console.log('4. Testing /api/live-odds endpoint...');
    try {
      const liveResponse = await axios.get(`${SERVER_URL}/api/live-odds`, { timeout: TIMEOUT_MS });
      const liveOdds = liveResponse.data;
      
      if (!Array.isArray(liveOdds)) {
        throw new Error('Expected array of live odds but received: ' + typeof liveOdds);
      }
      
      console.log(`Retrieved ${liveOdds.length} live events`);
      
      if (liveOdds.length > 0) {
        console.log('Sample live event:', JSON.stringify(liveOdds[0], null, 2));
        console.log('✅ Live odds endpoint passed\n');
      } else {
        console.log('⚠️ Warning: No live odds data returned, but endpoint works\n');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('⚠️ Live odds endpoint returned 404 - This is OK if there are no live events currently\n');
      } else {
        throw error;
      }
    }
    
    console.log('All tests completed successfully!');
    console.log('The Real Odds API is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Is the server running?');
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('\nTroubleshooting tips:');
    console.error('1. Make sure the server is running (node real-odds-server.js)');
    console.error('2. Check that your .env file has a valid ODDS_API_KEY');
    console.error('3. Ensure you have run node fetch-real-odds.js all to fetch initial data');
    process.exit(1);
  }
}

// Run the tests
testRealOddsAPI(); 