import express from 'express';
import { AssistantService } from '../services/assistant.service';
import { SubscriptionsController } from '../controllers/subscriptions.controller';
import { ApiResponse } from '../types';
import { optionalAuth, authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = express.Router();

// GET /api/assistants - Listar todos os assistentes (público)
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const assistants = await AssistantService.getAllAssistants();
    
    const response: ApiResponse<typeof assistants> = {
      success: true,
      data: assistants,
      message: 'Assistentes recuperados com sucesso'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar assistentes:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// GET /api/assistants/user - Listar assistentes disponíveis para o usuário autenticado
router.get('/user', authenticateToken, SubscriptionsController.getUserAssistants);

// GET /api/assistants/:id - Buscar assistente específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assistant = await AssistantService.getAssistantById(id);
    
    if (!assistant) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Assistente não encontrado'
      };
      
      return res.status(404).json(response);
    }
    
    const response: ApiResponse<typeof assistant> = {
      success: true,
      data: assistant,
      message: 'Assistente recuperado com sucesso'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar assistente:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: 'Erro interno do servidor'
    };
    
    res.status(500).json(response);
  }
});

// POST /api/assistants/:assistantId/validate-access - Validar acesso do usuário ao assistente
router.post('/:assistantId/validate-access', authenticateToken, SubscriptionsController.validateAssistantAccess);

export default router;