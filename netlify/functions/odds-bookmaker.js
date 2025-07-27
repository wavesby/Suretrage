// Netlify Function for individual bookmaker odds: /api/odds/[bookmaker]

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Sample data generator for specific bookmakers
function generateBookmakerData(bookmakerName) {
  const matches = [
    { home: 'Manchester United', away: 'Liverpool', league: 'Premier League' },
    { home: 'Arsenal', away: 'Chelsea', league: 'Premier League' },
    { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga' },
    { home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'Bundesliga' },
    { home: 'PSG', away: 'Marseille', league: 'Ligue 1' },
  ];
  
  return matches.map((match, index) => ({
    id: `${bookmakerName.toLowerCase()}_${index + 1}`,
    sport_key: 'soccer_epl',
    sport_title: match.league,
    commence_time: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    home_team: match.home,
    away_team: match.away,
    bookmakers: [{
      key: bookmakerName.toLowerCase(),
      title: bookmakerName,
      last_update: new Date().toISOString(),
      markets: [{
        key: 'h2h',
        last_update: new Date().toISOString(),
        outcomes: [
          { name: match.home, price: Math.round((1.8 + Math.random() * 1.0) * 100) / 100 },
          { name: match.away, price: Math.round((1.8 + Math.random() * 1.0) * 100) / 100 },
          { name: 'Draw', price: Math.round((2.8 + Math.random() * 0.5) * 100) / 100 }
        ]
      }]
    }]
  }));
}

exports.handler = async (event, context) => {
  console.log('🔄 Netlify Function: odds-bookmaker - Event received:', {
    httpMethod: event.httpMethod,
    headers: event.headers,
    path: event.path,
    queryStringParameters: event.queryStringParameters
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({})
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Extract bookmaker from path - Netlify passes the full path
    // Path will be like "/api/odds/1xbet" so we extract the last part
    const pathParts = event.path.split('/');
    const bookmaker = pathParts[pathParts.length - 1];
    
    if (!bookmaker || bookmaker === 'odds') {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Bookmaker parameter is required',
          path: event.path,
          example: '/api/odds/1xbet'
        })
      };
    }
    
    console.log(`🎯 Fetching odds for bookmaker: ${bookmaker}`);
    
    // Normalize bookmaker name
    const bookmakerName = bookmaker.charAt(0).toUpperCase() + bookmaker.slice(1).toLowerCase();
    
    // Generate sample data for this bookmaker
    const oddsData = generateBookmakerData(bookmakerName);
    
    console.log(`✅ Generated ${oddsData.length} events for ${bookmakerName}`);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(oddsData)
    };
  } catch (error) {
    console.error('❌ Error in bookmaker API:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to fetch bookmaker odds',
        details: error.message,
        path: event.path,
        platform: 'Netlify'
      })
    };
  }
}; 