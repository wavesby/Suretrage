# The Odds API Integration Guide

This guide explains how to integrate The Odds API with the Sport Arbitrage application to fetch odds data from multiple bookmakers without web scraping.

## Overview

The Odds API provides a reliable and efficient way to access odds data from many bookmakers worldwide. It offers several benefits over web scraping:

1. **Reliability**: No need to handle website changes, CAPTCHAs, or IP blocks
2. **Efficiency**: Fast API calls instead of launching browsers
3. **Consistency**: Standardized data format across bookmakers
4. **Coverage**: Access to multiple bookmakers from a single API
5. **Legal**: API usage is explicitly permitted (unlike scraping)

## Setting Up

### 1. Get an API Key

1. Visit [The Odds API](https://the-odds-api.com/) and sign up for an account
2. Choose a subscription plan based on your needs
   - Free tier provides 500 requests per month
   - Paid plans offer more requests and features

### 2. Configure the Application

1. Create a `.env` file in the project root (if not already present)
2. Add your API key:
   ```
   ODDS_API_KEY=your_api_key_here
   ```

## Using the Integration

Our integration with The Odds API is structured as follows:

1. **OddsApiProvider** (`odds-api-provider.js`) - Low-level API client with caching
2. **OddsApiIntegration** (`odds-api-integration.js`) - Higher-level integration with our app
3. **Command-line tools** (`run-odds-api.js`, `find-nigeria-bookmakers.js`) - Easy access to functionality

### Command Line Tools

#### Finding Available Bookmakers

To find which bookmakers are available through the API:

```bash
node find-nigeria-bookmakers.js
```

This script will:
- Fetch all available sports
- Check several popular sports in Nigeria
- Find all bookmakers available in the API
- Attempt to identify Nigerian bookmakers

#### Basic API Usage

The main command line tool provides several operations:

```bash
# List all available sports
node run-odds-api.js sports

# Fetch odds for all target sports
node run-odds-api.js odds

# Get odds for specific bookmakers
node run-odds-api.js bookmakers 1xbet sportybet

# Prepare data for arbitrage detection
node run-odds-api.js arbitrage 1xbet sportybet
```

### Bookmaker Mapping

The Odds API uses specific keys for each bookmaker, which may differ from our internal naming. The integration automatically maps common bookmaker names to their API keys:

| Our Name | API Keys |
|----------|----------|
| 1xbet | 1xbet, onexbet, 1xbit |
| sportybet | sportybet |
| bet9ja | bet9ja |
| betking | betking |
| betway | betway, betway_africa |
| parimatch | parimatch, parimatch_africa |

You can update this mapping in `odds-api-integration.js` as you discover the correct keys.

## Data Flow

1. **Fetch sports**: Get the list of available sports from the API
2. **Select target sports**: Focus on sports popular in Nigeria (soccer, basketball, etc.)
3. **Fetch odds**: Get odds for each target sport
4. **Filter bookmakers**: Keep only odds from your selected bookmakers
5. **Transform data**: Convert to our application's format
6. **Detect arbitrage**: Process the data with our arbitrage detection algorithm

## Available Sports

The API provides odds for many sports, including:

- Soccer (Premier League, La Liga, Serie A, Bundesliga, etc.)
- Basketball (NBA, EuroLeague)
- Tennis (ATP, WTA)
- American football (NFL, NCAA)
- Baseball (MLB)
- Cricket
- Rugby
- and many more

## Available Markets

The basic integration uses head-to-head (h2h) markets, but The Odds API supports:

- Head-to-head / Moneyline (h2h)
- Spreads / Handicaps
- Totals / Over-Under
- Outrights / Futures

The integration can be extended to include these markets.

## Rate Limiting and Quotas

The Odds API has rate limits and usage quotas based on your subscription:

- Each request has a usage cost (1 for basic queries)
- Multiple regions or markets increase the cost
- The API provides usage headers in each response
- Our integration includes caching to minimize API calls

## Troubleshooting

### Common Issues

1. **API key not found**:
   - Check if `.env` file exists and contains ODDS_API_KEY

2. **Rate limit exceeded**:
   - Add delays between requests
   - Implement better caching
   - Upgrade your API plan

3. **No bookmakers found**:
   - Check if your bookmaker names match the API's naming
   - Update the bookmaker mapping in the integration

4. **No events found**:
   - Verify the sport is in season
   - Try different sport keys

## Extending the Integration

The current integration can be extended in several ways:

1. **Add more markets**: Include spreads, totals, and other bet types
2. **Improve caching**: Implement more sophisticated caching strategies
3. **Real-time updates**: Poll the API periodically for updated odds
4. **Custom transformations**: Adapt data for specific arbitrage algorithms

## API Documentation

For complete API documentation, visit:
https://the-odds-api.com/liveapi/guides/v4/

## Support

If you encounter issues with The Odds API:
- Check their documentation
- Contact their support
- Review API response headers for error details

For issues with our integration:
- Open an issue on GitHub
- Check the console logs for detailed error messages 