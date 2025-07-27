// Netlify Function for health check

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  console.log('🔄 Netlify Function: health - Event received:', {
    httpMethod: event.httpMethod,
    headers: event.headers,
    path: event.path
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
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      server: 'Sports Arbitrage API (Netlify Functions)',
      environment: {
        platform: 'Netlify',
        nodeVersion: process.version,
        oddsApiKey: !!process.env.ODDS_API_KEY,
        supabaseConfigured: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
        region: process.env.AWS_REGION || 'unknown',
        functionName: context.functionName || 'health',
        requestId: context.awsRequestId || 'unknown'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      build: {
        buildId: process.env.BUILD_ID || 'unknown',
        deployId: process.env.DEPLOY_ID || 'unknown',
        commitSha: process.env.COMMIT_REF || 'unknown'
      }
    };
    
    console.log('✅ Health check successful');
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(health, null, 2)
    };
  } catch (error) {
    console.error('❌ Error in health check:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: error.message,
        server: 'Sports Arbitrage API (Netlify Functions)'
      })
    };
  }
}; 