#!/usr/bin/env node

/**
 * Build verification script for Netlify deployment
 * This script helps identify potential build issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying build configuration...\n');

// Check if package.json exists and is valid
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ package.json is valid');
  console.log(`   - Name: ${packageJson.name}`);
  console.log(`   - Version: ${packageJson.version}`);
  console.log(`   - Build script: ${packageJson.scripts.build}`);
} catch (error) {
  console.error('❌ package.json is invalid:', error.message);
  process.exit(1);
}

// Check if netlify.toml exists
if (fs.existsSync('netlify.toml')) {
  console.log('✅ netlify.toml exists');
} else {
  console.error('❌ netlify.toml not found');
  process.exit(1);
}

// Check if netlify functions directory exists
if (fs.existsSync('netlify/functions')) {
  console.log('✅ netlify/functions directory exists');
  
  // Check if functions have proper structure
  const functions = fs.readdirSync('netlify/functions');
  console.log(`   - Found ${functions.length} functions:`, functions.join(', '));
} else {
  console.error('❌ netlify/functions directory not found');
  process.exit(1);
}

// Check if src directory exists
if (fs.existsSync('src')) {
  console.log('✅ src directory exists');
} else {
  console.error('❌ src directory not found');
  process.exit(1);
}

// Check if vite.config.ts exists
if (fs.existsSync('vite.config.ts')) {
  console.log('✅ vite.config.ts exists');
} else {
  console.error('❌ vite.config.ts not found');
  process.exit(1);
}

// Check Node.js version
const nodeVersion = process.version;
console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if .nvmrc exists
if (fs.existsSync('.nvmrc')) {
  const nvmrcVersion = fs.readFileSync('.nvmrc', 'utf8').trim();
  console.log(`✅ .nvmrc specifies Node.js ${nvmrcVersion}`);
} else {
  console.log('⚠️  .nvmrc not found (optional)');
}

console.log('\n🎉 Build verification completed successfully!');
console.log('   Your project is ready for Netlify deployment.'); 