import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process'; // Added for background scraping

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Cache directory
const CACHE_DIR = path.join(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR);
}

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

// Add a health endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Generate mock data for bookmakers
function generateMockData(bookmaker) {
  console.log(`Generating reliable mock data for ${bookmaker}...`);
  
  const leagues = [
    'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'Champions League', 'Europa League', 'World Cup', 'Copa America', 'AFCON'
  ];
  
  const teams = {
    'Premier League': ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United', 'Tottenham'],
    'La Liga': ['Atletico Madrid', 'Barcelona', 'Real Madrid', 'Sevilla', 'Valencia', 'Villarreal'],
    'Serie A': ['AC Milan', 'Inter Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio'],
    'Bundesliga': ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Wolfsburg', 'Eintracht Frankfurt'],
    'Ligue 1': ['PSG', 'Lille', 'Lyon', 'Monaco', 'Marseille', 'Nice'],
    'Champions League': ['Real Madrid', 'Bayern Munich', 'Manchester City', 'PSG', 'Liverpool', 'Chelsea'],
    'Europa League': ['Sevilla', 'Arsenal', 'Manchester United', 'Roma', 'Villarreal', 'Ajax'],
    'World Cup': ['Brazil', 'France', 'Germany', 'Argentina', 'Spain', 'England'],
    'Copa America': ['Argentina', 'Brazil', 'Uruguay', 'Colombia', 'Chile', 'Peru'],
    'AFCON': ['Senegal', 'Egypt', 'Nigeria', 'Cameroon', 'Algeria', 'Morocco']
  };
  
  const matches = [];
  const currentDate = new Date();
  
  // Generate 20 mock matches
  for (let i = 0; i < 20; i++) {
    // Select a random league
    const league = leagues[Math.floor(Math.random() * leagues.length)];
    
    // Select two different teams from that league
    const leagueTeams = teams[league];
    const homeIndex = Math.floor(Math.random() * leagueTeams.length);
    let awayIndex = Math.floor(Math.random() * leagueTeams.length);
    
    // Make sure teams are different
    while (awayIndex === homeIndex) {
      awayIndex = Math.floor(Math.random() * leagueTeams.length);
    }
    
    const homeTeam = leagueTeams[homeIndex];
    const awayTeam = leagueTeams[awayIndex];
    
    // Generate match time (between now and 7 days from now)
    const matchDate = new Date(currentDate);
    matchDate.setDate(matchDate.getDate() + Math.floor(Math.random() * 7));
    matchDate.setHours(Math.floor(Math.random() * 12) + 12); // Between 12 PM and 11:59 PM
    matchDate.setMinutes(Math.floor(Math.random() * 60));
    
    // Format match time
    const matchTime = matchDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Generate odds with specific ranges to create arbitrage opportunities
    // Different ranges for different bookmakers
    let homeOdds, drawOdds, awayOdds;
    
    if (bookmaker === '1xBet') {
      // 1xBet tends to have higher home odds
      homeOdds = Math.round((1.8 + Math.random() * 1.5) * 100) / 100;
      drawOdds = Math.round((2.8 + Math.random() * 1.2) * 100) / 100;
      awayOdds = Math.round((1.7 + Math.random() * 1.3) * 100) / 100;
    } else if (bookmaker === 'SportyBet') {
      // SportyBet tends to have higher away odds
      homeOdds = Math.round((1.7 + Math.random() * 1.3) * 100) / 100;
      drawOdds = Math.round((2.7 + Math.random() * 1.3) * 100) / 100;
      awayOdds = Math.round((1.9 + Math.random() * 1.6) * 100) / 100;
    } else {
      // Generic odds for other bookmakers
      homeOdds = Math.round((1.7 + Math.random() * 1.5) * 100) / 100;
      drawOdds = Math.round((2.7 + Math.random() * 1.3) * 100) / 100;
      awayOdds = Math.round((1.7 + Math.random() * 1.5) * 100) / 100;
    }
    
    // Occasionally create clear arbitrage opportunities (about 20% of matches)
    if (i % 5 === 0) {
      // Create a match with guaranteed arbitrage opportunity
      if (bookmaker === '1xBet') {
        homeOdds = Math.round((2.5 + Math.random() * 0.5) * 100) / 100; // Higher home odds
        drawOdds = Math.round((3.0 + Math.random() * 0.5) * 100) / 100;
        awayOdds = Math.round((2.0 + Math.random() * 0.3) * 100) / 100;
      } else if (bookmaker === 'SportyBet') {
        homeOdds = Math.round((2.0 + Math.random() * 0.3) * 100) / 100;
        drawOdds = Math.round((3.0 + Math.random() * 0.5) * 100) / 100;
        awayOdds = Math.round((2.5 + Math.random() * 0.5) * 100) / 100; // Higher away odds
      }
    }
    
    // Create match object
    matches.push({
      match_id: `${bookmaker.toLowerCase()}_${Date.now()}_${i}`,
      match_name: `${homeTeam} vs ${awayTeam}`,
      home_team: homeTeam,
      away_team: awayTeam,
      team_home: homeTeam,
      team_away: awayTeam,
      league,
      match_time: matchTime,
      odds_home: homeOdds,
      odds_draw: drawOdds,
      odds_away: awayOdds,
      bookmaker: bookmaker,
      updated_at: new Date().toISOString()
    });
  }
  
  // Save to cache
  const cacheFilePath = path.join(CACHE_DIR, `${bookmaker.toLowerCase()}_odds.json`);
  fs.writeFileSync(cacheFilePath, JSON.stringify({
    timestamp: Date.now(),
    data: matches
  }));
  
  return matches;
}

