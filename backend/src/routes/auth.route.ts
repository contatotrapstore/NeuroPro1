import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// All auth routes require authentication
router.use(authenticateToken);

// GET /api/auth/profile - Get current user profile
router.get('/profile', AuthController.getProfile);

// PUT /api/auth/profile - Update user profile
router.put('/profile', AuthController.updateProfile);

// GET /api/auth/access - Get user subscriptions and access
router.get('/access', AuthController.getUserAccess);

export default router;