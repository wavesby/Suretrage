# Sport Arbitrage Documentation

Welcome to the comprehensive documentation for the Sport Arbitrage application. This document serves as an index to all available documentation.

## Core Documentation

- [**README.md**](README.md) - Main project overview and introduction
- [**README-REAL-DATA.md**](README-REAL-DATA.md) - Detailed documentation on the real data implementation

## Installation & Setup

- [**INSTALLATION.md**](INSTALLATION.md) - Complete step-by-step installation guide
- [**start.sh**](start.sh) - Startup script with automatic environment setup

## Implementation Details

- [**REAL-DATA-IMPLEMENTATION.md**](REAL-DATA-IMPLEMENTATION.md) - Summary of all changes made to implement real data
- [**server.js**](server.js) - Proxy server implementation for web scraping
- [**src/lib/api.ts**](src/lib/api.ts) - API integration for fetching real-time odds data
- [**src/utils/mockData.ts**](src/utils/mockData.ts) - Mock data removal and real data integration

## Verification & Quality Assurance

- [**CROSS-CHECK.md**](CROSS-CHECK.md) - Comprehensive checklist for verification
- [**VERIFICATION_SUMMARY.md**](VERIFICATION_SUMMARY.md) - Summary of the implementation and verification process
- [**validate-code.js**](validate-code.js) - Code validation script
- [**test-server.js**](test-server.js) - Server testing script

## Deployment & Production

- [**DEPLOYMENT.md**](DEPLOYMENT.md) - Guide for deploying to production environments

## Maintenance & Updates

- [**update-selectors.js**](update-selectors.js) - Tool for updating web scraping selectors when bookmaker websites change

## Key Components

### Backend Components

- **Proxy Server** (`server.js`) - Node.js Express server for web scraping
- **Caching System** - File-based caching to reduce load on bookmaker websites
- **Scheduled Updates** - Cron jobs for regular data refreshes

### Frontend Components

- **API Integration** (`src/lib/api.ts`) - Fetches data from the proxy server
- **Data Context** (`src/contexts/DataContext.tsx`) - Manages data state and updates
- **Arbitrage Logic** (`src/utils/arbitrage.ts`) - Calculates arbitrage opportunities

### Helper Scripts

- **start.sh** - Unified script to start both frontend and server
- **test-server.js** - Script to test the proxy server
- **update-selectors.js** - Tool to update web scraping selectors
- **validate-code.js** - Code validation script

## Getting Started

1. Follow the [Installation Guide](INSTALLATION.md) to set up the application
2. Run the application using `./start.sh`
3. Verify the installation using the [Cross-Check Guide](CROSS-CHECK.md)
4. Read the [Real Data Implementation](README-REAL-DATA.md) for detailed information

## Troubleshooting

For common issues and solutions, refer to:

- The Troubleshooting section in [INSTALLATION.md](INSTALLATION.md)
- The Common Issues section in [CROSS-CHECK.md](CROSS-CHECK.md)
- The Error Handling section in [README-REAL-DATA.md](README-REAL-DATA.md)

## Future Development

For planned enhancements and future development, see:

- The Next Steps section in [VERIFICATION_SUMMARY.md](VERIFICATION_SUMMARY.md)
- The Future Enhancements section in [README-REAL-DATA.md](README-REAL-DATA.md) 