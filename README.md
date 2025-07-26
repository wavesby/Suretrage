# Sport Arbitrage App

An application for detecting and tracking sports arbitrage betting opportunities.

## Overview

This application helps users identify profitable arbitrage betting opportunities across different bookmakers. By monitoring odds from multiple sources, the app can detect situations where the differences in bookmaker odds create guaranteed profit possibilities.

## Key Features

- Real-time odds monitoring from multiple bookmakers
- Automatic arbitrage opportunity detection
- Customizable stake calculator
- Opportunity filtering by profit percentage, league, and bookmakers
- User preferences management
- Progressive Web App (PWA) capabilities

## Technical Details

### Bookmaker Data Integration

The application uses a robust and fault-tolerant system for fetching odds data from bookmakers:

- **Web Scraping Engine**: Uses Playwright to extract real-time odds data from bookmaker websites
- **The Odds API Integration**: Uses the Odds API to fetch odds from multiple bookmakers
- **Proxy Server Architecture**: Dedicated Node.js server to handle scraping and data processing
- **Caching System**: File-based caching to reduce load on bookmaker websites and API requests
- **Rate limiting protection**: Implements delays and batched requests to avoid IP blocks
- **User Agent Rotation**: Rotates user agents to avoid detection
- **Robust error handling**: Automatically retries failed requests with exponential backoff
- **Data normalization**: Standardizes different bookmaker data formats for consistent processing
- **Data quality validation**: Ensures odds data meets quality standards before processing

### Odds Data Flow

1. User selects bookmakers to monitor
2. Proxy server fetches data from each selected bookmaker using either web scraping or The Odds API
3. Data is normalized into a consistent format
4. Quality checks are performed to ensure data is valid and recent
5. Arbitrage opportunities are calculated and displayed to the user

### The Odds API Integration

The application now supports fetching odds data through The Odds API, which provides a more reliable and efficient way to get bookmaker data compared to web scraping.

#### Setting up The Odds API

1. Sign up for an API key at [The Odds API](https://the-odds-api.com/)
2. Create a `.env` file in the project root (copy from `.env.example`)
3. Add your API key to the `.env` file: `ODDS_API_KEY=your_api_key_here`

#### Running The Odds API integration

```bash
# Get a list of all available sports
node run-odds-api.js sports

# Fetch odds for target sports
node run-odds-api.js odds

# Fetch odds for specific bookmakers
node run-odds-api.js bookmakers 1xbet sportybet

# Prepare data for arbitrage detection
node run-odds-api.js arbitrage 1xbet sportybet
```

#### Available bookmakers through The Odds API

The Odds API provides access to a wide range of bookmakers. The integration script will attempt to match your requested bookmakers with what's available in the API. Major bookmakers like 1xBet, Betway, and others are available.

Run the `node find-nigeria-bookmakers.js` script to identify bookmakers available for Nigerian markets.

### Supported Bookmakers

- 1xBet (fully implemented)
- SportyBet (fully implemented)
- Bet9ja (coming soon)
- BetKing (coming soon)
- NairaBet (coming soon)
- Betway (coming soon)
- BangBet (coming soon)
- Parimatch (coming soon)

## Development

### Tech Stack

- React 18 with TypeScript
- Vite build system
- TailwindCSS for styling
- Shadcn UI components
- React Context API for state management
- React Router for navigation
- Axios for HTTP requests
- Supabase for backend (authentication, database)
- Playwright for web scraping
- Express for the proxy server

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sport-arbitrage.git

# Navigate to project directory
cd sport-arbitrage

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Create .env file (copy from .env.example)
cp .env.example .env
```

### Running the Application

```bash
# Start both proxy server and frontend (recommended)
./start.sh

# Or run them separately
# Terminal 1: Start the proxy server
npm run server

# Terminal 2: Start the frontend
npm run dev
```

### Testing the Server

```bash
# Test the proxy server endpoints
node test-server.js
```

## Deployment

The application is configured as a Progressive Web App (PWA) and can be deployed to any static hosting service. The proxy server should be deployed separately on a server with Node.js support.

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Documentation

- [Real Data Implementation](README-REAL-DATA.md) - Detailed documentation on the real data implementation
- [Real Data Solution](REAL-DATA-SOLUTION.md) - Implementation of real data solution using The Odds API exclusively

## License

MIT
