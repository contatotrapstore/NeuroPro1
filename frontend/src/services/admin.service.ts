import { ApiService } from './api.service';

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  activePackages: number;
  recentConversations: number;
  monthlyRevenue: number;
  totalActiveRevenue: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  active_subscriptions: number;
  active_packages: number;
  subscriptions: any[];
  packages: any[];
}

export interface AdminSubscription {
  id: string;
  user_id: string;
  assistant_id: string;
  status: string;
  amount: number;
  subscription_type: string;
  created_at: string;
  expires_at?: string;
  assistants?: {
    name: string;
    description: string;
    icon: string;
  };
  user_packages?: {
    package_type: string;
    total_amount: number;
  };
}

export class AdminService {
  private apiService: ApiService;

  constructor() {
    this.apiService = ApiService.getInstance();
  }

  // Obter estatísticas do dashboard admin
  async getStats(): Promise<{ success: boolean; data?: AdminStats; error?: string }> {
    try {
      return await this.apiService.get('/admin/stats');
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar estatísticas'
      };
    }
  }

  // Listar usuários
  async getUsers(page = 1, limit = 20): Promise<{ success: boolean; data?: AdminUser[]; error?: string }> {
    try {
      return await this.apiService.get(`/admin/users?page=${page}&limit=${limit}`);
    } catch (error: any) {
      console.error('Error fetching admin users:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar usuários'
      };
    }
  }

  // Listar assinaturas
  async getSubscriptions(page = 1, limit = 20, status?: string): Promise<{ 
    success: boolean; 
    data?: AdminSubscription[]; 
    error?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  }> {
    try {
      let url = `/admin/subscriptions?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }
      return await this.apiService.get(url);
    } catch (error: any) {
      console.error('Error fetching admin subscriptions:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar assinaturas'
      };
    }
  }

  // Atualizar status de assinatura
  async updateSubscription(subscriptionId: string, status: string): Promise<{ 
    success: boolean; 
    data?: any; 
    error?: string 
  }> {
    try {
      return await this.apiService.put(`/admin/subscriptions/${subscriptionId}`, { status });
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      return {
        success: false,
        error: error.message || 'Erro ao atualizar assinatura'
      };
    }
  }

  // Atualizar assistente
  async updateAssistant(assistantId: string, updateData: {
    name?: string;
    description?: string;
    monthly_price?: number;
    semester_price?: number;
    is_active?: boolean;
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      return await this.apiService.put(`/admin/assistants/${assistantId}`, updateData);
    } catch (error: any) {
      console.error('Error updating assistant:', error);
      return {
        success: false,
        error: error.message || 'Erro ao atualizar assistente'
      };
    }
  }
}

// Singleton instance
export const adminService = new AdminService();