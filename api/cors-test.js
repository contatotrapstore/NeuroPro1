/**
 * Simple CORS Test Endpoint
 * Test if CORS is working before testing payment
 */

module.exports = async function handler(req, res) {
  console.log('🧪 CORS Test Endpoint');
  console.log('📋 Request details:', {
    method: req.method,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50),
    url: req.url
  });

  // Force CORS headers
  const allowedOrigins = [
    'https://www.neuroialab.com.br',
    'https://neuroialab.com.br',
    'https://neuroai-lab.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];

  const origin = req.headers.origin;
  console.log('🌐 CORS Test Check:', { origin, allowedOrigins });

  if (allowedOrigins.includes(origin)) {
    console.log('✅ CORS test allowed for origin:', origin);
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    console.log('⚠️ CORS test fallback to wildcard for origin:', origin);
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  console.log('📤 Response headers set:', {
    'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
    'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers')
  });

  if (req.method === 'OPTIONS') {
    console.log('🔍 Handling CORS test preflight request');
    res.status(200).json({
      message: 'CORS preflight successful',
      origin: origin,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Return success response for any method
  res.status(200).json({
    success: true,
    message: 'CORS test endpoint working!',
    data: {
      method: req.method,
      origin: origin,
      timestamp: new Date().toISOString(),
      headers: {
        'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods')
      }
    }
  });
};