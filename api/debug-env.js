module.exports = async function handler(req, res) {
  console.log('🔍 Debug ENV endpoint called');

  // CORS Headers
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'https://www.neuroialab.com.br',
    'https://neuroialab.com.br',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get all environment variables related to OpenAI
    const openaiEnvKeys = Object.keys(process.env).filter(key =>
      key.toLowerCase().includes('openai')
    );

    const envDebug = {
      // OpenAI specific
      has_OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      OPENAI_API_KEY_length: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
      OPENAI_API_KEY_starts: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 15) + '...' : 'N/A',

      has_VITE_OPENAI_API_KEY: !!process.env.VITE_OPENAI_API_KEY,
      VITE_OPENAI_API_KEY_length: process.env.VITE_OPENAI_API_KEY ? process.env.VITE_OPENAI_API_KEY.length : 0,

      // All OpenAI related keys
      openai_env_keys: openaiEnvKeys,
      openai_env_values: openaiEnvKeys.reduce((acc, key) => {
        acc[key] = process.env[key] ? `${process.env[key].substring(0, 15)}...` : 'undefined';
        return acc;
      }, {}),

      // Vercel specific
      vercel_env: process.env.VERCEL_ENV,
      node_env: process.env.NODE_ENV,
      vercel_url: process.env.VERCEL_URL,

      // General info
      total_env_vars: Object.keys(process.env).length,
      function_name: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',

      // Timestamp
      timestamp: new Date().toISOString(),
      build_time: Date.now()
    };

    console.log('🔍 Environment Debug Info:', envDebug);

    return res.status(200).json({
      success: true,
      message: 'Environment variables debug info',
      data: envDebug
    });

  } catch (error) {
    console.error('❌ Debug ENV error:', error);
    return res.status(500).json({
      success: false,
      error: 'Debug endpoint failed: ' + (error.message || 'Unknown error')
    });
  }
};