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
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<any> => {
    try {
      setLoading(true);
      
      // Se for o admin e não existir, criar a conta
      if (email === 'admin@neuroialab.com') {
        // Tentar fazer login primeiro
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        // Se falhar, tentar criar a conta admin
        if (loginError && loginError.message.includes('Invalid login credentials')) {
          console.log('Admin não existe, criando conta...');
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
            throw signupError;
          }
          
          // Confirmar o email imediatamente para admin
          if (signupData.user) {
            await supabase.auth.signInWithPassword({ email, password });
          }
          
          return { user: signupData.user };
        } else if (loginError) {
          throw loginError;
        }
        
        return loginData;
      } else {
        // Login normal para outros usuários
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }
        
        return data;
      }
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<void> => {
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
        throw new AuthError('Por favor, verifique seu email para confirmar a conta', 400, 'email_confirmation_required');
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

  const resetPassword = async (email: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error resetting password:', error);
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

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
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