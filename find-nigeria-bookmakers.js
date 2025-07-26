import * as dotenv from 'dotenv';
dotenv.config();
import OddsApiProvider from './odds-api-provider.js';

// List of bookmakers we're targeting in Nigeria
const targetBookmakers = [
  '1xbet', '1x', '1xBet', 
  'sportybet', 'sporty', 'SportyBet',
  'bet9ja', 'bet9', 
  'betking', 
  'nairabet', 
  'betway', 
  'bangbet', 
  'parimatch'
];

// Common words/patterns in Nigerian bookmaker names
const nigerianPatterns = [
  'africa', 'nigeria', 'naija', 'ng', '9ja'
];

async function findNigerianBookmakers() {
  console.log('Searching for Nigerian bookmakers in The Odds API...');
  const api = new OddsApiProvider();
  
  // Get all sports
  const sports = await api.getSports();
  if (!sports || sports.length === 0) {
    console.log('No sports found. Check your API key.');
    return;
  }
  
  console.log(`Found ${sports.length} sports.`);
  
  // Popular sports in Nigeria
  const popularSports = [
    { name: 'Soccer', keys: sports.filter(s => s.group === 'Soccer').map(s => s.key) },
    { name: 'Basketball', keys: sports.filter(s => s.group === 'Basketball').map(s => s.key) }
  ];
  
  console.log('\nAnalyzing popular sports in Nigeria:');
  const allBookmakers = new Set();
  const potentialNigerianBookmakers = new Set();
  
  // Check each sport category
  for (const sport of popularSports) {
    console.log(`\n===== ${sport.name} =====`);
    
    // For each sport key, get sample of bookmakers
    for (const sportKey of sport.keys.slice(0, 3)) { // Limit to first 3 to avoid excessive API calls
      console.log(`\nChecking ${sportKey}...`);
      
      try {
        // Get all bookmakers for this sport
        const bookmakers = await api.listBookmakers(sportKey);
        
        if (bookmakers && bookmakers.length > 0) {
          console.log(`Found ${bookmakers.length} bookmakers for ${sportKey}`);
          
          // Add all bookmakers to our overall set
          bookmakers.forEach(bm => {
            allBookmakers.add(JSON.stringify(bm));
            
            // Check if this might be a Nigerian bookmaker
            const bmKey = bm.key.toLowerCase();
            const bmName = bm.name.toLowerCase();
            
            const isTarget = targetBookmakers.some(target => 
              bmKey.includes(target.toLowerCase()) || 
              bmName.includes(target.toLowerCase())
            );
            
            const hasNigerianPattern = nigerianPatterns.some(pattern => 
              bmKey.includes(pattern) || 
              bmName.includes(pattern)
            );
            
            if (isTarget || hasNigerianPattern) {
              potentialNigerianBookmakers.add(JSON.stringify(bm));
            }
          });
        } else {
          console.log(`No bookmakers found for ${sportKey}`);
        }
      } catch (error) {
        console.error(`Error processing ${sportKey}:`, error.message);
      }
    }
  }
  
  // Display results
  console.log('\n===== RESULTS =====');
  console.log(`Total unique bookmakers found: ${allBookmakers.size}`);
  
  console.log('\nAll available bookmakers:');
  Array.from(allBookmakers)
    .map(bm => JSON.parse(bm))
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(bm => {
      console.log(`- ${bm.name} (key: ${bm.key})`);
    });
  
  console.log('\nPotential Nigerian bookmakers:');
  const nigerianBookies = Array.from(potentialNigerianBookmakers)
    .map(bm => JSON.parse(bm))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  if (nigerianBookies.length > 0) {
    nigerianBookies.forEach(bm => {
      console.log(`- ${bm.name} (key: ${bm.key})`);
    });
  } else {
    console.log('No Nigerian bookmakers found directly.');
    console.log('You may need to map your target bookmakers to the ones available in the API.');
  }
}

findNigerianBookmakers().catch(console.error); 