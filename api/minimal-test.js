/**
 * Minimal CORS Test - Absolute Basic
 */

module.exports = async function handler(req, res) {
  // IMMEDIATE CORS - NO IMPORTS, NO LOGIC
  console.log('🧪 MINIMAL TEST ENDPOINT');
  console.log('📋 Request details:', { method: req.method, origin: req.headers.origin });

  // FORCE HEADERS IMMEDIATELY
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  console.log('✅ Headers set');

  if (req.method === 'OPTIONS') {
    console.log('🔍 Preflight handled');
    return res.status(200).json({ message: 'Preflight OK' });
  }

  console.log('🎯 Main response');
  return res.status(200).json({
    success: true,
    message: 'Minimal test working!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin
  });
};