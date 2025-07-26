# Real Data Solution for Sport Arbitrage

This document outlines the implementation of a real data solution for the Sport Arbitrage system, which exclusively uses The Odds API for fetching live and pre-match odds without any mock data fallbacks.

## Overview

The original system had issues with scraping bookmaker websites directly and would often fall back to mock data when scraping failed. This new solution addresses these problems by:

1. Using The Odds API exclusively as the data source
2. Eliminating all mock data fallbacks
3. Implementing proper caching to reduce API calls
4. Ensuring consistent data formats for the frontend

## Components

### Key Files

- **real-odds-api-manager.js** - Core class for managing real odds data
- **fetch-real-odds.js** - CLI script for fetching odds data
- **real-odds-server.js** - Express server with real-data-only endpoints
- **test-real-odds-api.js** - Test script to validate the API
- **start-real-data-system.sh** - Script to start the entire system
- **stop-real-data-system.sh** - Script to stop all services

## Setup Instructions

### 1. Create .env file

Create a `.env` file in the project root with the following content:

```
# Odds API Configuration
ODDS_API_KEY=your_api_key_here

# Server Configuration
PORT=3001

# Cache Configuration
CACHE_DURATION_MINUTES=15

# Odds API Settings
USE_MOCK_DATA=false
USE_ODDS_API_ONLY=true
```

Replace `your_api_key_here` with your actual API key from [The Odds API](https://the-odds-api.com/).

### 2. Start the System

```bash
./start-real-data-system.sh
```

This script will:
- Check for the `.env` file and create it if missing
- Create necessary directories
- Perform an initial data fetch from The Odds API
- Start a background process to refresh odds data every 15 minutes
- Start the real-data-only API server
- Start the frontend development server

### 3. Stop the System

```bash
./stop-real-data-system.sh
```

## API Endpoints

The real-data-only API server provides the following endpoints:

- **GET /api/odds** - Get all odds data
- **GET /api/odds/:bookmaker** - Get odds for a specific bookmaker
- **GET /api/live-odds** - Get live odds data
- **POST /api/refresh-odds** - Force refresh all odds data
- **GET /health** - Health check endpoint

## Manual Commands

### Fetch Odds Data

```bash
# Fetch all odds data (both live and pre-match)
node fetch-real-odds.js all

# Fetch only pre-match odds
node fetch-real-odds.js prematch

# Fetch only live odds
node fetch-real-odds.js live

# Force refresh all data
node fetch-real-odds.js all --force
```

### Test the API

```bash
# Start the real-data-only server
node real-odds-server.js

# In a different terminal, run the test
node test-real-odds-api.js
```

## Data Flow

1. The Odds API provides data for multiple bookmakers
2. `real-odds-api-manager.js` fetches and processes this data
3. Data is stored in the `public/api/` directory as JSON files
4. The Express server serves this data through its API endpoints
5. The frontend consumes the API data for display and arbitrage calculations

## Troubleshooting

### No Data Available

If you're seeing "No odds data available" errors:

1. Check your API key is valid and has sufficient quota
2. Verify the `.env` file is correctly configured
3. Run `node fetch-real-odds.js all --force` to force a refresh

### API Quota Issues

The Odds API has usage limits. To conserve quota:

1. Use the cached data whenever possible
2. Increase the refresh intervals in the `.env` file
3. Consider upgrading your API subscription for higher limits

## Monitoring

Monitor API usage through the logs when running the fetch scripts. The system will log:

- The number of API calls made
- The number of events retrieved
- Any errors or warnings

## Implementation Notes

### Why Real Data Only?

Using real data exclusively ensures:

1. Accurate arbitrage calculations
2. Reliable betting opportunities
3. Better user experience
4. No misleading mock odds that could cause users to make poor betting decisions

### API Key Security

The API key is stored in the `.env` file which should never be committed to version control. Make sure to:

1. Add `.env` to your `.gitignore` file
2. Never expose your API key in client-side code
3. Rotate your API key if you suspect it has been compromised 