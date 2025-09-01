import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabase } from '../config/supabase';
import { getPackagePrice, type SubscriptionType, type PackageSize } from '../config/pricing';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Criar checkout para assinatura individual
router.post('/checkout/individual', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assistant_id, subscription_type } = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    // Verificar se o assistente existe
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', assistant_id)
      .eq('is_active', true)
      .single();

    if (assistantError || !assistant) {
      return res.status(404).json({
        success: false,
        message: 'Assistente não encontrado'
      });
    }

    // Verificar se já existe assinatura ativa
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('assistant_id', assistant_id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Você já possui uma assinatura ativa para este assistente'
      });
    }

    // Calcular preço
    const amount = subscription_type === 'monthly' ? assistant.monthly_price : assistant.semester_price;
    const planName = subscription_type === 'monthly' ? 'Mensal' : 'Semestral';

    // Integração com Asaas - Criar cobrança
    const asaasService = require('../services/asaas.service').asaasService;
    
    let checkoutData: any;
    
    try {
      // Criar ou obter cliente Asaas
      let asaasCustomer;
      try {
        // Tentar encontrar cliente existente pelo email
        const existingCustomers = await supabase
          .from('asaas_customers')
          .select('asaas_customer_id')
          .eq('user_id', userId)
          .single();
        
        if (existingCustomers?.data?.asaas_customer_id) {
          asaasCustomer = await asaasService.getCustomer(existingCustomers.data.asaas_customer_id);
        } else {
          throw new Error('Cliente não encontrado');
        }
      } catch {
        // Criar novo cliente
        asaasCustomer = await asaasService.createCustomer({
          name: req.user?.user_metadata?.name || req.user?.email?.split('@')[0] || 'Usuário',
          email: userEmail
        });
        
        // Salvar referência do cliente
        await supabase
          .from('asaas_customers')
          .insert({
            user_id: userId,
            asaas_customer_id: asaasCustomer.id
          });
      }

      // Criar assinatura no Asaas
      const nextDueDate = asaasService.calculateNextDueDate(subscription_type);
      const cycle = asaasService.mapSubscriptionType(subscription_type);
      
      const asaasSubscription = await asaasService.createSubscription({
        customer: asaasCustomer.id,
        billingType: 'PIX', // Default para PIX, pode ser alterado no frontend
        value: amount,
        nextDueDate,
        cycle,
        description: `Assinatura ${planName} - ${assistant.name}`
      });

      checkoutData = {
        type: 'individual',
        assistant_id,
        assistant_name: assistant.name,
        subscription_type,
        plan_name: planName,
        amount,
        currency: 'BRL',
        asaas_subscription_id: asaasSubscription.id,
        customer: {
          email: userEmail,
          name: req.user?.user_metadata?.name || 'Usuário'
        },
        description: `Assinatura ${planName} - ${assistant.name}`,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
        expires_in: 30 // 30 minutos para completar o pagamento
      };
    } catch (asaasError: any) {
      console.warn('Erro na integração Asaas, usando modo simulado:', asaasError.message);
      
      // Fallback para modo simulado
      checkoutData = {
        type: 'individual',
        assistant_id,
        assistant_name: assistant.name,
        subscription_type,
        plan_name: planName,
        amount,
        currency: 'BRL',
        simulation_mode: true,
        customer: {
          email: userEmail,
          name: req.user?.user_metadata?.name || 'Usuário'
        },
        description: `Assinatura ${planName} - ${assistant.name}`,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
        expires_in: 30
      };
    }

    res.json({
      success: true,
      data: checkoutData,
      message: 'Checkout criado com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao criar checkout individual:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Criar checkout para pacote
router.post('/checkout/package', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { package_type, subscription_type, selected_assistants } = req.body;
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    // Validar dados
    if (![3, 6].includes(package_type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de pacote inválido'
      });
    }

    if (selected_assistants.length !== package_type) {
      return res.status(400).json({
        success: false,
        message: `Selecione exatamente ${package_type} assistentes`
      });
    }

    // Verificar assistentes
    const { data: assistants, error: assistantsError } = await supabase
      .from('assistants')
      .select('id, name')
      .in('id', selected_assistants)
      .eq('is_active', true);

    if (assistantsError || assistants.length !== package_type) {
      return res.status(400).json({
        success: false,
        message: 'Um ou mais assistentes são inválidos'
      });
    }

    // Calcular preços usando configurações centralizadas
    const packagePrices = {
      3: { 
        monthly: getPackagePrice(3, 'monthly'), 
        semester: getPackagePrice(3, 'semester') 
      },
      6: { 
        monthly: getPackagePrice(6, 'monthly'), 
        semester: getPackagePrice(6, 'semester') 
      }
    };

    const amount = packagePrices[package_type as 3 | 6][subscription_type as 'monthly' | 'semester'];
    const planName = subscription_type === 'monthly' ? 'Mensal' : 'Semestral';
    const packageName = `Pacote ${package_type} Assistentes`;

    // Integração com Asaas para pacote
    const asaasService = require('../services/asaas.service').asaasService;
    
    let checkoutData: any;
    
    try {
      // Criar ou obter cliente Asaas
      let asaasCustomer;
      try {
        const existingCustomers = await supabase
          .from('asaas_customers')
          .select('asaas_customer_id')
          .eq('user_id', userId)
          .single();
        
        if (existingCustomers?.data?.asaas_customer_id) {
          asaasCustomer = await asaasService.getCustomer(existingCustomers.data.asaas_customer_id);
        } else {
          throw new Error('Cliente não encontrado');
        }
      } catch {
        asaasCustomer = await asaasService.createCustomer({
          name: req.user?.user_metadata?.name || req.user?.email?.split('@')[0] || 'Usuário',
          email: userEmail
        });
        
        await supabase
          .from('asaas_customers')
          .insert({
            user_id: userId,
            asaas_customer_id: asaasCustomer.id
          });
      }

      // Criar assinatura do pacote no Asaas
      const nextDueDate = asaasService.calculateNextDueDate(subscription_type);
      const cycle = asaasService.mapSubscriptionType(subscription_type);
      
      const asaasSubscription = await asaasService.createSubscription({
        customer: asaasCustomer.id,
        billingType: 'PIX',
        value: amount,
        nextDueDate,
        cycle,
        description: `${packageName} ${planName} - ${assistants.map(a => a.name).join(', ')}`
      });

      checkoutData = {
        type: 'package',
        package_type,
        subscription_type,
        plan_name: planName,
        selected_assistants,
        assistant_names: assistants.map(a => a.name),
        amount,
        currency: 'BRL',
        asaas_subscription_id: asaasSubscription.id,
        customer: {
          email: userEmail,
          name: req.user?.user_metadata?.name || 'Usuário'
        },
        description: `${packageName} ${planName} - ${assistants.map(a => a.name).join(', ')}`,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
        expires_in: 30
      };
    } catch (asaasError: any) {
      console.warn('Erro na integração Asaas para pacote, usando modo simulado:', asaasError.message);
      
      checkoutData = {
        type: 'package',
        package_type,
        subscription_type,
        plan_name: planName,
        selected_assistants,
        assistant_names: assistants.map(a => a.name),
        amount,
        currency: 'BRL',
        simulation_mode: true,
        customer: {
          email: userEmail,
          name: req.user?.user_metadata?.name || 'Usuário'
        },
        description: `${packageName} ${planName} - ${assistants.map(a => a.name).join(', ')}`,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success`,
        expires_in: 30
      };
    }

    res.json({
      success: true,
      data: checkoutData,
      message: 'Checkout do pacote criado com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao criar checkout do pacote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Confirmar pagamento (webhook simulado)
router.post('/confirm', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { payment_id, status, checkout_data } = req.body;

    if (status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Pagamento não aprovado'
      });
    }

    const userId = req.user?.id;
    
    if (checkout_data.type === 'individual') {
      // Confirmar assinatura individual
      const { assistant_id, subscription_type, amount } = checkout_data;
      
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (subscription_type === 'monthly' ? 1 : 6));

      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          assistant_id,
          subscription_type,
          package_type: 'individual',
          amount,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          asaas_subscription_id: payment_id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: subscription,
        message: 'Assinatura ativada com sucesso'
      });

    } else if (checkout_data.type === 'package') {
      // Confirmar pacote
      const { package_type, subscription_type, selected_assistants, amount } = checkout_data;
      
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (subscription_type === 'monthly' ? 1 : 6));

      // Criar pacote
      const { data: userPackage, error: packageError } = await supabase
        .from('user_packages')
        .insert({
          user_id: userId,
          package_type: `package_${package_type}`,
          subscription_type,
          total_amount: amount,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          asaas_subscription_id: payment_id
        })
        .select()
        .single();

      if (packageError) {
        throw packageError;
      }

      // Criar assinaturas individuais
      const individualPrice = amount / package_type;
      
      const subscriptionPromises = selected_assistants.map((assistantId: string) => 
        supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            assistant_id: assistantId,
            subscription_type,
            package_type: `package_${package_type}`,
            package_id: userPackage.id,
            amount: individualPrice,
            status: 'active',
            expires_at: expiresAt.toISOString()
          })
      );

      await Promise.all(subscriptionPromises);

      res.json({
        success: true,
        data: userPackage,
        message: 'Pacote ativado com sucesso'
      });
    }

  } catch (error: any) {
    console.error('Erro ao confirmar pagamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar confirmação',
      error: error.message
    });
  }
});

// Webhook do Asaas (sem autenticação)
router.post('/webhook', async (req, res) => {
  try {
    const asaasService = require('../services/asaas.service').asaasService;
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['asaas-access-token'] || req.headers['x-asaas-signature'];

    // Validar assinatura do webhook
    if (signature && !await asaasService.verifyWebhookSignature(rawBody, signature)) {
      console.warn('Assinatura de webhook inválida');
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    const { event, payment, subscription } = req.body;
    console.log('Webhook Asaas recebido:', { 
      event, 
      payment_id: payment?.id, 
      subscription_id: subscription?.id 
    });

    // Processar diferentes tipos de evento
    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        if (subscription?.id) {
          // Ativar/renovar assinatura
          await supabase
            .from('user_subscriptions')
            .update({ 
              status: 'active',
              last_payment_date: new Date().toISOString()
            })
            .eq('asaas_subscription_id', subscription.id);
          
          console.log('Assinatura ativada:', subscription.id);
        }
        break;

      case 'PAYMENT_OVERDUE':
        if (subscription?.id) {
          // Marcar como em atraso mas manter ativa por período de graça
          await supabase
            .from('user_subscriptions')
            .update({ status: 'overdue' })
            .eq('asaas_subscription_id', subscription.id);
          
          console.log('Assinatura em atraso:', subscription.id);
        }
        break;

      case 'PAYMENT_DELETED':
      case 'SUBSCRIPTION_CANCELLED':
        if (subscription?.id) {
          // Cancelar assinatura
          await supabase
            .from('user_subscriptions')
            .update({ 
              status: 'cancelled',
              cancelled_at: new Date().toISOString()
            })
            .eq('asaas_subscription_id', subscription.id);
          
          // Cancelar pacote relacionado se necessário
          await supabase
            .from('user_packages')
            .update({ 
              status: 'cancelled',
              cancelled_at: new Date().toISOString()
            })
            .eq('asaas_subscription_id', subscription.id);
          
          console.log('Assinatura cancelada:', subscription.id);
        }
        break;

      case 'SUBSCRIPTION_EXPIRED':
        if (subscription?.id) {
          // Marcar como expirada
          await supabase
            .from('user_subscriptions')
            .update({ 
              status: 'expired',
              expired_at: new Date().toISOString()
            })
            .eq('asaas_subscription_id', subscription.id);
          
          console.log('Assinatura expirada:', subscription.id);
        }
        break;

      default:
        console.log('Evento não tratado:', event);
    }

    res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('Erro no webhook Asaas:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Obter histórico de pagamentos
router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Buscar assinaturas com dados de pagamento
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        assistants (name, icon),
        user_packages (package_type)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar histórico',
        error: error.message
      });
    }

    // Processar dados para exibição
    const payments = subscriptions.map(sub => ({
      id: sub.id,
      type: sub.package_type === 'individual' ? 'individual' : 'package',
      assistant_name: sub.assistants?.name,
      assistant_icon: sub.assistants?.icon,
      package_type: sub.user_packages?.package_type,
      amount: sub.amount,
      status: sub.status,
      subscription_type: sub.subscription_type,
      created_at: sub.created_at,
      expires_at: sub.expires_at
    }));

    res.json({
      success: true,
      data: payments,
      message: 'Histórico recuperado com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

export default router;