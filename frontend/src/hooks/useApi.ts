import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.service';
import type { ApiResponse, LoadingState } from '../types';

/**
 * Custom hooks for API operations
 * Provides consistent loading, error, and data management
 */

interface UseApiState<T> extends LoadingState {
  data: T | null;
  refresh: () => Promise<void>;
  call: (...args: any[]) => Promise<T | null>;
}

/**
 * Generic hook for API calls with automatic state management
 */
export const useApi = <T = any>(
  apiCall: (...args: any[]) => Promise<ApiResponse<T>>,
  dependencies: any[] = []
): UseApiState<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async (...args: any[]): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall(...args);
      
      if (response.success && response.data) {
        setData(response.data);
        return response.data;
      } else {
        setError(response.error || 'Erro desconhecido');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Erro de rede');
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const refresh = useCallback(async () => {
    await call();
  }, [call]);

  useEffect(() => {
    call();
  }, dependencies);

  return { data, loading, error, refresh, call };
};

/**
 * Hook for fetching assistants
 */
export const useAssistants = () => {
  return useApi(() => apiService.getAssistants(), []);
};

/**
 * Hook for fetching user subscriptions
 */
export const useUserSubscriptions = () => {
  return useApi(() => apiService.getSubscriptions(), []);
};

/**
 * Hook for fetching user packages
 */
export const useUserPackages = () => {
  return useApi(() => apiService.getUserPackages(), []);
};

/**
 * Hook for fetching user's accessible assistants
 */
export const useUserAssistants = () => {
  return useApi(() => apiService.getUserAssistants(), []);
};

/**
 * Hook for dashboard data with graceful error handling
 */
export const useDashboardData = () => {
  return useApi(() => apiService.getDashboardData(), []);
};

/**
 * Hook for chat conversations
 */
export const useConversations = () => {
  return useApi(() => apiService.getConversations(), []);
};

/**
 * Hook for user profile
 */
export const useUserProfile = () => {
  return useApi(() => apiService.getProfile(), []);
};

/**
 * Hook for user access information
 */
export const useUserAccess = () => {
  return useApi(() => apiService.getUserAccess(), []);
};

/**
 * Hook for performing mutations (POST, PUT, DELETE) with loading state
 */
export const useMutation = <TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(async (variables: TVariables): Promise<TData | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await mutationFn(variables);
      
      if (response.success && response.data) {
        setData(response.data);
        return response.data;
      } else {
        setError(response.error || 'Erro na operação');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Erro de rede');
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutationFn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    data,
    loading,
    error,
    reset
  };
};

/**
 * Hook for creating subscriptions
 */
export const useCreateSubscription = () => {
  return useMutation<any, { assistantId: string; plan: 'monthly' | 'semester' }>(
    ({ assistantId, plan }) => apiService.createSubscription(assistantId, plan)
  );
};

/**
 * Hook for creating packages
 */
export const useCreatePackage = () => {
  return useMutation<any, { assistantIds: string[]; plan: 'monthly' | 'semester' }>(
    ({ assistantIds, plan }) => apiService.createPackage(assistantIds, plan)
  );
};

/**
 * Hook for updating user profile
 */
export const useUpdateProfile = () => {
  return useMutation<any, any>(
    (data) => apiService.updateProfile(data)
  );
};

/**
 * Hook for validating assistant access
 */
export const useValidateAccess = () => {
  return useMutation<{ hasAccess: boolean; accessType: string }, string>(
    (assistantId) => apiService.validateAssistantAccess(assistantId)
  );
};

/**
 * Hook for creating conversations
 */
export const useCreateConversation = () => {
  return useMutation<any, { assistantId: string; title?: string }>(
    ({ assistantId, title }) => apiService.createConversation(assistantId, title)
  );
};

/**
 * Hook for sending messages
 */
export const useSendMessage = () => {
  return useMutation<any, { conversationId: string; message: string }>(
    ({ conversationId, message }) => apiService.sendMessage(conversationId, message)
  );
};