import { supabase, supabaseClient } from '../config/supabase';
import { Assistant } from '../types';

export class AssistantService {
  // Buscar todos os assistentes ativos
  static async getAllAssistants(): Promise<Assistant[]> {
    try {
      const { data, error } = await supabaseClient
        .from('assistants')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Supabase error:', error);
        // Retornar dados mock enquanto configuramos a API corretamente
        return AssistantService.getMockAssistants();
      }

      return data || [];
    } catch (error) {
      console.error('Assistant service error:', error);
      // Retornar dados mock enquanto configuramos a API corretamente
      return AssistantService.getMockAssistants();
    }
  }

  // Fallback data with all 14 assistants (matches database structure)
  private static getMockAssistants(): Assistant[] {
    return [
      {
        id: 'psicoplano',
        name: 'PsicoPlano',
        description: 'Formulador de Rotas Terapêuticas - Especialista em criar planos de tratamento personalizados e estruturar rotas terapêuticas eficazes.',
        icon: 'map-route',
        color_theme: '#2D5A1F',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_8kNKRg68rR8zguhYzdlMEvQc',
        created_at: new Date().toISOString()
      },
      {
        id: 'neurocase',
        name: 'NeuroCase',
        description: 'Revisor de Casos Clínicos - Analisa casos complexos, oferece insights diagnósticos e sugere abordagens terapêuticas baseadas em evidências.',
        icon: 'clipboard-check',
        color_theme: '#1E40AF',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_UtJjVaQsINwkM9AbsZwGyXJh',
        created_at: new Date().toISOString()
      },
      {
        id: 'guia-etico',
        name: 'Guia Ético',
        description: 'Guia de Ética Profissional - Orientações sobre dilemas éticos, códigos de conduta e melhores práticas na psicologia clínica.',
        icon: 'balance-scale',
        color_theme: '#7C3AED',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_sQtvXr0d5UtxQzYh3a5NZiQ2',
        created_at: new Date().toISOString()
      },
      {
        id: 'sessaomap',
        name: 'SessãoMap',
        description: 'Formulador de Estruturas de Sessão - Organiza e estrutura sessões terapêuticas para maximizar a eficácia do atendimento.',
        icon: 'calendar-clock',
        color_theme: '#DC2626',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_WnaoRt68AqYhmqlBn5JmoSPR',
        created_at: new Date().toISOString()
      },
      {
        id: 'clinreplay',
        name: 'ClinReplay',
        description: 'Treinador de Sessões (Paciente IA) - Simulador de pacientes para prática e aperfeiçoamento de técnicas terapêuticas.',
        icon: 'conversation',
        color_theme: '#059669',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_LH7OonszQw0XYukWdUnj08hP',
        created_at: new Date().toISOString()
      },
      {
        id: 'cognitimap',
        name: 'CognitiMap',
        description: 'Construtor de Reestruturação Cognitiva - Especialista em técnicas de TCC para identificar e reestruturar pensamentos disfuncionais.',
        icon: 'brain-gear',
        color_theme: '#EA580C',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_cMKH3IySHOdSrp3bjZ4pXKsO',
        created_at: new Date().toISOString()
      },
      {
        id: 'mindroute',
        name: 'MindRoute',
        description: 'Guia de Abordagens Psicológicas - Orientador sobre diferentes correntes teóricas e suas aplicações práticas.',
        icon: 'compass',
        color_theme: '#0891B2',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_U97xBl6jNqrXt3pUvdiiqdBT',
        created_at: new Date().toISOString()
      },
      {
        id: 'theratrack',
        name: 'TheraTrack',
        description: 'Avaliador de Evolução Terapêutica - Monitora progressos, avalia resultados e sugere ajustes no tratamento.',
        icon: 'trending-up',
        color_theme: '#BE185D',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_BilxxLcGfFty0hcQibI7v58o',
        created_at: new Date().toISOString()
      },
      {
        id: 'neurolaudo',
        name: 'NeuroLaudo',
        description: 'Elaborador de Laudos Psicológicos - Assistente para criação de relatórios, laudos e documentos técnicos profissionais.',
        icon: 'document-seal',
        color_theme: '#9333EA',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_IQhnx3d2euQ8SoA2ygNoiCnZ',
        created_at: new Date().toISOString()
      },
      {
        id: 'psicotest',
        name: 'PsicoTest',
        description: 'Consultor de Testes Psicológicos - Orientações sobre aplicação, interpretação e escolha de instrumentos psicométricos.',
        icon: 'test-clipboard',
        color_theme: '#C2410C',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_eRiimrLZik6EgN3F1o27n4Ch',
        created_at: new Date().toISOString()
      },
      {
        id: 'therafocus',
        name: 'TheraFocus',
        description: 'Organizador de Intervenções para Transtornos Específicos - Especialista em protocolos para transtornos psicológicos específicos.',
        icon: 'target',
        color_theme: '#7C2D12',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_uGtcaF2p3wakd0bg23o5YGPk',
        created_at: new Date().toISOString()
      },
      {
        id: 'psicobase',
        name: 'PsicoBase',
        description: 'Estratégias Clínicas Baseadas em Evidências - Banco de conhecimento com intervenções validadas cientificamente.',
        icon: 'book-search',
        color_theme: '#166534',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_Yrin9tCffeXun3xVoLYaHZaH',
        created_at: new Date().toISOString()
      },
      {
        id: 'mindhome',
        name: 'MindHome',
        description: 'Elaborador de Atividades Terapêuticas Domiciliares - Cria exercícios e atividades para pacientes realizarem em casa.',
        icon: 'home-heart',
        color_theme: '#0F766E',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_1qXeJs1jYlYMP58ewPWUmCln',
        created_at: new Date().toISOString()
      },
      {
        id: 'clinprice',
        name: 'ClinPrice',
        description: 'Avaliador de Custos de Sessões Clínicas - Calcula valores justos para diferentes tipos de atendimento psicológico.',
        icon: 'calculator-dollar',
        color_theme: '#A16207',
        monthly_price: 39.90,
        semester_price: 199.00,
        is_active: true,
        openai_assistant_id: 'asst_ujSBJg2V5CJvIQgInE6FX4rM',
        created_at: new Date().toISOString()
      }
    ];
  }

  // Buscar assistentes disponíveis para um usuário
  static async getUserAvailableAssistants(userId: string, userClient?: any): Promise<Assistant[]> {
    try {
      console.log('=== DEBUG getUserAvailableAssistants ===');
      console.log('User ID recebido:', userId);
      console.log('Cliente individual fornecido:', userClient ? 'Sim' : 'Não');
      console.log('Data atual:', new Date().toISOString());

      // Usar o cliente individual da requisição ou fallback para o padrão
      const client = userClient || supabaseClient;
      
      if (userClient) {
        console.log('✅ Usando cliente Supabase individual da requisição');
      } else {
        console.log('⚠️ Usando cliente compartilhado - pode haver problemas com RLS');
      }

      const { data: subscriptions, error: subsError } = await client
        .from('user_subscriptions')
        .select('assistant_id, status, expires_at, created_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      console.log('Query de assinaturas executada');
      console.log('Erro na query:', subsError);
      console.log('Dados retornados:', subscriptions);

      if (subsError) {
        console.error('Erro ao buscar assinaturas:', subsError);
        return [];
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log('❌ Nenhuma assinatura ativa encontrada para o usuário');
        
        // Verificar se existem assinaturas sem filtro de data
        const { data: allSubs } = await client
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId);
        console.log('Todas as assinaturas do usuário (sem filtro):', allSubs);
        
        return [];
      }

      console.log('✅ Assinaturas ativas encontradas:', subscriptions.length);

      // Extrair IDs únicos dos assistentes
      const assistantIds = [...new Set(subscriptions.map((sub: any) => sub.assistant_id))];
      console.log('IDs de assistentes extraídos:', assistantIds);

      // Buscar dados dos assistentes (assistants são públicos, não precisam de token)
      const { data: assistants, error: assistantsError } = await supabaseClient
        .from('assistants')
        .select('*')
        .in('id', assistantIds)
        .eq('is_active', true);

      console.log('Query de assistentes executada');
      console.log('Erro na query:', assistantsError);
      console.log('Assistentes encontrados:', assistants?.length || 0);

      if (assistantsError) {
        console.error('Erro ao buscar dados dos assistentes:', assistantsError);
        return [];
      }

      console.log('=== FIM DEBUG ===');
      return assistants || [];
    } catch (error) {
      console.error('Erro geral ao buscar assistentes do usuário:', error);
      return [];
    }
  }

  // Validar se usuário tem acesso a um assistente específico
  static async validateUserAccess(userId: string, assistantId: string): Promise<{
    hasAccess: boolean;
    accessType: 'individual' | 'package' | null;
    subscription?: any;
  }> {
    // Verificar assinatura individual ativa
    const { data: individualSub } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('assistant_id', assistantId)
      .eq('package_type', 'individual')
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (individualSub) {
      return { 
        hasAccess: true, 
        accessType: 'individual', 
        subscription: individualSub 
      };
    }

    // Verificar acesso via pacote
    const { data: packageSub } = await supabaseClient
      .from('user_subscriptions')
      .select(`
        *,
        user_packages(*)
      `)
      .eq('user_id', userId)
      .eq('assistant_id', assistantId)
      .in('package_type', ['package_3', 'package_6'])
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .single();

    if (packageSub) {
      return { 
        hasAccess: true, 
        accessType: 'package', 
        subscription: packageSub 
      };
    }

    return { hasAccess: false, accessType: null };
  }

  // Buscar assistente por ID
  static async getAssistantById(assistantId: string): Promise<Assistant | null> {
    const { data, error } = await supabaseClient
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Não encontrado
      }
      throw new Error(`Erro ao buscar assistente: ${error.message}`);
    }

    return data;
  }
}