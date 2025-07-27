#!/bin/bash

echo "🚀 Sports Arbitrage - Vercel Deployment Script"
echo "=============================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "❌ This is not a git repository. Please run this script from your project root."
  exit 1
fi

echo "📦 Adding all changes to git..."
git add .

echo "💾 Committing changes..."
git commit -m "✨ Add Vercel serverless functions and deployment configuration

- Add serverless API functions (/api/odds.js, /api/health.js, /api/refresh-odds.js)
- Add vercel.json configuration for proper routing
- Fix frontend API calls to work with serverless architecture
- Update README with deployment instructions
- Add environment variable examples
- Add comprehensive deployment guide"

echo "🔄 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Code pushed to GitHub! Vercel will now automatically deploy."
echo ""
echo "🔧 NEXT STEPS (REQUIRED):"
echo "1. Go to your Vercel dashboard: https://vercel.com/dashboard"
echo "2. Find your Sport-arbitrage project"
echo "3. Go to Settings → Environment Variables"
echo "4. Add these variables:"
echo "   - ODDS_API_KEY=your_api_key_from_the_odds_api"
echo "   - VITE_PROXY_SERVER=https://your-app-name.vercel.app"
echo "   - VITE_SUPABASE_URL=your_supabase_url (optional)"
echo "   - VITE_SUPABASE_ANON_KEY=your_supabase_key (optional)"
echo ""
echo "5. Get your Odds API key from: https://the-odds-api.com/"
echo "6. Trigger a new deployment or wait for auto-deploy"
echo ""
echo "📖 For complete instructions, see: VERCEL_DEPLOYMENT.md"
echo ""
echo "🎯 Your app will be live at: https://your-app-name.vercel.app" 