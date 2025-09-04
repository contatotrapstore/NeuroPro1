import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

// Load and validate environment variables FIRST
import { env, isDevelopment } from './config/env.validation';

const app = express();
const PORT = env.PORT || 3000;

// Security middleware - Disable CSP for development
app.use(helmet({
  contentSecurityPolicy: isDevelopment ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", env.SUPABASE_URL, env.SUPABASE_URL.replace('https://', 'wss://'), "https://*.supabase.co", "wss://*.supabase.co"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - Allow multiple origins in development and Vercel domains in production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174', 
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  env.CORS_ORIGIN
];

// Add Vercel domains for production
const vercelDomains = [
  /https:\/\/.*\.vercel\.app$/,
  /https:\/\/neuroai-lab.*\.vercel\.app$/,
  /https:\/\/neuro.*\.vercel\.app$/
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (isDevelopment) {
      // In development, allow any localhost origin
      if (origin.startsWith('http://localhost:') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    } else {
      // In production, allow specific origins and Vercel domains
      if (origin === env.CORS_ORIGIN || vercelDomains.some(domain => domain.test(origin))) {
        return callback(null, true);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'apikey', 'prefer']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increase limit for development
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas, tente novamente em 15 minutos',
      error: 'Too Many Requests'
    });
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'NeuroIA Lab API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
import apiRoutes from './routes';
app.use('/api', apiRoutes);

// Import error handling middleware
import { errorHandler, notFoundHandler, setupGlobalErrorHandlers } from './middleware/error.middleware';

// Setup global error handlers for uncaught exceptions
setupGlobalErrorHandlers();

// 404 handler (must come before error handler)
app.use(notFoundHandler);

// Centralized error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NeuroIA Lab API server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
});


// restart
// restart for CORS
