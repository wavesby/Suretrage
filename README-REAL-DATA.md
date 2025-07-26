# Sport Arbitrage - Real Data Implementation

This document outlines how to set up and run the Sport Arbitrage application with real data from bookmakers.

## Overview

The application now uses a dedicated proxy server to fetch real-time odds data from bookmakers (1xBet and SportyBet) using web scraping techniques. This approach bypasses CORS restrictions and provides reliable data access.

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Chrome or Chromium browser (for Playwright)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install chromium
   ```

### Configuration

1. Create a `.env` file in the project root with the following content:
   ```
   VITE_PROXY_SERVER=http://localhost:3001
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### Running the Application

1. Start both the proxy server and frontend application:
   ```bash
   npm start
   ```

   This will start:
   - Proxy server on port 3001
   - Frontend application on port 8080

2. Alternatively, you can run them separately:
   ```bash
   # Run the proxy server
   npm run server
   
   # Run the frontend in a separate terminal
   npm run dev
   ```

## How It Works

### Proxy Server (server.js)

The proxy server uses Playwright to scrape odds data from bookmaker websites:

- **Web Scraping**: Uses headless Chrome to extract odds data from bookmaker websites
- **Caching**: Implements a file-based caching system to reduce load on bookmaker websites
- **Scheduled Updates**: Automatically refreshes data every hour
- **API Endpoints**:
  - `GET /api/odds/1xbet` - Get odds from 1xBet
  - `GET /api/odds/sportybet` - Get odds from SportyBet
  - `GET /api/odds/all` - Get combined odds from all bookmakers
  - `GET /health` - Health check endpoint

### Frontend Integration (src/lib/api.ts)

The frontend application connects to the proxy server to fetch odds data:

- **Direct API Calls**: Makes HTTP requests to the proxy server
- **Data Normalization**: Ensures consistent data format across bookmakers
- **Error Handling**: Implements robust error handling and fallbacks

## Troubleshooting

### Common Issues

1. **Proxy Server Not Starting**
   - Check if port 3001 is already in use
   - Verify that all dependencies are installed
   - Check for errors in the console

2. **No Data Being Fetched**
   - Verify that the proxy server is running
   - Check the console for error messages
   - Ensure the VITE_PROXY_SERVER environment variable is set correctly

3. **Scraping Failures**
   - Bookmaker websites may change their structure, requiring updates to the scraping code
   - Check the console for specific error messages
   - Try clearing the cache files in the `/cache` directory

### Debugging

To enable verbose logging, set the following environment variable:
```bash
DEBUG=1 npm run server
```

## Extending the System

### Adding More Bookmakers

To add support for additional bookmakers:

1. Add a new scraping function in `server.js`:
   ```javascript
   async function scrapeNewBookmakerOdds() {
     // Implementation similar to existing scraping functions
   }
   ```

2. Add a new API endpoint in `server.js`:
   ```javascript
   app.get('/api/odds/newbookmaker', async (req, res) => {
     // Implementation similar to existing endpoints
   })
   ```

3. Add a new fetch function in `src/lib/api.ts`:
   ```typescript
   export const fetchNewBookmakerOdds = async (): Promise<MatchOdds[]> => {
     // Implementation similar to existing fetch functions
   }
   ```

4. Update the `fetchAllOdds` function in `src/lib/api.ts` to include the new bookmaker.

## Security Considerations

- The proxy server should be deployed behind a firewall or API gateway
- Consider implementing rate limiting to prevent abuse
- Rotate user agents and IP addresses for production use to avoid being blocked
- Do not expose the proxy server to the public internet without proper security measures

## Maintenance

- Regularly check if the scraping selectors need to be updated
- Monitor for changes in bookmaker website structures
- Update the user agent strings periodically
- Consider implementing more sophisticated error recovery mechanisms for production use 