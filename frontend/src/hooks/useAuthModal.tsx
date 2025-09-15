import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalState {
  isOpen: boolean;
  mode: 'login' | 'register';
  message?: string;
  intendedAction?: () => void;
  redirectPath?: string;
}

export type { AuthModalState };

export const useAuthModal = () => {
  const { user } = useAuth();
  const [modalState, setModalState] = useState<AuthModalState>({
    isOpen: false,
    mode: 'login'
  });

  const showAuthModal = useCallback((
    message?: string,
    intendedAction?: () => void,
    mode: 'login' | 'register' = 'login',
    redirectPath?: string
  ) => {
    setModalState({
      isOpen: true,
      mode,
      message,
      intendedAction,
      redirectPath
    });
  }, []);

  const hideAuthModal = useCallback(() => {
    setModalState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const switchMode = useCallback((mode: 'login' | 'register') => {
    setModalState(prev => ({
      ...prev,
      mode
    }));
  }, []);

  const executeIntendedAction = useCallback(() => {
    if (modalState.intendedAction) {
      modalState.intendedAction();
    }
    hideAuthModal();
  }, [modalState.intendedAction, hideAuthModal]);

  // Verificar se usuário precisa de autenticação para uma ação
  const requireAuth = useCallback((
    action: () => void,
    message: string = 'Para continuar, faça login ou crie uma conta',
    mode: 'login' | 'register' = 'login'
  ) => {
    if (user) {
      // Se já está logado, executa a ação diretamente
      action();
    } else {
      // Se não está logado, mostra o modal
      showAuthModal(message, action, mode);
    }
  }, [user, showAuthModal]);

  return {
    modalState,
    isLoggedIn: !!user,
    showAuthModal,
    hideAuthModal,
    switchMode,
    executeIntendedAction,
    requireAuth
  };
};