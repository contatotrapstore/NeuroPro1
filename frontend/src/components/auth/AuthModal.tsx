import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent } from '../ui/Card';
import { X, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import type { AuthModalState } from '../../hooks/useAuthModal';
import Logo from '../../assets/Logo.png';

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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-lg z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <Card className="shadow-2xl shadow-black/30 bg-white border-0">
          <CardContent className="p-0">
            {/* Header */}
            <div className="relative p-8 bg-gradient-to-br from-neuro-primary via-green-600 to-blue-600 text-white text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Logo Completo */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <img
                    src={Logo}
                    alt="NeuroIA Lab"
                    className="h-16 w-auto object-contain drop-shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-white/20 rounded-xl blur-xl -z-10"></div>
                </div>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {mode === 'login' ? 'Bem-vindo de volta!' : 'Junte-se ao NeuroIA Lab'}
              </h2>

              {message && (
                <p className="text-white/90 text-sm md:text-base leading-relaxed bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  {message}
                </p>
              )}
            </div>

            {/* Form */}
            <div className="p-6 md:p-8 bg-white">
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-shake">
                    <p className="text-sm font-medium text-red-800 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      {error}
                    </p>
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
                    leftIcon={<User className="w-4 h-4 text-gray-500" />}
                    className="bg-gray-50 border-gray-200 focus:border-neuro-primary focus:ring-neuro-primary/20"
                  />
                )}

                <Input
                  label="Email Profissional"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                  leftIcon={<Mail className="w-4 h-4 text-gray-500" />}
                  className="bg-gray-50 border-gray-200 focus:border-neuro-primary focus:ring-neuro-primary/20"
                />

                <div className="relative">
                  <Input
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    placeholder="Mínimo 8 caracteres"
                    required
                    disabled={loading}
                    minLength={8}
                    leftIcon={<Lock className="w-4 h-4 text-gray-500" />}
                    className="bg-gray-50 border-gray-200 focus:border-neuro-primary focus:ring-neuro-primary/20 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors p-1"
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
                      leftIcon={<Lock className="w-4 h-4 text-gray-500" />}
                      className="bg-gray-50 border-gray-200 focus:border-neuro-primary focus:ring-neuro-primary/20 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  className="w-full mt-8 bg-gradient-to-r from-neuro-primary to-green-600 hover:from-neuro-primary-hover hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
                >
                  {mode === 'login' ? 'Entrar na Plataforma' : 'Criar Minha Conta'}
                </Button>
              </form>

              {/* Mode Switch */}
              <div className="mt-8 text-center">
                <div className="border-t border-gray-200 pt-6">
                  {mode === 'login' ? (
                    <p className="text-gray-600">
                      Novo no NeuroIA Lab?{' '}
                      <button
                        onClick={() => onModeSwitch('register')}
                        className="text-neuro-primary hover:text-neuro-primary-hover font-semibold underline decoration-neuro-primary/30 hover:decoration-neuro-primary transition-all"
                      >
                        Crie sua conta gratuita
                      </button>
                    </p>
                  ) : (
                    <p className="text-gray-600">
                      Já tem uma conta?{' '}
                      <button
                        onClick={() => onModeSwitch('login')}
                        className="text-neuro-primary hover:text-neuro-primary-hover font-semibold underline decoration-neuro-primary/30 hover:decoration-neuro-primary transition-all"
                      >
                        Faça login
                      </button>
                    </p>
                  )}
                </div>

                {/* Trust Indicators */}
                <div className="mt-6 flex flex-wrap justify-center items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>100% Seguro</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Sem spam</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Grátis para sempre</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};