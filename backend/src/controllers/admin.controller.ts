import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { supabase } from '../config/supabase';
import { ApiResponse } from '../types';

export class AdminController {
  // Listar todos os usuários
  static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Buscar usuários do Supabase Auth
      const { data: { users }, error } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: limit
      });

      if (error) {
        console.error('Error listing users:', error);
        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao buscar usuários'
        };
        return res.status(500).json(response);
      }

      // Buscar estatísticas de assinaturas para cada usuário
      const usersWithStats = await Promise.all(users.map(async (user) => {
        const { data: subscriptions } = await supabase
          .from('user_subscriptions')
          .select('*, assistants(name)')
          .eq('user_id', user.id)
          .eq('status', 'active');

        const { data: packages } = await supabase
          .from('user_packages')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active');

        return {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
          active_subscriptions: subscriptions?.length || 0,
          active_packages: packages?.length || 0,
          subscriptions: subscriptions || [],
          packages: packages || []
        };
      }));

      const response: ApiResponse<typeof usersWithStats> = {
        success: true,
        data: usersWithStats,
        message: 'Usuários recuperados com sucesso'
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getUsers:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  // Obter estatísticas do sistema
  static async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      // Contar usuários totais
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error('Error counting users:', usersError);
      }
      
      const totalUsers = users?.length || 0;

      // Contar assinaturas ativas
      const { count: activeSubscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Contar pacotes ativos
      const { count: activePackages, error: pkgError } = await supabase
        .from('user_packages')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Contar conversas do último mês
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { count: recentConversations, error: convError } = await supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .gte('created_at', lastMonth.toISOString());

      // Revenue mensal estimado
      const { data: subscriptionRevenue } = await supabase
        .from('user_subscriptions')
        .select('amount')
        .eq('status', 'active')
        .eq('subscription_type', 'monthly');

      const { data: packageRevenue } = await supabase
        .from('user_packages')
        .select('total_amount')
        .eq('status', 'active')
        .eq('subscription_type', 'monthly');

      const monthlyRevenue = 
        (subscriptionRevenue?.reduce((sum, sub) => sum + (sub.amount || 0), 0) || 0) +
        (packageRevenue?.reduce((sum, pkg) => sum + (pkg.total_amount || 0), 0) || 0);

      const stats = {
        totalUsers,
        activeSubscriptions: activeSubscriptions || 0,
        activePackages: activePackages || 0,
        recentConversations: recentConversations || 0,
        monthlyRevenue: monthlyRevenue,
        totalActiveRevenue: monthlyRevenue // Para simplicidade, assumindo tudo mensal
      };

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
        message: 'Estatísticas recuperadas com sucesso'
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getStats:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  // Listar todas as assinaturas
  static async getSubscriptions(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;

      let query = supabase
        .from('user_subscriptions')
        .select(`
          *,
          assistants(name, description, icon),
          user_packages(package_type, total_amount)
        `)
        .order('created_at', { ascending: false });

      if (status && ['active', 'cancelled', 'expired', 'pending'].includes(status)) {
        query = query.eq('status', status);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: subscriptions, error } = await query.range(from, to);

      if (error) {
        console.error('Error listing subscriptions:', error);
        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao buscar assinaturas'
        };
        return res.status(500).json(response);
      }

      // Count total separately
      const { count } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true });

      const response: ApiResponse<any> = {
        success: true,
        data: subscriptions || [],
        message: 'Assinaturas recuperadas com sucesso',
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getSubscriptions:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  // Atualizar status de assinatura
  static async updateSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const { subscriptionId } = req.params;
      const { status } = req.body;

      if (!['active', 'cancelled', 'expired', 'pending'].includes(status)) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Status inválido'
        };
        return res.status(400).json(response);
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating subscription:', error);
        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao atualizar assinatura'
        };
        return res.status(500).json(response);
      }

      const response: ApiResponse<typeof data> = {
        success: true,
        data,
        message: 'Assinatura atualizada com sucesso'
      };

      res.json(response);
    } catch (error) {
      console.error('Error in updateSubscription:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }

  // Atualizar assistente
  static async updateAssistant(req: AuthenticatedRequest, res: Response) {
    try {
      const { assistantId } = req.params;
      const { name, description, monthly_price, semester_price, is_active } = req.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (monthly_price !== undefined) updateData.monthly_price = monthly_price;
      if (semester_price !== undefined) updateData.semester_price = semester_price;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data, error } = await supabase
        .from('assistants')
        .update(updateData)
        .eq('id', assistantId)
        .select()
        .single();

      if (error) {
        console.error('Error updating assistant:', error);
        const response: ApiResponse<null> = {
          success: false,
          error: 'Erro ao atualizar assistente'
        };
        return res.status(500).json(response);
      }

      const response: ApiResponse<typeof data> = {
        success: true,
        data,
        message: 'Assistente atualizado com sucesso'
      };

      res.json(response);
    } catch (error) {
      console.error('Error in updateAssistant:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Erro interno do servidor'
      };
      res.status(500).json(response);
    }
  }
}