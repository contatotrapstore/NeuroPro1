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
  availableAssistants?: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
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

export interface AdminAssistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  monthly_price: number;
  semester_price: number;
  is_active: boolean;
  openai_id: string;
  stats?: {
    activeSubscriptions: number;
    monthlyRevenue: number;
    recentConversations: number;
  };
}

export interface AdminAnalytics {
  mrr: number;
  newUsers: number;
  conversionRate: number;
  totalActiveSubscriptions: number;
  mostPopularAssistants: Array<{
    assistant_id: string;
    count: number;
    name: string;
  }>;
  monthlyEvolution: Array<{
    month: string;
    revenue: number;
    date: string;
  }>;
  period: {
    startDate: string;
    endDate: string;
    type: string;
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

  // Listar assistentes com estatísticas
  async getAssistants(): Promise<{ success: boolean; data?: AdminAssistant[]; error?: string }> {
    try {
      return await this.apiService.get('/admin/assistants');
    } catch (error: any) {
      console.error('Error fetching admin assistants:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar assistentes'
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

  // Atualizar múltiplos assistentes (ação em lote)
  async bulkUpdateAssistants(assistants: Array<{ id: string; is_active: boolean }>, action: string): Promise<{ 
    success: boolean; 
    data?: any; 
    error?: string 
  }> {
    try {
      return await this.apiService.put('/admin/assistants/bulk', { assistants, action });
    } catch (error: any) {
      console.error('Error bulk updating assistants:', error);
      return {
        success: false,
        error: error.message || 'Erro ao atualizar assistentes em lote'
      };
    }
  }

  // Obter analytics avançados com filtros
  async getAnalytics(params?: {
    startDate?: string;
    endDate?: string;
    period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }): Promise<{ success: boolean; data?: AdminAnalytics; error?: string }> {
    try {
      let url = '/admin/analytics';
      if (params) {
        const queryParams = new URLSearchParams();
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.period) queryParams.append('period', params.period);
        
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
      }
      
      return await this.apiService.get(url);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar analytics'
      };
    }
  }

  // Exportar dados
  async exportData(type: 'users' | 'subscriptions' | 'revenue', format: 'csv' | 'json' = 'csv'): Promise<{ 
    success: boolean; 
    data?: any; 
    error?: string 
  }> {
    try {
      const url = `/admin/export?type=${type}&format=${format}`;
      return await this.apiService.get(url);
    } catch (error: any) {
      console.error('Error exporting data:', error);
      return {
        success: false,
        error: error.message || 'Erro ao exportar dados'
      };
    }
  }

  // Baixar arquivo de exportação
  async downloadExport(type: 'users' | 'subscriptions' | 'revenue'): Promise<void> {
    try {
      const apiService = this.apiService as any;
      const response = await fetch(`${apiService.baseURL}/admin/export?type=${type}&format=csv`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await apiService.getAuthToken()}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading export:', error);
      throw error;
    }
  }

  // Obter assistentes disponíveis para um usuário
  async getUserAvailableAssistants(userId: string): Promise<{ 
    success: boolean; 
    data?: Array<{
      id: string;
      name: string;
      icon: string;
      hasAccess: boolean;
    }>; 
    error?: string 
  }> {
    try {
      return await this.apiService.get(`/admin/users/${userId}/assistants`);
    } catch (error: any) {
      console.error('Error fetching user assistants:', error);
      return {
        success: false,
        error: error.message || 'Erro ao buscar assistentes do usuário'
      };
    }
  }

  // Gerenciar IAs de um usuário
  async manageUserAssistants(userId: string, assistantIds: string[], action: 'add' | 'remove'): Promise<{ 
    success: boolean; 
    data?: any; 
    error?: string 
  }> {
    try {
      return await this.apiService.put(`/admin/users/${userId}/assistants`, { assistantIds, action });
    } catch (error: any) {
      console.error('Error managing user assistants:', error);
      return {
        success: false,
        error: error.message || 'Erro ao gerenciar assistentes do usuário'
      };
    }
  }
}

// Singleton instance
export const adminService = new AdminService();