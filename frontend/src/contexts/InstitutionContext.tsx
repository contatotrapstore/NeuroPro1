import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';
import { getInstitutionStaticData } from '../config/institutions';

export interface Institution {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color: string;
  secondary_color?: string;
  settings: {
    welcome_message?: string;
    subtitle?: string;
    features?: string[];
    theme?: {
      font_family?: string;
      border_radius?: string;
      gradient?: string;
    };
    contact?: {
      email?: string;
      phone?: string;
      website?: string;
    };
    branding?: {
      show_neurolab_footer?: boolean;
      custom_favicon?: string;
      meta_description?: string;
    };
  };
}

export interface InstitutionAssistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  color_theme: string;
  openai_assistant_id?: string;
  is_simulator: boolean;
  is_primary: boolean;
  display_order: number;
}

export interface UserAccess {
  role: 'student' | 'teacher' | 'subadmin';
  is_admin: boolean;
  is_active: boolean; // Added is_active field
  permissions: {
    manage_users?: boolean;
    view_reports?: boolean;
    manage_assistants?: boolean;
    manage_settings?: boolean;
    view_conversations?: boolean;
    export_data?: boolean;
  };
  joined_at: string;
}

interface InstitutionContextType {
  // Estado principal
  institution: Institution | null;
  userAccess: UserAccess | null;
  availableAssistants: InstitutionAssistant[];

  // Estados de carregamento
  loading: boolean;
  error: string | null;
  authenticationComplete: boolean;
  institutionLoaded: boolean;

  // Estados de assinatura
  hasActiveSubscription: boolean;
  subscriptionError: string | null;
  isCheckingSubscription: boolean;

  // Funções
  loadInstitution: (slug: string, bypassCache?: boolean) => Promise<boolean>;
  verifyAccess: (token: string, slug: string) => Promise<boolean>;
  checkSubscription: (slug: string) => Promise<boolean>;
  createSubscription: (
    slug: string,
    planType?: 'monthly' | 'semester' | 'annual',
    paymentMethod?: 'pix' | 'credit_card'
  ) => Promise<{ success: boolean; subscription_id?: string; error?: string }>;
  activateSubscription: (
    subscriptionId: string,
    paymentId: string
  ) => Promise<{ success: boolean; error?: string }>;
  refreshUserAccess: (token: string, slug: string) => Promise<boolean>;
  clearContext: () => void;
  clearInstitutionCache: (slug: string) => void;
  setAuthenticationComplete: (complete: boolean) => void;

  // Helpers
  hasPermission: (permission: string) => boolean;
  isInstitutionUser: boolean;
  canAccessAdminPanel: boolean;
  canAccessAssistants: boolean; // Verificação dupla: aprovação + pagamento
  getPrimaryAssistant: () => InstitutionAssistant | null;
  getSimulatorAssistant: () => InstitutionAssistant | null;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

interface InstitutionProviderProps {
  children: React.ReactNode;
}

// Cache helpers
const CACHE_KEY = 'neurolab_institution_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em ms

interface CachedInstitution {
  data: Institution;
  timestamp: number;
}

const getCachedInstitution = (slug: string): Institution | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${slug}`);
    if (!cached) return null;

    const parsedCache: CachedInstitution = JSON.parse(cached);
    const isExpired = Date.now() - parsedCache.timestamp > CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(`${CACHE_KEY}_${slug}`);
      return null;
    }

    return parsedCache.data;
  } catch (error) {
    console.warn('Error reading institution cache:', error);
    return null;
  }
};

const setCachedInstitution = (slug: string, institution: Institution) => {
  try {
    const cache: CachedInstitution = {
      data: institution,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CACHE_KEY}_${slug}`, JSON.stringify(cache));
  } catch (error) {
    console.warn('Error saving institution cache:', error);
  }
};

// Removed getPublicAssistants function - now using only database assistants

