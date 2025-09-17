import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PageLoader, LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Download, Copy, CheckCircle, Clock, ArrowLeft, Calendar, FileText } from 'lucide-react';
import { ApiService } from '../services/api.service';
import toast from 'react-hot-toast';

interface BoletoPaymentData {
  payment_id: string;
  barcode: string;
  pdf_url: string;
  due_date: string;
  amount: number;
  description: string;
}

export default function PaymentBoleto() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<BoletoPaymentData | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (location.state) {
      setPaymentData(location.state as BoletoPaymentData);
    } else {
      navigate('/store');
      return;
    }

    // Start polling payment status (less frequent for boleto)
    const interval = setInterval(checkPaymentStatus, 30000); // Check every 30 seconds
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
              message: 'Pagamento do boleto confirmado! Sua assinatura está ativa.',
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

  const copyBarcode = async () => {
    if (!paymentData) return;

    try {
      await navigator.clipboard.writeText(paymentData.barcode);
      setCopied(true);
      toast.success('Código de barras copiado!');

      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast.error('Erro ao copiar código de barras');
    }
  };

  const downloadPdf = () => {
    if (!paymentData) return;

    window.open(paymentData.pdf_url, '_blank');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!paymentData) {
    return <PageLoader message="Carregando boleto..." />;
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
              Seu pagamento foi processado com sucesso.
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
            Boleto Bancário
          </h1>
          <p className="text-neuro-gray-600">
            Imprima ou pague online através do código de barras
          </p>
        </div>

        <div className="space-y-6">
          {/* Payment Details */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center md:text-left">
                  <div className="text-3xl font-bold text-neuro-primary mb-2">
                    {formatCurrency(paymentData.amount)}
                  </div>
                  <p className="text-neuro-gray-600">
                    {paymentData.description}
                  </p>
                </div>

                <div className="text-center md:text-right">
                  <div className="flex items-center justify-center md:justify-end space-x-2 mb-2">
                    <Calendar className="w-5 h-5 text-orange-500" />
                    <span className="text-orange-600 font-medium">
                      Vencimento: {formatDate(paymentData.due_date)}
                    </span>
                  </div>

                  <div className="flex items-center justify-center md:justify-end space-x-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="text-blue-600 font-medium">
                      Processamento: 1-3 dias úteis
                    </span>
                    {checking && <LoadingSpinner size="sm" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Download PDF */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-neuro-gray-900 mb-4 text-center">
                Baixar Boleto
              </h2>

              <div className="text-center mb-6">
                <FileText className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-neuro-gray-600 mb-4">
                  Baixe o boleto em PDF para imprimir ou pagar online
                </p>

                <Button
                  onClick={downloadPdf}
                  variant="primary"
                  leftIcon={<Download className="w-4 h-4" />}
                  className="w-full max-w-sm"
                >
                  Baixar Boleto PDF
                </Button>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Atenção:</strong> Guarde o PDF do boleto para seus registros.
                  Você pode pagar em qualquer banco, casa lotérica ou internet banking.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Barcode */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-neuro-gray-900 mb-4">
                Código de Barras
              </h2>

              <div className="space-y-4">
                <div className="p-3 bg-neuro-gray-50 rounded-lg border">
                  <p className="text-xs text-neuro-gray-600 mb-1">Linha digitável:</p>
                  <p className="text-sm font-mono text-neuro-gray-900 break-all">
                    {paymentData.barcode}
                  </p>
                </div>

                <Button
                  onClick={copyBarcode}
                  variant={copied ? "secondary" : "outline"}
                  leftIcon={copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  className="w-full"
                >
                  {copied ? 'Código Copiado!' : 'Copiar Código de Barras'}
                </Button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>💡 Dica:</strong> Use este código para pagar no internet banking
                  ou apps bancários na opção "Pagar boleto".
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-neuro-surface border-none">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neuro-gray-900 mb-4">
                Como pagar o boleto:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-neuro-gray-900 mb-3">🏦 Internet Banking</h4>
                  <div className="space-y-2 text-sm text-neuro-gray-600">
                    <p>1. Acesse o site do seu banco</p>
                    <p>2. Vá em "Pagamentos" → "Boleto"</p>
                    <p>3. Digite o código de barras</p>
                    <p>4. Confirme o pagamento</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-neuro-gray-900 mb-3">🏪 Presencial</h4>
                  <div className="space-y-2 text-sm text-neuro-gray-600">
                    <p>1. Imprima o boleto PDF</p>
                    <p>2. Leve a qualquer banco ou lotérica</p>
                    <p>3. Apresente o documento</p>
                    <p>4. Efetue o pagamento</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">📅 Importante sobre o vencimento:</h4>
                <p className="text-sm text-red-700">
                  O boleto vence em <strong>{formatDate(paymentData.due_date)}</strong>.
                  Após esta data, será necessário gerar um novo boleto.
                  Entre em contato conosco se precisar de ajuda.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <div className="text-center">
            <p className="text-sm text-neuro-gray-600 mb-2">
              Problemas com o pagamento?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:suporte@neuroialab.com"
                className="text-neuro-primary hover:underline font-medium"
              >
                📧 suporte@neuroialab.com
              </a>
              <a
                href="https://wa.me/5511999999999"
                className="text-neuro-primary hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                📱 WhatsApp Suporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}