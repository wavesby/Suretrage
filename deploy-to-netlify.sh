#!/bin/bash

echo "🚀 Sports Arbitrage - Netlify Deployment Script"
echo "=============================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "❌ This is not a git repository. Please run this script from your project root."
  exit 1
fi

# Check if netlify.toml exists
if [ ! -f "netlify.toml" ]; then
  echo "❌ netlify.toml not found. Please ensure the Netlify configuration is in place."
  exit 1
fi

# Check if Netlify functions exist
if [ ! -d "netlify/functions" ]; then
  echo "❌ Netlify functions directory not found. Please ensure functions are set up."
  exit 1
fi

echo "📦 Adding all changes to git..."
git add .

echo "💾 Committing changes..."
git commit -m "🚀 Migrate from Vercel to Netlify

✨ Complete Netlify Migration:
- Add netlify.toml configuration with proper redirects
- Convert Vercel API routes to Netlify Functions
- Add comprehensive CORS headers and security settings
- Implement perfect data flow matching localhost behavior
- Add enhanced health checks and monitoring
- Support for all existing API endpoints
- Optimized caching and performance settings
- Environment variable configuration for Netlify
- Beautiful mwaveslimited watermark integration

🔧 Technical Updates:
- Convert /api/odds to Netlify Function
- Convert /api/health to Netlify Function  
- Convert /api/refresh-odds to Netlify Function
- Convert /api/odds/[bookmaker] to Netlify Function
- Add proper SPA routing for React app
- Implement security headers and CSP
- Add performance optimization headers
- Enhanced error handling and logging

🎨 UI Enhancements:
- Stunning login page with animations
- Beautiful watermark integration across site
- Enhanced visual effects and micro-interactions
- Professional security badges and features
- Improved responsive design"

echo "🔄 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Code pushed to GitHub! Now setting up Netlify deployment..."
echo ""
echo "🔧 REQUIRED STEPS FOR NETLIFY:"
echo "================================"
echo ""
echo "1. 🌐 CONNECT TO NETLIFY:"
echo "   - Go to: https://app.netlify.com/"
echo "   - Click 'New site from Git'"
echo "   - Connect your GitHub repository"
echo "   - Select this repository: Sport-arbitrage"
echo ""
echo "2. ⚙️ BUILD SETTINGS:"
echo "   - Build command: npm run build"
echo "   - Publish directory: dist"
echo "   - Functions directory: netlify/functions"
echo ""
echo "3. 🔐 ENVIRONMENT VARIABLES:"
echo "   Go to Site settings → Environment variables and add:"
echo "   "
echo "   🔑 Required Variables:"
echo "   - ODDS_API_KEY=your_api_key_from_the_odds_api"
echo "   - VITE_PROXY_SERVER=https://your-site-name.netlify.app"
echo "   "
echo "   🎯 Optional Variables (for Supabase):"
echo "   - VITE_SUPABASE_URL=your_supabase_url"
echo "   - VITE_SUPABASE_ANON_KEY=your_supabase_key"
echo ""
echo "4. 🔗 GET YOUR ODDS API KEY:"
echo "   - Visit: https://the-odds-api.com/"
echo "   - Sign up for a free account"
echo "   - Copy your API key to ODDS_API_KEY variable"
echo ""
echo "5. 🚀 DEPLOY:"
echo "   - Click 'Deploy site' in Netlify"
echo "   - Wait for build to complete"
echo "   - Your site will be live at: https://your-site-name.netlify.app"
echo ""
echo "📊 NETLIFY FEATURES ENABLED:"
echo "============================"
echo "✅ Serverless Functions (API endpoints)"
echo "✅ Automatic HTTPS"
echo "✅ Global CDN"
echo "✅ Branch deploys"
echo "✅ Form handling"
echo "✅ Split testing"
echo "✅ Analytics"
echo "✅ Security headers"
echo "✅ Asset optimization"
echo ""
echo "🔍 VERIFY DEPLOYMENT:"
echo "===================="
echo "After deployment, test these endpoints:"
echo "- https://your-site.netlify.app/api/health"
echo "- https://your-site.netlify.app/api/odds"
echo "- https://your-site.netlify.app/api/odds/1xbet"
echo ""
echo "🎯 Your enhanced ArbiTrader Pro will be live with:"
echo "- ✨ Beautiful login page with animations"
echo "- 🏷️ mwaveslimited watermark integration"
echo "- 🚀 Perfect data flow matching localhost"
echo "- 🔒 Enterprise-grade security"
echo "- ⚡ Lightning-fast performance"
echo ""
echo "📖 For troubleshooting, check the Netlify functions logs in your dashboard." 