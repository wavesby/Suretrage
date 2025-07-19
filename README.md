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

- **Multi-layered API access**: Primary API endpoints with automatic fallback to alternative endpoints
- **Rate limiting protection**: Implements delays and batched requests to avoid IP blocks
- **Proxy integration**: Uses proxy services to bypass regional restrictions when needed
- **Web scraping fallback**: If APIs fail, can scrape public-facing bookmaker websites
- **Public odds API integration**: For situations where direct bookmaker access fails
- **Robust error handling**: Automatically retries failed requests with exponential backoff
- **Data normalization**: Standardizes different bookmaker data formats for consistent processing
- **Data quality validation**: Ensures odds data meets quality standards before processing

### Odds Data Flow

1. User selects bookmakers to monitor
2. System fetches data from each selected bookmaker using the most reliable method available
3. Data is normalized into a consistent format
4. Quality checks are performed to ensure data is valid and recent
5. Arbitrage opportunities are calculated and displayed to the user

### Supported Bookmakers

- Bet9ja
- 1xBet
- BetKing
- SportyBet
- NairaBet
- Betway
- BangBet
- Parimatch

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

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/sport-arbitrage.git

# Navigate to project directory
cd sport-arbitrage

# Install dependencies
npm install

# Start development server
npm run dev
```

## Deployment

The application is configured as a Progressive Web App (PWA) and can be deployed to any static hosting service.

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT
