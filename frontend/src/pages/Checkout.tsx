import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageLoader, LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { CreditCard, User, MapPin, Calendar, Lock, ArrowLeft } from 'lucide-react';
import { PixIcon, BoletoIcon, CreditCardIcon } from '../components/icons/PaymentIcons';
import { AssistantIcon } from '../components/ui/AssistantIcon';
import { ApiService } from '../services/api.service';

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  color_theme: string;
  monthly_price: number;
  semester_price: number;
}

interface CheckoutData {
  type: 'individual' | 'package';
  assistant_id?: string;
  package_type?: 'package_3' | 'package_6';
  subscription_type: 'monthly' | 'semester';
  selected_assistants?: string[];
  total_price: number;
}

interface CustomerData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  mobilePhone: string;
  postalCode: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  city: string;
  state: string;
}

interface CardData {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'PIX' | 'BOLETO'>('CREDIT_CARD');

  // Form data
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: '',
    mobilePhone: '',
    postalCode: '',
    address: '',
    addressNumber: '',
    complement: '',
    province: '',
    city: '',
    state: ''
  });

  const [cardData, setCardData] = useState<CardData>({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: ''
  });

  useEffect(() => {
    // Get checkout data from location state
    if (location.state) {
      setCheckoutData(location.state as CheckoutData);
    } else {
      // Redirect to store if no checkout data
      navigate('/store');
      return;
    }

    loadData();
  }, [location.state, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load assistants if needed
      const apiService = ApiService.getInstance();
      const result = await apiService.getAssistants();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar dados');
      }

      setAssistants(result.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkoutData) return;

    setProcessing(true);
    setError(null);

    try {
      const paymentData = {
        payment_method: paymentMethod,
        customer_data: customerData,
        ...(paymentMethod === 'CREDIT_CARD' && { card_data: cardData })
      };

      const apiService = ApiService.getInstance();
      let result;

      if (checkoutData.type === 'individual') {
        result = await apiService.createSubscriptionWithPayment(
          checkoutData.assistant_id!,
          checkoutData.subscription_type!,
          paymentData
        );
      } else {
        result = await apiService.createPackageWithPayment(
          checkoutData.selected_assistants!,
          checkoutData.subscription_type!,
          checkoutData.package_type!,
          paymentData
        );
      }

      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar pagamento');
      }

      const paymentResult = result.data;

      // Handle different payment methods
      if (paymentMethod === 'PIX') {
        console.log('🎯 Processing PIX payment result:', {
          hasPix: !!paymentResult.pix,
          hasPixFallback: !!paymentResult.pix_fallback,
          pixData: paymentResult.pix,
          paymentId: paymentResult.payment_id
        });

        if (paymentResult.pix && paymentResult.pix.qr_code && paymentResult.pix.copy_paste) {
          // Normal PIX flow - redirect to PIX payment page
          navigate('/payment/pix', {
            state: {
              payment_id: paymentResult.payment_id,
              qr_code: paymentResult.pix.qr_code,
              copy_paste: paymentResult.pix.copy_paste,
              amount: paymentResult.amount,
              description: paymentResult.description
            }
          });
        } else if (paymentResult.pix_fallback) {
          // PIX fallback - redirect to dedicated instructions page
          console.log('⚠️ PIX fallback mode activated');
          navigate('/payment/pix-instructions', {
            state: {
              payment_id: paymentResult.payment_id,
              message: paymentResult.pix_fallback.message,
              support_email: paymentResult.pix_fallback.support_email,
              error_details: paymentResult.pix_fallback.error_details
            }
          });
        } else {
          console.error('❌ PIX data missing in response:', paymentResult);
          throw new Error('Erro ao gerar QR Code PIX. Dados incompletos na resposta.');
        }
      } else if (paymentMethod === 'BOLETO' && paymentResult.boleto) {
        // Redirect to boleto payment page
        navigate('/payment/boleto', {
          state: {
            payment_id: paymentResult.payment_id,
            barcode: paymentResult.boleto.barcode,
            pdf_url: paymentResult.boleto.pdf_url,
            due_date: paymentResult.boleto.due_date,
            amount: paymentResult.amount,
            description: paymentResult.description
          }
        });
      } else {
        // Credit card or immediate payment - redirect to success
        navigate('/dashboard', {
          state: {
            message: 'Pagamento processado com sucesso! Sua assinatura está ativa.',
            type: 'success'
          }
        });
      }

    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getSelectedAssistants = () => {
    if (!checkoutData || !checkoutData.selected_assistants) return [];
    return assistants.filter(a => checkoutData.selected_assistants!.includes(a.id));
  };

  const getCurrentAssistant = () => {
    if (!checkoutData || checkoutData.type !== 'individual') return null;
    return assistants.find(a => a.id === checkoutData.assistant_id);
  };

  if (loading) {
    return <PageLoader message="Preparando checkout..." />;
  }

  if (error && !checkoutData) {
    return (
      <ErrorState
        title="Erro no checkout"
        message={error}
        onRetry={() => navigate('/store')}
        retryText="Voltar à Loja"
      />
    );
  }

  if (!checkoutData) {
    return null;
  }

  const selectedAssistants = getSelectedAssistants();
  const currentAssistant = getCurrentAssistant();

  return (
    <div className="min-h-screen bg-neuro-surface py-8">
      <div className="container mx-auto px-4 max-w-6xl">
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
            Finalizar Compra
          </h1>
          <p className="text-neuro-gray-600">
            Complete os dados abaixo para concluir sua assinatura
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method Selection */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-neuro-gray-900 mb-4">
                    Método de Pagamento
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'CREDIT_CARD', label: 'Cartão de Crédito', icon: CreditCardIcon },
                      { value: 'PIX', label: 'PIX', icon: PixIcon },
                      { value: 'BOLETO', label: 'Boleto', icon: BoletoIcon }
                    ].map(({ value, label, icon: Icon }) => (
                      <label
                        key={value}
                        className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          paymentMethod === value
                            ? 'border-neuro-primary bg-neuro-primary/5'
                            : 'border-neuro-gray-200 hover:border-neuro-primary/50'
                        }`}
                      >
                        <input
                          type="radio"
                          value={value}
                          checked={paymentMethod === value}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <Icon className="w-6 h-6 mx-auto mb-2" />
                          <span className="text-sm font-medium">{label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Data */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <User className="w-5 h-5 text-neuro-primary mr-2" />
                    <h2 className="text-xl font-semibold text-neuro-gray-900">
                      Dados Pessoais
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nome Completo"
                      value={customerData.name}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                    <Input
                      label="E-mail"
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                    <Input
                      label="CPF/CNPJ"
                      value={customerData.cpfCnpj}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                      required
                    />
                    <Input
                      label="Telefone"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    <Input
                      label="Celular"
                      value={customerData.mobilePhone}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, mobilePhone: e.target.value }))}
                      required
                    />
                    <Input
                      label="CEP"
                      value={customerData.postalCode}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, postalCode: e.target.value }))}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Data */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <MapPin className="w-5 h-5 text-neuro-primary mr-2" />
                    <h2 className="text-xl font-semibold text-neuro-gray-900">
                      Endereço
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Endereço"
                        value={customerData.address}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                        required
                      />
                    </div>
                    <Input
                      label="Número"
                      value={customerData.addressNumber}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, addressNumber: e.target.value }))}
                      required
                    />
                    <Input
                      label="Complemento"
                      value={customerData.complement}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, complement: e.target.value }))}
                    />
                    <Input
                      label="Bairro"
                      value={customerData.province}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, province: e.target.value }))}
                      required
                    />
                    <Input
                      label="Cidade"
                      value={customerData.city}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, city: e.target.value }))}
                      required
                    />
                    <Input
                      label="Estado"
                      value={customerData.state}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, state: e.target.value }))}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Credit Card Data (only if credit card selected) */}
              {paymentMethod === 'CREDIT_CARD' && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <CreditCard className="w-5 h-5 text-neuro-primary mr-2" />
                      <h2 className="text-xl font-semibold text-neuro-gray-900">
                        Dados do Cartão
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Input
                          label="Nome no Cartão"
                          value={cardData.holderName}
                          onChange={(e) => setCardData(prev => ({ ...prev, holderName: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Input
                          label="Número do Cartão"
                          value={cardData.number}
                          onChange={(e) => setCardData(prev => ({ ...prev, number: e.target.value }))}
                          placeholder="0000 0000 0000 0000"
                          required
                        />
                      </div>
                      <Input
                        label="Mês"
                        value={cardData.expiryMonth}
                        onChange={(e) => setCardData(prev => ({ ...prev, expiryMonth: e.target.value }))}
                        placeholder="MM"
                        required
                      />
                      <Input
                        label="Ano"
                        value={cardData.expiryYear}
                        onChange={(e) => setCardData(prev => ({ ...prev, expiryYear: e.target.value }))}
                        placeholder="AAAA"
                        required
                      />
                      <div className="md:col-span-2">
                        <Input
                          label="CCV"
                          value={cardData.ccv}
                          onChange={(e) => setCardData(prev => ({ ...prev, ccv: e.target.value }))}
                          placeholder="123"
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Display */}
              {error && (
                <Card variant="error">
                  <CardContent className="p-4">
                    <p className="text-neuro-error font-medium">{error}</p>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={processing}
                  leftIcon={processing ? <LoadingSpinner size="sm" /> : <Lock className="w-4 h-4" />}
                  className="min-w-48"
                >
                  {processing ? 'Processando...' : `Pagar ${formatCurrency(checkoutData.total_price)}`}
                </Button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-neuro-gray-900 mb-4">
                  Resumo do Pedido
                </h2>

                {checkoutData.type === 'individual' && currentAssistant && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-neuro-surface rounded-lg">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: currentAssistant.color_theme }}
                      >
                        <AssistantIcon iconType={currentAssistant.icon} color="white" size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium text-neuro-gray-900">
                          {currentAssistant.name}
                        </h4>
                        <p className="text-sm text-neuro-gray-600">
                          Assinatura {checkoutData.subscription_type === 'monthly' ? 'Mensal' : 'Semestral'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {checkoutData.type === 'package' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-neuro-surface rounded-lg">
                      <h4 className="font-medium text-neuro-gray-900 mb-2">
                        Pacote {checkoutData.package_type === 'package_3' ? '3' : '6'} Assistentes
                      </h4>
                      <p className="text-sm text-neuro-gray-600 mb-3">
                        Plano {checkoutData.subscription_type === 'monthly' ? 'Mensal' : 'Semestral'}
                      </p>
                      
                      <div className="space-y-2">
                        {selectedAssistants.map(assistant => (
                          <div key={assistant.id} className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: assistant.color_theme }}
                            >
                              <AssistantIcon iconType={assistant.icon} color="white" size={20} />
                            </div>
                            <span className="text-sm text-neuro-gray-900">
                              {assistant.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <hr className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-neuro-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(checkoutData.total_price)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg text-neuro-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(checkoutData.total_price)}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-neuro-surface rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Lock className="w-4 h-4 text-neuro-primary mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-neuro-gray-600">
                      <p className="font-medium mb-1">Pagamento Seguro</p>
                      <p>Seus dados estão protegidos com criptografia SSL de 256 bits.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing Cycle Info */}
            <Card className="bg-neuro-surface border-none">
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <Calendar className="w-4 h-4 text-neuro-primary mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-neuro-gray-600">
                    <p className="font-medium mb-1">Ciclo de Cobrança</p>
                    <p>
                      {checkoutData.subscription_type === 'monthly' 
                        ? 'Renovação mensal automática' 
                        : 'Renovação semestral automática'
                      }. Você pode cancelar a qualquer momento.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}