// Helper function to read from cache
function readFromCache(bookmaker) {
  try {
    const cacheFilePath = path.join(CACHE_DIR, `${bookmaker.toLowerCase()}_odds.json`);
    
    if (fs.existsSync(cacheFilePath)) {
      const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - cacheData.timestamp < CACHE_DURATION) {
        console.log(`Using cached ${bookmaker} data`);
        return cacheData.data;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error reading from cache: ${error.message}`);
    return null;
  }
}

// Helper function to clean SportyBet match data
function processSportyBetData(odds) {
  if (!odds || !Array.isArray(odds)) return odds;
  
  return odds.map(match => {
    // Fix team names that have ID prefixes
    const homeTeam = (match.home_team || match.team_home || '')
      .replace(/ID:?\s*\d+\s+/g, '')  // Remove ID prefix
      .trim();
    
    const awayTeam = (match.away_team || match.team_away || '')
      .replace(/ID:?\s*\d+\s+/g, '')  // Remove ID prefix
      .trim();
      
    // Check if the team names are the same or contain "vs" which means we need to split them
    let finalHomeTeam = homeTeam;
    let finalAwayTeam = awayTeam;
    
    if (homeTeam === awayTeam || homeTeam.includes(' vs ')) {
      // Split by "vs" if present
      if (homeTeam.includes(' vs ')) {
        const parts = homeTeam.split(' vs ');
        finalHomeTeam = parts[0].trim();
        finalAwayTeam = parts[1] ? parts[1].trim() : finalAwayTeam;
      } else {
        // If no vs but teams are same, use first part of the string for home team
        // and try to create a different away team
        if (homeTeam.includes(' ')) {
          const parts = homeTeam.split(' ');
          if (parts.length >= 2) {
            finalHomeTeam = parts[0].trim();
            finalAwayTeam = parts.slice(1).join(' ').trim();
          }
        }
      }
    }
    
    // Format the match time correctly
    let matchTime = match.match_time;
    if (matchTime && !matchTime.toString().includes("20")) {
      const now = new Date();
      if (matchTime.match(/\b\d{1,2}\s+\w{3}/i)) {
        matchTime = `${matchTime}, ${now.getFullYear()}`;
      }
    }
    
    return {
      ...match,
      home_team: finalHomeTeam,
      away_team: finalAwayTeam,
      team_home: finalHomeTeam,
      team_away: finalAwayTeam,
      match_name: `${finalHomeTeam} vs ${finalAwayTeam}`,
      match_time: matchTime
    };
  }).filter(match => 
    match.home_team && 
    match.away_team && 
    match.home_team !== match.away_team
  );
}

// Helper function to get real data from direct scraper
async function getDirectScraperData(bookmaker) {
  try {
    // Check if we have a recent direct scraper output file
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      console.log(`Output directory doesn't exist, returning mock data for ${bookmaker}`);
      return null;
    }
    
    // Find the most recent file for the bookmaker - check both direct and enhanced scrapers
    // The enhanced scraper follows the same naming convention as the direct scraper
    const files = fs.readdirSync(outputDir)
      .filter(file => file.startsWith(`${bookmaker.toLowerCase()}-matches-`) && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(outputDir, file),
        time: fs.statSync(path.join(outputDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      console.log(`No direct or enhanced scraper data found for ${bookmaker}, returning mock data`);
      return null;
    }
    
    // Check if the file is recent (less than 6 hours old)
    const mostRecentFile = files[0];
    const now = Date.now();
    const fileAge = now - mostRecentFile.time;
    const maxAge = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    
    if (fileAge > maxAge) {
      console.log(`Direct scraper data for ${bookmaker} is too old (${Math.round(fileAge / (60 * 60 * 1000))} hours), returning mock data`);
      return null;
    }
    
    // Read and parse the file
    const data = JSON.parse(fs.readFileSync(mostRecentFile.path, 'utf8'));
    console.log(`Using direct scraper data for ${bookmaker} from ${mostRecentFile.name} (${Math.round(fileAge / (60 * 1000))} minutes old)`);
    
    return data;
  } catch (error) {
    console.error(`Error getting direct scraper data for ${bookmaker}: ${error.message}`);
    return null;
  }
}

// 1xBet odds endpoint
app.get('/api/odds/1xbet', (req, res) => {
  console.log('1xBet odds requested');
  
  try {
    // First try to get from cache
    const cachedData = readFromCache('1xBet');
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Generate new mock data
    const odds = generateMockData('1xBet');
    console.log(`Generated ${odds.length} mock matches for 1xBet`);
    
    res.json(odds);
  } catch (error) {
    console.error('Error serving 1xBet odds:', error);
    res.status(500).json({ error: 'Failed to get 1xBet odds' });
  }
});

// Enhanced SportyBet odds API endpoint with better reliability
app.get('/api/odds/sportybet', (req, res) => {
  console.log('Fetching SportyBet odds...');
  
  try {
    // Check cache first for SportyBet odds
    const cachePath = path.join(__dirname, 'cache', 'sportybet_odds.json');
    
    if (fs.existsSync(cachePath)) {
      const cacheStats = fs.statSync(cachePath);
      const cacheAge = Date.now() - cacheStats.mtimeMs;
      const cacheDataRaw = fs.readFileSync(cachePath, 'utf8');
      let cacheData;
      
      try {
        cacheData = JSON.parse(cacheDataRaw);
        
        // Normalize data format - could be array or object with data property
        let normalizedData;
        if (Array.isArray(cacheData)) {
          normalizedData = cacheData;
        } else if (cacheData.data && Array.isArray(cacheData.data)) {
          normalizedData = cacheData.data;
        } else if (cacheData.match_id || cacheData.home_team) {
          // Handle case where it's a single match object
          normalizedData = [cacheData];
        } else {
          console.log('Cache data has invalid format:', typeof cacheData);
          normalizedData = [];
        }
        
        // Check if cache is valid (less than 6 hours old and contains data)
        if (cacheAge < 6 * 60 * 60 * 1000 && normalizedData.length > 0) {
          console.log(`Returning cached SportyBet odds (${normalizedData.length} matches, ${Math.floor(cacheAge / 60000)} minutes old)`);
          
          // Add cache age info for debugging
          const augmentedData = normalizedData.map(match => ({
            ...match,
            _cache_age_minutes: Math.floor(cacheAge / 60000),
            _cache_timestamp: new Date(cacheStats.mtimeMs).toISOString()
          }));
          
          return res.json(augmentedData);
        } else {
          console.log(`Cache is ${Math.floor(cacheAge / 60000)} minutes old or has ${normalizedData.length} matches, attempting to refresh...`);
          
          // Return cached data first, then trigger background refresh
          if (normalizedData.length > 0) {
            console.log(`Returning stale cached data while triggering refresh (${normalizedData.length} matches)`);
            
            // Trigger background refresh
            refreshSportyBetData();
            
            return res.json(normalizedData);
          }
        }
      } catch (parseError) {
        console.error(`Error parsing cache file: ${parseError.message}`);
        // Continue to get fresh data
      }
    }
    
    // No valid cache, try to get fresh data
    console.log('No valid cache found, fetching fresh data...');
    
    // Check if enhanced-sportybet-scraper.js exists
    const scraperPath = path.join(__dirname, 'enhanced-sportybet-scraper.js');
    
    if (fs.existsSync(scraperPath)) {
      // Return mock data immediately and trigger background scraping
      const mockData = generateSportyBetMockData();
      console.log(`Returning mock data (${mockData.length} matches) while triggering scraper`);
      
      // Trigger background refresh
      refreshSportyBetData();
      
      return res.json(mockData);
    } else {
      // Fall back to original mock data if no scraper exists
      console.log('Enhanced scraper not found, using fallback mock data');
      return res.json(generateMockData('SportyBet')); // Use original generateMockData as fallback
    }
  } catch (error) {
    console.error(`Error fetching SportyBet odds: ${error.message}`);
    return res.status(500).json({ error: 'Failed to fetch SportyBet odds', message: error.message });
  }
});

// Function to refresh SportyBet data in the background
function refreshSportyBetData() {
  // Only refresh if we're not already refreshing
  if (global.isRefreshingSportyBet) {
    console.log('Already refreshing SportyBet data, skipping...');
    return;
  }
  
  global.isRefreshingSportyBet = true;
  
  console.log('Triggering background refresh of SportyBet data...');
  
  const scraperPath = path.join(__dirname, 'enhanced-sportybet-scraper.js');
  
  // Use spawn to avoid blocking the main thread
  const child = spawn('node', [scraperPath], {
    detached: true,
    stdio: 'ignore'
  });
  
  // Don't wait for the child process
  child.unref();
  
  // Reset the refresh flag after 5 minutes (even if the process is still running)
  setTimeout(() => {
    global.isRefreshingSportyBet = false;
    console.log('Reset SportyBet refresh flag');
  }, 5 * 60 * 1000);
}

// Function to generate more realistic mock data when needed
function generateSportyBetMockData() {
  console.log('Generating realistic SportyBet mock data');
  
  const leagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League'];
  const teams = {
    'Premier League': ['Manchester City', 'Liverpool', 'Chelsea', 'Arsenal', 'Tottenham', 'Manchester United', 'Newcastle'],
    'La Liga': ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Villarreal', 'Real Betis'],
    'Serie A': ['AC Milan', 'Inter Milan', 'Napoli', 'Juventus', 'Roma', 'Lazio'],
    'Bundesliga': ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Freiburg', 'Union Berlin'],
    'Ligue 1': ['PSG', 'Marseille', 'Monaco', 'Lyon', 'Lille', 'Nice'],
    'Champions League': ['Manchester City', 'Real Madrid', 'Bayern Munich', 'PSG', 'Liverpool', 'Chelsea', 'Barcelona']
  };
  
  const matches = [];
  
  // Generate 5-10 matches per league
  leagues.forEach(league => {
    const leagueTeams = teams[league] || teams['Premier League'];
    const numMatches = 5 + Math.floor(Math.random() * 6); // 5-10 matches
    const usedTeams = new Set();
    
    for (let i = 0; i < numMatches; i++) {
      // Find home team not yet used
      let homeTeamIndex;
      do {
        homeTeamIndex = Math.floor(Math.random() * leagueTeams.length);
      } while (usedTeams.has(homeTeamIndex));
      
      // Find away team not yet used
      let awayTeamIndex;
      do {
        awayTeamIndex = Math.floor(Math.random() * leagueTeams.length);
      } while (awayTeamIndex === homeTeamIndex || usedTeams.has(awayTeamIndex));
      
      // Mark teams as used
      usedTeams.add(homeTeamIndex);
      usedTeams.add(awayTeamIndex);
      
      const homeTeam = leagueTeams[homeTeamIndex];
      const awayTeam = leagueTeams[awayTeamIndex];
      
      // Generate match date (0-7 days in future)
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + Math.floor(Math.random() * 8));
      matchDate.setHours(12 + Math.floor(Math.random() * 9)); // Between 12pm and 9pm
      matchDate.setMinutes([0, 15, 30, 45][Math.floor(Math.random() * 4)]); // Only 00, 15, 30, 45 minutes
      
      const formattedTime = matchDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric'
      });
      
      // Generate realistic odds
      const oddsHome = parseFloat((1.7 + Math.random() * 1.5).toFixed(2)); // 1.7-3.2
      const oddsDraw = parseFloat((2.8 + Math.random() * 1.2).toFixed(2)); // 2.8-4.0
      const oddsAway = parseFloat((2.0 + Math.random() * 2.0).toFixed(2)); // 2.0-4.0
      
      matches.push({
        match_id: `sportybet_mock_${Date.now()}_${i}`,
        match_name: `${homeTeam} vs ${awayTeam}`,
        home_team: homeTeam,
        away_team: awayTeam,
        team_home: homeTeam,
        team_away: awayTeam,
        league: league,
        match_time: formattedTime,
        odds_home: oddsHome,
        odds_draw: oddsDraw,
        odds_away: oddsAway,
        bookmaker: 'SportyBet',
        updated_at: new Date().toISOString(),
        source: 'mock_realtime'
      });
    }
  });
  
  return matches;
}

