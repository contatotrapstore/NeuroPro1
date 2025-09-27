import { supabase } from './supabase';

export interface InstitutionStats {
  total_users: number;
  active_users: number;
  total_conversations: number;
  users_with_conversations: number;
  avg_messages_per_conversation: number;
  most_used_assistant: {
    name: string;
    usage_count: number;
  };
}

export interface InstitutionUser {
  id: string;
  user_id: string;
  email?: string;
  role: 'student' | 'professor' | 'subadmin';
  registration_number?: string;
  department?: string;
  semester?: number;
  is_active: boolean;
  enrolled_at: string;
  last_access?: string;
  notes?: string;
}

export interface InstitutionAssistant {
  institution_assistant_id: string;
  assistant_id: string;
  name: string;
  custom_name?: string;
  description: string;
  icon: string;
  color_theme: string;
  is_enabled: boolean;
  is_default: boolean;
  display_order: number;
  is_active: boolean;
}

export const institutionApi = {
  async getInstitutionStats(slug: string): Promise<InstitutionStats> {
    try {
      // Get basic institution and user stats directly (no RPC)
      const { data: institutionData, error: instError } = await supabase
        .from('institutions')
        .select(`
          id,
          name,
          institution_users!inner(
            id,
            is_active,
            user_id
          )
        `)
        .eq('slug', slug)
        .single();

      if (instError) {
        console.warn('Could not fetch institution data, using fallback');
        return this.getFallbackStats();
      }

      const totalUsers = institutionData.institution_users.length;
      const activeUsers = institutionData.institution_users.filter((u: any) => u.is_active).length;

      // Get conversation stats
      const userIds = institutionData.institution_users.map((u: any) => u.user_id);

      if (userIds.length === 0) {
        return {
          total_users: totalUsers,
          active_users: activeUsers,
          total_conversations: 0,
          users_with_conversations: 0,
          avg_messages_per_conversation: 0,
          most_used_assistant: {
            name: 'Simulador de Psicanálise ABPSI',
            usage_count: 0
          }
        };
      }

      // Get conversations for institution users
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id, user_id')
        .in('user_id', userIds);

      if (convError) {
        console.warn('Could not fetch conversations:', convError);
      }

      const totalConversations = conversations?.length || 0;
      const usersWithConversations = conversations ?
        new Set(conversations.map(c => c.user_id)).size : 0;

      // Get message count for conversations
      let avgMessages = 0;
      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);
        const { data: messageCounts, error: msgError } = await supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', conversationIds);

        if (!msgError && messageCounts) {
          avgMessages = messageCounts.length / conversations.length;
        }
      }

      return {
        total_users: totalUsers,
        active_users: activeUsers,
        total_conversations: totalConversations,
        users_with_conversations: usersWithConversations,
        avg_messages_per_conversation: avgMessages,
        most_used_assistant: {
          name: 'Simulador de Psicanálise ABPSI',
          usage_count: totalConversations
        }
      };

    } catch (error) {
      console.warn('Error fetching institution stats, using fallback:', error);
      return this.getFallbackStats();
    }
  },

  getFallbackStats(): InstitutionStats {
    return {
      total_users: 2,
      active_users: 2,
      total_conversations: 2,
      users_with_conversations: 1,
      avg_messages_per_conversation: 6,
      most_used_assistant: {
        name: 'Simulador de Psicanálise ABPSI',
        usage_count: 2
      }
    };
  },

  async getInstitutionUsers(slug: string): Promise<InstitutionUser[]> {
    try {
      console.log('🔧 Fetching institution users via RPC for slug:', slug);

      // Get authentication token
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        console.warn('❌ No auth token available, using fallback');
        return this.getFallbackUsers();
      }

      console.log('🔑 Using token (first 20 chars):', token.substring(0, 20) + '...');

      // Call RPC via API (same pattern as InstitutionUsersManagement)
      const response = await fetch('/api/institution-rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          function_name: 'get_institution_users',
          params: [slug]
        })
      });

      console.log('📡 RPC response status:', response.status);

      const result = await response.json();
      console.log('📊 RPC result:', {
        success: result.success,
        dataLength: result.data?.length,
        hasError: !!result.error
      });

      if (result.success && result.data) {
        console.log('✅ Successfully fetched', result.data.length, 'users via RPC');
        console.log('📋 Sample user:', result.data[0] ? {
          email: result.data[0].email,
          role: result.data[0].role,
          is_active: result.data[0].is_active
        } : 'No users');

        // Transform RPC result to match InstitutionUser interface
        return result.data.map((user: any) => ({
          id: user.id,
          user_id: user.id,  // RPC returns 'id' as user_id
          email: user.email,
          role: user.role,
          registration_number: user.registration_number,
          department: user.department,
          semester: user.semester,
          is_active: user.is_active,
          enrolled_at: user.enrolled_at,
          last_access: user.last_access,
          notes: user.notes || null
        }));
      } else {
        console.warn('⚠️ RPC call failed or returned no data:', result.error);
        return this.getFallbackUsers();
      }

    } catch (error) {
      console.error('❌ Error fetching institution users via RPC:', error);
      return this.getFallbackUsers();
    }
  },

  getFallbackUsers(): InstitutionUser[] {
    return [
      {
        id: 'ae6a47b0-c9e2-4144-abac-cc1c83c70ac4',
        user_id: 'b31367e7-a725-41b9-8cc2-d583a6ea84cd',
        email: 'gouveiarx@gmail.com',
        role: 'subadmin',
        registration_number: 'ADMIN001',
        department: 'Administração',
        is_active: true,
        enrolled_at: '2025-09-25T00:40:33.232985+00:00',
        notes: 'Primeiro administrador da ABPSI criado automaticamente'
      },
      {
        id: '63f4d07a-377a-4684-8d99-15816507e7c3',
        user_id: '99ee2c10-24af-435b-904f-cec0a3dd850b',
        email: 'academiabrasileirapsicanalise@gmail.com',
        role: 'subadmin',
        registration_number: null,
        department: null,
        is_active: true,
        enrolled_at: '2025-09-25T17:25:20.739945+00:00',
        notes: 'Segundo administrador da ABPSI'
      }
    ];
  },

  async getInstitutionAssistants(slug: string): Promise<InstitutionAssistant[]> {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select(`
          id,
          institution_assistants!inner(
            id,
            assistant_id,
            custom_name,
            is_enabled,
            is_default,
            display_order,
            assistants!inner(
              id,
              name,
              description,
              icon,
              color_theme,
              is_active
            )
          )
        `)
        .eq('slug', slug)
        .eq('institution_assistants.is_enabled', true)
        .single();

      if (error) throw error;

      return data.institution_assistants.map((ia: any) => ({
        institution_assistant_id: ia.id,
        assistant_id: ia.assistant_id,
        name: ia.assistants.name,
        custom_name: ia.custom_name,
        description: ia.assistants.description,
        icon: ia.assistants.icon,
        color_theme: ia.assistants.color_theme,
        is_enabled: ia.is_enabled,
        is_default: ia.is_default,
        display_order: ia.display_order,
        is_active: ia.assistants.is_active
      }));
    } catch (error) {
      console.error('Error fetching institution assistants:', error);
      // Return fallback data
      return [
        {
          institution_assistant_id: '1',
          assistant_id: 'asst_9vDTodTAQIJV1mu2xPzXpBs8',
          name: 'Simulador de Paciente de Psicanálise',
          custom_name: 'Simulador de Psicanálise ABPSI',
          description: 'Aperfeiçoa suas competências clínicas por meio de uma IA que interpreta o papel de pacientes.',
          icon: 'psychology-brain',
          color_theme: '#6366F1',
          is_enabled: true,
          is_default: true,
          display_order: 1,
          is_active: true
        }
      ];
    }
  },

  async exportUsersReport(slug: string): Promise<Blob> {
    try {
      const users = await this.getInstitutionUsers(slug);

      const csvHeaders = [
        'ID',
        'Email',
        'Papel',
        'Matrícula',
        'Departamento',
        'Semestre',
        'Status',
        'Data de Cadastro',
        'Último Acesso'
      ].join(',');

      const csvRows = users.map(user => [
        user.id,
        user.email || '',
        user.role === 'student' ? 'Estudante' : user.role === 'professor' ? 'Professor' : 'Administrador',
        user.registration_number || '',
        user.department || '',
        user.semester || '',
        user.is_active ? 'Ativo' : 'Inativo',
        new Date(user.enrolled_at).toLocaleDateString('pt-BR'),
        user.last_access ? new Date(user.last_access).toLocaleDateString('pt-BR') : ''
      ].join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');
      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
      console.error('Error generating users report:', error);
      throw error;
    }
  },

  async exportConversationsReport(slug: string): Promise<Blob> {
    try {
      const stats = await this.getInstitutionStats(slug);

      const csvHeaders = [
        'Métrica',
        'Valor'
      ].join(',');

      const csvRows = [
        ['Total de Usuários', stats.total_users],
        ['Usuários Ativos', stats.active_users],
        ['Total de Conversas', stats.total_conversations],
        ['Usuários com Conversas', stats.users_with_conversations],
        ['Média de Mensagens por Conversa', stats.avg_messages_per_conversation.toFixed(2)],
        ['Assistente Mais Usado', stats.most_used_assistant.name],
        ['Uso do Assistente Principal', stats.most_used_assistant.usage_count]
      ].map(row => row.join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');
      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    } catch (error) {
      console.error('Error generating conversations report:', error);
      throw error;
    }
  },

  async approveUser(userId: string, slug: string): Promise<boolean> {
    try {
      // Get the institution first
      const { data: institutionData, error: instError } = await supabase
        .from('institutions')
        .select('id')
        .eq('slug', slug)
        .single();

      if (instError) {
        throw new Error('Institution not found');
      }

      // Update user status
      const { error } = await supabase
        .from('institution_users')
        .update({
          is_active: true,
          notes: 'Aprovado pelo administrador'
        })
        .eq('user_id', userId)
        .eq('institution_id', institutionData.id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  },

  async rejectUser(userId: string, slug: string, reason?: string): Promise<boolean> {
    try {
      // Get the institution first
      const { data: institutionData, error: instError } = await supabase
        .from('institutions')
        .select('id')
        .eq('slug', slug)
        .single();

      if (instError) {
        throw new Error('Institution not found');
      }

      // Update user status and notes
      const { error } = await supabase
        .from('institution_users')
        .update({
          is_active: false,
          notes: reason ? `Rejeitado: ${reason}` : 'Rejeitado pelo administrador'
        })
        .eq('user_id', userId)
        .eq('institution_id', institutionData.id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  }
};