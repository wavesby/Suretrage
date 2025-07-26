# Real Odds Fetching Guide

This guide explains how to extract real odds data from 1xBet and SportyBet for the sports arbitrage application.

## Real Odds Extraction

### How It Works

The `real-odds-extractor.js` script uses advanced web scraping techniques to extract real odds from bookmaker websites:

1. **Browser Automation**: Uses Playwright to control a headless Chrome browser that simulates a real user
2. **Multiple Selectors**: Tries various CSS selectors to adapt to website changes
3. **Resilient Extraction**: Uses multiple strategies to find team names and odds values
4. **Smart Fallback**: Only uses mock data if real data extraction fails
5. **Caching**: Stores extracted data to minimize scraping frequency

### Starting the Real Odds Server

1. Run the real odds extraction server:
   ```bash
   ./start-real-odds.sh
   ```

2. This script will:
   - Stop any existing server on port 3001
   - Install required dependencies
   - Start the real odds extraction server
   - Perform initial scraping to populate the cache

3. Once running, you can access:
   - 1xBet odds: `http://localhost:3001/api/odds/1xbet`
   - SportyBet odds: `http://localhost:3001/api/odds/sportybet`
   - All odds: `http://localhost:3001/api/odds/all`

### Stopping the Server

To stop the server:
```bash
./stop-real-odds.sh
```

## Troubleshooting & Maintenance

### Examining Extracted Data

After running the scraper, you can examine what was extracted:

1. Check log files:
   ```bash
   tail -f real-odds.log
   ```

2. View extracted HTML and screenshots:
   ```bash
   ls -la cache/
   ```

3. Analyze cache data:
   ```bash
   cat cache/1xbet_odds.json | jq
   cat cache/sportybet_odds.json | jq
   ```

### Updating Selectors

If the bookmakers change their website structure, you may need to update the selectors:

1. Open `real-odds-extractor.js`
2. Find the `matchSelectors` array in the scraping function for each bookmaker
3. Add new selectors based on the website's current HTML structure

### Common Issues

1. **No Matches Extracted**: This usually means the selectors need updating. Look at the saved HTML in the cache directory and update selectors.

2. **Connection Errors**: The bookmaker might be blocking your IP address. Consider:
   - Using a residential proxy service
   - Adding more delays between actions
   - Rotating user agents more frequently

3. **Slow Extraction**: The scraper attempts multiple selectors, which can be slow. Once you identify working selectors, you can prioritize them in the array.

## Best Practices

1. **Respect Rate Limits**: Don't scrape too frequently (limit to once every 5-10 minutes)

2. **Use Caching**: The script uses a 5-minute cache by default, which helps reduce load on bookmaker servers

3. **Update User Agents**: Periodically update the `USER_AGENTS` array with newer browser user agent strings

4. **Analyze HTML**: If extraction fails, analyze the saved HTML to identify new selectors

5. **Consider API Access**: If available, official API access would be more reliable and ethical than web scraping

## Legal Considerations

Always check the Terms of Service of the bookmaker websites before scraping. Many prohibit automated data extraction. Consider:

1. Getting explicit permission from the bookmakers
2. Using official APIs if available
3. Using the data only for personal, non-commercial purposes
4. Limiting the frequency and volume of scraping 