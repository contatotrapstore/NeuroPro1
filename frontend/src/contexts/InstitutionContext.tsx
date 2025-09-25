import React, { createContext, useContext, useEffect, useState } from 'react';
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

  // Funções
  loadInstitution: (slug: string) => Promise<boolean>;
  verifyAccess: (token: string, slug: string) => Promise<boolean>;
  clearContext: () => void;

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

  // Função para carregar dados básicos da instituição (público)
  const loadInstitution = async (slug: string): Promise<boolean> => {
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
        console.log('✅ Institution loaded successfully:', result.data.institution.name);
        setInstitution(result.data.institution);
        return true;
      } else {
        console.error('❌ Failed to load institution:', result.error);
        setError(result.error || 'Instituição não encontrada');
        return false;
      }
    } catch (error) {
      console.error('💥 Error loading institution:', error);
      setError('Erro ao carregar informações da instituição');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar acesso do usuário à instituição
  const verifyAccess = async (token: string, slug: string): Promise<boolean> => {
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
        return true;
      } else {
        console.error('❌ Access verification failed:', result.error);
        setError(result.error || 'Acesso não autorizado');
        return false;
      }
    } catch (error) {
      console.error('💥 Error verifying access:', error);
      setError(`Erro ao verificar acesso: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar contexto
  const clearContext = () => {
    setInstitution(null);
    setUserAccess(null);
    setAvailableAssistants([]);
    setError(null);
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
    loadInstitution,
    verifyAccess,
    clearContext,
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

// Hook especializado para verificar acesso a instituições
export const useInstitutionAuth = (slug?: string) => {
  const { verifyAccess, loadInstitution, isInstitutionUser, canAccessAdminPanel, error } = useInstitution();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!slug) return;

      // Primeiro, carregar informações básicas da instituição
      const institutionLoaded = await loadInstitution(slug);
      if (!institutionLoaded) {
        setAuthChecked(true);
        return;
      }

      // Tentar verificar acesso do usuário
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          // Usuário não logado - ok para páginas públicas
          setAuthChecked(true);
          return;
        }

        // Verificar acesso à instituição
        await verifyAccess(session.access_token, slug);
      } catch (error) {
        console.error('Error checking institution access:', error);
      } finally {
        setAuthChecked(true);
      }
    };

    checkAccess();
  }, [slug, verifyAccess, loadInstitution]);

  return {
    authChecked,
    isInstitutionUser,
    canAccessAdminPanel,
    error
  };
};