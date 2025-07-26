import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app for serving the extracted odds
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

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// User agent rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.2045.43',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/117.0'
];

// Get a random user agent
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Generate mock data as a fallback
function generateMockData(bookmaker) {
  console.log(`Falling back to mock data for ${bookmaker}...`);
  
  const leagues = [
    'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1',
    'Champions League', 'Europa League', 'World Cup', 'Copa America', 'AFCON'
  ];
  
  const teams = {
    'Premier League': ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United', 'Tottenham'],
    'La Liga': ['Atletico Madrid', 'Barcelona', 'Real Madrid', 'Sevilla', 'Valencia', 'Villarreal'],
    'Serie A': ['AC Milan', 'Inter Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio'],
    'Bundesliga': ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Wolfsburg', 'Frankfurt'],
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
    const league = leagues[Math.floor(Math.random() * leagues.length)];
    const leagueTeams = teams[league];
    const homeIndex = Math.floor(Math.random() * leagueTeams.length);
    let awayIndex = Math.floor(Math.random() * leagueTeams.length);
    
    while (awayIndex === homeIndex) {
      awayIndex = Math.floor(Math.random() * leagueTeams.length);
    }
    
    const homeTeam = leagueTeams[homeIndex];
    const awayTeam = leagueTeams[awayIndex];
    
    // Generate match time
    const matchDate = new Date(currentDate);
    matchDate.setDate(matchDate.getDate() + Math.floor(Math.random() * 7));
    matchDate.setHours(Math.floor(Math.random() * 12) + 12);
    matchDate.setMinutes(Math.floor(Math.random() * 60));
    
    // Format match time
    const matchTime = matchDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Generate odds with specific ranges based on bookmaker
    let homeOdds, drawOdds, awayOdds;
    
    if (bookmaker === '1xBet') {
      homeOdds = Math.round((1.8 + Math.random() * 1.5) * 100) / 100;
      drawOdds = Math.round((2.8 + Math.random() * 1.2) * 100) / 100;
      awayOdds = Math.round((1.7 + Math.random() * 1.3) * 100) / 100;
    } else if (bookmaker === 'SportyBet') {
      homeOdds = Math.round((1.7 + Math.random() * 1.3) * 100) / 100;
      drawOdds = Math.round((2.7 + Math.random() * 1.3) * 100) / 100;
      awayOdds = Math.round((1.9 + Math.random() * 1.6) * 100) / 100;
    } else {
      homeOdds = Math.round((1.7 + Math.random() * 1.5) * 100) / 100;
      drawOdds = Math.round((2.7 + Math.random() * 1.3) * 100) / 100;
      awayOdds = Math.round((1.7 + Math.random() * 1.5) * 100) / 100;
    }
    
    // Create arbitrage opportunities occasionally
    if (i % 5 === 0) {
      if (bookmaker === '1xBet') {
        homeOdds = Math.round((2.5 + Math.random() * 0.5) * 100) / 100;
      } else if (bookmaker === 'SportyBet') {
        awayOdds = Math.round((2.5 + Math.random() * 0.5) * 100) / 100;
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
      updated_at: new Date().toISOString(),
      is_mock: true
    });
  }
  
  // Save to cache
  writeToCache(bookmaker, matches);
  
  return matches;
}