// All odds endpoint
app.get('/api/odds/all', (req, res) => {
  console.log('All odds requested');
  
  try {
    let allOdds = [];
    
    // Get 1xBet odds
    let oneXBetOdds = readFromCache('1xBet');
    if (!oneXBetOdds) {
      // Try to get from direct scraper
      const directData = getDirectScraperData('1xbet');
      if (directData) {
        oneXBetOdds = directData;
      } else {
        oneXBetOdds = generateMockData('1xBet');
      }
    }
    
    // Get SportyBet odds
    let sportyBetOdds = readFromCache('SportyBet');
    if (!sportyBetOdds) {
      // Try to get from direct scraper
      const directData = getDirectScraperData('sportybet');
      if (directData) {
        sportyBetOdds = directData;
      } else {
        sportyBetOdds = generateMockData('SportyBet');
      }
    }
    
    // Process SportyBet data to fix team names
    const processedSportyBetOdds = processSportyBetData(sportyBetOdds);
    
    // Combine odds
    allOdds = [...oneXBetOdds, ...processedSportyBetOdds];
    
    // Save combined odds to a file for debugging
    const allOddsPath = path.join(__dirname, 'all_odds.json');
    fs.writeFileSync(allOddsPath, JSON.stringify(allOdds, null, 2));
    console.log(`Saved combined odds to all_odds.json for debugging`);
    
    console.log(`Returning ${allOdds.length} total odds`);
    res.json(allOdds);
  } catch (error) {
    console.error('Error serving all odds:', error);
    res.status(500).json({ error: 'Failed to get all odds' });
  }
});

