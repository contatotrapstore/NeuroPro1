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

// GET /api/admin/assistants - Listar assistentes com estatísticas
router.get('/assistants', AdminController.getAssistants);

// PUT /api/admin/assistants/:assistantId - Atualizar assistente
router.put('/assistants/:assistantId', AdminController.updateAssistant);

// PUT /api/admin/assistants/bulk - Atualizar múltiplos assistentes
router.put('/assistants/bulk', AdminController.bulkUpdateAssistants);

// GET /api/admin/analytics - Analytics avançados com filtros
router.get('/analytics', AdminController.getAnalytics);

// GET /api/admin/export - Exportar dados (CSV/Excel)
router.get('/export', AdminController.exportData);

// GET /api/admin/users/:userId/assistants - Obter assistentes disponíveis para um usuário
router.get('/users/:userId/assistants', AdminController.getUserAvailableAssistants);

// PUT /api/admin/users/:userId/assistants - Gerenciar IAs de um usuário
router.put('/users/:userId/assistants', AdminController.manageUserAssistants);

// POST /api/admin/execute-sql - Executar SQL via MCP tools (endpoint interno)
router.post('/execute-sql', AdminController.executeSql);

export default router;