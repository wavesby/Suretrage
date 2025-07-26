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
  'https://www.sportybet.com/ng/sport/football',
  'https://sportybet.com/ng/sport/football',
  'https://www.sportybet.com/gh/sport/football',
  'https://www.sportybet.com/ke/sport/football',
  'https://www.sportybet.com/ug/sport/football',
  'https://www.sportybet.com/ng/'
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
async function extractMatchesFromSportyBet(page) {
  // First try to extract directly using the exact layout visible in screenshots
  const matches = await page.evaluate(() => {
    const results = [];
    const now = new Date();
    
    try {
      // 1. Find the table-like structure with matches
      let matchRows = [];
      
      // Look for specific table structure with team names and odds (visible in screenshot)
      const tables = document.querySelectorAll('table, .match-table, .event-table, [class*="match-list"]');
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr, .match-row, [class*="event-row"]');
        
        rows.forEach(row => {
          const rowText = row.textContent.trim();
          // If row contains digits (odds) and team names
          if (/\d+\.\d+/.test(rowText) && /[A-Za-z]/.test(rowText)) {
            matchRows.push(row);
          }
        });
      });
      
      // If no table found, look for match/event containers
      if (matchRows.length === 0) {
        const eventItems = document.querySelectorAll('.match-row, .event-item, .odd-item, [class*="match"], [class*="event"]');
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
          
          // Find team name elements - first check for dedicated team elements
          const teamElements = row.querySelectorAll('.team-name, [class*="team"], [class*="participant"]');
          
          if (teamElements.length >= 2) {
            homeTeam = teamElements[0].textContent.trim();
            awayTeam = teamElements[1].textContent.trim();
          } else {
            // Try to extract teams from match name element
            const matchNameElem = row.querySelector('.match-name, [class*="match-name"], [class*="event-name"]');
            
            if (matchNameElem) {
              const fullName = matchNameElem.textContent.trim();
              const teamParts = fullName.split(/\s+(?:-|vs|v)\s+/i);
              
              if (teamParts.length === 2) {
                homeTeam = teamParts[0].trim();
                awayTeam = teamParts[1].trim();
              }
            } else {
              // Last resort: Try to extract from row text using pattern
              const teamMatch = rowText.match(/([A-Za-z0-9\s.&'-]+)\s+(?:-|vs|v)\s+([A-Za-z0-9\s.&'-]+)/i);
              if (teamMatch) {
                homeTeam = teamMatch[1].trim();
                awayTeam = teamMatch[2].trim();
              }

            }
          }
          
          // If we still don't have team names, skip this row
          if (!homeTeam || !awayTeam) return;
          
          // Find odds (1, X, 2) - SportyBet has buttons with odds values
          const oddButtons = row.querySelectorAll('button, .odd, [class*="odd-value"], [class*="odds-value"]');
          const odds = [];
          
          oddButtons.forEach(button => {
            const value = parseFloat(button.textContent.trim());
            if (!isNaN(value) && value > 1 && value < 20) {
              odds.push(value);
            }
          });
          
          // If we didn't find odds in buttons, try to extract from text
          if (odds.length < 3) {
            const oddPattern = /\b(\d+\.\d+)\b/g;
            let match;
            
            while ((match = oddPattern.exec(rowText)) !== null) {
              const value = parseFloat(match[1]);
              if (value > 1 && value < 20) {
                odds.push(value);
              }
            }
          }
          
          // We need at least 3 odds values (1, X, 2)
          if (odds.length < 3) return;
          
          // Extract league information if available
          let league = "Football";
          const leagueElement = row.closest('[class*="league"], [class*="tournament"], [class*="championship"]');
          if (leagueElement) {
            const leagueName = leagueElement.querySelector('[class*="name"], [class*="title"]');
            if (leagueName) {
              league = leagueName.textContent.trim();
            } else {
              league = leagueElement.textContent.trim();
            }
            
            // Clean up league name
            league = league.replace(/\d+$/, '').trim();
          }
          
          // Extract match time if available
          let matchTime = "Today";
          const timeElement = row.querySelector('[class*="time"], [class*="date"], [class*="clock"]');
          if (timeElement) {
            matchTime = timeElement.textContent.trim();
          }
          
          // Create match object
          results.push({
            match_id: `sportybet_${Date.now()}_${index}`,
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
            bookmaker: 'SportyBet',
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
    const isMMA = match.home_team.includes('Poirier') || 
                 match.home_team.includes('Holloway') ||
                 match.away_team.includes('Poirier') ||
                 match.away_team.includes('Holloway');
    
    return !isMMA && 
           match.home_team && 
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
  console.log('Starting SportyBet direct scraper...');
  
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
  
  const page = await context.newPage();
  page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
  
  let extractedMatches = [];
  let loaded = false;
  
  // Try each URL until we get results
  for (const url of URLS) {
    try {
      console.log(`Trying to load ${url}...`);
      
      await page.goto(url, { timeout: 60000, waitUntil: 'networkidle' });
      
      // Take screenshot
      await page.screenshot({ 
        path: path.join(OUTPUT_DIR, `sportybet-initial-${Date.now()}.png`),
        fullPage: false 
      });
      
      // Look for and click on "Football" if needed
      try {
        // Check if we're already on football page
        const onFootball = await page.evaluate(() => {
          return document.body.textContent.includes('Football') || 
                 document.body.textContent.includes('Soccer');
        });
        
        if (!onFootball) {
          await page.click('a:has-text("Football")', { timeout: 5000 });
          console.log('Clicked on Football link');
          await page.waitForTimeout(3000);
        }
      } catch (e) {
        console.log('Could not navigate to football section: ', e.message);
      }
      
      console.log('Scrolling down the page to load more content...');
      await autoScroll(page);
      
      // Take screenshot after scrolling
      await page.screenshot({ 
        path: path.join(OUTPUT_DIR, `sportybet-after-scroll-${Date.now()}.png`),
        fullPage: false 
      });
      
      // Save HTML for analysis
      const html = await page.content();
      fs.writeFileSync(path.join(OUTPUT_DIR, `sportybet-page-${Date.now()}.html`), html);
      
      console.log('Extracting matches...');
      extractedMatches = await extractMatchesFromSportyBet(page);
      
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
  const outputPath = path.join(OUTPUT_DIR, `sportybet-matches-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(extractedMatches, null, 2));
  console.log(`Saved ${extractedMatches.length} matches to ${outputPath}`);
  
  // Also save to standard location for the API to use
  const apiOutputPath = path.join(__dirname, 'cache', 'sportybet_odds.json');
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
main().catch(console.error); 