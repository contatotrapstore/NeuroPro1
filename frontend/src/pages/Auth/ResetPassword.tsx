import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { NeuroLabIconLarge } from '../../components/icons/NeuroLabLogo';
import { supabase } from '../../services/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { updatePassword } = useAuth();

  useEffect(() => {
    // Verificar se há tokens de recuperação na URL
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // Configurar a sessão com os tokens da URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
    } else {
      // Se não há tokens, redirecionar para login
      navigate('/auth/login');
    }
  }, [searchParams, navigate]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'A senha deve ter pelo menos 8 caracteres';
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      return 'A senha deve conter pelo menos uma letra maiúscula e uma minúscula';
    }

    if (!/(?=.*\d)/.test(password)) {
      return 'A senha deve conter pelo menos um número';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setError('');
      setLoading(true);

      const { error } = await updatePassword(password);

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (error: any) {
      console.error('Reset password error:', error);

      if (error.message?.includes('Invalid or expired')) {
        setError('Link de recuperação expirado ou inválido. Solicite um novo link.');
      } else {
        setError('Erro ao redefinir senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-neuro-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="shadow-2xl shadow-neuro-primary/10 animate-fade-in">
            <CardContent className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-neuro-gray-900 mb-4">
                Senha Alterada!
              </h2>
              <p className="text-neuro-gray-600 mb-6 leading-relaxed">
                Sua senha foi redefinida com sucesso. Agora você pode fazer login com sua nova senha.
              </p>
              <Button
                onClick={() => navigate('/auth/login')}
                className="w-full"
              >
                Ir para Login
              </Button>
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
          <h1 className="text-4xl font-bold text-neuro-gray-900 mb-3">Nova Senha</h1>
          <p className="text-lg text-neuro-gray-600">
            Digite sua nova senha para redefinir sua conta
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="text-blue-600 mr-3 text-lg">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 mb-1">Requisitos da Senha</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Pelo menos 8 caracteres</li>
                      <li>• Pelo menos uma letra maiúscula e uma minúscula</li>
                      <li>• Pelo menos um número</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Input
                label="Nova Senha"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="Digite sua nova senha"
                required
                disabled={loading}
                minLength={8}
              />

              <Input
                label="Confirmar Nova Senha"
                type="password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua nova senha"
                required
                disabled={loading}
                minLength={8}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
                disabled={!password || !confirmPassword}
              >
                Redefinir Senha
              </Button>
            </form>

            <div className="mt-8 text-center">
              <Button
                onClick={() => navigate('/auth/login')}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;