import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { ArrowLeft, Mail } from 'lucide-react';
import { NeuroLabIconLarge } from '../../components/icons/NeuroLabLogo';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Por favor, insira seu email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setSent(true);
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError('Erro ao enviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-neuro-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="shadow-2xl shadow-neuro-primary/10 animate-fade-in">
            <CardContent className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-neuro-primary/10 rounded-2xl mb-6">
                <Mail className="h-8 w-8 text-neuro-primary" />
              </div>
              <h2 className="text-2xl font-bold text-neuro-gray-900 mb-4">
                Email Enviado!
              </h2>
              <p className="text-neuro-gray-600 mb-6 leading-relaxed">
                Enviamos um link para redefinir sua senha para <strong className="text-neuro-primary">{email}</strong>.
                Verifique sua caixa de entrada e spam.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-2"
              >
                <Link to="/auth/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para login
                </Link>
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
          <h1 className="text-4xl font-bold text-neuro-gray-900 mb-3">Recuperar Senha</h1>
          <p className="text-lg text-neuro-gray-600">
            Digite seu email para receber um link de recuperação
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
                label="Email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
                helper="Digite o email usado para criar sua conta"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Enviar link de recuperação
              </Button>
            </form>

            <div className="mt-8 text-center">
              <Button
                asChild
                variant="ghost"
                size="sm"
              >
                <Link to="/auth/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;