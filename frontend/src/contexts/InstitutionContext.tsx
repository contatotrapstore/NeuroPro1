import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { User } from '@supabase/supabase-js';

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

  // Funções
  loadInstitution: (slug: string) => Promise<boolean>;
  verifyAccess: (token: string, slug: string) => Promise<boolean>;
  clearContext: () => void;
  setAuthenticationComplete: (complete: boolean) => void;

  // Helpers
  hasPermission: (permission: string) => boolean;
  isInstitutionUser: boolean;
  canAccessAdminPanel: boolean;
  getPrimaryAssistant: () => InstitutionAssistant | null;
  getSimulatorAssistant: () => InstitutionAssistant | null;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

interface InstitutionProviderProps {
  children: React.ReactNode;
}

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

  // Função para carregar dados básicos da instituição (público) - Memorizada para evitar loops
  const loadInstitution = useCallback(async (slug: string): Promise<boolean> => {
    // Se já está carregando ou já carregou esta instituição, retornar
    if (isLoadingInstitution || (institution?.slug === slug)) {
      console.log('🔄 InstitutionContext: Institution already loading or loaded, skipping...');
      return !!institution;
    }

    setIsLoadingInstitution(true);
    setLoading(true);
    setError(null);

    console.log(`🔄 InstitutionContext: Loading institution ${slug}...`);

    try {
      // Use the simplified endpoint with query parameter
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
        console.log('✅ Institution loaded successfully:', {
          name: result.data.institution.name,
          logo_url: result.data.institution.logo_url,
          primary_color: result.data.institution.primary_color
        });
        setInstitution(result.data.institution);
        setInstitutionLoaded(true);
        return true;
      } else {
        console.error('❌ Failed to load institution:', result.error);
        setError(result.error || 'Instituição não encontrada');
        setInstitutionLoaded(false);
        return false;
      }
    } catch (error) {
      console.error('💥 Error loading institution:', error);
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
        setAvailableAssistants(result.data.available_assistants || []);
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
    console.log('🧹 Institution context cleared');
  };

  // Helper para verificar permissões
  const hasPermission = (permission: string): boolean => {
    if (!userAccess || !userAccess.is_admin) return false;
    return userAccess.permissions[permission] === true;
  };

  // Computed properties
  const isInstitutionUser = !!userAccess;
  const canAccessAdminPanel = userAccess?.is_admin || false;

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
      if (institution.settings.theme) {
        const theme = institution.settings.theme;

        if (theme.font_family) {
          root.style.setProperty('--institution-font', theme.font_family);
        }

        if (theme.border_radius) {
          root.style.setProperty('--institution-radius', theme.border_radius);
        }
      }

      // Aplicar favicon customizado
      if (institution.settings.branding?.custom_favicon) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = institution.settings.branding.custom_favicon;
        }
      }

      // Aplicar meta description
      if (institution.settings.branding?.meta_description) {
        const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
        if (metaDescription) {
          metaDescription.content = institution.settings.branding.meta_description;
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
    loadInstitution,
    verifyAccess,
    clearContext,
    setAuthenticationComplete,
    hasPermission,
    isInstitutionUser,
    canAccessAdminPanel,
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
  const { verifyAccess, loadInstitution, isInstitutionUser, canAccessAdminPanel, error, institution } = useInstitution();
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