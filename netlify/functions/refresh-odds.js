// Netlify Function for refreshing odds

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  console.log('🔄 Netlify Function: refresh-odds - Event received:', {
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('🔄 Manual odds refresh requested (Netlify Functions)');
    
    // In serverless environment, we can't maintain cache
    // So we just return a success response
    const response = {
      success: true,
      message: 'Refresh request acknowledged (Netlify Functions)',
      timestamp: new Date().toISOString(),
      note: 'In serverless mode, data is fetched fresh on each request',
      platform: 'Netlify',
      functionName: context.functionName || 'refresh-odds',
      requestId: context.awsRequestId || 'unknown'
    };
    
    console.log('✅ Refresh request processed successfully');
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('❌ Error in refresh endpoint:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process refresh request',
        details: error.message,
        timestamp: new Date().toISOString(),
        platform: 'Netlify'
      })
    };
  }
}; 