import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { AuthContextType, ProfileUpdateData } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          // Clear invalid tokens if refresh token is invalid
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('Refresh Token Not Found') ||
              error.message.includes('JWT expired')) {
            console.log('Clearing invalid tokens from localStorage');
            // Clear all Supabase-related localStorage items
            const keysToRemove = Object.keys(localStorage).filter(key => 
              key.startsWith('supabase.auth.') || key.includes('supabase')
            );
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Sign out silently without throwing error
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.warn('Error during signout:', signOutError);
            }
            
            setUser(null);
          }
        } else {
          setUser(session?.user || null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setUser(session?.user || null);
        setLoading(false);

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          // Clear any cached data
          localStorage.removeItem('user-preferences');
          // Clear any Supabase-related localStorage items
          const keysToRemove = Object.keys(localStorage).filter(key => 
            key.startsWith('supabase.auth.') || key.includes('supabase')
          );
          keysToRemove.forEach(key => localStorage.removeItem(key));
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }

        if (event === 'SIGNED_IN') {
          console.log('User signed in successfully');
        }

        if (event === 'PASSWORD_RECOVERY') {
          console.log('🔐 Password recovery mode detected:', session?.user?.email);
          // Armazenar estado temporário para a página de reset
          sessionStorage.setItem('password_recovery_active', 'true');
          if (session) {
            sessionStorage.setItem('password_recovery_session', JSON.stringify(session));
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<any> => {
    try {
      setLoading(true);
      
      // Lista de emails admin
      const adminEmails = ['admin@neuroialab.com', 'gouveiarx@gmail.com', 'pstales@gmail.com'];
      const isAdminEmail = adminEmails.includes(email);
      
      if (isAdminEmail) {
        console.log(`🔑 Tentando login admin para: ${email}`);
      }
      
      // Tentar login normal primeiro
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Se falhar e for admin@neuroialab.com, tentar criar automaticamente
      if (error && error.message.includes('Invalid login credentials') && email === 'admin@neuroialab.com') {
        console.log('👤 Admin padrão não existe, criando conta...');
        
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: 'Administrador',
              role: 'admin'
            }
          }
        });

        if (signupError) {
          if (signupError.message.includes('already registered')) {
            throw new Error('Admin já existe mas não consegue fazer login. Email pode precisar ser confirmado no painel do Supabase.');
          } else {
            throw signupError;
          }
        }

        console.log('✅ Admin criado, aguarde confirmação de email ou configure no Supabase para não exigir confirmação');
        throw new Error('Conta admin criada com sucesso! Se o Supabase exigir confirmação de email, confirme primeiro ou desabilite essa opção no painel.');
      } else if (error) {
        throw error;
      }

      if (isAdminEmail) {
        console.log(`✅ Login admin realizado com sucesso para: ${email}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ needsConfirmation: boolean } | void> => {
    try {
      setLoading(true);
      
      // First, sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });

      if (error) {
        throw error;
      }

      // If signup was successful but email confirmation is required
      if (data.user && !data.session) {
        // User created but needs email confirmation
        return { needsConfirmation: true };
      }
      
      // If we have a session, login was automatic
      if (data.session) {
        return { needsConfirmation: false };
      }
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error resending confirmation:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      // Determinar a URL de redirecionamento baseada no ambiente
      const getRedirectUrl = () => {
        const currentOrigin = window.location.origin;

        // Para desenvolvimento local
        if (currentOrigin.includes('localhost')) {
          return `${currentOrigin}/auth/reset-password`;
        }

        // Para produção, usar domínio principal (SSL funcionando no www subdomain)
        return 'https://www.neuroialab.com.br/auth/reset-password';
      };

      const redirectUrl = getRedirectUrl();

      console.log('🔄 Enviando email de reset para:', email);
      console.log('🔗 URL de redirecionamento:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('❌ Erro no Supabase resetPasswordForEmail:', error);
        throw error;
      }

      console.log('✅ Email de reset enviado com sucesso');
    } catch (error) {
      console.error('💥 Error resetting password:', error);
      throw error;
    }
  };

  const updateProfile = async (profileData: ProfileUpdateData): Promise<{ error: any }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: profileData
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error: any }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating password:', error);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendConfirmation,
    updateProfile,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};