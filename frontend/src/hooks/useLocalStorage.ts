import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for localStorage with TypeScript support
 * Provides automatic serialization and error handling
 */

type SetValue<T> = (value: T | ((prevValue: T) => T)) => void;

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, SetValue<T>, () => void] => {
  // Get value from localStorage on initial render
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Set value in localStorage and state
  const setValue: SetValue<T> = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

/**
 * Hook for user preferences
 */
export const useUserPreferences = () => {
  return useLocalStorage('user-preferences', {
    theme: 'light',
    language: 'pt-BR',
    notifications: true,
    autoSave: true,
  });
};

/**
 * Hook for chat settings
 */
export const useChatSettings = () => {
  return useLocalStorage('chat-settings', {
    fontSize: 'medium',
    soundEnabled: true,
    showTimestamps: true,
    compactMode: false,
  });
};

/**
 * Hook for assistant selection history
 */
export const useAssistantHistory = () => {
  return useLocalStorage<string[]>('assistant-history', []);
};

/**
 * Hook for form auto-save
 */
export const useFormAutoSave = <T>(formId: string, initialData: T) => {
  const [data, setData, removeData] = useLocalStorage(`form-${formId}`, initialData);

  const saveData = useCallback((formData: Partial<T>) => {
    setData(prevData => ({ ...prevData, ...formData }));
  }, [setData]);

  const clearData = useCallback(() => {
    removeData();
  }, [removeData]);

  return {
    data,
    saveData,
    clearData,
    hasData: JSON.stringify(data) !== JSON.stringify(initialData)
  };
};

/**
 * Hook for package selection state
 */
export const usePackageSelection = () => {
  return useLocalStorage('package-selection', {
    packageType: null as 'package_3' | 'package_6' | null,
    selectedAssistants: [] as string[],
    subscriptionType: 'monthly' as 'monthly' | 'semester',
    step: 1,
  });
};

/**
 * Hook for recent searches
 */
export const useRecentSearches = () => {
  const [searches, setSearches, removeSearches] = useLocalStorage<string[]>('recent-searches', []);

  const addSearch = useCallback((query: string) => {
    if (query.trim()) {
      setSearches(prev => {
        const filtered = prev.filter(s => s !== query);
        return [query, ...filtered].slice(0, 10); // Keep only 10 recent searches
      });
    }
  }, [setSearches]);

  const removeSearch = useCallback((query: string) => {
    setSearches(prev => prev.filter(s => s !== query));
  }, [setSearches]);

  const clearSearches = useCallback(() => {
    removeSearches();
  }, [removeSearches]);

  return {
    searches,
    addSearch,
    removeSearch,
    clearSearches
  };
};

/**
 * Hook for conversations cache
 */
export const useConversationsCache = () => {
  return useLocalStorage('conversations-cache', {
    conversations: [] as any[],
    lastUpdated: null as string | null,
    userId: null as string | null
  });
};