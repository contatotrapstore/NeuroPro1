import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware';
import { SubscriptionsController } from '../controllers/subscriptions.controller';
import { supabase } from '../config/supabase';
import { getPackagePrice, type SubscriptionType, type PackageSize } from '../../../shared/config/pricing';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// GET /api/packages/user - Obter pacotes do usuário
router.get('/user', SubscriptionsController.getUserPackages);

// POST /api/packages - Criar novo pacote
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { assistantIds, plan, packageType } = req.body;

    // Validar entrada
    if (!assistantIds || !Array.isArray(assistantIds)) {
      return res.status(400).json({
        success: false,
        error: 'Lista de assistentes é obrigatória'
      });
    }

    // Validar número de assistentes
    if (packageType === 'package_3' && assistantIds.length !== 3) {
      return res.status(400).json({
        success: false,
        error: 'Pacote de 3 assistentes deve conter exatamente 3 assistentes'
      });
    }

    if (packageType === 'package_6' && assistantIds.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Pacote de 6 assistentes deve conter exatamente 6 assistentes'
      });
    }

    const validPlans = ['monthly', 'semester'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Plano deve ser "monthly" ou "semester"'
      });
    }

    // Calcular preços usando configurações centralizadas
    const prices = {
      package_3: {
        monthly: getPackagePrice(3, 'monthly'),
        semester: getPackagePrice(3, 'semester')
      },
      package_6: {
        monthly: getPackagePrice(6, 'monthly'),
        semester: getPackagePrice(6, 'semester')
      }
    };

    const price = prices[packageType as keyof typeof prices]?.[plan as keyof typeof prices.package_3];
    
    if (!price) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de pacote ou plano inválido'
      });
    }

    // Calcular data de expiração
    const expirationDate = new Date();
    if (plan === 'semester') {
      expirationDate.setMonth(expirationDate.getMonth() + 6);
    } else {
      expirationDate.setMonth(expirationDate.getMonth() + 1);
    }

    // Criar o pacote
    const { data: packageData, error: packageError } = await supabase
      .from('user_packages')
      .insert({
        user_id: userId,
        package_type: packageType,
        plan: plan,
        price: price,
        status: 'active',
        expires_at: expirationDate.toISOString()
      })
      .select()
      .single();

    if (packageError) {
      throw packageError;
    }

    // Criar as assinaturas para cada assistente
    const subscriptions = assistantIds.map((assistantId: string) => ({
      user_id: userId,
      assistant_id: assistantId,
      package_id: packageData.id,
      package_type: packageType,
      plan: plan,
      status: 'active',
      expires_at: expirationDate.toISOString()
    }));

    const { error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .insert(subscriptions);

    if (subscriptionsError) {
      // Rollback: deletar o pacote se as assinaturas falharam
      await supabase
        .from('user_packages')
        .delete()
        .eq('id', packageData.id);
      
      throw subscriptionsError;
    }

    res.status(201).json({
      success: true,
      data: {
        package: packageData,
        assistantCount: assistantIds.length
      },
      message: 'Pacote criado com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao criar pacote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// POST /api/packages/validate - Validar seleção de pacote
router.post('/validate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assistantIds, packageType } = req.body;

    if (!assistantIds || !Array.isArray(assistantIds)) {
      return res.status(400).json({
        success: false,
        error: 'Lista de assistentes é obrigatória'
      });
    }

    // Validar número correto de assistentes
    const expectedCount = packageType === 'package_3' ? 3 : packageType === 'package_6' ? 6 : 0;
    
    if (expectedCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de pacote inválido'
      });
    }

    if (assistantIds.length !== expectedCount) {
      return res.status(400).json({
        success: false,
        error: `Selecione exatamente ${expectedCount} assistentes para este pacote`
      });
    }

    // Verificar se todos os assistentes existem e estão ativos
    const { data: assistants, error } = await supabase
      .from('assistants')
      .select('id, name')
      .in('id', assistantIds)
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    if (!assistants || assistants.length !== assistantIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Um ou mais assistentes selecionados são inválidos'
      });
    }

    // Verificar se não há duplicatas
    const uniqueIds = [...new Set(assistantIds)];
    if (uniqueIds.length !== assistantIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível selecionar o mesmo assistente mais de uma vez'
      });
    }

    res.json({
      success: true,
      data: {
        assistants,
        isValid: true
      },
      message: 'Seleção de pacote válida'
    });

  } catch (error: any) {
    console.error('Erro ao validar pacote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;