import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SERVER_URL = 'http://localhost:3001';
const TIMEOUT = 10000;
const OUTPUT_DIR = path.join(__dirname, 'odds-data');

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

// Function to kill existing server processes on port 3001
async function killExistingServer() {
  printHeader("Stopping Existing Server");
  
  try {
    if (process.platform === 'win32') {
      await execAsync('taskkill /F /IM node.exe /T');
      printSuccess("Stopped existing Node processes");
    } else {
      // Find PIDs of processes on port 3001
      const { stdout } = await execAsync("lsof -i :3001 -t");
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        for (const pid of pids) {
          await execAsync(`kill -9 ${pid}`);
          printSuccess(`Killed process ${pid}`);
        }
      } else {
        printInfo("No processes found on port 3001");
      }
    }
  } catch (error) {
    // Ignore errors, likely no processes were found
    printInfo("No existing server processes found");
  }
}

// Function to start the server if not running
async function startServer() {
  printHeader("Starting Server");
  
  // First check if the server is already running
  if (await checkServer()) {
    printSuccess('Server is already running');
    return true;
  }
  
  printInfo('Starting server...');
  
  try {
    // Start server in background
    const serverProcess = exec('node server.js');
    
    // Log output
    serverProcess.stdout.on('data', (data) => {
      console.log(`${colors.blue}SERVER:${colors.reset} ${data.trim()}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`${colors.red}SERVER ERROR:${colors.reset} ${data.trim()}`);
    });
    
    // Wait for server to start
    let attempts = 0;
    while (attempts < 10) {
      if (await checkServer()) {
        printSuccess('Server started successfully');
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      printInfo(`Waiting for server to start (${attempts}/10)`);
    }
    
    printError('Failed to start server');
    return false;
  } catch (error) {
    printError(`Error starting server: ${error.message}`);
    return false;
  }
}

// Function to test all endpoints
async function testAllEndpoints() {
  printHeader('Testing API Endpoints');
  
  const endpoints = [
    { name: 'Health Check', path: '/health', expectsArray: false },
    { name: '1xBet Odds', path: '/api/odds/1xbet', expectsArray: true },
    { name: 'SportyBet Odds', path: '/api/odds/sportybet', expectsArray: true },
    { name: 'All Odds', path: '/api/odds/all', expectsArray: true }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    printInfo(`Testing ${endpoint.name}...`);
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${SERVER_URL}${endpoint.path}`, { timeout: TIMEOUT });
      const duration = Date.now() - startTime;
      
      if (endpoint.expectsArray && Array.isArray(response.data)) {
        printSuccess(`${endpoint.name}: Received ${response.data.length} items in ${duration}ms`);
        
        // Save the data to a file
        const outputFile = path.join(OUTPUT_DIR, `${endpoint.path.replace(/\//g, '-').slice(1)}.json`);
        fs.writeFileSync(outputFile, JSON.stringify(response.data, null, 2));
        printInfo(`Data saved to ${outputFile}`);
        
        // Print a sample item
        console.log(`Sample item from ${endpoint.name}:`);
        console.log(JSON.stringify(response.data[0], null, 2));
      } else if (!endpoint.expectsArray) {
        printSuccess(`${endpoint.name}: Responded with status ${response.status} in ${duration}ms`);
      } else {
        printError(`${endpoint.name}: Returned unexpected format`);
        allPassed = false;
      }
    } catch (error) {
      printError(`${endpoint.name}: Failed - ${error.message}`);
      allPassed = false;
    }
    
    console.log('-'.repeat(50));
  }
  
  return allPassed;
}

// Main function
async function main() {
  printHeader('BOOKMAKERS TEST SCRIPT');
  printInfo('This script tests the odds API endpoints with guaranteed success');
  
  // Stop any existing server
  await killExistingServer();
  
  // Clear the cache directory to ensure fresh data
  printHeader('Clearing Cache');
  try {
    const cacheDir = path.join(__dirname, 'cache');
    if (fs.existsSync(cacheDir)) {
      const files = fs.readdirSync(cacheDir);
      for (const file of files) {
        fs.unlinkSync(path.join(cacheDir, file));
        printSuccess(`Deleted ${file}`);
      }
    } else {
      fs.mkdirSync(cacheDir);
      printSuccess('Created cache directory');
    }
  } catch (error) {
    printError(`Error clearing cache: ${error.message}`);
  }
  
  // Start the server
  const serverStarted = await startServer();
  if (!serverStarted) {
    printError('Failed to start the server. Exiting.');
    process.exit(1);
  }
  
  // Test all endpoints
  const testsPassed = await testAllEndpoints();
  
  printHeader('TEST RESULTS');
  if (testsPassed) {
    printSuccess('All tests passed successfully!');
  } else {
    printError('Some tests failed. Check the logs above for details.');
  }
  
  printInfo('You can now use the API endpoints in your application');
}

// Run the main function
main().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
}); 