import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

// Import all routes from backend
import authRoutes from '../backend/src/routes/auth.routes';
import chatRoutes from '../backend/src/routes/chat.routes';
import assistantRoutes from '../backend/src/routes/assistant.routes';
import subscriptionRoutes from '../backend/src/routes/subscription.routes';
import packageRoutes from '../backend/src/routes/packages.routes';
import paymentRoutes from '../backend/src/routes/payments.routes';
import adminRoutes from '../backend/src/routes/admin.routes';
import webhookRoutes from '../backend/src/routes/webhook.routes';

// Import middleware
import { errorHandler, notFoundHandler } from '../backend/src/middleware/error.middleware';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration for Vercel deployment
const corsOptions = {
  origin: [
    'https://neuroai-lab.vercel.app',
    'https://neuroai-fq36b7np3-edevs.vercel.app',
    'https://neuroai-99v9xt5rl-edevs.vercel.app',
    // Allow any Vercel preview URLs
    /https:\/\/.*\.vercel\.app$/,
    // Development origins
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas, tente novamente em 15 minutos',
      error: 'Too Many Requests'
    });
  }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'NeuroIA Lab API is running on Vercel',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/assistants', assistantRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Export handler for Vercel
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};