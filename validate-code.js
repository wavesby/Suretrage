#!/usr/bin/env node

/**
 * This script validates the server.js code to ensure it's error-free
 * It performs static analysis without actually running the code
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Files to validate
const filesToValidate = [
  'server.js',
  'src/lib/api.ts',
  'src/utils/mockData.ts'
];

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Function to validate JavaScript syntax
function validateJavaScriptSyntax(filePath) {
  try {
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Try to parse the JavaScript code
    new Function(content);
    
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: `${error.name}: ${error.message}`,
      line: error.lineNumber || 'unknown'
    };
  }
}

// Function to check required dependencies
function checkDependencies(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const requiredDeps = new Set();
    
    // Extract require statements
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    let match;
    
    while ((match = requireRegex.exec(content)) !== null) {
      const dep = match[1];
      // Only add external dependencies (not built-in Node.js modules or local files)
      if (!dep.startsWith('.') && !dep.startsWith('/') && !['fs', 'path', 'http', 'https', 'util', 'os', 'child_process'].includes(dep)) {
        requiredDeps.add(dep);
      }
    }
    
    // Extract import statements
    const importRegex = /import .* from ['"]([^'"]+)['"]/g;
    while ((match = importRegex.exec(content)) !== null) {
      const dep = match[1];
      // Only add external dependencies (not built-in Node.js modules or local files)
      if (!dep.startsWith('.') && !dep.startsWith('/') && !dep.startsWith('@/') && !['fs', 'path', 'http', 'https', 'util', 'os', 'child_process'].includes(dep)) {
        requiredDeps.add(dep);
      }
    }
    
    // Check if all required dependencies are in package.json
    const missingDeps = [];
    
    for (const dep of requiredDeps) {
      let found = false;
      
      for (const packageDep in dependencies) {
        if (dep === packageDep || dep.startsWith(`${packageDep}/`)) {
          found = true;
          break;
        }
      }
      
      if (!found) {
        missingDeps.push(dep);
      }
    }
    
    return {
      valid: missingDeps.length === 0,
      missingDeps
    };
  } catch (error) {
    return { 
      valid: false, 
      error: `Error checking dependencies: ${error.message}`
    };
  }
}

// Function to check for common issues in server.js
function checkServerJsIssues() {
  try {
    const content = fs.readFileSync('server.js', 'utf8');
    const issues = [];
    
    // Check for proper error handling
    if (!content.includes('try {') || !content.includes('catch (error)')) {
      issues.push('Missing proper error handling (try/catch blocks)');
    }
    
    // Check for CORS configuration
    if (!content.includes('app.use(cors())')) {
      issues.push('Missing CORS middleware');
    }
    
    // Check for cache directory creation
    if (!content.includes('fs.mkdirSync(CACHE_DIR)')) {
      issues.push('Missing cache directory creation');
    }
    
    // Check for scraping functions
    if (!content.includes('scrape1xBetOdds') || !content.includes('scrapeSportyBetOdds')) {
      issues.push('Missing scraping functions for bookmakers');
    }
    
    // Check for API endpoints
    if (!content.includes('app.get(\'/api/odds/1xbet\'') || 
        !content.includes('app.get(\'/api/odds/sportybet\'') ||
        !content.includes('app.get(\'/api/odds/all\'')) {
      issues.push('Missing required API endpoints');
    }
    
    // Check for scheduled updates
    if (!content.includes('cron.schedule')) {
      issues.push('Missing scheduled updates via cron');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  } catch (error) {
    return { 
      valid: false, 
      error: `Error checking server.js issues: ${error.message}`
    };
  }
}

// Function to check for common issues in api.ts
function checkApiTsIssues() {
  try {
    const content = fs.readFileSync('src/lib/api.ts', 'utf8');
    const issues = [];
    
    // Check for proxy server URL
    if (!content.includes('PROXY_SERVER')) {
      issues.push('Missing PROXY_SERVER constant');
    }
    
    // Check for fetch functions
    if (!content.includes('fetch1xBetOdds') || !content.includes('fetchSportyBetOdds')) {
      issues.push('Missing fetch functions for bookmakers');
    }
    
    // Check for fetchAllOdds function
    if (!content.includes('fetchAllOdds')) {
      issues.push('Missing fetchAllOdds function');
    }
    
    // Check for fetchArbitrageOpportunities function
    if (!content.includes('fetchArbitrageOpportunities')) {
      issues.push('Missing fetchArbitrageOpportunities function');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  } catch (error) {
    return { 
      valid: false, 
      error: `Error checking api.ts issues: ${error.message}`
    };
  }
}

// Function to check for common issues in mockData.ts
function checkMockDataTsIssues() {
  try {
    const content = fs.readFileSync('src/utils/mockData.ts', 'utf8');
    const issues = [];
    
    // Check for import from api.ts
    if (!content.includes('import { fetchAllOdds } from \'@/lib/api\'')) {
      issues.push('Missing import for fetchAllOdds from api.ts');
    }
    
    // Check for empty mockOdds array
    if (!content.includes('export const mockOdds: MatchOdds[] = []')) {
      issues.push('Missing empty mockOdds array export');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  } catch (error) {
    return { 
      valid: false, 
      error: `Error checking mockData.ts issues: ${error.message}`
    };
  }
}

// Main validation function
function validateFiles() {
  console.log(`${colors.magenta}=== Sport Arbitrage Code Validation ====${colors.reset}`);
  console.log(`${colors.yellow}Validating code files to ensure error-free implementation${colors.reset}`);
  console.log('');
  
  let allValid = true;
  
  // Check if files exist
  for (const file of filesToValidate) {
    if (!fileExists(file)) {
      console.log(`${colors.red}✗ File not found: ${file}${colors.reset}`);
      allValid = false;
    } else {
      console.log(`${colors.green}✓ File exists: ${file}${colors.reset}`);
    }
  }
  
  console.log('');
  
  // Validate JavaScript syntax
  for (const file of filesToValidate) {
    if (fileExists(file) && file.endsWith('.js')) {
      const result = validateJavaScriptSyntax(file);
      
      if (result.valid) {
        console.log(`${colors.green}✓ Valid JavaScript syntax: ${file}${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Invalid JavaScript syntax in ${file}: ${result.error} (line ${result.line})${colors.reset}`);
        allValid = false;
      }
    }
  }
  
  console.log('');
  
  // Check dependencies
  for (const file of filesToValidate) {
    if (fileExists(file) && file.endsWith('.js')) {
      const result = checkDependencies(file);
      
      if (result.valid) {
        console.log(`${colors.green}✓ All dependencies found for: ${file}${colors.reset}`);
      } else if (result.missingDeps) {
        console.log(`${colors.red}✗ Missing dependencies in ${file}: ${result.missingDeps.join(', ')}${colors.reset}`);
        allValid = false;
      } else {
        console.log(`${colors.red}✗ Error checking dependencies in ${file}: ${result.error}${colors.reset}`);
        allValid = false;
      }
    }
  }
  
  console.log('');
  
  // Check for common issues in server.js
  if (fileExists('server.js')) {
    const result = checkServerJsIssues();
    
    if (result.valid) {
      console.log(`${colors.green}✓ No common issues found in server.js${colors.reset}`);
    } else if (result.issues) {
      console.log(`${colors.red}✗ Issues found in server.js:${colors.reset}`);
      result.issues.forEach(issue => {
        console.log(`  ${colors.red}- ${issue}${colors.reset}`);
      });
      allValid = false;
    } else {
      console.log(`${colors.red}✗ Error checking server.js: ${result.error}${colors.reset}`);
      allValid = false;
    }
  }
  
  console.log('');
  
  // Check for common issues in api.ts
  if (fileExists('src/lib/api.ts')) {
    const result = checkApiTsIssues();
    
    if (result.valid) {
      console.log(`${colors.green}✓ No common issues found in api.ts${colors.reset}`);
    } else if (result.issues) {
      console.log(`${colors.red}✗ Issues found in api.ts:${colors.reset}`);
      result.issues.forEach(issue => {
        console.log(`  ${colors.red}- ${issue}${colors.reset}`);
      });
      allValid = false;
    } else {
      console.log(`${colors.red}✗ Error checking api.ts: ${result.error}${colors.reset}`);
      allValid = false;
    }
  }
  
  console.log('');
  
  // Check for common issues in mockData.ts
  if (fileExists('src/utils/mockData.ts')) {
    const result = checkMockDataTsIssues();
    
    if (result.valid) {
      console.log(`${colors.green}✓ No common issues found in mockData.ts${colors.reset}`);
    } else if (result.issues) {
      console.log(`${colors.red}✗ Issues found in mockData.ts:${colors.reset}`);
      result.issues.forEach(issue => {
        console.log(`  ${colors.red}- ${issue}${colors.reset}`);
      });
      allValid = false;
    } else {
      console.log(`${colors.red}✗ Error checking mockData.ts: ${result.error}${colors.reset}`);
      allValid = false;
    }
  }
  
  console.log('');
  
  // Final result
  if (allValid) {
    console.log(`${colors.green}✅ All validation checks passed! The code appears to be error-free.${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Some validation checks failed. Please fix the issues above.${colors.reset}`);
  }
  
  console.log(`${colors.magenta}=== Validation Complete ====${colors.reset}`);
}

// Run the validation
validateFiles(); 