import express from 'express';
import assistantsRouter from './assistants.route';
import authRouter from './auth.route';
import chatRouter from './chat.routes';
import subscriptionsRouter from './subscriptions.routes';
import packagesRouter from './packages.routes';
import paymentsRouter from './payments.routes';
import adminRouter from './admin.routes';
import webhooksRouter from './webhooks.routes';

const router = express.Router();

// Health check route
router.get('/health', async (req, res) => {
  const healthStatus: any = {
    overall: 'healthy',
    database: { status: 'unknown', responseTime: 0 },
    externalServices: {
      supabase: { status: 'unknown', responseTime: 0 },
      asaas: { status: 'unknown', responseTime: 0, statusCode: null as any }
    },
    system: {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };

  try {
    // Test Supabase connection
    const { supabase } = require('../config/supabase');
    const startTime = Date.now();
    const { data, error } = await supabase.from('assistants').select('count').limit(1);
    const responseTime = Date.now() - startTime;
    
    if (error) {
      healthStatus.externalServices.supabase = {
        status: 'unhealthy',
        responseTime,
        error: error.message
      };
      healthStatus.overall = 'unhealthy';
    } else {
      healthStatus.externalServices.supabase = {
        status: 'healthy',
        responseTime
      };
    }
    
    healthStatus.database = {
      status: error ? 'unhealthy' : 'healthy',
      responseTime
    };

  } catch (err: any) {
    healthStatus.externalServices.supabase = {
      status: 'unhealthy',
      responseTime: 0,
      error: err.message
    };
    healthStatus.database = {
      status: 'unhealthy',
      responseTime: 0
    };
    healthStatus.overall = 'unhealthy';
  }

  // Test Asaas (mock for now)
  healthStatus.externalServices.asaas = {
    status: 'degraded',
    responseTime: 200,
    statusCode: 404
  };

  res.json(healthStatus);
});

// Auth routes
router.use('/auth', authRouter);

// Assistant routes
router.use('/assistants', assistantsRouter);

// Chat routes
router.use('/chat', chatRouter);

// Subscription routes
router.use('/subscriptions', subscriptionsRouter);

// Package routes
router.use('/packages', packagesRouter);

// Payment routes
router.use('/payments', paymentsRouter);

// Admin routes
router.use('/admin', adminRouter);

// Webhook routes
router.use('/webhooks', webhooksRouter);

export default router;