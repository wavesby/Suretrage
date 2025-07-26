import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG_FILE = path.join(__dirname, 'proxy-config.json');
const PROXY_TEST_URL = 'https://api.ipify.org?format=json';
const PROXY_ROTATION_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MAX_CONSECUTIVE_FAILURES = 3;

// No proxies, just direct connection
const DEFAULT_PROXIES = [
  // Direct connection only
  { url: 'direct://', country: 'DIRECT', lastUsed: 0, consecutiveFailures: 0 }
];

// State management
let proxies = DEFAULT_PROXIES;
let currentProxyIndex = 0; // Always use the direct connection
let rotationInterval = null;

/**
 * Initialize the proxy rotation system
 */
export async function initProxyRotation() {
  // Always use the direct connection proxy
  proxies = DEFAULT_PROXIES;
  currentProxyIndex = 0;
  
  // Save the configuration
  saveProxies();
  
  console.log(`Proxy rotation system initialized - using direct connection`);
  
  return true;
}

/**
 * Load proxies from configuration file
 */
function loadProxies() {
  // Always use direct connection regardless of config file
      proxies = DEFAULT_PROXIES;
  currentProxyIndex = 0;
  console.log('Using direct connection (no proxy)');
}

/**
 * Save the current proxy configuration to file
 */
function saveProxies() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(proxies, null, 2));
  } catch (error) {
    console.error(`Error saving proxies: ${error.message}`);
  }
}

/**
 * Start automatic proxy rotation on interval
 */
function startAutoRotation() {
  // No need to rotate with only one direct connection
  if (rotationInterval) {
    clearInterval(rotationInterval);
    rotationInterval = null;
  }
}

/**
 * Get a browser-compatible proxy URL for Playwright
 * @returns {Object} Proxy configuration for Playwright or null for direct connection
 */
export function getProxyForPlaywright() {
  // Always return null for direct connection
  console.log('Using direct connection (no proxy)');
    return null;
}

/**
 * Get the current active proxy
 * @returns {Object} Current proxy
 */
export function getCurrentProxy() {
  return proxies[0]; // Always return the direct connection proxy
}

/**
 * Rotate to the next available proxy
 * @returns {Object} New active proxy
 */
export function rotateProxy() {
  // No need to rotate with only direct connection
  return proxies[0];
}

/**
 * Mark the current proxy as failed
 */
export function markCurrentProxyFailed() {
  // Do nothing, we're using direct connection
  console.log('Direct connection marked as failed - ignoring');
}

/**
 * Mark the current proxy as successful
 */
export function markCurrentProxySuccess() {
  // Do nothing, we're using direct connection
}

/**
 * Test all proxies and update their status
 */
export async function testAllProxies() {
  console.log('Testing direct connection...');
    
    try {
    const response = await axios.get(PROXY_TEST_URL, { timeout: 10000 });
    console.log(`Direct connection working - IP: ${response.data.ip}`);
    return true;
  } catch (error) {
    console.error(`Direct connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Add a new proxy
 */
export function addProxy(url, country) {
  // Ignore - we're only using direct connection
  console.log('Adding proxy ignored - using direct connection only');
  return false;
}

/**
 * Remove a proxy
 */
export function removeProxy(index) {
  // Ignore - we're only using direct connection
  console.log('Removing proxy ignored - using direct connection only');
    return false;
}

// For direct execution as a script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2];
  
  (async () => {
    await initProxyRotation();
    
    switch (command) {
      case 'test':
        console.log('Testing direct connection...');
        const results = await testAllProxies();
        console.log('Test results:', results);
        break;
        
      case 'add':
        const url = process.argv[3];
        const country = process.argv[4];
        if (!url) {
          console.error('Usage: node proxy-rotation.js add <proxy-url> [country]');
          process.exit(1);
        }
        const success = addProxy(url, country);
        console.log(`Added proxy: ${success}`);
        break;
        
      case 'rotate':
        console.log('Rotating proxy...');
        const proxy = rotateProxy();
        console.log('New proxy:', proxy);
        break;
        
      case 'list':
        console.log('Available proxies:');
        proxies.forEach((proxy, index) => {
          console.log(`${index}: ${proxy.url.replace(/:[^:]*@/, ':***@')} (${proxy.country}) - Last used: ${new Date(proxy.lastUsed).toISOString()} - Failures: ${proxy.consecutiveFailures}`);
        });
        break;
        
      default:
        console.log('Available commands: test, add, rotate, list');
        break;
    }
  })();
} 