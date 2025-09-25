import { supabase } from '../services/supabase';

/**
 * Helper para obter o token de autenticação do Supabase corretamente
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Erro ao obter sessão:', error);
      return null;
    }

    if (!session) {
      return null;
    }

    return session.access_token;
  } catch (error) {
    console.error('❌ Erro em getAuthToken:', error);
    return null;
  }
};

/**
 * Helper para criar headers de autenticação para chamadas de API
 */
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await getAuthToken();

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};