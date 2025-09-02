export default function handler(req, res) {
  // Enable CORS for production frontend
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'http://localhost:5173', // Development
    'http://localhost:3000'  // Development backend
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
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