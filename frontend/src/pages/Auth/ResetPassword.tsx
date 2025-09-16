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
  const [tokensProcessed, setTokensProcessed] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { updatePassword } = useAuth();

  useEffect(() => {
    // Verificar tokens tanto no hash (#) quanto em query params (?)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = searchParams;

    // Tentar obter tokens de ambos os formatos
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
    const errorParam = hashParams.get('error') || queryParams.get('error');
    const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

    console.log('🔍 ResetPassword useEffect - URL params:', {
      hashParams: Object.fromEntries(hashParams),
      queryParams: Object.fromEntries(queryParams),
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      error: errorParam,
      errorDescription: errorDescription
    });

    if (errorParam) {
      console.error('❌ Error in reset password URL:', errorParam, errorDescription);
      setError(errorDescription || 'Link de recuperação inválido ou expirado. Solicite um novo link.');
      return;
    }

    if (accessToken && refreshToken) {
      console.log('✅ Tokens de reset encontrados, guardando para uso posterior...');
      // NÃO fazer setSession automaticamente - apenas validar que os tokens existem
      // Os tokens serão usados apenas após o usuário definir a nova senha
      setTokensProcessed(true);
    } else {
      console.log('❌ Tokens não encontrados na URL');
      // Se não há tokens, mostrar mensagem informativa
      console.warn('⚠️ Nenhum token encontrado na URL. Usuário pode estar acessando diretamente.');
      setTokensProcessed(true);
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

      // Obter tokens da URL novamente
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = searchParams;
      const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');

      if (!accessToken || !refreshToken) {
        throw new Error('Tokens de reset não encontrados. Solicite um novo link.');
      }

      // Primeiro, configurar a sessão com os tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (sessionError) {
        throw sessionError;
      }

      console.log('✅ Sessão temporária configurada para reset de senha');

      // Agora tentar atualizar a senha
      const { error } = await updatePassword(password);

      if (error) {
        throw error;
      }

      console.log('✅ Senha alterada com sucesso');
      setSuccess(true);
    } catch (error: any) {
      console.error('Reset password error:', error);

      if (error.message?.includes('Invalid or expired')) {
        setError('Link de recuperação expirado ou inválido. Solicite um novo link.');
      } else if (error.message?.includes('Tokens de reset')) {
        setError(error.message);
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

              {/* Mostrar aviso se não há tokens válidos após processamento */}
              {tokensProcessed && (() => {
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const queryParams = new URLSearchParams(window.location.search);
                const hasValidTokens =
                  (hashParams.get('access_token') && hashParams.get('refresh_token')) ||
                  (queryParams.get('access_token') && queryParams.get('refresh_token'));

                if (!hasValidTokens && !error) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-amber-800">
                        <strong>Link inválido:</strong> Este link de redefinição de senha não é válido ou expirou.
                        Para redefinir sua senha, <a href="/auth/forgot-password" className="text-amber-900 underline font-medium">clique aqui para solicitar um novo link</a>.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

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