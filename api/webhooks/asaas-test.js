/**
 * Asaas Webhook Test Endpoint - NeuroIA Lab
 * Tests webhook connectivity and configuration
 */

module.exports = async function handler(req, res) {
  console.log('🧪 Webhook Test Endpoint Called');
  console.log('📋 Request Details:', {
    method: req.method,
    url: req.url,
    headers: Object.keys(req.headers),
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, asaas-signature, x-asaas-signature');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('🔍 OPTIONS preflight handled');
    return res.status(200).end();
  }

  // Test response
  const testData = {
    success: true,
    message: 'Webhook test endpoint is working correctly',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAsaasToken: !!process.env.ASAAS_API_TOKEN
    }
  };

  if (req.method === 'POST') {
    testData.body = req.body;
    testData.bodySize = JSON.stringify(req.body || {}).length;
  }

  console.log('✅ Test response prepared:', testData);

  return res.status(200).json(testData);
};