// Helper function to read from cache
function readFromCache(bookmaker) {
  try {
    const cacheFilePath = path.join(CACHE_DIR, `${bookmaker.toLowerCase()}_odds.json`);
    
    if (fs.existsSync(cacheFilePath)) {
      const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
      const now = Date.now();
      
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

// Helper function to write to cache
function writeToCache(bookmaker, data) {
  try {
    const cacheFilePath = path.join(CACHE_DIR, `${bookmaker.toLowerCase()}_odds.json`);
    
    fs.writeFileSync(cacheFilePath, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
    
    console.log(`Cached ${data.length} ${bookmaker} odds`);
  } catch (error) {
    console.error(`Error writing to cache: ${error.message}`);
  }
}

// Fix 1xBet team name and odds extraction
async function scrape1xBetOdds() {
  console.log('Attempting to scrape 1xBet odds...');
  
  // Check cache first
  const cachedData = readFromCache('1xBet');
  if (cachedData) {
    return cachedData;
  }
  
  // Launch browser with advanced stealth settings
  const browser = await chromium.launch({
    headless: true, // Set to true in production, false for debugging
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: getRandomUserAgent(),
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    javaScriptEnabled: true
  });
  
  // Create page
  const page = await context.newPage();
  
  try {
    // List of URLs to try
    const urls = [
      'https://1xbet.ng/en/line/football',
      'https://1xbet.com/en/line/football',
      'https://ng.1xbet.com/en/line/football'
    ];
    
    let loaded = false;
    
    // Try different URLs until one works
    for (const url of urls) {
      try {
        console.log(`Trying to load ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Take a screenshot for debugging
        const screenshotPath = path.join(CACHE_DIR, `1xbet-page.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`Saved screenshot to ${screenshotPath}`);
        
        // Save HTML for debugging
        const html = await page.content();
        const htmlPath = path.join(CACHE_DIR, `1xbet-page.html`);
        fs.writeFileSync(htmlPath, html);
        console.log(`Saved HTML to ${htmlPath}`);
        
        console.log(`Successfully loaded ${url}`);
        loaded = true;
        break;
      } catch (error) {
        console.error(`Error loading ${url}: ${error.message}`);
      }
    }
    
    if (!loaded) {
      throw new Error('Failed to load any 1xBet URL');
    }
    
    // Wait for content to load and perform some scrolling
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(2000);
    
    // Extract data directly using page.evaluate to get better control
    const matches = await page.evaluate(() => {
      // Helper function to find actual team names and clean them
      function extractTeamNames(text) {
        // Try to find patterns like "Team1 - Team2" or "Team1 vs Team2"
        if (!text) return null;
        
        // Strip out common betting terms
        let cleanText = text.replace(/1X2|1X|12|X2|O\/U|Total|[+]\d+|TG/g, '');
        
        // Try different separators
        const separators = [' vs ', ' - ', ' – ', '—'];
        for (const separator of separators) {
          if (cleanText.includes(separator)) {
            const parts = cleanText.split(separator);
            if (parts.length === 2) {
              return {
                homeTeam: parts[0].trim(),
                awayTeam: parts[1].trim()
              };
            }
          }
        }
        
        // Look for cases where we have two separate elements
        return null;
      }
      
      // Helper function to extract clean odds values
      function extractOdds(element) {
        const oddElements = element.querySelectorAll('span[class*="coef"], span[class*="odd"], button, [class*="bet"]');
        const odds = [];
        
        oddElements.forEach(el => {
          const text = el.textContent.trim();
          const value = parseFloat(text.replace(',', '.'));
          if (!isNaN(value) && value > 1 && value < 20) {
            odds.push(value);
          }
        });
        
        // If we found 3 odds, return them
        if (odds.length >= 3) {
          return {
            home: odds[0],
            draw: odds[1],
            away: odds[2]
          };
        }
        return null;
      }
      
      // Extract league name if available
      function extractLeague(element) {
        const leagueElements = element.querySelectorAll('[class*="league"], [class*="tournament"]');
        if (leagueElements.length > 0) {
          return leagueElements[0].textContent.trim();
        }
        return "Football";
      }
      
      // Try to find match rows
      const eventRows = document.querySelectorAll('.dashboard-champ, .c-events__item, .event-item');
      const extractedMatches = [];
      
      // Process each potential match
      eventRows.forEach((row, index) => {
        // Look for team names
        const allText = row.textContent.trim();
        
        // Try to find team names from heading or strong elements first
        let teamData = null;
        
        // Try to extract from all elements that might contain team names
        const nameElements = row.querySelectorAll('a, span, div, strong, h3, h4, [class*="name"]');
        for (const elem of nameElements) {
          const elemText = elem.textContent.trim();
          if (elemText.length > 5) { // Filter out very short texts
            const extracted = extractTeamNames(elemText);
            if (extracted) {
              teamData = extracted;
              break;
            }
          }
        }
        
        // If we couldn't find team names, skip this row
        if (!teamData) return;
        
        // Extract odds
        const oddsData = extractOdds(row);
        if (!oddsData) return;
        
        // Extract league
        const league = extractLeague(row);
        
        // Only add if we have valid data
        extractedMatches.push({
          match_id: `1xbet_${Date.now()}_${index}`,
          match_name: `${teamData.homeTeam} vs ${teamData.awayTeam}`,
          home_team: teamData.homeTeam,
          away_team: teamData.awayTeam,
          team_home: teamData.homeTeam,
          team_away: teamData.awayTeam,
          league: league,
          match_time: "Today",
          odds_home: oddsData.home,
          odds_draw: oddsData.draw,
          odds_away: oddsData.away,
          bookmaker: '1xBet',
          updated_at: new Date().toISOString(),
          is_mock: false
        });
      });
      
      return extractedMatches;
    });
    
    await browser.close();
    
    // If we found matches, save them to cache
    if (matches && matches.length > 0) {
      console.log(`Successfully extracted ${matches.length} matches from 1xBet`);
      writeToCache('1xBet', matches);
      return matches;
    }
    
    console.log('Failed to extract match data from 1xBet, falling back to mock data');
    return generateMockData('1xBet');
  } catch (error) {
    console.error(`Error scraping 1xBet: ${error.message}`);
    await browser.close();
    return generateMockData('1xBet');
  }
}

// Improved SportyBet scraping function
async function scrapeSportyBetOdds() {
  console.log('Attempting to scrape SportyBet odds...');
  
  // Check cache first
  const cachedData = readFromCache('SportyBet');
  if (cachedData) {
    return cachedData;
  }
  
  // Launch browser with advanced stealth settings
  const browser = await chromium.launch({
    headless: true, // Set to true for production
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: getRandomUserAgent(),
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    javaScriptEnabled: true
  });
  
  // Create page
  const page = await context.newPage();
  
  try {
    // List of URLs to try
    const urls = [
      'https://www.sportybet.com/ng/sport/football',
      'https://m.sportybet.com/ng/sport/football', 
      'https://sportybet.com/ng/sport/football'
    ];
    
    let loaded = false;
    
    // Try different URLs until one works
    for (const url of urls) {
      try {
        console.log(`Trying to load ${url}...`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Take a screenshot for debugging
        const screenshotPath = path.join(CACHE_DIR, `sportybet-page.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`Saved screenshot to ${screenshotPath}`);
        
        // Save HTML for debugging
        const html = await page.content();
        const htmlPath = path.join(CACHE_DIR, `sportybet-page.html`);
        fs.writeFileSync(htmlPath, html);
        console.log(`Saved HTML to ${htmlPath}`);
        
        console.log(`Successfully loaded ${url}`);
        loaded = true;
        break;
      } catch (error) {
        console.error(`Error loading ${url}: ${error.message}`);
      }
    }
    
    if (!loaded) {
      throw new Error('Failed to load any SportyBet URL');
    }
    
    // Wait for content to load and perform some scrolling
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(2000);
    
    // Parse the HTML directly to extract matches and clean team names
    const matches = await page.evaluate(() => {
      // Helper function to extract and clean team names from text with IDs
      function cleanTeamNames(text) {
        if (!text) return null;
        
        // Remove ID prefixes and match time
        const cleanedText = text.replace(/\d{2}:\d{2}\s+ID:\s+\d+\s+/g, '');
        
        // Try to find vs or splitting point
        if (cleanedText.includes(' vs ')) {
          const teams = cleanedText.split(' vs ');
          if (teams.length === 2) {
            return {
              homeTeam: teams[0].trim(),
              awayTeam: teams[1].trim()
            };
          }
        }
        
        // If there's no explicit vs, try to extract the team name itself
        // SportyBet often has formats like "07:00 ID: 28531 Crystal Palace Liverpool"
        // We want to extract "Crystal Palace" and "Liverpool"
        
        // Split by spaces and remove time and ID parts
        const parts = text.split(' ');
        if (parts.length >= 6) { // We need at least time + ID + team names
          // Remove time and ID parts (first 4 elements)
          const teamParts = parts.slice(4);
          
          // Try to split remaining text into two teams
          // This is a heuristic - in reality, we need to know the team names to split properly
          const midpoint = Math.floor(teamParts.length / 2);
          const homeTeam = teamParts.slice(0, midpoint).join(' ');
          const awayTeam = teamParts.slice(midpoint).join(' ');
          
          return {
            homeTeam: homeTeam,
            awayTeam: awayTeam
          };
        }
        
        return null;
      }
      
      // Find events on the page
      const eventRows = document.querySelectorAll('.odd-item, .event-item, [class*="match"], [class*="event"]');
      const matches = [];
      
      // Extract data from each event
      eventRows.forEach((row, index) => {
        // Find the text containing team names
        const allText = row.textContent.trim();
        
        // Extract team names
        const teamInfo = cleanTeamNames(allText);
        if (!teamInfo) return;
        
        // Extract odds (we need 3 odds: home, draw, away)
        const oddElements = row.querySelectorAll('.odd, [class*="odd"], button');
        const odds = [];
        
        oddElements.forEach(el => {
          const text = el.textContent.trim();
          const value = parseFloat(text.replace(',', '.'));
          if (!isNaN(value) && value > 1 && value < 20) {
            odds.push(value);
          }
        });
        
        // Skip if we don't have 3 odds
        if (odds.length < 3) return;
        
        // Get league name if available (if not, use Football)
        let league = "Football";
        const leagueElements = row.querySelectorAll('[class*="league"], [class*="tournament"]');
        if (leagueElements.length > 0) {
          league = leagueElements[0].textContent.trim();
        }
        
        // Get match time if available
        let matchTime = "Today";
        if (allText.match(/\d{2}:\d{2}/)) {
          matchTime = allText.match(/\d{2}:\d{2}/)[0];
        }
        
        matches.push({
          match_id: `sportybet_${Date.now()}_${index}`,
          match_name: `${teamInfo.homeTeam} vs ${teamInfo.awayTeam}`,
          home_team: teamInfo.homeTeam,
          away_team: teamInfo.awayTeam,
          team_home: teamInfo.homeTeam,
          team_away: teamInfo.awayTeam,
          league: league,
          match_time: matchTime,
          odds_home: odds[0],
          odds_draw: odds[1],
          odds_away: odds[2],
          bookmaker: 'SportyBet',
          updated_at: new Date().toISOString(),
          is_mock: false
        });
      });
      
      return matches;
    });
    
    await browser.close();
    
    // If we found matches, save them to cache
    if (matches && matches.length > 0) {
      console.log(`Successfully extracted ${matches.length} matches from SportyBet`);
      writeToCache('SportyBet', matches);
      return matches;
    }
    
    console.log('Failed to extract match data from SportyBet, falling back to mock data');
    return generateMockData('SportyBet');
  } catch (error) {
    console.error(`Error scraping SportyBet: ${error.message}`);
    await browser.close();
    return generateMockData('SportyBet');
  }
}

// 1xBet odds endpoint
app.get('/api/odds/1xbet', async (req, res) => {
  console.log('1xBet odds requested');
  
  try {
    const odds = await scrape1xBetOdds();
    res.json(odds);
  } catch (error) {
    console.error('Error serving 1xBet odds:', error);
    res.status(500).json({ error: 'Failed to get 1xBet odds' });
  }
});

// SportyBet odds endpoint
app.get('/api/odds/sportybet', async (req, res) => {
  console.log('SportyBet odds requested');
  
  try {
    const odds = await scrapeSportyBetOdds();
    res.json(odds);
  } catch (error) {
    console.error('Error serving SportyBet odds:', error);
    res.status(500).json({ error: 'Failed to get SportyBet odds' });
  }
});

// All odds endpoint
app.get('/api/odds/all', async (req, res) => {
  console.log('All odds requested');
  
  try {
    // Get odds from both bookmakers
    const oneXBetOdds = await scrape1xBetOdds();
    const sportyBetOdds = await scrapeSportyBetOdds();
    
    // Combine odds
    const allOdds = [...oneXBetOdds, ...sportyBetOdds];
    
    // Save combined odds to a file for debugging
    const allOddsPath = path.join(__dirname, 'all_odds.json');
    fs.writeFileSync(allOddsPath, JSON.stringify(allOdds, null, 2));
    
    console.log(`Returning ${allOdds.length} total odds`);
    res.json(allOdds);
  } catch (error) {
    console.error('Error serving all odds:', error);
    res.status(500).json({ error: 'Failed to get odds' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Real odds extractor server running on port ${PORT}`);
});

// Run initial scraping to populate cache
(async () => {
  try {
    console.log('Performing initial scraping to populate cache...');
    await scrape1xBetOdds();
    await scrapeSportyBetOdds();
    console.log('Initial scraping complete');
  } catch (error) {
    console.error('Error during initial scraping:', error);
  }
})(); 