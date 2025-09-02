import { supabase } from './supabase';
import type { ApiResponse, Assistant, UserSubscription, UserPackage } from '../types';

export class ApiService {
  private static instance: ApiService;
  private baseURL: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private requestQueue = new Map<string, Promise<any>>();
  private retryCount = new Map<string, number>();
  private requestTimestamps = new Map<string, number>();
  private readonly CACHE_TTL = 60000; // 60 seconds (aumentado)
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY = 2000; // 2 seconds
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

  constructor() {
    // Detectar se está em produção baseado na URL
    const isProduction = typeof window !== 'undefined' && 
      (window.location.hostname !== 'localhost' && 
       window.location.hostname !== '127.0.0.1' && 
       window.location.hostname !== '');
    
    // Em produção, usar URL absoluta do backend
    if (isProduction) {
      this.baseURL = 'https://neuro-pro-backend.vercel.app/api';
    } else {
      // Em desenvolvimento, usar proxy local
      this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
    }
    
    console.log('🌍 API Base URL configurada:', {
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'servidor',
      isProduction,
      baseURL: this.baseURL
    });
  }

  // Singleton pattern
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Get current auth token
  private async getAuthToken(): Promise<string | null> {
    try {
      console.log('🔑 Obtendo token de autenticação...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Erro ao obter sessão:', error);
        return null;
      }
      
      if (!session) {
        console.log('❌ Nenhuma sessão encontrada');
        return null;
      }
      
      console.log('✅ Sessão encontrada:', {
        userId: session.user?.id,
        email: session.user?.email,
        hasToken: !!session.access_token,
        tokenLength: session.access_token?.length
      });
      
      return session?.access_token || null;
    } catch (error) {
      console.error('❌ Erro em getAuthToken:', error);
      return null;
    }
  }

  // Check if user is authenticated
  private async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }

  // Handle authentication errors
  private handleAuthError(error: any, silent = false) {
    if (error.status === 401) {
      // Token expired or invalid
      const errorMessage = silent ? 'Não autenticado' : 'Sessão expirada. Faça login para continuar.';
      
      // Only redirect if not in silent mode and not on dashboard
      if (!silent && !window.location.pathname.includes('/dashboard')) {
        console.warn('Authentication failed, redirecting to login');
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
    return null;
  }

  // Check cache for GET requests
  private getCachedData<T>(cacheKey: string): T | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(cacheKey); // Remove expired cache
    }
    return null;
  }

  // Set cache data
  private setCacheData(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  // Sleep function for delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Exponential backoff retry logic
  private async retryWithBackoff<T>(
    cacheKey: string,
    requestFn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      const result = await requestFn();
      // Reset retry count on success
      this.retryCount.delete(cacheKey);
      return result;
    } catch (error: any) {
      const currentRetries = this.retryCount.get(cacheKey) || 0;
      
      // Check if it's a 429 error and we haven't exceeded max retries
      if (error.message.includes('429') && currentRetries < this.MAX_RETRIES) {
        this.retryCount.set(cacheKey, currentRetries + 1);
        
        // Exponential backoff: 1s, 2s, 4s...
        const delay = this.BASE_DELAY * Math.pow(2, currentRetries);
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${currentRetries + 1}/${this.MAX_RETRIES})`);
        
        await this.sleep(delay);
        return this.retryWithBackoff(cacheKey, requestFn, attempt + 1);
      }
      
      // Reset retry count and throw error
      this.retryCount.delete(cacheKey);
      throw error;
    }
  }

  // Rate limiting - ensure minimum interval between requests
  private async enforceRateLimit(cacheKey: string): Promise<void> {
    const lastRequest = this.requestTimestamps.get(cacheKey);
    if (lastRequest) {
      const timeSinceLastRequest = Date.now() - lastRequest;
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`Rate limiting: waiting ${waitTime}ms before request`);
        await this.sleep(waitTime);
      }
    }
    this.requestTimestamps.set(cacheKey, Date.now());
  }

  // Throttle requests to prevent duplicate API calls
  private async throttleRequest<T>(cacheKey: string, requestFn: () => Promise<T>): Promise<T> {
    // If request is already in progress, wait for it
    if (this.requestQueue.has(cacheKey)) {
      return await this.requestQueue.get(cacheKey);
    }

    // Enforce rate limiting
    await this.enforceRateLimit(cacheKey);

    // Start new request with retry logic
    const requestPromise = this.retryWithBackoff(cacheKey, requestFn).finally(() => {
      this.requestQueue.delete(cacheKey);
    });

    this.requestQueue.set(cacheKey, requestPromise);
    return await requestPromise;
  }

  // Make authenticated API calls
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit & { requireAuth?: boolean; skipCache?: boolean } = {}
  ): Promise<ApiResponse<T>> {
    const { requireAuth = true, skipCache = false, ...fetchOptions } = options;
    const method = (fetchOptions.method || 'GET').toUpperCase();
    const cacheKey = `${method}:${endpoint}${fetchOptions.body ? ':' + fetchOptions.body : ''}`;

    // For GET requests, check cache first
    if (method === 'GET' && !skipCache) {
      const cached = this.getCachedData<ApiResponse<T>>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Use throttling to prevent duplicate requests
    return this.throttleRequest(cacheKey, async () => {
      return this._makeRequestInternal<T>(endpoint, { requireAuth, skipCache, ...fetchOptions });
    });
  }

  private async _makeRequestInternal<T>(
    endpoint: string, 
    options: RequestInit & { requireAuth?: boolean; skipCache?: boolean } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const { requireAuth = true, skipCache = false, ...fetchOptions } = options;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      };

      // Add authorization header if auth is required or available
      if (requireAuth) {
        console.log('🔐 Autenticação obrigatória para:', endpoint);
        const token = await this.getAuthToken();
        if (!token) {
          console.log('❌ Token não encontrado para requisição obrigatória');
          return {
            success: false,
            error: 'Usuário não autenticado. Faça login para continuar.'
          };
        }
        headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Token adicionado ao header');
      } else {
        // Optional auth - include token if available but don't require it
        console.log('🔓 Autenticação opcional para:', endpoint);
        const token = await this.getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('✅ Token opcional adicionado ao header');
        } else {
          console.log('ℹ️ Sem token para autenticação opcional');
        }
      }

      const url = `${this.baseURL}${endpoint}`;
      
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Handle network errors
      if (!response.ok) {
        if (response.status === 401) {
          const authError = this.handleAuthError({ status: 401 });
          if (authError) return authError;
        }
        
        let errorMessage = `Erro ${response.status}`;
        try {
          const result = await response.json();
          errorMessage = result.error || result.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Cache successful GET responses
      const method = (fetchOptions.method || 'GET').toUpperCase();
      if (method === 'GET' && !skipCache && result.success) {
        const cacheKey = `${method}:${endpoint}${fetchOptions.body ? ':' + fetchOptions.body : ''}`;
        this.setCacheData(cacheKey, result);
      }
      
      return result;

    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      
      // Handle network/connection errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Erro de conexão. Verifique sua internet e tente novamente.'
        };
      }

      return {
        success: false,
        error: error.message || 'Erro na comunicação com o servidor'
      };
    }
  }

  // GET request
  async get<T>(endpoint: string, options: { requireAuth?: boolean } = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { 
      method: 'GET',
      ...options 
    });
  }

  // POST request
  async post<T>(endpoint: string, data?: any, options: { requireAuth?: boolean } = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any, options: { requireAuth?: boolean } = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
  }

  // DELETE request
  async delete<T>(endpoint: string, options: { requireAuth?: boolean } = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { 
      method: 'DELETE',
      ...options 
    });
  }

  // Public methods (no auth required)
  async getAssistants(): Promise<ApiResponse<Assistant[]>> {
    return this.get<Assistant[]>('/assistants', { requireAuth: false });
  }

  async getHealthCheck(): Promise<ApiResponse<{ status: string; message: string; timestamp: string; version: string }>> {
    return this.get('/health', { requireAuth: false });
  }

  // Protected methods (auth required)
  async getSubscriptions(): Promise<ApiResponse<UserSubscription[]>> {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      return {
        success: false,
        error: 'Usuário não autenticado',
        data: []
      };
    }
    
    try {
      const result = await this.get<UserSubscription[]>('/subscriptions');
      return result;
    } catch (error: any) {
      console.warn('Error getting subscriptions:', error);
      return {
        success: false,
        error: 'Erro ao carregar subscriptions',
        data: []
      };
    }
  }

  async getUserPackages(): Promise<ApiResponse<UserPackage[]>> {
    return this.get<UserPackage[]>('/packages/user');
  }

  async createSubscription(assistantId: string, plan: 'monthly' | 'semester'): Promise<ApiResponse<UserSubscription>> {
    return this.post<UserSubscription>('/subscriptions', { assistantId, plan });
  }

  async createPackage(assistantIds: string[], plan: 'monthly' | 'semester'): Promise<ApiResponse<UserPackage>> {
    return this.post<UserPackage>('/packages', { assistantIds, plan });
  }

  // User-specific assistants (shows only subscribed ones)
  async getUserAssistants(): Promise<ApiResponse<Assistant[]>> {
    return this.get<Assistant[]>('/assistants/user');
  }

  // Check access to specific assistant
  async validateAssistantAccess(assistantId: string): Promise<ApiResponse<{ hasAccess: boolean; accessType: string }>> {
    return this.post(`/assistants/${assistantId}/validate-access`);
  }

  // Chat methods
  async createConversation(assistantId: string, title?: string): Promise<ApiResponse<any>> {
    return this.post('/chat/conversations', { assistant_id: assistantId, title });
  }

  async getConversations(): Promise<ApiResponse<any[]>> {
    return this.get('/chat/conversations');
  }

  async sendMessage(conversationId: string, message: string): Promise<ApiResponse<any>> {
    return this.post(`/chat/conversations/${conversationId}/message`, { message });
  }

  async getMessages(conversationId: string): Promise<ApiResponse<any[]>> {
    return this.get(`/chat/conversations/${conversationId}/messages`);
  }

  // Profile methods
  async getProfile(): Promise<ApiResponse<any>> {
    return this.get('/auth/profile');
  }

  async updateProfile(data: any): Promise<ApiResponse<any>> {
    return this.put('/auth/profile', data);
  }

  async getUserAccess(): Promise<ApiResponse<{ subscriptions: UserSubscription[], packages: UserPackage[] }>> {
    return this.get('/auth/access');
  }

  // Graceful error handling for dashboard data
  async getDashboardData() {
    try {
      const [assistantsResult, subscriptionsResult, packagesResult] = await Promise.allSettled([
        this.getAssistants(),
        this.getSubscriptions(),
        this.getUserPackages()
      ]);

      const assistants = assistantsResult.status === 'fulfilled' && assistantsResult.value.success 
        ? assistantsResult.value.data || [] 
        : [];

      const subscriptions = subscriptionsResult.status === 'fulfilled' && subscriptionsResult.value.success 
        ? subscriptionsResult.value.data || [] 
        : [];

      const packages = packagesResult.status === 'fulfilled' && packagesResult.value.success 
        ? packagesResult.value.data || [] 
        : [];

      return {
        success: true,
        data: {
          assistants,
          subscriptions,
          packages,
          hasAuthErrors: subscriptionsResult.status === 'rejected' || packagesResult.status === 'rejected'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Erro ao carregar dados do dashboard',
        data: { assistants: [], subscriptions: [], packages: [], hasAuthErrors: true }
      };
    }
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();
export default apiService;