export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.status(200).json({});
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('🔄 Manual odds refresh requested (serverless)');
    
    // In serverless environment, we can't maintain cache
    // So we just return a success response
    res.status(200).json({
      success: true,
      message: 'Refresh request acknowledged (serverless mode)',
      timestamp: new Date().toISOString(),
      note: 'In serverless mode, data is fetched fresh on each request'
    });
  } catch (error) {
    console.error('❌ Error in refresh endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refresh request',
      details: error.message
    });
  }
} 