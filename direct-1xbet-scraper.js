import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Make sure output directory exists
const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Set URLs to try
const URLS = [
  'https://1xbet.com/en/line/football',
  'https://1xbet.ng/en/line/football',
  'https://1xbet.mobi/en/line/football',
  'https://1x001.com/en/line/football',
  'https://1xbet.co.ke/en/line/football',
  'https://1xbet.co.za/en/line/football'
];

// User agents to rotate
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

// Function to clean team names
function cleanTeamName(name) {
  if (!name) return '';
  
  // Remove various prefixes, suffixes and artifacts
  return name
    .replace(/^\d+\s*[-:]?\s*\d+\s+/g, '') // Remove score prefixes like "1-0 "
    .replace(/\(\d+\)/g, '') // Remove things like "(2)"
    .replace(/\s*\(\w+\)\s*$/g, '') // Remove suffixes like "(W)"
    .replace(/\s+Total\s+/gi, ' ') // Remove "Total"
    .replace(/\s+Under\s+/gi, ' ') // Remove "Under"
    .replace(/\s+Over\s+/gi, ' ') // Remove "Over"
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/\s+/g, ' '); // Normalize spaces
}

// Function to format date properly
function formatMatchTime(time) {
  if (!time) return 'Today';
  
  // If it's already in a proper date format, keep it
  if (time.match(/\b\d{1,2}\s+\w{3}/i)) return time;
  
  // Get current date for reference
  const now = new Date();
  const today = now.getDate();
  const month = now.toLocaleString('en-US', { month: 'short' });
  
  // If the time is just a time (like "19:30"), prepend today's date
  if (time.match(/^\d{1,2}:\d{2}$/)) {
    return `${today} ${month}, ${time}`;
  }
  
  // If it's a date format we don't recognize, return a standardized format
  return `${today} ${month}, ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// Scroll function to mimic human behavior
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        // Add some randomness
        const randomPause = Math.floor(Math.random() * 100) + 50;
        setTimeout(() => {}, randomPause);
        
        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 200);
    });
  });
}

// Main scraping function targeting exact layout in screenshots
async function extractMatchesFrom1xBet(page) {
  // First try to extract directly using the exact layout visible in screenshots
  const matches = await page.evaluate(() => {
    const results = [];
    const now = new Date();
    
    try {
      // 1. Find the table-like structure with matches
      let matchRows = [];
      
      // Look for specific table structure with team names and odds
      const tables = document.querySelectorAll('table, [class*="table"]');
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        
        rows.forEach(row => {
          // Check if row has multiple cells and looks like a match row
          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return;
          
          const rowText = row.textContent.trim();
          // If row contains digits (odds) and team names
          if (/\d+\.\d+/.test(rowText) && /[A-Za-z]/.test(rowText)) {
            matchRows.push(row);
          }
        });
      });
      
      // If no table found, look for event items/cards
      if (matchRows.length === 0) {
        const eventItems = document.querySelectorAll('[class*="event-item"], [class*="event_item"], [class*="match-item"]');
        matchRows = Array.from(eventItems);
      }
      
      console.log(`Found ${matchRows.length} potential match rows`);
      
      // 2. Process each match row
      matchRows.forEach((row, index) => {
        try {
          const rowText = row.textContent.trim();
          
          // Skip rows that don't look like match data
          if (!rowText.match(/\d+\.\d+/) || rowText.length < 10) return;
          
          // Extract team names (handle various formats)
          let homeTeam = '', awayTeam = '';
          
          // Find team name elements
          const teamElements = row.querySelectorAll('[class*="team"], [class*="participant"]');
          if (teamElements.length >= 2) {
            homeTeam = teamElements[0].textContent.trim();
            awayTeam = teamElements[1].textContent.trim();
          } else {
            // If no team elements found, try to extract from row text using pattern
            const teamMatch = rowText.match(/([A-Za-z0-9\s.&'-]+)\s+(?:-|vs|v)\s+([A-Za-z0-9\s.&'-]+)/i);
            if (teamMatch) {
              homeTeam = teamMatch[1].trim();
              awayTeam = teamMatch[2].trim();
            } else {
              // Try another common pattern
              const hyphenPattern = /([^-]+)-([^0-9]+)/;
              const matchParts = hyphenPattern.exec(rowText);
              if (matchParts && matchParts.length >= 3) {
                homeTeam = matchParts[1].trim();
                awayTeam = matchParts[2].trim();
              }
            }
          }
          
          // If we still don't have team names, skip this row
          if (!homeTeam || !awayTeam) return;
          
          // Find odds values (1, X, 2)
          const oddPattern = /\b(\d+\.\d+)\b/g;
          const odds = [];
          let match;
          
          while ((match = oddPattern.exec(rowText)) !== null) {
            odds.push(parseFloat(match[1]));
          }
          
          // We need at least 3 odds values (1, X, 2)
          if (odds.length < 3) return;
          
          // Extract league information if available
          let league = "Football";
          const leagueElement = row.closest('[class*="league"], [class*="championship"]');
          if (leagueElement) {
            const leagueText = leagueElement.textContent;
            // Extract just the league name without extra text
            const leagueMatch = /([A-Za-z0-9\s.&'-]+)/.exec(leagueText);
            if (leagueMatch) league = leagueMatch[1].trim();
          }
          
          // Extract match time if available
          let matchTime = "Today";
          const timeElement = row.querySelector('[class*="time"], [class*="date"]');
          if (timeElement) matchTime = timeElement.textContent.trim();
          
          // Create match object
          results.push({
            match_id: `1xbet_${Date.now()}_${index}`,
            match_name: `${homeTeam} vs ${awayTeam}`,
            home_team: homeTeam,
            away_team: awayTeam,
            team_home: homeTeam, 
            team_away: awayTeam,
            league: league,
            match_time: matchTime,
            odds_home: odds[0],
            odds_draw: odds[1],
            odds_away: odds[2],
            bookmaker: '1xBet',
            updated_at: now.toISOString()
          });
        } catch (err) {
          console.log(`Error processing row: ${err.message}`);
        }
      });
      
      return results;
    } catch (error) {
      console.error(`Error extracting matches: ${error.message}`);
      return [];
    }
  });
  
  console.log(`Extracted ${matches.length} raw matches`);
  
  // Clean and validate extracted matches
  return matches.map(match => {
    return {
      ...match,
      home_team: cleanTeamName(match.home_team),
      away_team: cleanTeamName(match.away_team),
      team_home: cleanTeamName(match.home_team),
      team_away: cleanTeamName(match.away_team),
      match_name: `${cleanTeamName(match.home_team)} vs ${cleanTeamName(match.away_team)}`,
      match_time: formatMatchTime(match.match_time)
    };
  }).filter(match => {
    return match.home_team && 
           match.away_team && 
           match.home_team.length >= 2 && 
           match.away_team.length >= 2 &&
           match.odds_home && 
           match.odds_draw && 
           match.odds_away;
  });
}

// Main function to run the scraper
async function main() {
  console.log('Starting 1xBet direct scraper...');
  
  // Launch browser with enhanced stealth settings
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080'
    ]
  });
  
  // Get random user agent
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  
  const context = await browser.newContext({
    userAgent: userAgent,
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    javaScriptEnabled: true,
    ignoreHTTPSErrors: true
  });
  
  // Add cookies to bypass restrictions
  await context.addCookies([
    { 
      name: 'cookie_consent', 
      value: 'accepted', 
      domain: '.1xbet.com', 
      path: '/' 
    },
    {
      name: 'is_bot_detected',
      value: '0',
      domain: '.1xbet.com',
      path: '/'
    }
  ]);
  
  const page = await context.newPage();
  page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
  
  let extractedMatches = [];
  let loaded = false;
  
  // Try each URL until we get results
  for (const url of URLS) {
    try {
      console.log(`Trying to load ${url}...`);
      
      await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
      
      // Handle any popups or cookie notices
      try {
        await page.click('button:has-text("Accept")', { timeout: 3000 });
        console.log('Clicked Accept button');
      } catch (e) {}
      
      try {
        await page.click('button:has-text("Continue")', { timeout: 3000 });
        console.log('Clicked Continue button');
      } catch (e) {}
      
      // Take screenshot
      await page.screenshot({ 
        path: path.join(OUTPUT_DIR, `1xbet-initial-${Date.now()}.png`),
        fullPage: false 
      });
      
      console.log('Scrolling down the page to load more content...');
      await autoScroll(page);
      
      // Take screenshot after scrolling
      await page.screenshot({ 
        path: path.join(OUTPUT_DIR, `1xbet-after-scroll-${Date.now()}.png`),
        fullPage: false 
      });
      
      console.log('Extracting matches...');
      extractedMatches = await extractMatchesFrom1xBet(page);
      
      if (extractedMatches && extractedMatches.length >= 5) {
        console.log(`Successfully extracted ${extractedMatches.length} matches from ${url}`);
        loaded = true;
        break;
      } else {
        console.log(`Could not extract enough matches from ${url}, trying next URL`);
      }
    } catch (error) {
      console.error(`Error processing ${url}: ${error.message}`);
    }
  }
  
  await browser.close();
  
  if (!loaded || extractedMatches.length < 5) {
    console.log('Failed to extract sufficient matches from any URL');
    return;
  }
  
  // Save extracted matches to file
  const outputPath = path.join(OUTPUT_DIR, `1xbet-matches-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(extractedMatches, null, 2));
  console.log(`Saved ${extractedMatches.length} matches to ${outputPath}`);
  
  // Also save to standard location for the API to use
  const apiOutputPath = path.join(__dirname, 'cache', '1xbet_odds.json');
  if (!fs.existsSync(path.join(__dirname, 'cache'))) {
    fs.mkdirSync(path.join(__dirname, 'cache'));
  }
  
  fs.writeFileSync(apiOutputPath, JSON.stringify({
    timestamp: Date.now(),
    data: extractedMatches
  }));
  
  console.log(`Saved matches to API cache at ${apiOutputPath}`);
  console.log('Done!');
}

// Run the scraper
main().catch(console.error); 