export const InstitutionProvider: React.FC<InstitutionProviderProps> = ({ children }) => {
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [availableAssistants, setAvailableAssistants] = useState<InstitutionAssistant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticationComplete, setAuthenticationComplete] = useState(false);
  const [institutionLoaded, setInstitutionLoaded] = useState(false);
  const [isLoadingInstitution, setIsLoadingInstitution] = useState(false);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(false);

  // Estados de assinatura
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  // Função para carregar dados básicos da instituição (público) - Otimizada com cache e dados estáticos
  const loadInstitution = useCallback(async (slug: string, bypassCache: boolean = false): Promise<boolean> => {
    // Se já está carregando ou já carregou esta instituição, retornar
    if (isLoadingInstitution || (institution?.slug === slug)) {
      console.log('🔄 InstitutionContext: Institution already loading or loaded, skipping...');
      return !!institution;
    }

    setIsLoadingInstitution(true);
    setError(null);

    console.log(`🔄 InstitutionContext: Loading institution ${slug}...`);

    // 1. Primeiro, tentar carregar dados estáticos para exibição imediata
    const staticData = getInstitutionStaticData(slug);
    if (staticData) {
      console.log('📦 Using static data for immediate display:', staticData.name);
      const staticInstitution: Institution = {
        id: `static_${staticData.slug}`,
        name: staticData.name,
        slug: staticData.slug,
        logo_url: staticData.logo_url,
        primary_color: staticData.primary_color,
        secondary_color: staticData.secondary_color,
        settings: staticData.settings || {}
      };
      setInstitution(staticInstitution);
      setInstitutionLoaded(true);
      setLoading(false);

      // Initialize empty assistants array - will be populated after authentication
      setAvailableAssistants([]);
    }

    // 2. Tentar carregar do cache (a menos que bypassCache seja true)
    const cached = !bypassCache ? getCachedInstitution(slug) : null;
    if (cached) {
      console.log('📱 Using cached institution data:', cached.name);
      setInstitution(cached);
      setInstitutionLoaded(true);
      setLoading(false);
      setIsLoadingInstitution(false);

      // Initialize empty assistants array for cached data
      setAvailableAssistants([]);

      return true;
    }

    // 3. Carregar do servidor em background (não bloqueia a UI)
    try {
      const response = await fetch(`/api/institution-auth?slug=${slug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Institution load response status:', response.status);

      const result = await response.json();
      console.log('📊 Institution load result:', result);

      if (result.success && result.data.institution) {
        console.log('✅ Institution loaded from server:', {
          name: result.data.institution.name,
          logo_url: result.data.institution.logo_url,
          primary_color: result.data.institution.primary_color
        });

        const serverInstitution = result.data.institution;
        setInstitution(serverInstitution);
        setCachedInstitution(slug, serverInstitution);
        setInstitutionLoaded(true);

        // Initialize empty assistants array for server data
        setAvailableAssistants([]);

        return true;
      } else {
        console.error('❌ Failed to load institution:', result.error);
        // Se falhou mas já temos dados estáticos, considerar sucesso
        if (staticData) {
          console.log('📦 Falling back to static data after server error');
          return true;
        }
        setError(result.error || 'Instituição não encontrada');
        setInstitutionLoaded(false);
        return false;
      }
    } catch (error) {
      console.error('💥 Error loading institution:', error);
      // Se falhou mas já temos dados estáticos, considerar sucesso
      if (staticData) {
        console.log('📦 Falling back to static data after network error');
        return true;
      }
      setError('Erro ao carregar informações da instituição');
      setInstitutionLoaded(false);
      return false;
    } finally {
      setIsLoadingInstitution(false);
      setLoading(false);
    }
  }, [institution?.slug, isLoadingInstitution]);

  // Função para verificar acesso do usuário à instituição - Memorizada para evitar loops
  const verifyAccess = useCallback(async (token: string, slug: string): Promise<boolean> => {
    // Se já está verificando, retornar
    if (isVerifyingAccess) {
      console.log('🔄 InstitutionContext: Access verification already in progress, skipping...');
      return false;
    }

    setIsVerifyingAccess(true);
    setLoading(true);
    setError(null);

    console.log(`🔄 InstitutionContext: Verifying access for ${slug}...`);

    try {
      // Use the simplified endpoint with query parameter and send token in Authorization header
      const response = await fetch(`/api/institution-auth?slug=${slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'verify_access'
        })
      });

      console.log('📡 Access verification response status:', response.status);

      const result = await response.json();
      console.log('📊 Access verification result:', result);

      if (result.success) {
        console.log('✅ Access verified successfully');
        setInstitution(result.data.institution);
        setUserAccess(result.data.user_access);

        // Use only authenticated assistants from the database
        const authenticatedAssistants = result.data.available_assistants || [];
        const sortedAssistants = authenticatedAssistants.sort((a, b) => a.display_order - b.display_order);
        console.log('🔗 Database assistants for authenticated user:', sortedAssistants.map(a => a.name));
        setAvailableAssistants(sortedAssistants);

        setAuthenticationComplete(true);
        setInstitutionLoaded(true);
        return true;
      } else {
        console.error('❌ Access verification failed:', result.error);
        setError(result.error || 'Acesso não autorizado');
        setAuthenticationComplete(false);
        return false;
      }
    } catch (error) {
      console.error('💥 Error verifying access:', error);
      setError(`Erro ao verificar acesso: ${error.message}`);
      setAuthenticationComplete(false);
      return false;
    } finally {
      setIsVerifyingAccess(false);
      setLoading(false);
    }
  }, [isVerifyingAccess]);

  // Função para limpar cache de instituição específica
  const clearInstitutionCache = useCallback((slug: string) => {
    try {
      localStorage.removeItem(`${CACHE_KEY}_${slug}`);
      console.log(`🧹 Cache cleared for institution: ${slug}`);
    } catch (error) {
      console.warn('Error clearing institution cache:', error);
    }
  }, []);

  // Função para forçar recarga de dados do usuário
  const refreshUserAccess = useCallback(async (token: string, slug: string): Promise<boolean> => {
    console.log('🔄 Refreshing user access data...');

    // Limpar cache primeiro
    clearInstitutionCache(slug);

    // Recarregar instituição sem cache
    await loadInstitution(slug, true);

    // Verificar acesso novamente
    return verifyAccess(token, slug);
  }, [clearInstitutionCache, loadInstitution, verifyAccess]);

  // Função para limpar contexto
  const clearContext = () => {
    setInstitution(null);
    setUserAccess(null);
    setAvailableAssistants([]);
    setError(null);
    setLoading(false);
    setAuthenticationComplete(false);
    setInstitutionLoaded(false);
    setIsLoadingInstitution(false);
    setIsVerifyingAccess(false);
    setHasActiveSubscription(false);
    setSubscriptionError(null);
    setIsCheckingSubscription(false);
    console.log('🧹 Institution context cleared');
  };

  // Helper para verificar permissões
  const hasPermission = (permission: string): boolean => {
    if (!userAccess || !userAccess.is_admin) return false;
    return userAccess.permissions[permission] === true;
  };

  // Função para verificar assinatura
  const checkSubscription = useCallback(async (slug: string): Promise<boolean> => {
    if (!userAccess || !userAccess.is_active) {
      console.log('❌ checkSubscription: User not approved');
      return false;
    }

    // Subadmins e admins não precisam de assinatura
    if (userAccess.role === 'subadmin' || userAccess.is_admin) {
      console.log('✅ User is subadmin/admin - subscription check bypassed');
      setHasActiveSubscription(true);
      return true;
    }

    setIsCheckingSubscription(true);
    setSubscriptionError(null);

    try {
      const response = await fetch('/api/institution-rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('../services/supabase')).supabase.auth.getSession().then(r => r.data.session?.access_token)}`
        },
        body: JSON.stringify({
          function_name: 'get_institution_subscription_status',
          params: [slug]
        })
      });

      const result = await response.json();
      console.log('📊 Subscription check response:', result);

      if (!result.success) {
        console.error('❌ Error checking subscription:', result.error);
        setSubscriptionError(result.error || 'Erro ao verificar assinatura');
        return false;
      }

      const { has_subscription, error_type, error_message } = result.data;

      if (!has_subscription) {
        console.log('🚫 No subscription found');
        setSubscriptionError(error_message || 'Você precisa de uma assinatura para usar os recursos desta instituição');
        setHasActiveSubscription(false);
        return false;
      }

      console.log('✅ Subscription valid');
      setHasActiveSubscription(true);
      return true;
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionError('Erro interno ao verificar assinatura');
      return false;
    } finally {
      setIsCheckingSubscription(false);
    }
  }, [userAccess]);

  // Função para criar nova assinatura
  const createSubscription = useCallback(async (
    slug: string,
    planType: 'monthly' | 'semester' | 'annual' = 'monthly',
    paymentMethod: 'pix' | 'credit_card' = 'pix'
  ): Promise<{ success: boolean; subscription_id?: string; error?: string }> => {
    try {
      const response = await fetch('/api/institution-rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('../services/supabase')).supabase.auth.getSession().then(r => r.data.session?.access_token)}`
        },
        body: JSON.stringify({
          function_name: 'create_institution_subscription',
          params: [
            (await import('../services/supabase')).supabase.auth.getUser().then(r => r.data.user?.id),
            slug,
            planType,
            paymentMethod,
            47.00 // Preço fixo mensal
          ]
        })
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          subscription_id: result.data.subscription_id
        };
      } else {
        return {
          success: false,
          error: result.error || 'Erro ao criar assinatura'
        };
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        error: 'Erro interno ao criar assinatura'
      };
    }
  }, []);

  // Função para ativar assinatura após pagamento
  const activateSubscription = useCallback(async (
    subscriptionId: string,
    paymentId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/institution-rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('../services/supabase')).supabase.auth.getSession().then(r => r.data.session?.access_token)}`
        },
        body: JSON.stringify({
          function_name: 'activate_institution_subscription',
          params: [subscriptionId, paymentId]
        })
      });

      const result = await response.json();

      if (result.success) {
        // Atualizar estado local
        setHasActiveSubscription(true);
        setSubscriptionError(null);
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Erro ao ativar assinatura'
        };
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
      return {
        success: false,
        error: 'Erro interno ao ativar assinatura'
      };
    }
  }, []);

  // Computed properties
  const isInstitutionUser = !!userAccess;
  const canAccessAdminPanel = userAccess?.is_admin || false;
  const canAccessAssistants = (userAccess?.is_active || false) &&
    (userAccess?.role === 'subadmin' || userAccess?.is_admin || hasActiveSubscription); // Subadmins isentos de assinatura

  // Helper para obter assistente principal
  const getPrimaryAssistant = (): InstitutionAssistant | null => {
    return availableAssistants.find(a => a.is_primary) || availableAssistants[0] || null;
  };

  // Helper para obter assistente simulador
  const getSimulatorAssistant = (): InstitutionAssistant | null => {
    return availableAssistants.find(a => a.is_simulator) || null;
  };

  // Aplicar tema da instituição dinamicamente
  useEffect(() => {
    if (institution) {
      const root = document.documentElement;

      // Aplicar cores
      root.style.setProperty('--institution-primary', institution.primary_color);
      if (institution.secondary_color) {
        root.style.setProperty('--institution-secondary', institution.secondary_color);
      }

      // Aplicar configurações de tema
      if (institution?.settings?.theme) {
        const theme = institution.settings?.theme;

        if (theme.font_family) {
          root.style.setProperty('--institution-font', theme.font_family);
        }

        if (theme.border_radius) {
          root.style.setProperty('--institution-radius', theme.border_radius);
        }
      }

      // Aplicar favicon customizado
      if (institution?.settings?.branding?.custom_favicon) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = institution.settings?.branding?.custom_favicon;
        }
      }

      // Aplicar meta description
      if (institution?.settings?.branding?.meta_description) {
        const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
        if (metaDescription) {
          metaDescription.content = institution.settings?.branding?.meta_description;
        }
      }

      // Atualizar título da página
      document.title = `${institution.name} - Portal de IA`;
    }

    return () => {
      // Limpar customizações quando componente desmonta
      const root = document.documentElement;
      root.style.removeProperty('--institution-primary');
      root.style.removeProperty('--institution-secondary');
      root.style.removeProperty('--institution-font');
      root.style.removeProperty('--institution-radius');
    };
  }, [institution]);

  const value: InstitutionContextType = {
    institution,
    userAccess,
    availableAssistants,
    loading,
    error,
    authenticationComplete,
    institutionLoaded,
    hasActiveSubscription,
    subscriptionError,
    isCheckingSubscription,
    loadInstitution,
    verifyAccess,
    checkSubscription,
    createSubscription,
    activateSubscription,
    refreshUserAccess,
    clearContext,
    clearInstitutionCache,
    setAuthenticationComplete,
    hasPermission,
    isInstitutionUser,
    canAccessAdminPanel,
    canAccessAssistants,
    getPrimaryAssistant,
    getSimulatorAssistant,
  };

  return (
    <InstitutionContext.Provider value={value}>
      {children}
    </InstitutionContext.Provider>
  );
};

export const useInstitution = (): InstitutionContextType => {
  const context = useContext(InstitutionContext);
  if (context === undefined) {
    throw new Error('useInstitution must be used within an InstitutionProvider');
  }
  return context;
};

// Hook especializado para verificar acesso a instituições - Corrigido para evitar loops
export const useInstitutionAuth = (slug?: string) => {
  const { verifyAccess, loadInstitution, isInstitutionUser, canAccessAdminPanel, error, institution, institutionLoaded } = useInstitution();
  const [authChecked, setAuthChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Se não tem slug, já está checando, ou já foi checado, retornar
      if (!slug || isChecking) return;

      // Se já temos a instituição carregada e verificada para este slug, considerar OK
      if (institution?.slug === slug && authChecked && institutionLoaded) {
        console.log('✅ InstitutionContext: Already loaded and verified for this slug, skipping...');
        return;
      }

      setIsChecking(true);
      setAuthChecked(false);

      try {
        // Carregar instituição apenas se não está carregada para este slug
        if (institution?.slug !== slug) {
          console.log('🔍 useInstitutionAuth: Loading institution for first time...');
          const loaded = await loadInstitution(slug);
          if (!loaded) {
            setAuthChecked(true);
            setIsChecking(false);
            return;
          }
        }

        // Verificar sessão e acesso do usuário
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          // Usuário não logado - ok para páginas públicas
          console.log('🔍 useInstitutionAuth: No session, public access only');
          setAuthChecked(true);
          setIsChecking(false);
          return;
        }

        // Verificar acesso à instituição
        console.log('🔍 useInstitutionAuth: Verifying user access...');
        await verifyAccess(session.access_token, slug);

      } catch (error) {
        console.error('Error checking institution access:', error);
      } finally {
        setAuthChecked(true);
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [slug]); // Remover dependências instáveis para evitar loops

  return {
    authChecked,
    isInstitutionUser,
    canAccessAdminPanel,
    error
  };
};