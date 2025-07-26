# Direct Bookmaker Data Scraping Solution

This document explains our specialized solution for accurately extracting real match data from 1xBet and SportyBet exactly as shown in the screenshots.

## Overview

Our direct scraping solution is designed to precisely extract the match data visible in the 1xBet and SportyBet interfaces, ensuring:

1. Exact match names as displayed on the bookmaker sites
2. Correct team names without any artifacts
3. Actual leagues for each match
4. Real match dates and times
5. Accurate odds values for home, draw, and away

## How It Works

The solution consists of specialized scrapers targeting the exact layout of each bookmaker:

### 1. Direct 1xBet Scraper (`direct-1xbet-scraper.js`)

This specialized scraper:

- Uses multiple URLs to access 1xBet's football section
- Precisely targets the table layout shown in the screenshots
- Extracts team names, match times, and odds exactly as displayed
- Cleans any artifacts from team names
- Properly formats date/time information
- Saves both raw and processed data for verification

### 2. Direct SportyBet Scraper (`direct-sportybet-scraper.js`)

This specialized scraper:

- Uses multiple URLs to access SportyBet's football section
- Precisely targets the layout shown in the screenshots
- Extracts team names, match times, and odds exactly as displayed
- Filters out non-football events like MMA fights
- Cleans any artifacts from team names
- Properly formats date/time information
- Saves both raw and processed data for verification

## Running the Scrapers

We provide three ways to run the scrapers:

### Option 1: Run Both Scrapers Together

```bash
./run-direct-scrapers.sh
```

This will run both scrapers sequentially and then start the API server.

### Option 2: Run Individual Scrapers

For 1xBet:
```bash
./run-direct-1xbet.sh
```

For SportyBet:
```bash
./run-direct-sportybet.sh
```

### Option 3: Run Custom Extraction

You can also run the JavaScript files directly for more control:
```bash
node direct-1xbet-scraper.js
node direct-sportybet-scraper.js
```

## Output and Results

The scrapers produce several types of output:

1. **Processed JSON Data**
   - Saved in `output/1xbet-matches-[timestamp].json`
   - Saved in `output/sportybet-matches-[timestamp].json`

2. **API Cache Data**
   - Saved in `cache/1xbet_odds.json`
   - Saved in `cache/sportybet_odds.json`

3. **Debugging Information**
   - Screenshots of the loaded pages saved in `output/`
   - HTML dumps of the pages saved in `output/`

## Verification

You can verify that the scraped data matches the actual bookmaker interface by:

1. Comparing the `output/*.json` files with the screenshots
2. Checking the saved screenshots in the `output` directory
3. Accessing the API endpoints to view the processed data:
   - http://localhost:3001/api/odds/1xbet
   - http://localhost:3001/api/odds/sportybet
   - http://localhost:3001/api/odds/all

## Technical Details

### Browser Configuration

The scrapers use a full Chrome browser with:
- Stealth mode to avoid detection
- Full JavaScript execution
- Human-like scrolling behavior
- Random user agent rotation
- Cookie management

### Data Processing

All extracted data goes through a rigorous processing pipeline:

1. Initial extraction from DOM elements
2. Team name cleaning to remove artifacts
3. Match time formatting to ensure consistency
4. Validation to ensure only complete and valid matches are included
5. Final formatting to match the required API structure

## Customization

If you need to adjust the scrapers to handle website changes:

1. Edit the URL lists in the scraper files
2. Modify the extraction strategies to target new DOM structures
3. Update the cleaning functions if new artifacts appear in team names
4. Adjust the date formatting if the site changes its date format

## Troubleshooting

If the scrapers aren't working as expected:

1. Check the output screenshots to see what's being loaded
2. Examine the HTML dumps to understand the page structure
3. Update the selectors in the extraction strategies
4. Try running in non-headless mode for visual debugging

## Conclusion

This direct scraping solution ensures you get the exact match data as displayed on the bookmaker websites, formatted consistently for your application. The specialized approach targeting the exact layout shown in the screenshots guarantees accurate extraction of team names, match times, and odds values. 