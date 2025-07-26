# Real Odds Extraction Improvements

This document explains the improvements made to the real odds extraction system to ensure we get accurate data from 1xBet and SportyBet.

## Issues Identified & Fixed

### 1. 1xBet Team Name Parsing Issues

**Problem:** The initial scraper was extracting incorrect team names like "Russia. Premier League1X21X12 2XOTotalU+6 vs Russia. Premier League".

**Solution:**
- Added specialized text cleaning to remove betting terms like "1X2", "O/U", "Total", etc.
- Implemented multi-strategy team name extraction that tries different separators
- Added filtering to ensure only real team names are extracted

### 2. Fixed Odds Values

**Problem:** All odds were being extracted as fixed values (2, 12, 12) instead of actual odds.

**Solution:**
- Implemented better odds element identification
- Added validation to ensure odds are within reasonable ranges
- Improved parsing of numeric values

### 3. SportyBet Mock Data Fallback

**Problem:** SportyBet was falling back to mock data rather than extracting real odds.

**Solution:**
- Updated selectors to match the current SportyBet website structure
- Added more robust match container detection
- Improved error handling and retry logic

## Key Improvements in Scraping Logic

1. **Better Text Cleaning:**
   - Regular expressions to remove betting terms: `/1X2|1X|12|X2|O\/U|Total|[+]\d+|TG/g`
   - Trying multiple separators: `[' vs ', ' - ', ' – ', '—']`

2. **Multi-Strategy Team Detection:**
   - First tries to find elements containing both teams
   - Falls back to finding separate elements for home/away teams
   - Uses length filtering to avoid short, meaningless text

3. **Enhanced Odds Extraction:**
   - More specific selectors: `span[class*="coef"], span[class*="odd"], button, [class*="bet"]`
   - Value validation: `!isNaN(value) && value > 1 && value < 20`
   - Proper numeric parsing: `parseFloat(text.replace(',', '.'))`

4. **Better League & Match Time Extraction:**
   - Specialized selectors for each type of information
   - Meaningful defaults when information can't be found

## Browser Automation Improvements

1. **Visual Debugging:**
   - Screenshots saved for manual inspection
   - HTML content saved for selector analysis
   - Detailed console logging

2. **Stealth Settings:**
   - Improved user agent rotation
   - Disabled automation flags
   - Added proper timeout handling

3. **Headless Mode:**
   - Development: Non-headless for visual debugging
   - Production: Headless for performance

## Fallback System

The system still includes a smart fallback to mock data when:
- Real extraction fails completely
- Website structure changes dramatically
- Site is temporarily down or blocking scrapers

## Using the Improved System

1. Run `./start-real-odds.sh` to start the extraction server
2. Access real odds via the API endpoints:
   - `http://localhost:3001/api/odds/1xbet`
   - `http://localhost:3001/api/odds/sportybet`
   - `http://localhost:3001/api/odds/all`

## Maintaining the Solution

To keep the scraper working when websites change:

1. Check the saved HTML (`cache/1xbet-page.html` and `cache/sportybet-page.html`)
2. Analyze the HTML structure and update selectors if needed
3. Look at screenshots to visually confirm what's being extracted
4. Edit the extraction functions in `real-odds-extractor.js`

The improved scraper is much more resilient to website changes and should work reliably to extract real odds data from both bookmakers. 