// Main API endpoint for odds (same as /api/odds/all)
app.get('/api/odds', (req, res) => {
  console.log('Main odds API endpoint requested');
  
  try {
    let allOdds = [];
    
    // Get 1xBet odds
    let oneXBetOdds = readFromCache('1xBet');
    if (!oneXBetOdds) {
      // Try to get from direct scraper
      const directData = getDirectScraperData('1xbet');
      if (directData) {
        oneXBetOdds = directData;
      } else {
        oneXBetOdds = generateMockData('1xBet');
      }
    }
    
    // Get SportyBet odds
    let sportyBetOdds = readFromCache('SportyBet');
    if (!sportyBetOdds) {
      // Try to get from direct scraper
      const directData = getDirectScraperData('sportybet');
      if (directData) {
        sportyBetOdds = directData;
      } else {
        sportyBetOdds = generateMockData('SportyBet');
      }
    }
    
    // Process SportyBet data to fix team names
    const processedSportyBetOdds = processSportyBetData(sportyBetOdds);
    
    // Combine odds
    allOdds = [...oneXBetOdds, ...processedSportyBetOdds];
    
    // Log data for debugging
    console.log(`Returning ${allOdds.length} total odds from main API endpoint`);
    res.json(allOdds);
  } catch (error) {
    console.error('Error serving odds from main API endpoint:', error);
    res.status(500).json({ error: 'Failed to get odds data' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Reliable odds server running on port ${PORT}`);
}); 