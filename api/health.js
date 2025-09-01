export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({ 
    status: 'OK', 
    message: 'NeuroIA Lab API is running on Vercel',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production',
    method: req.method,
    url: req.url
  });
}