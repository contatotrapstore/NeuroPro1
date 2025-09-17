import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageLoader, LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Copy, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { ApiService } from '../services/api.service';
import toast from 'react-hot-toast';

interface PixPaymentData {
  payment_id: string;
  qr_code: string;
  copy_paste: string;
  amount: number;
  description: string;
}

export default function PaymentPix() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<PixPaymentData | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    console.log('🎯 PaymentPix - Location state:', location.state);

    if (location.state) {
      const pixData = location.state as PixPaymentData;
      console.log('✅ PIX data received:', {
        hasPaymentId: !!pixData.payment_id,
        hasQrCode: !!pixData.qr_code,
        hasCopyPaste: !!pixData.copy_paste,
        amount: pixData.amount,
        description: pixData.description
      });

      if (!pixData.qr_code || !pixData.copy_paste) {
        console.error('❌ PIX data incomplete:', pixData);
        toast.error('Dados do PIX incompletos. Tente novamente.');
        navigate('/store');
        return;
      }

      setPaymentData(pixData);
    } else {
      console.error('❌ No payment data in location.state');
      navigate('/store');
      return;
    }

    // Start polling payment status
    const interval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(interval);
  }, [location.state, navigate]);

  const checkPaymentStatus = async () => {
    if (!paymentData || completed) return;

    setChecking(true);
    try {
      const apiService = ApiService.getInstance();
      const result = await apiService.getPaymentStatus(paymentData.payment_id);

      if (result.success && result.data.status === 'RECEIVED') {
        setCompleted(true);
        toast.success('Pagamento confirmado!');

        setTimeout(() => {
          navigate('/dashboard', {
            state: {
              message: 'Pagamento PIX confirmado! Sua assinatura está ativa.',
              type: 'success'
            }
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
    } finally {
      setChecking(false);
    }
  };

  const copyPixCode = async () => {
    if (!paymentData) return;

    try {
      await navigator.clipboard.writeText(paymentData.copy_paste);
      setCopied(true);
      toast.success('Código PIX copiado!');

      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Erro ao copiar código PIX');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!paymentData) {
    return <PageLoader message="Carregando pagamento PIX..." />;
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-neuro-surface flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-neuro-gray-900 mb-2">
              Pagamento Confirmado!
            </h1>
            <p className="text-neuro-gray-600 mb-6">
              Seu pagamento PIX foi processado com sucesso.
              Redirecionando para o dashboard...
            </p>
            <LoadingSpinner />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neuro-surface py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-neuro-gray-900 mb-2">
            Pagamento PIX
          </h1>
          <p className="text-neuro-gray-600">
            Finalize seu pagamento através do PIX
          </p>
        </div>

        <div className="space-y-6">
          {/* Payment Details */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-neuro-primary mb-2">
                  {formatCurrency(paymentData.amount)}
                </div>
                <p className="text-neuro-gray-600">
                  {paymentData.description}
                </p>
              </div>

              <div className="flex items-center justify-center space-x-2 mb-6">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-orange-600 font-medium">
                  Aguardando pagamento...
                </span>
                {checking && <LoadingSpinner size="sm" />}
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-neuro-gray-900 mb-4 text-center">
                Escaneie o QR Code
              </h2>

              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white rounded-lg border">
                  <img
                    src={`data:image/png;base64,${paymentData.qr_code}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              <div className="text-center text-sm text-neuro-gray-600">
                <p>Abra o app do seu banco e escaneie o código</p>
                <p>O pagamento será confirmado automaticamente</p>
              </div>
            </CardContent>
          </Card>

          {/* Copy and Paste */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-neuro-gray-900 mb-4">
                Ou copie o código PIX
              </h2>

              <div className="space-y-4">
                <div className="p-3 bg-neuro-gray-50 rounded-lg border">
                  <p className="text-xs text-neuro-gray-600 mb-1">Código PIX:</p>
                  <p className="text-sm font-mono text-neuro-gray-900 break-all">
                    {paymentData.copy_paste}
                  </p>
                </div>

                <Button
                  onClick={copyPixCode}
                  variant={copied ? "secondary" : "primary"}
                  leftIcon={copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  className="w-full"
                >
                  {copied ? 'Código Copiado!' : 'Copiar Código PIX'}
                </Button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica:</strong> Cole este código no seu app de banco
                  ou internet banking na seção PIX/Transferências.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-neuro-surface border-none">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neuro-gray-900 mb-4">
                Como pagar com PIX:
              </h3>

              <div className="space-y-3 text-sm text-neuro-gray-600">
                <div className="flex items-start space-x-3">
                  <span className="bg-neuro-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                  <p>Abra o aplicativo do seu banco ou internet banking</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-neuro-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                  <p>Acesse a área PIX</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-neuro-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                  <p>Escaneie o QR Code ou cole o código copiado</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="bg-neuro-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                  <p>Confirme o pagamento e aguarde a confirmação aqui</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <div className="text-center">
            <p className="text-sm text-neuro-gray-600 mb-2">
              Problemas com o pagamento?
            </p>
            <a
              href="mailto:suporte@neuroialab.com"
              className="text-neuro-primary hover:underline font-medium"
            >
              Entre em contato conosco
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}