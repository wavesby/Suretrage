import { chromium } from 'playwright';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SERVER_URL = 'http://localhost:3001';
const TIMEOUT = 60000; // 60 seconds
const OUTPUT_DIR = path.join(__dirname, 'scraper-results');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Color console output for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Helper functions
const printHeader = (title) => {
  console.log(`\n${colors.bold}${colors.magenta}${title}${colors.reset}\n${'-'.repeat(title.length)}`);
};

const printSuccess = (message) => console.log(`${colors.green}✓ ${message}${colors.reset}`);
const printError = (message) => console.log(`${colors.red}✗ ${message}${colors.reset}`);
const printWarning = (message) => console.log(`${colors.yellow}! ${message}${colors.reset}`);
const printInfo = (message) => console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);

// Function to check if server is running
async function checkServer() {
  try {
    await axios.get(`${SERVER_URL}/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

// Function to start the server if not running
async function ensureServerRunning() {
  if (await checkServer()) {
    printSuccess('Server is already running');
    return;
  }
  
  printInfo('Starting server...');
  
  try {
    // Start server in background
    const child = exec('node server.js');
    
    // Log output
    child.stdout.on('data', (data) => {
      console.log(`${colors.blue}SERVER:${colors.reset} ${data.trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`${colors.red}SERVER ERROR:${colors.reset} ${data.trim()}`);
    });
    
    // Wait for server to start
    let attempts = 0;
    while (!(await checkServer()) && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (await checkServer()) {
      printSuccess('Server started successfully');
    } else {
      printError('Failed to start server');
      throw new Error('Server failed to start');
    }
  } catch (error) {
    printError(`Error starting server: ${error.message}`);
    throw error;
  }
}

