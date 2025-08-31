import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Eye, EyeOff, Check } from 'lucide-react';
import { NeuroLabIconLarge } from '../../components/icons/NeuroLabLogo';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return false;
    }

    if (name.length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return false;
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um email válido');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      await signUp(formData.email, formData.password, formData.name);
      
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.message?.includes('already registered')) {
        setError('Este email já está cadastrado');
      } else if (error.message?.includes('email_confirmation_required')) {
        setError('Conta criada! Verifique seu email para confirmar.');
        setSuccess(true);
        setTimeout(() => navigate('/auth/login'), 3000);
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neuro-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="shadow-2xl shadow-neuro-success/10 animate-fade-in">
            <CardContent className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-neuro-success/10 rounded-2xl mb-6">
                <Check className="h-8 w-8 text-neuro-success" />
              </div>
              <h2 className="text-2xl font-bold text-neuro-gray-900 mb-4">
                Conta Criada!
              </h2>
              <p className="text-neuro-gray-600 mb-6 leading-relaxed">
                Sua conta foi criada com sucesso. Você será redirecionado para o login em alguns segundos.
              </p>
              <p className="text-sm text-neuro-gray-500">
                Se você não recebeu um email de confirmação, verifique sua pasta de spam.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neuro-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-neuro-primary rounded-2xl mb-6 shadow-lg shadow-neuro-primary/20">
            <NeuroLabIconLarge color="white" size={40} />
          </div>
          <h1 className="text-4xl font-bold text-neuro-gray-900 mb-3">NeuroIA Lab</h1>
          <p className="text-lg text-neuro-gray-600">
            Crie sua conta e comece a usar nossos assistentes
          </p>
        </div>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
        <Card className="shadow-2xl shadow-neuro-primary/5">
          <CardContent className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-neuro-error/10 border border-neuro-error/20 rounded-lg p-4 animate-shake">
                  <p className="text-sm text-neuro-error font-medium">{error}</p>
                </div>
              )}

              <Input
                label="Nome completo"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Seu nome completo"
                required
                disabled={loading}
              />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />

              <div className="relative">
                <Input
                  label="Senha"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  helper="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-neuro-gray-400 hover:text-neuro-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirmar senha"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-8 text-neuro-gray-400 hover:text-neuro-gray-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Criar conta
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neuro-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-neuro-gray-500 font-medium">
                    Já tem uma conta?
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <Link to="/auth/login">
                    Fazer login
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;