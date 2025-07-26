import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// User agents to rotate
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:105.0) Gecko/20100101 Firefox/105.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36 Edg/106.0.1370.47'
];

// Function to get a random user agent
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Get args - run headless or not
const args = process.argv.slice(2);
const headless = args.includes('--headless');

// Update URL list to try more variations
const URLS = [
  'https://1xbet.ng/en/line/football',
  'https://1xbet.com/en/line/football',
  'https://1xbet.ng/en/sports/1',
  'https://ng.1xbet.com/en/line/football',
  'https://1xbet.ng/en',
  'https://ng.1xbet.com/en'
];

// Debug options
const TAKE_SCREENSHOTS = true;
const SAVE_HTML = true;
const VERBOSE_LOGGING = true;

// Update selectors list based on HTML inspection
const MATCH_SELECTORS = [
  '.c-events__item',
  '.c-events__item_game',
  '.sports-event-row',
  '.line-event-container',
  '[data-name="eventContainer"]',
  '.line__champ',
  '.line-dashboard-champ', 
  '.league__container',
  '.league-item',
  '.sport__dashboard',
  // More generic selectors to try
  '.coupon-bets',
  '.dashboard-champ',
  '.c-table--game-stats',
  'table[data-name="dashboard-champ"]',
  '[class*="event"]',
  '[class*="match"]',
  '[class*="game"]'
];

// Update the selectors to properly extract team names and odds from the working selector
const TEAM_NAME_SELECTORS = [
  '.c-events__name',
  '.c-events__teams',
  '.teams-name',
  '.member-name',
  '.c-events-scoreboard__team',
  '.c-teams',
  '.c-events__team',
  '.names__col',
  '.names-col',
  '.player-name',
  '.competitor',
  // Add more comprehensive selectors
  '.name',
  '.team',
  '.teams',
  '[class*="team"]',
  '[class*="name"]',
  'h4',
  'h3',
  '.match-name',
  'a',
  '.game',
  '.match',
  '.event'
];

const ODD_SELECTORS = [
  '.c-bets__bet',
  '.koeff-value',
  '.koef',
  '.bets__bet',
  '.bet-value',
  '.c-events__price',
  '.bet_type',
  '.odds',
  '.event-odds',
  '.koef-value',
  '.bet-box__value',
  '[class*="odds"]',
  '[class*="koef"]',
  '[data-name*="odd"]',
  // Add more comprehensive selectors
  'button',
  'span',
  '[class*="bet"]',
  '[class*="value"]',
  '[class*="price"]',
  '.coefficient',
  '.rate',
  '.number'
];

function logVerbose(...args) {
  if (VERBOSE_LOGGING) {
    console.log(...args);
  }
}

async function saveScreenshot(page, name) {
  if (!TAKE_SCREENSHOTS) return;
  
  const screenshotPath = path.join(__dirname, `screenshot-${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to ${screenshotPath}`);
}

async function saveHTML(page, name) {
  if (!SAVE_HTML) return;
  
  const htmlPath = path.join(__dirname, `page-${name}-${Date.now()}.html`);
  const html = await page.content();
  fs.writeFileSync(htmlPath, html);
  console.log(`Saved HTML to ${htmlPath}`);
}

