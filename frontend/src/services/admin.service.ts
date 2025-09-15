import { ApiService } from './api.service';
import { supabase } from './supabase';

export interface AssistantStats {
  subscriptionCount: number;
  conversationCount: number;
  monthlyRevenue: number;
  recentActivity: number;
  lastUsed?: string;
}

export interface AssistantCreateData {
  id: string;
  name: string;
  description: string;
  full_description?: string;
  icon: string;
  icon_type?: 'svg' | 'image' | 'emoji';
  color_theme: string;
  area: 'Psicologia' | 'Psicopedagogia' | 'Fonoaudiologia';
  monthly_price: number;
  semester_price: number;
  is_active: boolean;
  openai_assistant_id?: string;
  specialization?: string;
  features?: string[];
  order_index?: number;
}

export interface AssistantUpdateData extends Partial<AssistantCreateData> {
  id: string;
}

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
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  user_metadata?: {
    name?: string;
    profession?: string;
  };
  active_subscriptions: number;
  active_packages?: number;
  availableAssistants?: Array<{
    id: string;
    name: string;
    icon: string;
    icon_url?: string;
    icon_type?: 'svg' | 'image' | 'emoji';
    color_theme: string;
  }>;
}

export class AdminService {
  private static instance: AdminService;
  private apiService: ApiService;

  private constructor() {
    this.apiService = ApiService.getInstance();
  }

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  // Assistant Management
  async getAssistants() {
    return this.apiService.get('/admin/assistants');
  }

  async getAssistant(id: string) {
    return this.apiService.get(`/admin/assistants/${id}`);
  }

  async createAssistant(data: AssistantCreateData) {
    return this.apiService.post('/admin/assistants', data);
  }

  async updateAssistant(id: string, data: AssistantUpdateData) {
    return this.apiService.put(`/admin/assistants/${id}`, data);
  }

  async deleteAssistant(id: string) {
    return this.apiService.delete(`/admin/assistants/${id}`);
  }

  async getAssistantStats(id: string): Promise<{ success: boolean; data?: AssistantStats; error?: string }> {
    return this.apiService.get(`/admin/assistants/${id}/stats`);
  }

  async uploadAssistantIcon(assistantId: string, file: File): Promise<{ success: boolean; data?: any; error?: string }> {
    const formData = new FormData();
    formData.append('icon', file);

    try {
      // Get proper auth token from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        return {
          success: false,
          error: 'Erro de autenticação. Faça login novamente.'
        };
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/upload/assistant-icon/${assistantId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: 'Erro ao fazer upload do ícone'
      };
    }
  }

  // Statistics and Analytics
  async getStats() {
    return this.apiService.get('/admin/stats');
  }

  async getUsers(page = 1, limit = 20) {
    return this.apiService.get(`/admin/users?page=${page}&limit=${limit}`);
  }

  async getSubscriptions(page = 1, limit = 20) {
    return this.apiService.get(`/admin/subscriptions?page=${page}&limit=${limit}`);
  }

  async getUserAvailableAssistants(userId: string) {
    return this.apiService.get(`/admin/users/${userId}/available-assistants`);
  }

  async manageUserAssistants(userId: string, assistantIds: string[], action: 'add' | 'remove') {
    return this.apiService.post(`/admin/users/${userId}/assistants`, {
      assistantIds,
      action
    });
  }

  // Cache management for real-time sync
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  private getCacheKey(endpoint: string, params?: any): string {
    return params ? `${endpoint}:${JSON.stringify(params)}` : endpoint;
  }

  async getCachedData<T>(
    endpoint: string, 
    fetcher: () => Promise<{ success: boolean; data?: T; error?: string }>,
    ttl: number = 60000 // 1 minute default
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const cacheKey = this.getCacheKey(endpoint);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return { success: true, data: cached.data };
    }

    const result = await fetcher();
    
    if (result.success && result.data) {
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now(),
        ttl
      });
    }

    return result;
  }

  invalidateCache(pattern?: string) {
    if (pattern) {
      // Remove entries matching pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear entire cache
      this.cache.clear();
    }
  }

  // Real-time synchronization
  private eventListeners = new Map<string, Set<Function>>();

  addEventListener(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  removeEventListener(event: string, callback: Function) {
    this.eventListeners.get(event)?.delete(callback);
  }

  emit(event: string, data?: any) {
    this.eventListeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Event callback error:', error);
      }
    });
  }

  // Trigger cache invalidation and emit events after modifications
  private async afterModification(type: 'create' | 'update' | 'delete', entity: 'assistant', id: string, data?: any) {
    // Invalidate related caches
    this.invalidateCache('assistants');
    this.invalidateCache(`assistant/${id}`);
    
    // Emit real-time event
    this.emit(`${entity}:${type}`, { id, data });
    this.emit(`${entity}:changed`, { type, id, data });
    
    // Global change event for UI refresh
    this.emit('data:changed', { entity, type, id, data });
  }
}

export const adminService = AdminService.getInstance();