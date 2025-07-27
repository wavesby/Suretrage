// Default Nigerian bookmakers for The Odds API
const DEFAULT_NIGERIAN_BOOKMAKERS = ['1xbet', 'betway', 'sportybet', 'pinnacle'];

// Enable CORS for all origins
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Sample data generator for fallback
function generateSampleOddsData() {
  const sampleMatches = [
    { home: 'Manchester United', away: 'Liverpool', league: 'Premier League' },
    { home: 'Arsenal', away: 'Chelsea', league: 'Premier League' },
    { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga' },
    { home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'Bundesliga' },
    { home: 'PSG', away: 'Marseille', league: 'Ligue 1' },
  ];
  
  const bookmakers = [
    { key: '1xbet', title: '1xBet' },
    { key: 'betway', title: 'Betway' },
    { key: 'sportybet', title: 'SportyBet' },
    { key: 'pinnacle', title: 'Pinnacle' },
  ];
  
  return sampleMatches.map((match, index) => {
    const isArbitrageMatch = index < 2; // First 2 matches have arbitrage opportunities
    
    return {
      id: `sample_${index + 1}`,
      sport_key: 'soccer_epl',
      sport_title: match.league,
      commence_time: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      home_team: match.home,
      away_team: match.away,
      bookmakers: bookmakers.map((bm, bmIndex) => {
        let homeOdds, awayOdds, drawOdds;
        
        if (isArbitrageMatch) {
          switch (bmIndex) {
            case 0: homeOdds = 1.8; awayOdds = 3.5; drawOdds = 3.2; break;
            case 1: homeOdds = 3.2; awayOdds = 1.9; drawOdds = 3.4; break;
            case 2: homeOdds = 2.8; awayOdds = 2.9; drawOdds = 2.8; break;
            default: homeOdds = 2.0; awayOdds = 2.0; drawOdds = 3.0;
          }
        } else {
          homeOdds = 1.8 + Math.random() * 2.0;
          awayOdds = 1.8 + Math.random() * 2.0;
          drawOdds = 2.8 + Math.random() * 1.0;
        }
        
        return {
          key: bm.key,
          title: bm.title,
          last_update: new Date().toISOString(),
          markets: [
            {
              key: 'h2h',
              last_update: new Date().toISOString(),
              outcomes: [
                { name: match.home, price: Math.round(homeOdds * 100) / 100 },
                { name: match.away, price: Math.round(awayOdds * 100) / 100 },
                { name: 'Draw', price: Math.round(drawOdds * 100) / 100 }
              ]
            }
          ]
        };
      })
    };
  });
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('🔄 Fetching odds data for serverless function...');
    
    // Try to get real data from The Odds API
    let oddsData = [];
    
    if (process.env.ODDS_API_KEY) {
      try {
        // Use The Odds API if available
        const apiResponse = await fetch(
          `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${process.env.ODDS_API_KEY}&regions=us,uk,eu&markets=h2h&oddsFormat=decimal&bookmakers=${DEFAULT_NIGERIAN_BOOKMAKERS.join(',')}`
        );
        
        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            oddsData = apiData;
            console.log(`✅ Fetched ${oddsData.length} events from The Odds API`);
          }
        }
      } catch (apiError) {
        console.warn('⚠️ Odds API failed:', apiError.message);
      }
    }
    
    // Fallback to sample data if no real data available
    if (oddsData.length === 0) {
      console.log('🎭 Using sample data for demonstration');
      oddsData = generateSampleOddsData();
    }
    
    // Set headers and return data
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    res.status(200).json(oddsData);
  } catch (error) {
    console.error('❌ Error in odds API:', error);
    
    // Return sample data on error
    const fallbackData = generateSampleOddsData();
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    res.status(200).json(fallbackData);
  }
} 