// Main scraping function with advanced debugging
async function scrape1xBet() {
  console.log(`Starting 1xBet scraper in ${headless ? 'headless' : 'headed (visible)'} mode`);
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: headless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-web-security',
      '--disable-setuid-sandbox',
      '--no-sandbox'
    ],
    slowMo: headless ? 0 : 100 // Slow down in visible mode
  });
  
  // Set up context with desktop properties
  const context = await browser.newContext({
    userAgent: getRandomUserAgent(),
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    javaScriptEnabled: true,
    locale: 'en-US',
    hasTouch: false,
    permissions: ['geolocation'],
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'DNT': '1'
    }
  });
  
  // Add common cookies for 1xBet to appear more like a real user
  await context.addCookies([
    {
      name: 'cookie_consent',
      value: 'accepted',
      domain: '.1xbet.ng',
      path: '/',
      secure: true
    },
    {
      name: 'tzo',
      value: '-60',
      domain: '.1xbet.ng',
      path: '/',
      secure: true
    }
  ]);
  
  // Create new page
  const page = await context.newPage();
  
  // Add debug event listeners
  page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.text()}`));
  page.on('pageerror', err => console.error(`BROWSER ERROR: ${err}`));
  
  try {
    let navigationSuccessful = false;
    let url;
    
    // Try different URLs until one works
    for (url of URLS) {
      try {
        console.log(`Trying to navigate to ${url}...`);
        
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 60000 
        });
        
        // Wait for some content to load
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        
        console.log(`Successfully loaded ${url}`);
        navigationSuccessful = true;
        break;
      } catch (e) {
        console.error(`Failed to navigate to ${url}: ${e.message}`);
        await saveScreenshot(page, `failed-navigation-${url.replace(/https?:\/\/|\.|\/|\:/g, '-')}`);
      }
    }
    
    if (!navigationSuccessful) {
      throw new Error('Failed to navigate to any 1xBet URL');
    }
    
    // Save initial screenshot and HTML
    await saveScreenshot(page, 'initial-page');
    await saveHTML(page, 'initial-page');
    
    // Human-like behavior: wait and scroll
    await page.waitForTimeout(3000);
    
    // Perform some scrolling
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, Math.floor(Math.random() * 300) + 200);
      });
      await page.waitForTimeout(1000);
    }
    
    // Save post-scroll screenshot
    await saveScreenshot(page, 'post-scroll');
    
    // Try to find matches using different selectors
    let foundSelector = null;
    let elementCount = 0;
    
    for (const selector of MATCH_SELECTORS) {
      try {
        console.log(`Trying to find matches with selector: ${selector}`);
        await page.waitForSelector(selector, { timeout: 5000 });
        
        const count = await page.evaluate((sel) => {
          return document.querySelectorAll(sel).length;
        }, selector);
        
        console.log(`Found ${count} elements with selector ${selector}`);
        
        if (count > 0) {
          foundSelector = selector;
          elementCount = count;
          break;
        }
      } catch (e) {
        console.log(`Selector ${selector} not found: ${e.message}`);
      }
    }
    
    if (!foundSelector) {
      throw new Error('Could not find any matches using any of the selectors');
    }
    
    console.log(`=== MATCH ELEMENTS FOUND: ${elementCount} with selector ${foundSelector} ===`);
    
    // Test each element selector to find team names and odds
    let teamNameSelector = null;
    for (const selector of TEAM_NAME_SELECTORS) {
      const combined = `${foundSelector} ${selector}`;
      try {
        const count = await page.evaluate((sel) => {
          return document.querySelectorAll(sel).length;
        }, combined);
        
        if (count > 0) {
          teamNameSelector = selector;
          console.log(`Found team name selector: ${teamNameSelector} (${count} elements)`);
          break;
        }
      } catch (e) {
        logVerbose(`Team name selector ${selector} failed: ${e.message}`);
      }
    }
    
    let oddSelector = null;
    for (const selector of ODD_SELECTORS) {
      const combined = `${foundSelector} ${selector}`;
      try {
        const count = await page.evaluate((sel) => {
          return document.querySelectorAll(sel).length;
        }, combined);
        
        if (count > 0) {
          oddSelector = selector;
          console.log(`Found odds selector: ${oddSelector} (${count} elements)`);
          break;
        }
      } catch (e) {
        logVerbose(`Odds selector ${selector} failed: ${e.message}`);
      }
    }
    
    // Extract match data with the found selectors
    console.log(`Extracting data with selectors: Match=${foundSelector}, Team=${teamNameSelector}, Odds=${oddSelector}`);
    
    // Extract data using selectors
    const matches = await page.evaluate(({ matchSelector, teamSelector, oddsSelector }) => {
      const matchElements = document.querySelectorAll(matchSelector);
      const matchData = [];
      
      matchElements.forEach((match, index) => {
        try {
          // Extract team names
          const teamElement = teamSelector ? match.querySelector(teamSelector) : null;
          if (!teamElement) return;
          
          const fullText = teamElement.textContent.trim();
          
          // Try different separators for team names
          let teams = [];
          if (fullText.includes(' vs ')) {
            teams = fullText.split(' vs ');
          } else if (fullText.includes(' v ')) {
            teams = fullText.split(' v ');
          } else if (fullText.includes(' - ')) {
            teams = fullText.split(' - ');
          } else if (fullText.includes('–')) {
            teams = fullText.split('–');
          } else {
            // Try to get team names from child elements
            const childElements = Array.from(teamElement.children);
            if (childElements.length >= 2) {
              teams = [
                childElements[0].textContent.trim(),
                childElements[childElements.length - 1].textContent.trim()
              ];
            }
          }
          
          if (teams.length !== 2) return;
          
          const homeTeam = teams[0].trim();
          const awayTeam = teams[1].trim();
          
          // Extract league
          const leagueElement = match.querySelector('.league-name') || 
                              match.querySelector('.c-events__liga');
          const league = leagueElement ? leagueElement.textContent.trim() : 'Unknown League';
          
          // Extract match time
          const timeElement = match.querySelector('.time') || 
                            match.querySelector('.c-events__time');
          const matchTime = timeElement ? timeElement.textContent.trim() : 'TBD';
          
          // Extract odds
          const oddsElements = oddsSelector ? match.querySelectorAll(oddsSelector) : [];
          
          if (oddsElements.length >= 3) {
            const homeOdds = parseFloat(oddsElements[0].textContent.trim().replace(',', '.')) || 0;
            const drawOdds = parseFloat(oddsElements[1].textContent.trim().replace(',', '.')) || 0;
            const awayOdds = parseFloat(oddsElements[2].textContent.trim().replace(',', '.')) || 0;
            
            if (homeOdds > 1 && drawOdds > 1 && awayOdds > 1) {
              matchData.push({
                match_id: `1xbet_${Date.now()}_${index}`,
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
                bookmaker: '1xBet',
                market_type: '1X2',
                updated_at: new Date().toISOString()
              });
            }
          }
        } catch (error) {
          console.error('Error processing match:', error);
        }
      });
      
      return matchData;
    }, { matchSelector: foundSelector, teamSelector: teamNameSelector, oddsSelector: oddSelector });
    
    console.log(`Extracted ${matches.length} matches from 1xBet`);
    
    // Take one more screenshot
    await saveScreenshot(page, 'after-extraction');
    
    // Save the extracted data
    const outputFile = path.join(__dirname, `1xbet-matches-${Date.now()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(matches, null, 2));
    console.log(`Saved extracted matches to ${outputFile}`);
    
    // Output working selectors for future use
    const selectorsFile = path.join(__dirname, 'working-1xbet-selectors.json');
    fs.writeFileSync(selectorsFile, JSON.stringify({
      url: url,
      matchSelector: foundSelector,
      teamSelector: teamNameSelector,
      oddSelector: oddSelector,
      timestamp: new Date().toISOString()
    }, null, 2));
    console.log(`Saved working selectors to ${selectorsFile}`);
    
    // Close browser
    await browser.close();
    
    return matches;
  } catch (error) {
    console.error(`Error in 1xBet scraping: ${error.message}`);
    await saveScreenshot(page, 'error-state');
    await saveHTML(page, 'error-state');
    
    // Always close browser
    await browser.close();
    return [];
  }
}

// Run the scraper
scrape1xBet()
  .then(matches => {
    console.log(`Script completed with ${matches.length} matches extracted`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 