// Function to test all endpoints
async function testAllEndpoints() {
  printHeader('Testing API Endpoints');
  
  const results = {
    timestamp: new Date().toISOString(),
    endpoints: {}
  };
  
  const endpoints = [
    { name: 'Health Check', path: '/health', expectsArray: false },
    { name: '1xBet Odds', path: '/api/odds/1xbet', expectsArray: true },
    { name: 'SportyBet Odds', path: '/api/odds/sportybet', expectsArray: true },
    { name: 'All Odds', path: '/api/odds/all', expectsArray: true }
  ];
  
  for (const endpoint of endpoints) {
    printInfo(`Testing ${endpoint.name}...`);
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${SERVER_URL}${endpoint.path}`, { timeout: TIMEOUT });
      const duration = Date.now() - startTime;
      
      results.endpoints[endpoint.path] = {
        statusCode: response.status,
        duration,
        dataSize: Array.isArray(response.data) ? response.data.length : null,
        isMockData: Array.isArray(response.data) ? checkIfMockData(response.data) : false
      };
      
      if (endpoint.expectsArray && Array.isArray(response.data)) {
        if (results.endpoints[endpoint.path].isMockData) {
          printWarning(`${endpoint.name} returned mock data (${response.data.length} items)`);
        } else {
          printSuccess(`${endpoint.name} returned real data (${response.data.length} items)`);
        }
        
        // Save the data to a file
        const outputFile = path.join(OUTPUT_DIR, `${endpoint.path.replace(/\//g, '-').slice(1)}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(response.data, null, 2));
      } else if (!endpoint.expectsArray) {
        printSuccess(`${endpoint.name} responded with status ${response.status}`);
      } else {
        printError(`${endpoint.name} returned unexpected format`);
      }
    } catch (error) {
      printError(`${endpoint.name} failed: ${error.message}`);
      results.endpoints[endpoint.path] = {
        error: error.message,
        status: 'failed'
      };
    }
  }
  
  // Save test results
  const resultsFile = path.join(OUTPUT_DIR, `api-test-results-${Date.now()}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  printInfo(`Results saved to ${resultsFile}`);
  
  return results;
}

// Function to check if data is mock data
function checkIfMockData(data) {
  if (!data || data.length === 0) return true;
  
  // Check for common indicators of mock data
  const mockDataIndicators = [
    // Check for predictable patterns in generated IDs
    (item) => item.match_id?.includes('_0') && item.match_id?.includes('_1'),
    // Check if the match times are all similar format and recent
    (item) => item.match_time?.includes('Jul ') || item.match_time?.includes('Aug ')
  ];
  
  // Sample a few items
  const sampleItems = data.slice(0, Math.min(5, data.length));
  let mockScore = 0;
  
  for (const item of sampleItems) {
    for (const indicator of mockDataIndicators) {
      if (indicator(item)) {
        mockScore++;
        break;
      }
    }
  }
  
  // If most items match mock indicators, it's likely mock data
  return mockScore >= Math.floor(sampleItems.length * 0.6);
}

// Function to inspect and reset cache
async function resetCache() {
  printHeader('Resetting Cache');
  
  const cacheDir = path.join(__dirname, 'cache');
  
  if (fs.existsSync(cacheDir)) {
    const files = fs.readdirSync(cacheDir);
    
    printInfo(`Found ${files.length} files in cache directory`);
    
    for (const file of files) {
      try {
        const filePath = path.join(cacheDir, file);
        fs.unlinkSync(filePath);
        printSuccess(`Deleted ${file}`);
      } catch (error) {
        printError(`Failed to delete ${file}: ${error.message}`);
      }
    }
  } else {
    printInfo('Cache directory does not exist, creating it');
    fs.mkdirSync(cacheDir, { recursive: true });
  }
}

// Function to run 1xBet scraper directly
async function runDirectScraper() {
  printHeader('Running Direct 1xBet Scraper');
  
  try {
    const browser = await chromium.launch({ 
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-web-security'
      ]
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    
    const page = await context.newPage();
    
    try {
      printInfo('Navigating to 1xBet...');
      await page.goto('https://1xbet.ng/en/line/football', { waitUntil: 'networkidle', timeout: 60000 });
      
      // Take a screenshot for inspection
      const screenshotPath = path.join(OUTPUT_DIR, `1xbet-screenshot-${Date.now()}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      printSuccess(`Saved screenshot to ${screenshotPath}`);
      
      // Save HTML for inspection
      const htmlPath = path.join(OUTPUT_DIR, `1xbet-html-${Date.now()}.html`);
      const html = await page.content();
      fs.writeFileSync(htmlPath, html);
      printSuccess(`Saved HTML to ${htmlPath}`);
      
      // Extract available selectors
      const selectors = await page.evaluate(() => {
        const result = {};
        const allElements = document.querySelectorAll('*');
        const classFrequency = {};
        
        // Count class frequency
        allElements.forEach(el => {
          if (el.className && typeof el.className === 'string') {
            el.className.split(' ').forEach(className => {
              if (className) {
                if (!classFrequency[className]) classFrequency[className] = 0;
                classFrequency[className]++;
              }
            });
          }
        });
        
        // Find potential match containers (elements that appear multiple times)
        result.potentialMatchContainers = Object.entries(classFrequency)
          .filter(([className, count]) => count > 5 && count < 100) // Reasonable range for match containers
          .map(([className]) => `.${className}`)
          .slice(0, 20); // Take top 20
        
        return result;
      });
      
      // Save selectors for reference
      const selectorsPath = path.join(OUTPUT_DIR, `1xbet-selectors-${Date.now()}.json`);
      fs.writeFileSync(selectorsPath, JSON.stringify(selectors, null, 2));
      printSuccess(`Saved selectors to ${selectorsPath}`);
      
      await browser.close();
    } catch (error) {
      printError(`Scraping error: ${error.message}`);
      
      try {
        const screenshotPath = path.join(OUTPUT_DIR, `1xbet-error-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath });
        printInfo(`Saved error screenshot to ${screenshotPath}`);
      } catch (e) {
        // Ignore screenshot errors
      }
      
      await browser.close();
    }
  } catch (error) {
    printError(`Browser launch error: ${error.message}`);
  }
}

// Main function
async function main() {
  printHeader('Sports Arbitrage Scraper Test');
  
  try {
    // Step 1: Make sure server is running
    await ensureServerRunning();
    
    // Step 2: Reset cache to force fresh fetching
    await resetCache();
    
    // Step 3: Run direct scraper to inspect 1xBet website
    await runDirectScraper();
    
    // Step 4: Restart server to use fresh settings
    printInfo('Restarting server...');
    try {
      await execAsync('pkill -f "node server.js"');
    } catch (e) {
      // Ignore errors if server wasn't running
    }
    
    // Allow some time for the process to fully terminate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start server again
    await ensureServerRunning();
    
    // Step 5: Test all endpoints with fresh settings
    await testAllEndpoints();
    
    printHeader('Test Complete');
    printSuccess('All tests completed successfully');
    
  } catch (error) {
    printError(`Test failed: ${error.message}`);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 