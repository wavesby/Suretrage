export default function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    server: 'Sports Arbitrage API (Serverless)',
    environment: {
      platform: 'Vercel',
      nodeVersion: process.version,
      oddsApiKey: !!process.env.ODDS_API_KEY,
      supabaseConfigured: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY)
    }
  };
  
  res.status(200).json(health);
} 