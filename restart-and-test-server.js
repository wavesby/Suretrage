import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import fs from 'fs';

const execAsync = promisify(exec);

// Configuration
const SERVER_URL = 'http://localhost:3001';
const TIMEOUT = 10000;

async function killExistingServer() {
  console.log('Killing any existing Node.js server processes...');
  try {
    if (process.platform === 'win32') {
      await execAsync('taskkill /F /IM node.exe /T');
    } else {
      // Find PIDs of processes on port 3001
      const { stdout } = await execAsync("lsof -i :3001 -t");
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        for (const pid of pids) {
          await execAsync(`kill -9 ${pid}`);
        }
      }
    }
    console.log('✅ Existing server processes killed');
  } catch (error) {
    // Ignore errors, likely no processes were found
    console.log('No existing server processes found');
  }
}

async function startServer() {
  console.log('Starting server...');
  
  // Start server in a separate process
  const serverProcess = exec('node server.js');
  
  serverProcess.stdout.on('data', (data) => {
    console.log(`SERVER: ${data.trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`SERVER ERROR: ${data.trim()}`);
  });
  
  // Wait for server to start
  let attempts = 0;
  while (attempts < 10) {
    try {
      await axios.get(`${SERVER_URL}/health`, { timeout: 2000 });
      console.log('✅ Server started successfully');
      return true;
    } catch (error) {
      attempts++;
      console.log(`Waiting for server to start (${attempts}/10)...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.error('❌ Failed to start server');
  return false;
}

async function testOddsEndpoints() {
  console.log('\nTesting odds endpoints...');
  
  const endpoints = [
    { name: '1xBet Odds', path: '/api/odds/1xbet' },
    { name: 'SportyBet Odds', path: '/api/odds/sportybet' },
    { name: 'All Odds', path: '/api/odds/all' }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint.name}...`);
    try {
      const response = await axios.get(`${SERVER_URL}${endpoint.path}`, { timeout: TIMEOUT });
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        const isMockData = checkIfMockData(response.data);
        
        if (isMockData) {
          console.log(`⚠️ ${endpoint.name} returned mock data (${response.data.length} items)`);
        } else {
          console.log(`✅ ${endpoint.name} returned real data (${response.data.length} items)`);
          
          // Save real data for inspection
          fs.writeFileSync(`${endpoint.path.replace(/\//g, '-').slice(1)}.json`, 
            JSON.stringify(response.data, null, 2));
        }
        
        // Log a sample match
        console.log('Sample match:');
        console.log(JSON.stringify(response.data[0], null, 2));
      } else {
        console.log(`❌ ${endpoint.name} returned no data`);
      }
    } catch (error) {
      console.error(`❌ ${endpoint.name} failed: ${error.message}`);
    }
    
    console.log('----------------------------');
  }
}

// Function to check if data is mock data
function checkIfMockData(data) {
  if (!data || data.length === 0) return true;
  
  // Check if data contains these patterns that are common in mock data
  const mockPatterns = [
    (item) => item.match_id?.includes('_0') && item.match_id?.includes(Date.now().toString().substring(0, 6)),
    (item) => ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Barcelona', 'Real Madrid'].includes(item.team_home)
  ];
  
  // Sample a few items
  const sampleSize = Math.min(5, data.length);
  let mockPatternMatches = 0;
  
  for (let i = 0; i < sampleSize; i++) {
    const item = data[i];
    for (const pattern of mockPatterns) {
      if (pattern(item)) {
        mockPatternMatches++;
        break;
      }
    }
  }
  
  // If more than half of the samples match mock patterns
  return mockPatternMatches >= Math.ceil(sampleSize / 2);
}

async function main() {
  console.log('======================================');
  console.log('SPORTS ARBITRAGE SERVER TEST');
  console.log('======================================');
  
  // Kill any existing server
  await killExistingServer();
  
  // Clear cache
  console.log('\nClearing cache...');
  try {
    const cacheDir = './cache';
    if (fs.existsSync(cacheDir)) {
      for (const file of fs.readdirSync(cacheDir)) {
        fs.unlinkSync(`${cacheDir}/${file}`);
      }
      console.log('✅ Cache cleared');
    } else {
      fs.mkdirSync(cacheDir);
      console.log('✅ Cache directory created');
    }
  } catch (error) {
    console.error('❌ Failed to clear cache:', error.message);
  }
  
  // Start server
  const serverStarted = await startServer();
  if (!serverStarted) {
    console.error('Failed to start server, exiting test');
    process.exit(1);
  }
  
  // Test odds endpoints
  await testOddsEndpoints();
  
  console.log('\nTest completed!');
  console.log('You can now manually verify the odds data');
}

main().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
}); 