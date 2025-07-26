# Integrating The Odds API with Your Arbitrage System

This document provides instructions for integrating the data from The Odds API with your existing arbitrage detection system.

## Getting Started

1. Make sure the Odds API scripts are set up and working (see ODDS-API-GUIDE.md)
2. Verify your API key is working by running:
   ```
   node test-odds-api.js
   ```

## Integration Steps

### 1. Fetch Arbitrage-Ready Data

Run the following command to fetch and format odds data for arbitrage detection:

```bash
node run-odds-api.js arbitrage 1xbet betway
# Add more bookmakers as needed
```

This will create a file called `arbitrage-ready.json` in the `odds-data` directory.

### 2. Process with Your Arbitrage Detection Code

The arbitrage-ready.json data follows this structure:

```json
[
  {
    "id": "unique_event_id",
    "sport": "sport_key",
    "league": "league_name",
    "startTime": "ISO8601_timestamp",
    "homeTeam": "Home Team",
    "awayTeam": "Away Team",
    "bookmakers": [
      {
        "name": "Bookmaker Name",
        "key": "bookmaker_key",
        "lastUpdate": "ISO8601_timestamp",
        "markets": [
          {
            "type": "h2h",
            "outcomes": [
              {
                "name": "Team Name",
                "price": 2.5, // Decimal odds
                "point": null, // For spreads/totals
                "description": null // Additional info
              },
              // More outcomes...
            ]
          }
          // More markets...
        ]
      }
      // More bookmakers...
    ]
  }
  // More events...
]
```

### 3. Load the Data in Your Arbitrage Detection System

Add this code to your existing arbitrage detection system:

```javascript
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadOddsApiData() {
  try {
    const filePath = path.join(__dirname, 'odds-data', 'arbitrage-ready.json');
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading Odds API data:', error.message);
    return [];
  }
}

async function detectArbitrageOpportunities() {
  const oddsData = await loadOddsApiData();
  // Pass this data to your arbitrage detection algorithm
  // Your existing arbitrage detection code here...
}
```

### 4. Use in a Combined System

For best results, consider using both your web scraping system and the Odds API:

1. Set up a scheduled task to fetch fresh odds data from the API
2. Use your existing web scraping as a fallback or for bookmakers not in the API
3. Combine data from both sources for more arbitrage opportunities

### 5. Updating Bookmaker Mappings

If you need to update the bookmaker mappings (to match API keys to your system), edit the `odds-api-integration.js` file:

```javascript
this.bookmakerMapping = {
  '1xbet': ['onexbet'],
  'sportybet': ['sportybet'],
  // Add more mappings as needed
};
```

## Next Steps

1. Consider creating an automated script to fetch API data on a schedule
2. Extend the integration to include more markets (spreads, totals, etc.)
3. Create a unified data source that merges API data with scraped data

For more detailed information, see the ODDS-API-GUIDE.md file. 