#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SERVER_FILE = path.join(__dirname, 'server.js');
const BOOKMAKERS = ['1xBet', 'SportyBet'];
const URLS = {
  '1xBet': 'https://1xbet.ng/en/line/football',
  'SportyBet': 'https://www.sportybet.com/ng/sport/football'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt function with colors
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset}`, (answer) => {
      resolve(answer);
    });
  });
}

// Function to read server.js file
function readServerFile() {
  return fs.readFileSync(SERVER_FILE, 'utf8');
}

// Function to write updated server.js file
function writeServerFile(content) {
  fs.writeFileSync(SERVER_FILE, content, 'utf8');
}

// Function to extract selector patterns from server.js
function extractSelectors(content, bookmaker) {
  const selectors = {};
  
  // Different regex patterns for different bookmakers
  if (bookmaker === '1xBet') {
    const matchItemRegex = /\.c-events__item/g;
    const matchNameRegex = /\.c-events__name/g;
    const leagueRegex = /\.c-events__liga/g;
    const timeRegex = /\.c-events__time/g;
    const oddsRegex = /\.c-bets__bet/g;
    
    // Extract selectors using regex
    selectors.matchItem = (content.match(matchItemRegex) || [])[0];
    selectors.matchName = (content.match(matchNameRegex) || [])[0];
    selectors.league = (content.match(leagueRegex) || [])[0];
    selectors.time = (content.match(timeRegex) || [])[0];
    selectors.odds = (content.match(oddsRegex) || [])[0];
  } else if (bookmaker === 'SportyBet') {
    const matchItemRegex = /\.event-box/g;
    const teamNameRegex = /\.event-name .name/g;
    const leagueRegex = /\.league-name/g;
    const timeRegex = /\.event-time/g;
    const oddsRegex = /\.odd-item .odd/g;
    
    // Extract selectors using regex
    selectors.matchItem = (content.match(matchItemRegex) || [])[0];
    selectors.teamName = (content.match(teamNameRegex) || [])[0];
    selectors.league = (content.match(leagueRegex) || [])[0];
    selectors.time = (content.match(timeRegex) || [])[0];
    selectors.odds = (content.match(oddsRegex) || [])[0];
  }
  
  return selectors;
}

// Function to update selectors in server.js
function updateSelectors(content, bookmaker, selectors) {
  let updatedContent = content;
  
  // Different update patterns for different bookmakers
  if (bookmaker === '1xBet') {
    if (selectors.matchItem) {
      updatedContent = updatedContent.replace(/\.c-events__item/g, selectors.matchItem);
    }
    if (selectors.matchName) {
      updatedContent = updatedContent.replace(/\.c-events__name/g, selectors.matchName);
    }
    if (selectors.league) {
      updatedContent = updatedContent.replace(/\.c-events__liga/g, selectors.league);
    }
    if (selectors.time) {
      updatedContent = updatedContent.replace(/\.c-events__time/g, selectors.time);
    }
    if (selectors.odds) {
      updatedContent = updatedContent.replace(/\.c-bets__bet/g, selectors.odds);
    }
  } else if (bookmaker === 'SportyBet') {
    if (selectors.matchItem) {
      updatedContent = updatedContent.replace(/\.event-box/g, selectors.matchItem);
    }
    if (selectors.teamName) {
      updatedContent = updatedContent.replace(/\.event-name .name/g, selectors.teamName);
    }
    if (selectors.league) {
      updatedContent = updatedContent.replace(/\.league-name/g, selectors.league);
    }
    if (selectors.time) {
      updatedContent = updatedContent.replace(/\.event-time/g, selectors.time);
    }
    if (selectors.odds) {
      updatedContent = updatedContent.replace(/\.odd-item .odd/g, selectors.odds);
    }
  }
  
  return updatedContent;
}

// Function to check selectors on bookmaker website
async function checkSelectors(bookmaker) {
  console.log(`${colors.blue}Checking selectors for ${bookmaker}...${colors.reset}`);
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto(URLS[bookmaker], { timeout: 60000 });
    console.log(`${colors.green}Page loaded successfully${colors.reset}`);
    
    // Wait for user to inspect the page
    console.log(`${colors.yellow}Browser window opened. Please inspect the page to identify selectors.${colors.reset}`);
    console.log(`${colors.yellow}Press Enter when you're ready to continue...${colors.reset}`);
    await prompt('');
    
    // Get current selectors
    const serverContent = readServerFile();
    const currentSelectors = extractSelectors(serverContent, bookmaker);
    
    console.log(`${colors.green}Current selectors for ${bookmaker}:${colors.reset}`);
    Object.entries(currentSelectors).forEach(([key, value]) => {
      console.log(`  ${key}: ${value || 'Not found'}`);
    });
    
    // Ask for new selectors
    console.log(`${colors.yellow}Enter new selectors (leave empty to keep current):${colors.reset}`);
    
    const newSelectors = {};
    
    if (bookmaker === '1xBet') {
      newSelectors.matchItem = await prompt(`Match item selector (current: ${currentSelectors.matchItem || 'Not found'}): `);
      newSelectors.matchName = await prompt(`Match name selector (current: ${currentSelectors.matchName || 'Not found'}): `);
      newSelectors.league = await prompt(`League selector (current: ${currentSelectors.league || 'Not found'}): `);
      newSelectors.time = await prompt(`Time selector (current: ${currentSelectors.time || 'Not found'}): `);
      newSelectors.odds = await prompt(`Odds selector (current: ${currentSelectors.odds || 'Not found'}): `);
    } else if (bookmaker === 'SportyBet') {
      newSelectors.matchItem = await prompt(`Match item selector (current: ${currentSelectors.matchItem || 'Not found'}): `);
      newSelectors.teamName = await prompt(`Team name selector (current: ${currentSelectors.teamName || 'Not found'}): `);
      newSelectors.league = await prompt(`League selector (current: ${currentSelectors.league || 'Not found'}): `);
      newSelectors.time = await prompt(`Time selector (current: ${currentSelectors.time || 'Not found'}): `);
      newSelectors.odds = await prompt(`Odds selector (current: ${currentSelectors.odds || 'Not found'}): `);
    }
    
    // Filter out empty values
    Object.keys(newSelectors).forEach(key => {
      if (!newSelectors[key]) {
        delete newSelectors[key];
      }
    });
    
    // Update selectors if any were provided
    if (Object.keys(newSelectors).length > 0) {
      const updatedContent = updateSelectors(serverContent, bookmaker, newSelectors);
      writeServerFile(updatedContent);
      console.log(`${colors.green}Selectors updated successfully${colors.reset}`);
    } else {
      console.log(`${colors.yellow}No changes made${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error);
  } finally {
    await browser.close();
  }
}

// Main function
async function main() {
  console.log(`${colors.magenta}=== Sport Arbitrage Selector Update Tool ====${colors.reset}`);
  console.log(`${colors.yellow}This tool helps you update the selectors used for web scraping${colors.reset}`);
  console.log('');
  
  // Check if server.js exists
  if (!fs.existsSync(SERVER_FILE)) {
    console.error(`${colors.red}Error: server.js not found${colors.reset}`);
    rl.close();
    return;
  }
  
  // Ask which bookmaker to update
  console.log(`${colors.cyan}Select a bookmaker to update:${colors.reset}`);
  BOOKMAKERS.forEach((bookmaker, index) => {
    console.log(`  ${index + 1}. ${bookmaker}`);
  });
  
  const bookmakerIndex = parseInt(await prompt('Enter number: ')) - 1;
  
  if (bookmakerIndex < 0 || bookmakerIndex >= BOOKMAKERS.length) {
    console.error(`${colors.red}Invalid selection${colors.reset}`);
    rl.close();
    return;
  }
  
  const selectedBookmaker = BOOKMAKERS[bookmakerIndex];
  
  // Check selectors for selected bookmaker
  await checkSelectors(selectedBookmaker);
  
  console.log(`${colors.magenta}=== Tool Complete ====${colors.reset}`);
  rl.close();
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  rl.close();
}); 