import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabase } from '../config/supabase';
import { asaasService } from '../services/asaas.service';
import { AssistantService } from '../services/assistant.service';
import { ApiResponse } from '../types';

export class SubscriptionsController {
  // Criar assinatura individual com integração Asaas
  static async createIndividualSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const { assistant_id, subscription_type, payment_method, customer_data, card_data } = req.body;
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (!assistant_id || !subscription_type || !payment_method) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Dados obrigatórios não fornecidos'
        };
        return res.status(400).json(response);
      }

      // Verificar se o assistente existe
      const { data: assistant, error: assistantError } = await supabase
        .from('assistants')
        .select('*')
        .eq('id', assistant_id)
        .eq('is_active', true)
        .single();

      if (assistantError || !assistant) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Assistente não encontrado'
        };
        return res.status(404).json(response);
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
        const response: ApiResponse<null> = {
          success: false,
          error: 'Você já possui uma assinatura ativa para este assistente'
        };
        return res.status(400).json(response);
      }

      // Calcular valores
      const amount = asaasService.getSubscriptionValue(subscription_type, 'individual');
      const nextDueDate = asaasService.calculateNextDueDate(subscription_type);
      const cycle = asaasService.mapSubscriptionType(subscription_type);

      // Criar cliente no Asaas
      let asaasCustomer;
      try {
        asaasCustomer = await asaasService.createCustomer({
          name: customer_data?.name || 'Cliente',
          email: userEmail || customer_data?.email,
          cpfCnpj: customer_data?.cpfCnpj,
          phone: customer_data?.phone,
          mobilePhone: customer_data?.mobilePhone,
          postalCode: customer_data?.postalCode,
          address: customer_data?.address,
          addressNumber: customer_data?.addressNumber,
          province: customer_data?.province,
          city: customer_data?.city,
          state: customer_data?.state
        });
      } catch (error: any) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Erro ao criar cliente: ${error.message}`
        };
        return res.status(500).json(response);
      }

      // Preparar dados da assinatura
      const subscriptionData: any = {
        customer: asaasCustomer.id,
        billingType: payment_method,
        value: amount,
        nextDueDate: nextDueDate,
        cycle: cycle,
        description: `NeuroIA Lab - ${assistant.name} (${subscription_type})`
      };

      // Adicionar dados do cartão se for pagamento por cartão
      if (payment_method === 'CREDIT_CARD' && card_data) {
        subscriptionData.creditCard = {
          holderName: card_data.holderName,
          number: card_data.number,
          expiryMonth: card_data.expiryMonth,
          expiryYear: card_data.expiryYear,
          ccv: card_data.ccv
        };

        subscriptionData.creditCardHolderInfo = {
          name: customer_data?.name || card_data.holderName,
          email: userEmail || customer_data?.email,
          cpfCnpj: customer_data?.cpfCnpj,
          postalCode: customer_data?.postalCode || '00000000',
          addressNumber: customer_data?.addressNumber || 'S/N',
          addressComplement: customer_data?.complement,
          phone: customer_data?.phone || '',
          mobilePhone: customer_data?.mobilePhone
        };
      }

      // Criar assinatura no Asaas
      let asaasSubscription;
      try {
        asaasSubscription = await asaasService.createSubscription(subscriptionData);
      } catch (error: any) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Erro ao processar pagamento: ${error.message}`
        };
        return res.status(500).json(response);
      }

      // Calcular data de expiração
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (subscription_type === 'monthly' ? 1 : 6));

      // Criar assinatura no banco
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          assistant_id,
          subscription_type,
          package_type: 'individual',
          amount,
          status: asaasSubscription.status.toLowerCase(),
          asaas_subscription_id: asaasSubscription.id,
          expires_at: expiresAt.toISOString()
        })
        .select('*, assistants(name, description, icon, color_theme)')
        .single();

      if (subscriptionError) {
        // Tentar cancelar assinatura no Asaas se a criação no banco falhar
        try {
          await asaasService.cancelSubscription(asaasSubscription.id);
        } catch (error) {
          console.error('Erro ao cancelar assinatura no Asaas:', error);
        }

        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao salvar assinatura'
        };
        return res.status(500).json(response);
      }

      const response: ApiResponse<typeof subscription> = {
        success: true,
        data: subscription,
        message: 'Assinatura criada com sucesso'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating individual subscription:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  // Criar pacote customizado com integração Asaas
  static async createPackageSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const { package_type, subscription_type, assistant_ids, payment_method, customer_data, card_data } = req.body;
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      // Validações
      if (!package_type || !subscription_type || !assistant_ids || !payment_method) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Dados obrigatórios não fornecidos'
        };
        return res.status(400).json(response);
      }

      const expectedCount = package_type === 'package_3' ? 3 : 6;
      if (assistant_ids.length !== expectedCount) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Selecione exatamente ${expectedCount} assistentes para este pacote`
        };
        return res.status(400).json(response);
      }

      // Verificar se todos os assistentes existem
      const { data: assistants, error: assistantsError } = await supabase
        .from('assistants')
        .select('*')
        .in('id', assistant_ids)
        .eq('is_active', true);

      if (assistantsError || assistants.length !== expectedCount) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Um ou mais assistentes são inválidos'
        };
        return res.status(400).json(response);
      }

      // Calcular valores
      const totalAmount = asaasService.getSubscriptionValue(subscription_type, package_type);
      const nextDueDate = asaasService.calculateNextDueDate(subscription_type);
      const cycle = asaasService.mapSubscriptionType(subscription_type);

      // Criar cliente no Asaas
      let asaasCustomer;
      try {
        asaasCustomer = await asaasService.createCustomer({
          name: customer_data?.name || 'Cliente',
          email: userEmail || customer_data?.email,
          cpfCnpj: customer_data?.cpfCnpj,
          phone: customer_data?.phone,
          mobilePhone: customer_data?.mobilePhone,
          postalCode: customer_data?.postalCode,
          address: customer_data?.address,
          addressNumber: customer_data?.addressNumber,
          province: customer_data?.province,
          city: customer_data?.city,
          state: customer_data?.state
        });
      } catch (error: any) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Erro ao criar cliente: ${error.message}`
        };
        return res.status(500).json(response);
      }

      // Preparar dados da assinatura
      const packageName = package_type === 'package_3' ? '3 Assistentes' : '6 Assistentes';
      const subscriptionData: any = {
        customer: asaasCustomer.id,
        billingType: payment_method,
        value: totalAmount,
        nextDueDate: nextDueDate,
        cycle: cycle,
        description: `NeuroIA Lab - Pacote ${packageName} (${subscription_type})`
      };

      // Adicionar dados do cartão se for pagamento por cartão
      if (payment_method === 'CREDIT_CARD' && card_data) {
        subscriptionData.creditCard = {
          holderName: card_data.holderName,
          number: card_data.number,
          expiryMonth: card_data.expiryMonth,
          expiryYear: card_data.expiryYear,
          ccv: card_data.ccv
        };

        subscriptionData.creditCardHolderInfo = {
          name: customer_data?.name || card_data.holderName,
          email: userEmail || customer_data?.email,
          cpfCnpj: customer_data?.cpfCnpj,
          postalCode: customer_data?.postalCode || '00000000',
          addressNumber: customer_data?.addressNumber || 'S/N',
          addressComplement: customer_data?.complement,
          phone: customer_data?.phone || '',
          mobilePhone: customer_data?.mobilePhone
        };
      }

      // Criar assinatura no Asaas
      let asaasSubscription;
      try {
        asaasSubscription = await asaasService.createSubscription(subscriptionData);
      } catch (error: any) {
        const response: ApiResponse<null> = {
          success: false,
          error: `Erro ao processar pagamento: ${error.message}`
        };
        return res.status(500).json(response);
      }

      // Calcular data de expiração
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + (subscription_type === 'monthly' ? 1 : 6));

      // Criar pacote no banco
      const { data: userPackage, error: packageError } = await supabase
        .from('user_packages')
        .insert({
          user_id: userId,
          package_type,
          subscription_type,
          total_amount: totalAmount,
          status: asaasSubscription.status.toLowerCase(),
          asaas_subscription_id: asaasSubscription.id,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (packageError) {
        // Tentar cancelar assinatura no Asaas se a criação no banco falhar
        try {
          await asaasService.cancelSubscription(asaasSubscription.id);
        } catch (error) {
          console.error('Erro ao cancelar assinatura no Asaas:', error);
        }

        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao criar pacote'
        };
        return res.status(500).json(response);
      }

      // Criar assinaturas individuais dentro do pacote
      const individualPrice = totalAmount / expectedCount;
      const subscriptionPromises = assistant_ids.map((assistantId: string) =>
        supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            assistant_id: assistantId,
            subscription_type,
            package_type,
            package_id: userPackage.id,
            amount: individualPrice,
            status: asaasSubscription.status.toLowerCase(),
            asaas_subscription_id: asaasSubscription.id,
            expires_at: expiresAt.toISOString()
          })
      );

      const subscriptionResults = await Promise.all(subscriptionPromises);

      // Verificar se todas as assinaturas foram criadas
      const hasError = subscriptionResults.some(result => result.error);
      if (hasError) {
        // Reverter criações em caso de erro
        await supabase.from('user_packages').delete().eq('id', userPackage.id);
        
        try {
          await asaasService.cancelSubscription(asaasSubscription.id);
        } catch (error) {
          console.error('Erro ao cancelar assinatura no Asaas:', error);
        }

        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao criar assinaturas do pacote'
        };
        return res.status(500).json(response);
      }

      const response: ApiResponse<any> = {
        success: true,
        data: {
          package: userPackage,
          assistants: assistants,
          subscription_count: assistant_ids.length
        },
        message: 'Pacote criado com sucesso'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating package subscription:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  // Cancelar assinatura
  static async cancelSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const { subscriptionId } = req.params;
      const userId = req.user?.id;

      // Verificar se a assinatura pertence ao usuário
      const { data: subscription, error: findError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_id', userId)
        .single();

      if (findError || !subscription) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Assinatura não encontrada'
        };
        return res.status(404).json(response);
      }

      // Cancelar no Asaas se existe ID
      if (subscription.asaas_subscription_id) {
        try {
          await asaasService.cancelSubscription(subscription.asaas_subscription_id);
        } catch (error: any) {
          console.error('Erro ao cancelar no Asaas:', error);
          // Continua com o cancelamento local mesmo se falhar no Asaas
        }
      }

      // Cancelar assinatura no banco
      const { error: cancelError } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (cancelError) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao cancelar assinatura'
        };
        return res.status(500).json(response);
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Assinatura cancelada com sucesso'
      };

      res.json(response);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  // Cancelar pacote
  static async cancelPackage(req: AuthenticatedRequest, res: Response) {
    try {
      const { packageId } = req.params;
      const userId = req.user?.id;

      // Verificar se o pacote pertence ao usuário
      const { data: userPackage, error: findError } = await supabase
        .from('user_packages')
        .select('*')
        .eq('id', packageId)
        .eq('user_id', userId)
        .single();

      if (findError || !userPackage) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Pacote não encontrado'
        };
        return res.status(404).json(response);
      }

      // Cancelar no Asaas se existe ID
      if (userPackage.asaas_subscription_id) {
        try {
          await asaasService.cancelSubscription(userPackage.asaas_subscription_id);
        } catch (error: any) {
          console.error('Erro ao cancelar no Asaas:', error);
          // Continua com o cancelamento local mesmo se falhar no Asaas
        }
      }

      // Cancelar pacote no banco
      const { error: cancelPackageError } = await supabase
        .from('user_packages')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', packageId);

      if (cancelPackageError) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao cancelar pacote'
        };
        return res.status(500).json(response);
      }

      // Cancelar todas as assinaturas do pacote
      const { error: cancelSubscriptionsError } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('package_id', packageId);

      if (cancelSubscriptionsError) {
        console.error('Erro ao cancelar assinaturas do pacote:', cancelSubscriptionsError);
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Pacote cancelado com sucesso'
      };

      res.json(response);
    } catch (error) {
      console.error('Error cancelling package:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  // Listar assinaturas do usuário
  static async getUserSubscriptions(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const userClient = req.supabaseClient;

      console.log('🔍 [getUserSubscriptions] Iniciando busca de assinaturas');
      console.log('🔍 [getUserSubscriptions] User ID:', userId);
      console.log('🔍 [getUserSubscriptions] Cliente individual disponível:', !!userClient);

      if (!userClient) {
        console.log('❌ [getUserSubscriptions] Cliente individual não disponível, usando fallback');
      }

      // Usar cliente individual da requisição ou fallback para o compartilhado
      const client = userClient || supabase;

      const { data: subscriptions, error } = await client
        .from('user_subscriptions')
        .select(`
          *,
          assistants (
            id,
            name,
            description,
            icon,
            color_theme,
            openai_assistant_id
          ),
          user_packages (
            id,
            package_type,
            total_amount
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('🔍 [getUserSubscriptions] Query executada');
      console.log('🔍 [getUserSubscriptions] Erro:', error);
      console.log('🔍 [getUserSubscriptions] Subscriptions encontradas:', subscriptions?.length || 0);

      if (error) {
        console.error('❌ [getUserSubscriptions] Erro na query:', error);
        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao buscar assinaturas'
        };
        return res.status(500).json(response);
      }

      console.log('✅ [getUserSubscriptions] Retornando', subscriptions?.length || 0, 'assinaturas');
      const response: ApiResponse<typeof subscriptions> = {
        success: true,
        data: subscriptions || []
      };

      res.json(response);
    } catch (error) {
      console.error('❌ [getUserSubscriptions] Error getting user subscriptions:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  // Listar pacotes do usuário
  static async getUserPackages(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const userClient = req.supabaseClient;

      console.log('🔍 [getUserPackages] Iniciando busca de pacotes');
      console.log('🔍 [getUserPackages] User ID:', userId);
      console.log('🔍 [getUserPackages] Cliente individual disponível:', !!userClient);

      // Usar cliente individual da requisição ou fallback para o compartilhado
      const client = userClient || supabase;

      const { data: packages, error } = await client
        .from('user_packages')
        .select(`
          *,
          user_subscriptions (
            assistant_id,
            assistants (
              id,
              name,
              description,
              icon,
              color_theme,
              openai_assistant_id
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('🔍 [getUserPackages] Query executada');
      console.log('🔍 [getUserPackages] Erro:', error);
      console.log('🔍 [getUserPackages] Packages encontrados:', packages?.length || 0);

      if (error) {
        console.error('❌ [getUserPackages] Erro na query:', error);
        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao buscar pacotes'
        };
        return res.status(500).json(response);
      }

      console.log('✅ [getUserPackages] Retornando', packages?.length || 0, 'pacotes');
      const response: ApiResponse<typeof packages> = {
        success: true,
        data: packages || []
      };

      res.json(response);
    } catch (error) {
      console.error('❌ [getUserPackages] Error getting user packages:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  // Listar assistentes acessíveis ao usuário (usando função otimizada)
  static async getUserAssistants(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const userClient = req.supabaseClient;

      console.log('🔍 [getUserAssistants] Buscando assistentes para usuário:', userId);
      console.log('🔍 [getUserAssistants] Cliente individual disponível:', !!userClient);

      if (!userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Usuário não autenticado'
        };
        return res.status(401).json(response);
      }

      // Usar o serviço de assistentes com o cliente individual da requisição
      const assistants = await AssistantService.getUserAvailableAssistants(userId, userClient);

      const response: ApiResponse<typeof assistants> = {
        success: true,
        data: assistants,
        message: 'Assistentes recuperados com sucesso'
      };

      console.log('✅ [getUserAssistants] Retornando assistentes do serviço:', assistants.length);
      res.json(response);
    } catch (error) {
      console.error('❌ [getUserAssistants] Error getting user assistants:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  // Validar acesso do usuário a um assistente específico
  static async validateAssistantAccess(req: AuthenticatedRequest, res: Response) {
    try {
      const { assistantId } = req.params;
      const userId = req.user?.id;

      const { data: accessData, error } = await supabase
        .rpc('check_user_assistant_access', {
          p_user_id: userId,
          p_assistant_id: assistantId,
          p_current_time: new Date().toISOString()
        });

      if (error) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao verificar acesso'
        };
        return res.status(500).json(response);
      }

      const response: ApiResponse<typeof accessData> = {
        success: true,
        data: accessData
      };

      res.json(response);
    } catch (error) {
      console.error('Error validating assistant access:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  // Obter resumo de acesso do usuário
  static async getUserAccessSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      const { data: summary, error } = await supabase
        .rpc('get_user_access_summary', {
          p_user_id: userId,
          p_current_time: new Date().toISOString()
        });

      if (error) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao obter resumo de acesso'
        };
        return res.status(500).json(response);
      }

      const response: ApiResponse<typeof summary> = {
        success: true,
        data: summary
      };

      res.json(response);
    } catch (error) {
      console.error('Error getting user access summary:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }
}