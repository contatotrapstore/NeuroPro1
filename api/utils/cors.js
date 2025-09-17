/**
 * Centralized CORS Configuration for NeuroIA Lab API
 */

const allowedOrigins = [
  // Production domains
  'https://www.neuroialab.com.br',
  'https://neuroialab.com.br',
  'https://neuroai-lab.vercel.app',

  // Development domains
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

/**
 * Apply CORS headers to response
 */
function applyCors(req, res) {
  console.log('🌐 CORS Check:', {
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50),
    method: req.method,
    url: req.url
  });

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    console.log('✅ CORS allowed for origin:', origin);
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    console.log('⚠️ CORS fallback for origin:', origin);
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔍 Handling CORS preflight request');
    res.status(200).end();
    return true; // Indicates that the request was handled
  }

  return false; // Continue with normal request processing
}

/**
 * CORS middleware for easy usage
 */
function corsMiddleware(req, res, next) {
  const handled = applyCors(req, res);
  if (!handled && next) {
    next();
  }
}

module.exports = {
  allowedOrigins,
  applyCors,
  corsMiddleware
};