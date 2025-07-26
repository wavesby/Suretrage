# Real Pre-Match Games Scraping Solution

This document explains our specialized solution for extracting real pre-match games from 1xBet and SportyBet bookmakers.

## Overview

Our enhanced solution focuses specifically on extracting real pre-match games using advanced browser automation and scraping techniques that:

1. Directly target pre-match game sections on bookmaker websites
2. Use advanced anti-detection measures to avoid being blocked
3. Employ multiple extraction strategies to adapt to different page layouts
4. Implement human-like browsing behavior to appear as a normal user
5. Properly parse and format team names, odds values, and match times

## Key Features

### Advanced Anti-Detection Measures

The scraper uses multiple techniques to avoid detection:

- **Stealth Browser Settings**: Disables automation flags and fingerprinting
- **User Agent Rotation**: Changes browser identification on each run
- **Human-like Scrolling**: Scrolls the page gradually with random pauses
- **Multiple Entry Points**: Tries several URLs to access the betting markets
- **Custom Headers**: Uses normal browser request headers
- **Cookie Handling**: Sets cookies like a regular user

### Multiple Extraction Strategies

Instead of relying on fixed selectors that can break, the scraper uses multiple strategies:

1. **Direct Match Containers**: Looks for DOM elements that clearly contain matches
2. **Table-based Layout**: Extracts data from table structures common in betting sites
3. **Generic Approach**: Uses text patterns and proximity analysis to find matches when other methods fail

### Proper Data Formatting

The scraper ensures all data is properly formatted to match your expected structure:

- **Clean Team Names**: Removes ID prefixes and cleans up team names
- **Consistent Odds Format**: Extracts and validates odds values
- **Formatted Match Times**: Converts various time formats to your preferred format
- **Complete Match Records**: Ensures all fields are properly populated

## How to Use

### Starting the Pre-Match Scraper

Run the following command to start the pre-match scraper:

```bash
./start-real-prematch.sh
```

This script will:
- Stop any existing servers on port 3001
- Install required dependencies
- Start the pre-match scraper in headless mode
- Begin extracting real pre-match data in the background

### API Endpoints

Once the server is running, you can access the following endpoints:

- `http://localhost:3001/health` - Health check endpoint
- `http://localhost:3001/api/odds/1xbet` - Get real pre-match games from 1xBet
- `http://localhost:3001/api/odds/sportybet` - Get real pre-match games from SportyBet
- `http://localhost:3001/api/odds/all` - Get real pre-match games from both bookmakers

### Stopping the Server

To stop the pre-match scraper, run:

```bash
./stop-prematch-scraper.sh
```

## Monitoring and Debugging

### Log Files

You can monitor the scraper's progress and debug issues using the log file:

```bash
tail -f prematch-scraper.log
```

### Cached Data

Scraped data is cached for 2 minutes to reduce load on the bookmaker websites. You can find the cached data in:

- `cache/1xbet_odds.json`
- `cache/sportybet_odds.json`

### Screenshots and HTML

For debugging purposes, the scraper saves:

- Screenshots of the loaded pages
- Complete HTML of the loaded pages

These files are stored in the `cache` directory and can be used to analyze why extraction might be failing and how to improve selectors.

## Fallback Mechanism

If real scraping fails for any reason, the system falls back to high-quality sample data that matches the exact format you require. This ensures your application never fails due to scraping issues while still providing an opportunity to get real data when possible.

## Technical Notes

### Browser Launch Options

The browser is launched in headless mode in production (set by the start script) but can be changed to non-headless mode for debugging by editing the script or directly modifying `real-prematch-scraper.js`.

### Cache Duration

The cache duration is set to 2 minutes for real data, which strikes a balance between having fresh odds and not overwhelming the bookmaker websites with requests. This can be adjusted in the script if needed.

### Multiple Selectors

The scraper uses multiple selectors to adapt to website changes. If certain selectors stop working, the system will automatically try others, increasing resilience to website updates. 