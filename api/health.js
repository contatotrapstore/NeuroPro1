module.exports = function handler(req, res) {
  console.log('🚀 Health check started');
  console.log('Request method:', req.method);
  console.log('Request origin:', req.headers.origin);
  
  // Enable CORS for production frontend
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  
  if (req.method === 'OPTIONS') {
    console.log('✅ Health preflight OPTIONS handled');
    res.status(200).end();
    return;
  }

  console.log('✅ Health check successful');
  res.status(200).json({ 
    status: 'OK', 
    message: 'NeuroIA Lab API is running on Vercel',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production',
    method: req.method,
    url: req.url
  });
};