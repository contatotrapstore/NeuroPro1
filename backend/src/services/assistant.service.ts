import { supabase } from '../config/supabase';
import { Assistant } from '../types';

export class AssistantService {
  // Buscar todos os assistentes ativos
  static async getAllAssistants(): Promise<Assistant[]> {
    const { data, error } = await supabase
      .from('assistants')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new Error(`Erro ao buscar assistentes: ${error.message}`);
    }

    return data || [];
  }

  // Buscar assistentes disponíveis para um usuário
  static async getUserAvailableAssistants(userId: string): Promise<Assistant[]> {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        assistant_id,
        assistants(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Erro ao buscar assistentes do usuário: ${error.message}`);
    }

    // Extrair assistentes únicos
    const assistantMap = new Map<string, Assistant>();
    data?.forEach((sub: any) => {
      if (sub.assistants && !assistantMap.has(sub.assistant_id)) {
        assistantMap.set(sub.assistant_id, sub.assistants);
      }
    });

    return Array.from(assistantMap.values());
  }

  // Validar se usuário tem acesso a um assistente específico
  static async validateUserAccess(userId: string, assistantId: string): Promise<{
    hasAccess: boolean;
    accessType: 'individual' | 'package' | null;
    subscription?: any;
  }> {
    // Verificar assinatura individual ativa
    const { data: individualSub } = await supabase
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
    const { data: packageSub } = await supabase
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
    const { data, error } = await supabase
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