import axios from 'axios';

// Configuration
const PROXY_URL = 'http://localhost:3001';
const ENDPOINTS = [
  '/health',
  '/api/odds/1xbet',
  '/api/odds/sportybet',
  '/api/odds/all'
];

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

// Test function
async function testEndpoint(endpoint) {
  console.log(`${colors.blue}Testing endpoint: ${endpoint}${colors.reset}`);
  
  try {
    const startTime = Date.now();
    const response = await axios.get(`${PROXY_URL}${endpoint}`, { timeout: 30000 });
    const endTime = Date.now();
    
    console.log(`${colors.green}✓ Status: ${response.status}${colors.reset}`);
    console.log(`${colors.cyan}  Response time: ${endTime - startTime}ms${colors.reset}`);
    
    if (endpoint === '/health') {
      console.log(`${colors.cyan}  Health status: ${response.data.status}${colors.reset}`);
      console.log(`${colors.cyan}  Server time: ${response.data.time}${colors.reset}`);
    } else {
      const data = response.data;
      if (Array.isArray(data)) {
        console.log(`${colors.cyan}  Items received: ${data.length}${colors.reset}`);
        
        if (data.length > 0) {
          console.log(`${colors.yellow}  Sample item:${colors.reset}`);
          const sample = data[0];
          console.log(`    Match: ${sample.match_name}`);
          console.log(`    Bookmaker: ${sample.bookmaker}`);
          console.log(`    Odds: ${sample.odds_home} / ${sample.odds_draw} / ${sample.odds_away}`);
          console.log(`    Updated: ${sample.updated_at}`);
        }
      } else {
        console.log(`${colors.yellow}  Response is not an array${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    
    if (error.response) {
      console.log(`${colors.red}  Status: ${error.response.status}${colors.reset}`);
      console.log(`${colors.red}  Data: ${JSON.stringify(error.response.data)}${colors.reset}`);
    }
  }
  
  console.log(''); // Empty line for readability
}

// Main function
async function runTests() {
  console.log(`${colors.magenta}=== Sport Arbitrage Proxy Server Test ====${colors.reset}`);
  console.log(`${colors.yellow}Testing server at: ${PROXY_URL}${colors.reset}`);
  console.log('');
  
  // First test health endpoint
  await testEndpoint('/health');
  
  // Then test data endpoints
  for (const endpoint of ENDPOINTS.filter(e => e !== '/health')) {
    await testEndpoint(endpoint);
  }
  
  console.log(`${colors.magenta}=== Test Complete ====${colors.reset}`);
}

// Run the tests
console.log(`${colors.yellow}Starting tests...${colors.reset}`);
console.log(`${colors.yellow}Make sure the proxy server is running on ${PROXY_URL}${colors.reset}`);
console.log('');

runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
}); 