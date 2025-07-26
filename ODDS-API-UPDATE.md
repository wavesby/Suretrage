# Updating to The Odds API

This guide explains how to update your Sport Arbitrage system to use The Odds API for more reliable odds data.

## What's New

- Real-time odds from The Odds API
- More reliable data compared to web scraping
- Support for international bookmakers
- Automatic data refresh
- Improved arbitrage detection with better data

## Quick Start

```bash
# Start the complete system with both API and frontend
./start-complete-system.sh
```

## Step by Step Installation

1. **Install dependencies**

```bash
# Make sure you have all required packages
npm install
```

2. **Set up your API key**

```bash
# Create .env file with your Odds API key
echo "ODDS_API_KEY=24941339955c373fe2eced8f5c5a0f88" > .env
```

3. **Test the API server**

```bash
# Run the API server
node server.js
```

4. **Test the odds data refresh**

```bash
# Refresh odds data
node refresh-odds-api.js 1xbet betway
```

5. **Start the complete system**

```bash
# Start everything (API server, odds refresh, frontend)
./start-complete-system.sh
```

## Troubleshooting

### Blank white screen in frontend

If you see a blank white screen in the frontend:

1. Check if the API server is running:
   ```
   curl http://localhost:3001/health
   ```

2. Check if odds data is available:
   ```
   curl http://localhost:3001/api/odds
   ```

3. Open browser console (F12) to check for errors

4. Make sure the Vite server is using the correct proxy configuration in `vite.config.ts`

### Server not starting

1. Make sure port 3001 is not already in use:
   ```
   lsof -i :3001
   ```

2. Kill any existing processes:
   ```
   pkill -f "node server.js"
   ```

3. Try running with verbose logging:
   ```
   DEBUG=* node server.js
   ```

## Manual Scripts

You can run individual components separately:

1. **API Server only**:
   ```
   node server.js
   ```

2. **Odds data refresh only**:
   ```
   node refresh-odds-api.js 1xbet betway
   ```

3. **Frontend only**:
   ```
   npm run dev
   ```

4. **Continuous odds refresh**:
   ```
   ./start-odds-api-refresh.sh
   ```

## Support

If you encounter issues, check the logs in the `logs` directory for more information. 