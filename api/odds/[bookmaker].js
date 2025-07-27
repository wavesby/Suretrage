// Dynamic route for individual bookmaker odds: /api/odds/[bookmaker]
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
  ];
  
  return matches.map((match, index) => ({
    id: `${bookmakerName}_${index + 1}`,
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
          { name: match.home, price: 1.8 + Math.random() * 1.0 },
          { name: match.away, price: 1.8 + Math.random() * 1.0 },
          { name: 'Draw', price: 2.8 + Math.random() * 0.5 }
        ]
      }]
    }]
  }));
}

export default async function handler(req, res) {
  // Handle CORS
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { bookmaker } = req.query;
    
    console.log(`🎯 Fetching odds for bookmaker: ${bookmaker}`);
    
    // Normalize bookmaker name
    const bookmakerName = bookmaker.charAt(0).toUpperCase() + bookmaker.slice(1).toLowerCase();
    
    // Generate sample data for this bookmaker
    const oddsData = generateBookmakerData(bookmakerName);
    
    console.log(`✅ Generated ${oddsData.length} events for ${bookmakerName}`);
    
    res.status(200).json(oddsData);
  } catch (error) {
    console.error('❌ Error in bookmaker API:', error);
    
    res.status(500).json({
      error: 'Failed to fetch bookmaker odds',
      details: error.message,
      bookmaker: req.query.bookmaker
    });
  }
} 