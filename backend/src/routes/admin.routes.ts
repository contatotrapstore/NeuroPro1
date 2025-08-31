import express from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = express.Router();

// Aplicar middleware de autenticação e admin em todas as rotas
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/users - Listar usuários
router.get('/users', AdminController.getUsers);

// GET /api/admin/stats - Estatísticas do sistema
router.get('/stats', AdminController.getStats);

// GET /api/admin/subscriptions - Listar assinaturas
router.get('/subscriptions', AdminController.getSubscriptions);

// PUT /api/admin/subscriptions/:subscriptionId - Atualizar assinatura
router.put('/subscriptions/:subscriptionId', AdminController.updateSubscription);

// PUT /api/admin/assistants/:assistantId - Atualizar assistente
router.put('/assistants/:assistantId', AdminController.updateAssistant);

export default router;