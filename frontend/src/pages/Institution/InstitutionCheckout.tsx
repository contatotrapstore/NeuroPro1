import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { Icon } from '../../components/ui/Icon';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

interface CheckoutPlan {
  id: string;
  name: string;
  price: number;
  duration: 'monthly' | 'semester' | 'annual';
  description: string;
  features: string[];
  popular?: boolean;
}

const CHECKOUT_PLANS: CheckoutPlan[] = [
  {
    id: 'monthly',
    name: 'Plano Mensal',
    price: 47.00,
    duration: 'monthly',
    description: 'Acesso completo por 1 mês',
    features: [
      'Acesso a todos os assistentes especializados',
      'Chat ilimitado',
      'Recursos exclusivos da instituição',
      'Suporte técnico'
    ]
  },
  {
    id: 'semester',
    name: 'Plano Semestral',
    price: 240.00,
    duration: 'semester',
    description: 'Acesso completo por 6 meses',
    features: [
      'Acesso a todos os assistentes especializados',
      'Chat ilimitado',
      'Recursos exclusivos da instituição',
      'Suporte técnico',
      'Desconto de 15%'
    ],
    popular: true
  },
  {
    id: 'annual',
    name: 'Plano Anual',
    price: 420.00,
    duration: 'annual',
    description: 'Acesso completo por 12 meses',
    features: [
      'Acesso a todos os assistentes especializados',
      'Chat ilimitado',
      'Recursos exclusivos da instituição',
      'Suporte técnico',
      'Desconto de 25%'
    ]
  }
];

export const InstitutionCheckout: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { institution, loading: institutionLoading } = useInstitution();

  const [selectedPlan, setSelectedPlan] = useState<CheckoutPlan>(CHECKOUT_PLANS[1]); // Default to semester
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  // Redirect if not logged in
  useEffect(() => {
    if (!institutionLoading && !user) {
      navigate(`/i/${slug}/login`);
    }
  }, [user, institutionLoading, navigate, slug]);

  const handlePlanSelect = (plan: CheckoutPlan) => {
    setSelectedPlan(plan);
  };

  const handleCheckout = async () => {
    if (!user || !institution || !slug) return;

    setIsProcessing(true);
    try {
      const { supabase } = await import('../../services/supabase');
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      if (!token) {
        toast.error('Erro de autenticação. Faça login novamente.');
        return;
      }

      // Criar assinatura pendente
      const response = await fetch('/api/create-institution-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          institution_slug: slug,
          subscription_type: selectedPlan.duration,
          amount: selectedPlan.price,
          payment_method: paymentMethod
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao processar pagamento');
      }

      // Redirecionar para página de pagamento ou confirmação
      if (paymentMethod === 'pix') {
        navigate(`/i/${slug}/payment/pix?subscription_id=${result.subscription_id}`);
      } else {
        // Para cartão, redirecionar para processamento de pagamento
        navigate(`/i/${slug}/payment/card?subscription_id=${result.subscription_id}`);
      }

      toast.success('Pedido criado com sucesso!');

    } catch (error) {
      console.error('Error processing checkout:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  if (institutionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Instituição não encontrada</h1>
          <p className="text-gray-600">A instituição solicitada não existe ou não está ativa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {institution.logo_url ? (
                <img
                  src={institution.logo_url}
                  alt={institution.name}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: institution.primary_color }}
                >
                  <span className="text-white font-bold text-lg">
                    {institution.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">Assinatura {institution.name}</h1>
                <p className="text-sm text-gray-600">Escolha seu plano de acesso</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/i/${slug}`)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Icon name="x" className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Plans Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Escolha seu Plano
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CHECKOUT_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative bg-white rounded-xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg",
                  selectedPlan.id === plan.id
                    ? "border-blue-500 shadow-lg"
                    : "border-gray-200 hover:border-gray-300",
                  plan.popular && "ring-2 ring-blue-500 ring-opacity-50"
                )}
                onClick={() => handlePlanSelect(plan)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">
                      R$ {plan.price.toFixed(2)}
                    </span>
                    <span className="text-gray-600 ml-1">
                      /{plan.duration === 'monthly' ? 'mês' : plan.duration === 'semester' ? '6 meses' : 'ano'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Icon name="check" className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {selectedPlan.id === plan.id && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none">
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Icon name="check" className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Método de Pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod('pix')}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                paymentMethod === 'pix'
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon name="smartphone" className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">PIX</h4>
                  <p className="text-sm text-gray-600">Pagamento instantâneo</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('card')}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                paymentMethod === 'card'
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="creditCard" className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Cartão de Crédito</h4>
                  <p className="text-sm text-gray-600">Visa, Mastercard, Elo</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Summary and Checkout */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h3>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Plano selecionado:</span>
              <span className="font-medium text-gray-900">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Método de pagamento:</span>
              <span className="font-medium text-gray-900">
                {paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}
              </span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">R$ {selectedPlan.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className={cn(
              "w-full py-3 px-6 rounded-xl font-semibold text-white transition-all",
              "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center space-x-2"
            )}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Icon name="creditCard" className="w-4 h-4" />
                <span>Finalizar Pagamento</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            🔒 Pagamento 100% seguro e protegido
          </p>
        </div>
      </div>
    </div>
  );
};