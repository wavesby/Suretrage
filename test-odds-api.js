import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

// You'll need to add your API key to .env file
const API_KEY = process.env.ODDS_API_KEY || 'YOUR_API_KEY';
const BASE_URL = 'https://api.the-odds-api.com/v4';

async function listAllSports() {
  try {
    const response = await axios.get(`${BASE_URL}/sports`, {
      params: {
        apiKey: API_KEY,
        all: true // Get both in and out of season sports
      }
    });
    
    console.log('Sports list:');
    console.log(JSON.stringify(response.data, null, 2));
    logApiUsage(response);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching sports:', error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
  }
}

async function getOddsForSport(sportKey) {
  try {
    // Using 'eu' region to potentially get more global bookmakers
    const regions = ['eu', 'uk']; 
    const response = await axios.get(`${BASE_URL}/sports/${sportKey}/odds`, {
      params: {
        apiKey: API_KEY,
        regions: regions.join(','),
        markets: 'h2h', // Head to head / moneyline odds
        oddsFormat: 'decimal'
      }
    });
    
    console.log(`Odds for ${sportKey}:`);
    
    // Extract unique bookmakers
    const bookmakers = new Set();
    response.data.forEach(event => {
      event.bookmakers.forEach(bookie => {
        bookmakers.add(bookie.key);
      });
    });
    
    console.log('Available bookmakers:', Array.from(bookmakers));
    console.log(`Total events: ${response.data.length}`);
    console.log('Sample event:', JSON.stringify(response.data[0], null, 2));
    
    logApiUsage(response);
    return response.data;
  } catch (error) {
    console.error(`Error fetching odds for ${sportKey}:`, error.message);
    if (error.response) {
      console.error('API response:', error.response.data);
    }
  }
}

function logApiUsage(response) {
  console.log('\nAPI Usage:');
  console.log('Requests remaining:', response.headers['x-requests-remaining']);
  console.log('Requests used:', response.headers['x-requests-used']);
  console.log('Last request cost:', response.headers['x-requests-last']);
}

async function main() {
  // Step 1: Get all sports
  const sports = await listAllSports();
  
  if (!sports) return;
  
  // Step 2: Find soccer sport keys (most popular in Nigeria)
  const soccerSports = sports.filter(sport => sport.group === 'Soccer');
  console.log('\nSoccer leagues available:');
  soccerSports.forEach(sport => {
    console.log(`- ${sport.title}: ${sport.key}`);
  });
  
  // Step 3: Get odds for a popular soccer league (Premier League)
  const soccerKey = soccerSports.find(sport => sport.key.includes('epl') || sport.key.includes('premier'))?.key;
  if (soccerKey) {
    await getOddsForSport(soccerKey);
  }
}

main().catch(console.error); 