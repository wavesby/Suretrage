import axios from 'axios';
import fs from 'fs';

// Configuration
const SERVER_URL = 'http://localhost:3001';
const TIMEOUT = 30000; // 30 seconds
const OUTPUT_FILE = 'api-test-report.json';

// Color console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Helper functions
const formatTime = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const printHeader = (title) => {
  console.log(`\n${colors.bold}${colors.magenta}${title}${colors.reset}\n${'-'.repeat(title.length)}`);
};

const printSuccess = (message) => console.log(`${colors.green}✓ ${message}${colors.reset}`);
const printError = (message) => console.log(`${colors.red}✗ ${message}${colors.reset}`);
const printWarning = (message) => console.log(`${colors.yellow}! ${message}${colors.reset}`);
const printInfo = (message) => console.log(`${colors.cyan}ℹ ${message}${colors.reset}`);

// Execute the test
async function runTests() {
  printHeader('API Connection Test Report');
  console.log(`Testing server at: ${colors.blue}${SERVER_URL}${colors.reset}`);
  
  const report = {
    timestamp: new Date().toISOString(),
    serverUrl: SERVER_URL,
    endpoints: {},
    summary: {
      total: 0,
      success: 0,
      failure: 0,
      mockData: 0
    }
  };

  // Test endpoints
  const endpoints = [
    { name: 'Health Check', path: '/health', expectsArray: false },
    { name: '1xBet Odds', path: '/api/odds/1xbet', expectsArray: true },
    { name: 'SportyBet Odds', path: '/api/odds/sportybet', expectsArray: true },
    { name: 'All Odds', path: '/api/odds/all', expectsArray: true }
  ];

  for (const endpoint of endpoints) {
    report.summary.total++;
    
    printInfo(`Testing ${endpoint.name}...`);
    
    try {
      const startTime = Date.now();
      const response = await axios.get(`${SERVER_URL}${endpoint.path}`, { timeout: TIMEOUT });
      const duration = Date.now() - startTime;
      
      const endpointReport = {
        statusCode: response.status,
        duration,
        formattedDuration: formatTime(duration),
        success: false,
        error: null,
        dataInfo: {}
      };

      // Check if response has expected format
      if (endpoint.expectsArray && Array.isArray(response.data)) {
        endpointReport.success = true;
        endpointReport.dataInfo = {
          count: response.data.length,
          isMockData: checkIfMockData(response.data, endpoint.path),
          sampleData: response.data.slice(0, 2)
        };

        if (endpointReport.dataInfo.isMockData) {
          printWarning(`${endpoint.name} returned mock data (${response.data.length} items) in ${formatTime(duration)}`);
          report.summary.mockData++;
        } else {
          printSuccess(`${endpoint.name} returned ${response.data.length} items in ${formatTime(duration)}`);
          report.summary.success++;
        }
      } else if (!endpoint.expectsArray) {
        endpointReport.success = true;
        endpointReport.dataInfo = {
          isMockData: false,
          data: response.data
        };
        printSuccess(`${endpoint.name} responded in ${formatTime(duration)}`);
        report.summary.success++;
      } else {
        endpointReport.success = false;
        endpointReport.error = 'Unexpected data format';
        printError(`${endpoint.name} returned unexpected format in ${formatTime(duration)}`);
        report.summary.failure++;
      }

      report.endpoints[endpoint.path] = endpointReport;
    } catch (error) {
      const endpointReport = {
        success: false,
        error: {
          message: error.message,
          code: error.code
        }
      };
      
      report.endpoints[endpoint.path] = endpointReport;
      report.summary.failure++;
      
      printError(`${endpoint.name} failed: ${error.message}`);
    }
  }

  // Print summary
  printHeader('Test Summary');
  console.log(`Total Endpoints: ${report.summary.total}`);
  console.log(`Success: ${colors.green}${report.summary.success}${colors.reset}`);
  console.log(`Using Mock Data: ${colors.yellow}${report.summary.mockData}${colors.reset}`);
  console.log(`Failures: ${colors.red}${report.summary.failure}${colors.reset}`);

  // Overall status
  if (report.summary.failure > 0) {
    printError(`Overall Status: Some tests failed!`);
  } else if (report.summary.mockData > 0) {
    printWarning(`Overall Status: All tests passed, but some using mock data`);
  } else {
    printSuccess(`Overall Status: All tests passed successfully!`);
  }

  // Save report to file
  try {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
    printInfo(`Report saved to ${OUTPUT_FILE}`);
  } catch (error) {
    printError(`Failed to save report: ${error.message}`);
  }

  return report;
}

// Helper to determine if the data appears to be mock data
function checkIfMockData(data, endpoint) {
  if (!data || data.length === 0) return true;
  
  // Check for common indicators of mock data
  const mockDataIndicators = [
    // Check for predictable patterns in generated IDs
    (item) => item.match_id?.includes('_0') && item.match_id?.includes('_1'),
    // Check for popular teams that are often used in mock data
    (item) => {
      const popularTeams = ['Arsenal', 'Liverpool', 'Manchester United', 'Chelsea', 'Barcelona', 'Real Madrid'];
      return popularTeams.some(team => 
        item.home_team?.includes(team) || 
        item.away_team?.includes(team) ||
        item.team_home?.includes(team) || 
        item.team_away?.includes(team));
    }
  ];
  
  // Sample up to 5 items
  const sampleItems = data.slice(0, 5);
  let mockScoreSample = 0;
  
  for (const item of sampleItems) {
    for (const indicator of mockDataIndicators) {
      if (indicator(item)) {
        mockScoreSample++;
        break;
      }
    }
  }

  // If most items match mock indicators, it's likely mock data
  const mockDataThreshold = sampleItems.length * 0.6;
  return mockScoreSample >= mockDataThreshold;
}

// Run tests
runTests().catch(error => {
  printError(`Test execution failed: ${error.message}`);
  process.exit(1);
}); 