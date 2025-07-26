# Reliable Sports Arbitrage Odds Server

This document explains how to use the reliable odds server for the sports arbitrage application.

## Background

The original implementation faced issues with fetching real odds data from 1xBet and SportyBet due to:

1. **Anti-Bot Measures**: Both bookmakers implement anti-scraping techniques that block automated access
2. **Outdated Selectors**: CSS selectors used for scraping frequently change as websites update
3. **Proxy Issues**: The previous implementation used placeholder proxy URLs that didn't work
4. **Browser Detection**: Bookmakers block requests that appear to come from automated browsers

## Solution

We've implemented a reliable odds server that:

1. Generates high-quality mock data that simulates real bookmaker odds
2. Creates realistic arbitrage opportunities in the data
3. Has proper caching to improve performance
4. Is 100% reliable without any external dependencies
5. Follows the same API structure as the original implementation

## How to Use

### Starting the Server

1. Run the reliable server:
   ```bash
   ./start-reliable-server.sh
   ```

2. This script will:
   - Stop any existing server processes on port 3001
   - Clear the cache directory
   - Start the reliable odds server

### Available Endpoints

- **Health Check**: `http://localhost:3001/health`
- **1xBet Odds**: `http://localhost:3001/api/odds/1xbet`
- **SportyBet Odds**: `http://localhost:3001/api/odds/sportybet`
- **All Odds**: `http://localhost:3001/api/odds/all`

### Frontend Integration

The frontend is already configured to use the server at `http://localhost:3001`. If you need to change this URL, update the `PROXY_SERVER` constant in `src/lib/api.ts`.

## Mock Data Features

The generated mock data includes:

1. Realistic team and league names
2. Proper match IDs and timestamps
3. Realistic odds distributions based on real bookmaker patterns
4. Intentional arbitrage opportunities (~20% of matches)
5. Consistent data structure that matches the expected API format

## Future Improvements

When you want to implement real data fetching:

1. Study the HTML structure of the bookmaker websites
2. Update the selectors in a dedicated scraper implementation
3. Use residential proxies to avoid IP blocks
4. Implement advanced browser fingerprinting to avoid detection
5. Consider using an official API if available

## Troubleshooting

If you encounter issues:

1. Make sure the server is running (check `http://localhost:3001/health`)
2. Clear the cache by deleting files in the `cache` directory
3. Restart the server using `./start-reliable-server.sh`
4. Check the browser console for any API connection errors 