import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '../../assets/Logo.png';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailConfirmationHelp, setShowEmailConfirmationHelp] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

  const { signIn, resendConfirmation } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signIn(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos');
      } else if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
        setError('Sua conta ainda não foi confirmada. Verifique seu email.');
        setShowEmailConfirmationHelp(true);
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    try {
      setResendingEmail(true);
      setError('');
      
      await resendConfirmation(email);
      
      setError('Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada.');
      setShowEmailConfirmationHelp(false);
      
      setTimeout(() => {
        setError('');
      }, 5000);
    } catch (error: any) {
      console.error('Resend error:', error);
      setError('Erro ao reenviar email. Verifique se o email está correto.');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neuro-50 via-white to-neuro-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-neuro-primary/5 via-transparent to-neuro-primary/5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neuro-primary/10 via-transparent to-transparent"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-neuro-primary/20 to-neuro-primary-light/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-neuro-success/20 to-neuro-primary/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-neuro-primary to-neuro-primary-dark rounded-3xl mb-6 shadow-2xl shadow-neuro-primary/30 animate-glow-pulse">
            <img src={Logo} alt="NeuroIA Lab" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-neuro-primary via-neuro-primary-dark to-neuro-primary bg-clip-text text-transparent mb-3">
            NeuroIA Lab
          </h1>
          <p className="text-lg text-neuro-gray-600 font-medium">
            Acesse sua conta para continuar
          </p>
        </div>
      </div>

      <div className="relative mt-10 sm:mx-auto sm:w-full sm:max-w-md animate-slide-up z-10">
        <Card className="backdrop-blur-xl bg-white/80 border border-neuro-primary/20 shadow-2xl shadow-neuro-primary/10">
          <CardContent className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className={`${error.includes('sucesso') ? 'bg-neuro-success/10 border-neuro-success/20' : 'bg-neuro-error/10 border-neuro-error/20'} border rounded-lg p-4 animate-shake`}>
                  <p className={`text-sm font-medium ${error.includes('sucesso') ? 'text-neuro-success' : 'text-neuro-error'}`}>{error}</p>
                  {showEmailConfirmationHelp && email && (
                    <div className="mt-3">
                      <Button
                        type="button"
                        onClick={handleResendConfirmation}
                        variant="outline"
                        size="sm"
                        loading={resendingEmail}
                        className="text-xs"
                      >
                        Reenviar Email de Confirmação
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
              />

              <div className="relative">
                <Input
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-10 text-neuro-gray-400 hover:text-neuro-gray-600 transition-colors"
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

              <div className="flex items-center justify-end">
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-neuro-primary hover:text-neuro-primary-hover font-medium transition-colors"
                >
                  Esqueceu sua senha?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full bg-gradient-to-r from-neuro-primary to-neuro-primary-dark hover:from-neuro-primary-dark hover:to-neuro-primary shadow-lg shadow-neuro-primary/30 hover:shadow-xl hover:shadow-neuro-primary/40 transition-all duration-300"
              >
                Entrar
              </Button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neuro-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-neuro-gray-400 font-medium">
                    Não tem uma conta?
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button
                  asChild
                  variant="primary"
                  size="lg"
                  className="w-full bg-gradient-to-r from-neuro-primary to-neuro-primary-dark hover:from-neuro-primary-dark hover:to-neuro-primary text-white shadow-lg shadow-neuro-primary/30 hover:shadow-xl hover:shadow-neuro-primary/40 transition-all duration-300"
                >
                  <Link to="/auth/register">
                    Criar nova conta
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

export default Login;