import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CheckCircle, CreditCard, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/api.service';

const apiService = ApiService.getInstance();

interface PaymentConfirmationState {
  payment_id: string;
  subscription_id: string;
  amount: number;
  description: string;
  payment_method: string;
}

type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'REFUNDED' | 'UNKNOWN';

export function PaymentConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkCount, setCheckCount] = useState(0);

  const paymentData = location.state as PaymentConfirmationState;

  useEffect(() => {
    if (!paymentData) {
      navigate('/store');
      return;
    }

    checkPaymentStatus();

    // Check payment status every 5 seconds for up to 2 minutes
    const interval = setInterval(() => {
      if (checkCount < 24) { // 24 * 5 seconds = 2 minutes
        checkPaymentStatus();
        setCheckCount(prev => prev + 1);
      } else {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checkCount]);

  const checkPaymentStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Checking payment status:', paymentData.payment_id);

      const response = await apiService.getPaymentStatus(paymentData.payment_id);

      if (response.success) {
        const status = response.data.status as PaymentStatus;
        console.log('💳 Payment status:', status);

        setPaymentStatus(status);

        // If payment is confirmed, redirect to dashboard
        if (status === 'CONFIRMED' || status === 'RECEIVED') {
          setTimeout(() => {
            navigate('/dashboard', {
              state: {
                message: 'Pagamento confirmado! Sua assinatura está ativa.',
                type: 'success'
              }
            });
          }, 2000); // Give user time to see success message
        }
      } else {
        throw new Error(response.error || 'Erro ao verificar status do pagamento');
      }
    } catch (error: any) {
      console.error('Erro ao verificar pagamento:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Clock className="w-8 h-8 text-yellow-500" />,
          title: 'Processando Pagamento',
          message: 'Seu pagamento está sendo processado. Isso pode levar alguns instantes.',
          color: 'yellow'
        };
      case 'CONFIRMED':
      case 'RECEIVED':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          title: 'Pagamento Confirmado!',
          message: 'Seu pagamento foi confirmado. Redirecionando para o dashboard...',
          color: 'green'
        };
      case 'OVERDUE':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
          title: 'Pagamento Recusado',
          message: 'O pagamento foi recusado. Verifique os dados do cartão e tente novamente.',
          color: 'red'
        };
      case 'REFUNDED':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
          title: 'Pagamento Cancelado',
          message: 'O pagamento foi cancelado.',
          color: 'red'
        };
      default:
        return {
          icon: <Clock className="w-8 h-8 text-gray-500" />,
          title: 'Verificando Pagamento',
          message: 'Aguarde enquanto verificamos o status do seu pagamento.',
          color: 'gray'
        };
    }
  };

  if (!paymentData) {
    return null;
  }

  const statusConfig = getStatusConfig(paymentStatus);

  return (
    <div className="min-h-screen bg-neuro-surface py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neuro-gray-900 mb-2">
            Confirmação de Pagamento
          </h1>
          <p className="text-neuro-gray-600">
            Acompanhe o status do seu pagamento em tempo real
          </p>
        </div>

        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                {loading ? (
                  <LoadingSpinner size="lg" />
                ) : (
                  statusConfig.icon
                )}

                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold text-neuro-gray-900">
                    {statusConfig.title}
                  </h2>
                  <p className="text-neuro-gray-600 max-w-md">
                    {statusConfig.message}
                  </p>
                </div>

                {paymentStatus === 'PENDING' && (
                  <div className="flex items-center space-x-2 text-sm text-neuro-gray-500">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando a cada 5 segundos...</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neuro-gray-900 mb-4">
                Detalhes do Pagamento
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neuro-gray-600">Método de Pagamento:</span>
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-neuro-gray-500" />
                    <span className="font-medium">Cartão de Crédito</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-neuro-gray-600">Valor:</span>
                  <span className="font-semibold text-neuro-gray-900">
                    {formatCurrency(paymentData.amount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neuro-gray-600">Descrição:</span>
                  <span className="font-medium text-neuro-gray-900">
                    {paymentData.description}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neuro-gray-600">ID do Pagamento:</span>
                  <span className="font-mono text-sm text-neuro-gray-700">
                    {paymentData.payment_id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card variant="error">
              <CardContent className="p-4">
                <p className="text-neuro-error font-medium">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkPaymentStatus}
                  className="mt-2"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            {(paymentStatus === 'OVERDUE' || paymentStatus === 'REFUNDED') && (
              <Button
                variant="primary"
                onClick={() => navigate('/store')}
              >
                Tentar Novamente
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
            >
              Ir para Dashboard
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-sm text-neuro-gray-500">
              Problemas com o pagamento? Entre em contato com o{' '}
              <a href="mailto:suporte@neuroialab.com" className="text-neuro-primary hover:underline">
                suporte
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}