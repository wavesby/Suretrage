# Vercel Deployment Guide

This guide explains how to properly deploy the Sports Arbitrage application to Vercel.

## Quick Fix Summary

Your app wasn't working on Vercel because:
1. ❌ Express.js server can't run continuously on Vercel
2. ❌ Frontend was trying to connect to `localhost:3001` (doesn't exist in production)
3. ❌ Missing serverless API functions
4. ❌ Environment variables not configured

## What I've Fixed

### 1. Created Serverless API Functions
- `/api/odds.js` - Main odds data endpoint
- `/api/health.js` - Health check endpoint
- `/api/refresh-odds.js` - Odds refresh endpoint

### 2. Added Vercel Configuration
- `vercel.json` - Vercel deployment configuration
- Updated API calls to work with serverless functions

### 3. Fixed Frontend API Configuration
- Updated `src/lib/api.ts` to use relative URLs in production
- Maintains localhost development support

## Deployment Steps

### Step 1: Set Up Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:

```bash
# Required for odds data
ODDS_API_KEY=your_api_key_from_the_odds_api

# Optional - for database features
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Frontend API endpoint (use your Vercel domain)
VITE_PROXY_SERVER=https://your-app-name.vercel.app
```

### Step 2: Get The Odds API Key

1. Visit [The Odds API](https://the-odds-api.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to Vercel environment variables

### Step 3: Deploy

1. Push your code to GitHub (you've already done this)
2. Vercel will automatically deploy
3. Update `VITE_PROXY_SERVER` with your actual Vercel domain

### Step 4: Test Your Deployment

Visit these URLs to test:
- `https://your-app.vercel.app/` - Main application
- `https://your-app.vercel.app/api/health` - Health check
- `https://your-app.vercel.app/api/odds` - Odds data

## Architecture Changes

### Before (Local Development)
```
Frontend (localhost:5173) → Proxy → Express Server (localhost:3001) → Scrapers/APIs
```

### After (Vercel Production)
```
Frontend (Vercel) → Serverless Functions (Vercel) → The Odds API
```

## Key Differences in Production

1. **No Web Scraping**: Serverless functions can't run long-term scrapers
2. **No File Caching**: Vercel filesystem is read-only
3. **API-First**: Uses The Odds API for real data
4. **Serverless**: Each API call is a separate function execution

## Troubleshooting

### Frontend Shows No Data
- Check if `VITE_PROXY_SERVER` is set correctly
- Verify `ODDS_API_KEY` is working at `/api/health`

### API Errors
- Check Vercel function logs
- Verify environment variables are set
- Test The Odds API key manually

### CORS Issues
- All API functions include CORS headers
- If issues persist, check browser console

## Local Development

For local development, your existing setup still works:
```bash
npm run start  # Runs both frontend and Express server
```

The serverless functions are only used in production.

## Next Steps

1. ✅ Set environment variables in Vercel
2. ✅ Get The Odds API key
3. ✅ Deploy and test
4. 📈 Monitor usage and optimize

Your app should now work perfectly on Vercel! 🚀 