# Sport Arbitrage App

An application for detecting and tracking sports arbitrage betting opportunities.

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/Sport-arbitrage)

**Important**: After deployment, you MUST set environment variables in Vercel. See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for complete instructions.

## Overview

This application helps users identify profitable arbitrage betting opportunities across different bookmakers. By monitoring odds from multiple sources, the app can detect situations where the differences in bookmaker odds create guaranteed profit possibilities.

## ⚡ Production Deployment

The app is now optimized for Vercel deployment with:
- ✅ Serverless API functions
- ✅ The Odds API integration
- ✅ Real-time odds data
- ✅ CORS-enabled endpoints
- ✅ Environment variable support

**For Vercel deployment instructions, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)**

## Key Features

- Real-time odds monitoring from multiple bookmakers
- Automatic arbitrage opportunity detection
- Customizable stake calculator
- Opportunity filtering by profit percentage, league, and bookmakers
- User preferences management
- Progressive Web App (PWA) capabilities

## Technical Details

### Architecture

**Local Development:**
```
Frontend (Vite) → Express Server → Web Scrapers + The Odds API
```

**Production (Vercel):**
```
Frontend (Static) → Serverless Functions → The Odds API
```

### Bookmaker Data Integration

The application uses a robust and fault-tolerant system for fetching odds data:

- **🔄 The Odds API Integration**: Primary data source for production
- **🤖 Web Scraping Engine**: Uses Playwright for local development (1xBet, SportyBet)
- **⚡ Serverless Functions**: Vercel-optimized API endpoints
- **📊 Data Normalization**: Standardizes different bookmaker data formats
- **🔍 Quality Validation**: Ensures odds data meets quality standards
- **🎯 Arbitrage Detection**: Advanced algorithms for opportunity identification

### Odds Data Flow

1. User selects bookmakers to monitor
2. **Production**: Serverless functions fetch from The Odds API
3. **Development**: Express server scrapes websites + API calls
4. Data is normalized into consistent format
5. Quality checks ensure data validity
6. Arbitrage opportunities calculated and displayed

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- (Optional) The Odds API key for real data

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/Sport-arbitrage.git
   cd Sport-arbitrage
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Start the application**
   ```bash
   npm run start
   ```

This will start both the Express server (port 3001) and Vite dev server (port 5173).

### Production Deployment (Vercel)

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for complete deployment instructions.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ODDS_API_KEY` | The Odds API key | Production |
| `VITE_SUPABASE_URL` | Supabase database URL | Optional |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Optional |
| `VITE_PROXY_SERVER` | API server URL for production | Production |

## API Endpoints

### Production (Vercel)
- `GET /api/odds` - Fetch all odds data
- `GET /api/health` - Health check
- `POST /api/refresh-odds` - Refresh odds data

### Development (Express Server)
- `GET /api/odds` - All odds with caching
- `GET /api/odds/:bookmaker` - Specific bookmaker
- `POST /api/refresh-odds` - Force refresh
- `GET /health` - Health check

## Project Structure

```
Sport-arbitrage/
├── src/                          # Frontend React app
│   ├── components/              # React components
│   ├── lib/                     # API integration
│   ├── utils/                   # Arbitrage calculations
│   └── contexts/                # React contexts
├── api/                         # Vercel serverless functions
│   ├── odds.js                  # Main odds endpoint
│   ├── health.js               # Health check
│   └── refresh-odds.js         # Refresh endpoint
├── server.js                   # Express server (development)
├── vercel.json                 # Vercel configuration
└── docs/                       # Documentation
```

## Features in Detail

### Arbitrage Detection
- Calculates implied probabilities
- Identifies profit opportunities
- Risk assessment and stake optimization
- Multi-market analysis

### Bookmaker Support
- **Production**: Via The Odds API (20+ bookmakers)
- **Development**: Direct scraping (1xBet, SportyBet, etc.)
- Automatic data validation and normalization

### User Interface
- Clean, responsive design
- Real-time updates
- Filtering and sorting
- Mobile-optimized

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run start`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

- 📖 Full documentation: [DOCUMENTATION.md](DOCUMENTATION.md)
- 🚀 Deployment guide: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
- 🔧 Installation help: [INSTALLATION.md](INSTALLATION.md)

---

**🎯 Ready to find arbitrage opportunities? Deploy to Vercel in minutes!**
