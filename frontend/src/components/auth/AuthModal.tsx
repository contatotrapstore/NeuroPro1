import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { X, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { NeuroLabIconLarge } from '../icons/NeuroLabLogo';
import type { AuthModalState } from '../../hooks/useAuthModal';

interface AuthModalProps {
  modalState: AuthModalState;
  onClose: () => void;
  onModeSwitch: (mode: 'login' | 'register') => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  modalState,
  onClose,
  onModeSwitch,
  onSuccess
}) => {
  const { signIn, signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { isOpen, mode, message } = modalState;

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        password: '',
        name: '',
        confirmPassword: ''
      });
      setError('');
    }
  }, [isOpen, mode]);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        // Login
        if (!formData.email || !formData.password) {
          setError('Por favor, preencha todos os campos');
          return;
        }

        await signIn(formData.email, formData.password);
        onSuccess();

      } else {
        // Register
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
          setError('Por favor, preencha todos os campos');
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setError('As senhas não coincidem');
          return;
        }

        if (formData.password.length < 8) {
          setError('A senha deve ter pelo menos 8 caracteres');
          return;
        }

        await signUp(formData.email, formData.password, formData.name);
        onSuccess();
      }
    } catch (error: any) {
      console.error('Auth error:', error);

      if (error.message?.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos');
      } else if (error.message?.includes('User already registered')) {
        setError('Este email já está cadastrado. Tente fazer login.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Confirme seu email antes de fazer login');
      } else {
        setError(error.message || 'Erro interno. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="shadow-2xl shadow-neuro-primary/10">
          <CardContent className="p-0">
            {/* Header */}
            <div className="relative p-6 bg-gradient-to-br from-neuro-primary to-neuro-primary-hover text-white text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
                <NeuroLabIconLarge color="white" size={32} />
              </div>

              <h2 className="text-2xl font-bold mb-2">
                {mode === 'login' ? 'Entrar' : 'Criar Conta'}
              </h2>

              {message && (
                <p className="text-white/80 text-sm">
                  {message}
                </p>
              )}
            </div>

            {/* Form */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-shake">
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                  </div>
                )}

                {mode === 'register' && (
                  <Input
                    label="Nome Completo"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    placeholder="Seu nome completo"
                    required
                    disabled={loading}
                    leftIcon={<User className="w-4 h-4" />}
                  />
                )}

                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  leftIcon={<Mail className="w-4 h-4" />}
                />

                <div className="relative">
                  <Input
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    placeholder="Sua senha"
                    required
                    disabled={loading}
                    minLength={8}
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {mode === 'register' && (
                  <div className="relative">
                    <Input
                      label="Confirmar Senha"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      placeholder="Confirme sua senha"
                      required
                      disabled={loading}
                      minLength={8}
                      leftIcon={<Lock className="w-4 h-4" />}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full mt-6"
                >
                  {mode === 'login' ? 'Entrar' : 'Criar Conta'}
                </Button>
              </form>

              {/* Mode Switch */}
              <div className="mt-6 text-center text-sm text-gray-600">
                {mode === 'login' ? (
                  <>
                    Não tem uma conta?{' '}
                    <button
                      onClick={() => onModeSwitch('register')}
                      className="text-neuro-primary hover:text-neuro-primary-hover font-medium"
                    >
                      Criar conta
                    </button>
                  </>
                ) : (
                  <>
                    Já tem uma conta?{' '}
                    <button
                      onClick={() => onModeSwitch('login')}
                      className="text-neuro-primary hover:text-neuro-primary-hover font-medium"
                    >
                      Fazer login
                    </button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};