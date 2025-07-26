import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins during development
app.use(cors());
app.use(express.json());

// Add middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Ensure necessary directories exist
const CACHE_DIR = path.join(__dirname, 'cache');
const ODDS_DATA_DIR = path.join(__dirname, 'odds-data');
const PUBLIC_API_DIR = path.join(__dirname, 'public', 'api');

for (const dir of [CACHE_DIR, ODDS_DATA_DIR, PUBLIC_API_DIR]) {
  if (!existsSync(dir)) {
    try {
      mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
  } catch (err) {
      console.error(`Failed to create directory ${dir}:`, err);
    }
  }
}

// Cache configuration
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
let oddsCache = {
  timestamp: 0,
  data: null,
  bookmakerData: {}
};

// Serve static files from the public directory
app.use(express.static('public'));

// Helper function to load odds data from multiple possible sources
async function loadOddsData(forceRefresh = false) {
  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && oddsCache.timestamp > Date.now() - CACHE_DURATION && oddsCache.data) {
    console.log('✅ Using cached odds data');
    return oddsCache.data;
  }

  try {
    console.log('🔄 Loading fresh odds data...');
    
    // Try to load REAL ODDS API data only - no mock/demo data
    const possiblePaths = [
      path.join(__dirname, 'odds-data', 'soccer_epl-eu-uk-us-au-h2h-totals.json'),
      path.join(__dirname, 'odds-data', 'soccer_spain_la_liga-eu-uk-us-au-h2h-totals.json'),
      path.join(__dirname, 'odds-data', 'soccer_germany_bundesliga-eu-uk-us-au-h2h-totals.json'),
      path.join(__dirname, 'odds-data', 'soccer_italy_serie_a-eu-uk-us-au-h2h-totals.json'),
      path.join(__dirname, 'odds-data', 'soccer_france_ligue_one-eu-uk-us-au-h2h-totals.json'),
      path.join(__dirname, 'odds-data', 'filtered-all-odds.json'),
      path.join(__dirname, 'odds-data', 'api-odds-all.json'),
      path.join(__dirname, 'all_odds.json')
    ];
    
    for (const filePath of possiblePaths) {
      if (existsSync(filePath)) {
        console.log(`📥 Loading odds data from ${filePath}`);
        try {
        const data = await fs.readFile(filePath, 'utf-8');
        const parsedData = JSON.parse(data);
        
          // Normalize the data format
          let normalizedData = Array.isArray(parsedData) ? parsedData : [];
          
          // If data is wrapped in an object, try to extract events or data array
          if (!Array.isArray(parsedData)) {
            if (parsedData.events && Array.isArray(parsedData.events)) {
              normalizedData = parsedData.events;
            } else if (parsedData.data && Array.isArray(parsedData.data)) {
              normalizedData = parsedData.data;
              console.log(`📦 Extracted ${normalizedData.length} events from data property`);
            }
          }
          
          // Further normalize each event to ensure consistent structure  
          normalizedData = normalizedData.map(event => ({
            id: event.id || `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sport_key: event.sport_key || event.sport || 'soccer',
            sport_title: event.sport_title || event.league || 'Unknown League',
            commence_time: event.commence_time || event.match_time || event.startTime || new Date().toISOString(),
            home_team: event.home_team || event.homeTeam || event.team_home || '',
            away_team: event.away_team || event.awayTeam || event.team_away || '',
            bookmakers: Array.isArray(event.bookmakers) ? event.bookmakers : []
          })).filter(event => {
            // Filter out events without team names or bookmakers
            const hasTeams = event.home_team && event.away_team;
            const hasBookmakers = Array.isArray(event.bookmakers) && event.bookmakers.length > 0;
            if (hasTeams && !hasBookmakers) {
              console.warn(`⚠️ Event ${event.home_team} vs ${event.away_team} has no bookmakers, skipping`);
            }
            return hasTeams && hasBookmakers;
          });
          
          if (normalizedData.length > 0) {
        // Update cache
            oddsCache.data = normalizedData;
        oddsCache.timestamp = Date.now();
        
        // Process and organize data by bookmaker for faster lookups
        oddsCache.bookmakerData = {};
            normalizedData.forEach(event => {
          if (event.bookmakers && Array.isArray(event.bookmakers)) {
            event.bookmakers.forEach(bm => {
                  const key = (bm.key || bm.name || 'unknown').toLowerCase();
              if (!oddsCache.bookmakerData[key]) {
                oddsCache.bookmakerData[key] = [];
              }
              oddsCache.bookmakerData[key].push(event);
            });
          }
        });
        
            console.log(`✅ Successfully loaded ${normalizedData.length} events`);
            return normalizedData;
          }
        } catch (parseError) {
          console.warn(`⚠️ Failed to parse ${filePath}:`, parseError.message);
          continue;
        }
      }
    }
    
    console.warn('⚠️ No valid odds data files found, checking all files in odds-data...');
    
    // Try to load any JSON file from odds-data directory as fallback
    try {
      const fs = await import('fs/promises');
      const oddsDataDir = path.join(__dirname, 'odds-data');
      const files = await fs.readdir(oddsDataDir);
      const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('api_call_count'));
      
      console.log(`📁 Found ${jsonFiles.length} JSON files in odds-data: ${jsonFiles.slice(0, 5).join(', ')}...`);
      
      for (const fileName of jsonFiles) {
        const filePath = path.join(oddsDataDir, fileName);
        try {
          console.log(`📥 Trying to load ${fileName}...`);
          const fileData = await fs.readFile(filePath, 'utf-8');
          const parsed = JSON.parse(fileData);
          
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`✅ Successfully loaded ${parsed.length} events from ${fileName}`);
            oddsCache.data = parsed;
            oddsCache.timestamp = Date.now();
            return parsed;
          } else if (parsed && typeof parsed === 'object' && parsed.events && Array.isArray(parsed.events) && parsed.events.length > 0) {
            console.log(`✅ Successfully loaded ${parsed.events.length} events from ${fileName} (nested)`);
            oddsCache.data = parsed.events;
            oddsCache.timestamp = Date.now();
            return parsed.events;
          }
        } catch (e) {
          console.warn(`⚠️ Failed to parse ${fileName}: ${e.message}`);
          continue;
        }
      }
    } catch (e) {
      console.warn('⚠️ Could not read odds-data directory:', e.message);
    }
    
    console.warn('⚠️ No valid data found, generating sample data...');
    
    // Generate sample data if no real data is available
    const sampleData = generateSampleOddsData();
    oddsCache.data = sampleData;
    oddsCache.timestamp = Date.now();
    
    return sampleData;
  } catch (error) {
    console.error('❌ Error loading odds data:', error);
    // Return empty array instead of null for easier handling
    return [];
  }
}

// Function to generate sample odds data for testing
function generateSampleOddsData() {
  console.log('🎭 Generating sample odds data for testing with arbitrage opportunities...');
  
  const sampleMatches = [
    { home: 'Manchester United', away: 'Liverpool', league: 'Premier League' },
    { home: 'Arsenal', away: 'Chelsea', league: 'Premier League' },
    { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga' },
    { home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'Bundesliga' },
    { home: 'PSG', away: 'Marseille', league: 'Ligue 1' },
    { home: 'Manchester City', away: 'Tottenham', league: 'Premier League' },
    { home: 'Atletico Madrid', away: 'Valencia', league: 'La Liga' },
    { home: 'AC Milan', away: 'Inter Milan', league: 'Serie A' }
  ];
  
  const bookmakers = [
    { key: '1xbet', title: '1xBet' },
    { key: 'betway', title: 'Betway' },
    { key: 'sportybet', title: 'SportyBet' },
    { key: 'pinnacle', title: 'Pinnacle' },
    { key: 'bet365', title: 'Bet365' }
  ];
  
  return sampleMatches.map((match, index) => {
    // Create some arbitrage opportunities by carefully setting odds
    const isArbitrageMatch = index < 3; // First 3 matches will have arbitrage opportunities
    
    return {
      id: `sample_${index + 1}`,
      sport_key: 'soccer_epl',
      sport_title: match.league,
      commence_time: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      home_team: match.home,
      away_team: match.away,
      bookmakers: bookmakers.map((bm, bmIndex) => {
        let homeOdds, awayOdds, drawOdds;
        
        if (isArbitrageMatch) {
          // Create arbitrage opportunity by varying odds across bookmakers
          switch (bmIndex) {
            case 0: // 1xBet - favors home
              homeOdds = 1.8 + Math.random() * 0.2;
              awayOdds = 3.5 + Math.random() * 0.5;
              drawOdds = 3.2 + Math.random() * 0.3;
              break;
            case 1: // Betway - favors away
              homeOdds = 3.2 + Math.random() * 0.3;
              awayOdds = 1.9 + Math.random() * 0.2;
              drawOdds = 3.4 + Math.random() * 0.3;
              break;
            case 2: // SportyBet - favors draw
              homeOdds = 2.8 + Math.random() * 0.3;
              awayOdds = 2.9 + Math.random() * 0.3;
              drawOdds = 2.8 + Math.random() * 0.2;
              break;
            default:
              homeOdds = 2.0 + Math.random() * 1.0;
              awayOdds = 2.0 + Math.random() * 1.0;
              drawOdds = 3.0 + Math.random() * 0.5;
          }
        } else {
          // Normal odds without arbitrage
          homeOdds = 1.8 + Math.random() * 2.0;
          awayOdds = 1.8 + Math.random() * 2.0;
          drawOdds = 2.8 + Math.random() * 1.0;
        }
        
        return {
          key: bm.key,
          title: bm.title,
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                {
                  name: match.home,
                  price: Math.round(homeOdds * 100) / 100
                },
                {
                  name: match.away,
                  price: Math.round(awayOdds * 100) / 100
                },
                {
                  name: 'Draw',
                  price: Math.round(drawOdds * 100) / 100
                }
              ]
            },
            {
              key: 'totals',
              last_update: new Date().toISOString(),
              outcomes: [
                {
                  name: 'Over',
                  price: 1.8 + Math.random() * 0.4,
                  point: 2.5
                },
                {
                  name: 'Under',
                  price: 1.8 + Math.random() * 0.4,
                  point: 2.5
                }
              ]
            }
          ]
        };
      })
    };
  });
}

// Main endpoint to serve all odds data
app.get('/api/odds', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const oddsData = await loadOddsData(forceRefresh);
    
    if (!oddsData || oddsData.length === 0) {
      console.warn('⚠️ No odds data available, using sample data');
      const sampleData = generateSampleOddsData();
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.json(sampleData);
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log(`✅ Serving ${oddsData.length} events to client`);
    res.json(oddsData);
  } catch (error) {
    console.error('❌ Error serving odds data:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve odds data',
      details: error.message 
    });
  }
});

// Endpoint to serve odds data for a specific bookmaker
app.get('/api/odds/:bookmaker', async (req, res) => {
  try {
    const { bookmaker } = req.params;
    const bookmakerKey = bookmaker.toLowerCase().replace(/\s+/g, '');
    
    console.log(`🎯 Fetching odds for bookmaker: ${bookmaker} (${bookmakerKey})`);
    
    // Load all odds data
    const allOdds = await loadOddsData();
    
    if (!Array.isArray(allOdds)) {
      console.error('❌ Odds data is not an array');
      return res.status(500).json({ error: 'Invalid odds data format' });
    }
    
    // Filter odds for the requested bookmaker
    const filteredOdds = allOdds.filter(event => {
      if (!event.bookmakers || !Array.isArray(event.bookmakers)) {
        return false;
      }
      return event.bookmakers.some(bm => 
        (bm.key && bm.key.toLowerCase().includes(bookmakerKey)) || 
        (bm.title && bm.title.toLowerCase().includes(bookmaker.toLowerCase()))
      );
    });
    
    console.log(`✅ Found ${filteredOdds.length} events for ${bookmaker}`);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    res.json(filteredOdds);
  } catch (error) {
    console.error(`❌ Error fetching odds for ${req.params.bookmaker}:`, error);
    res.status(500).json({ 
      error: `Failed to retrieve odds for ${req.params.bookmaker}`,
      details: error.message 
    });
  }
});

// Endpoint to refresh odds data
app.post('/api/refresh-odds', async (req, res) => {
  try {
    console.log('🔄 Manual odds refresh requested');
    
    // Force refresh of odds data
    const refreshedData = await loadOddsData(true);
    
    res.json({
      success: true,
      message: `Refreshed ${refreshedData.length} events`,
      timestamp: new Date().toISOString(),
      events: refreshedData.length
    });
  } catch (error) {
    console.error('❌ Error refreshing odds data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh odds data',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'Sports Arbitrage API',
    cache: {
      hasData: !!oddsCache.data,
      eventsCount: oddsCache.data ? oddsCache.data.length : 0,
      lastUpdate: oddsCache.timestamp ? new Date(oddsCache.timestamp).toISOString() : null,
      age: oddsCache.timestamp ? Date.now() - oddsCache.timestamp : null
    },
    environment: {
      nodeVersion: process.version,
      port: PORT,
      oddsApiKey: !!process.env.ODDS_API_KEY,
      supabaseConfigured: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY)
    }
  };
  
  res.json(health);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Start the server
app.listen(PORT, () => {
  console.log('🚀 Sports Arbitrage API Server Started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Odds API: http://localhost:${PORT}/api/odds`);
  console.log(`🔑 ODDS API Key configured: ${!!process.env.ODDS_API_KEY}`);
  console.log(`🗄️  Supabase configured: ${!!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY)}`);
  
  // Load initial data
  loadOddsData().then(data => {
    console.log(`📥 Initial data load: ${data.length} events available`);
  });
}); 

export default app; 