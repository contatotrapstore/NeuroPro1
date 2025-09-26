import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { Icon } from '../../components/ui/Icon';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const MONTHLY_PLAN = {
  id: 'monthly',
  name: 'Plano Mensal',
  price: 47.00,
  duration: 'monthly' as const,
  description: 'Acesso completo por 1 mês',
  features: [
    'Acesso a todos os assistentes especializados',
    'Chat ilimitado com IAs especializadas',
    'Recursos exclusivos da instituição',
    'Suporte técnico especializado'
  ]
};

export const InstitutionCheckout: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    institution,
    loading: institutionLoading,
    createSubscription,
    availableAssistants
  } = useInstitution();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');

  // Redirect if not logged in
  useEffect(() => {
    if (!institutionLoading && !user) {
      navigate(`/i/${slug}/login`);
    }
  }, [user, institutionLoading, navigate, slug]);

  const handleCheckout = async () => {
    if (!user || !institution || !slug) return;

    setIsProcessing(true);
    try {
      // Usar a nova função do contexto
      const result = await createSubscription(slug, 'monthly', paymentMethod);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar assinatura');
      }

      // Para esta demo, simular ativação imediata (em produção seria processamento real)
      toast.success('Assinatura criada com sucesso!');

      // Por enquanto, simular pagamento bem-sucedido e redirecionar
      toast.success('🎉 Pagamento confirmado! Sua assinatura está ativa.');

      // Redirecionar para o chat para usar os assistentes
      setTimeout(() => {
        navigate(`/i/${slug}/chat`);
      }, 2000);

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
                <p className="text-sm text-gray-600">Plano mensal - R$ 47,00/mês</p>
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

      <div className="max-w-2xl mx-auto p-6">
        {/* Plan Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Assinatura Mensal
          </h2>

          {/* Single Plan Card */}
          <div className="bg-white rounded-2xl border-2 border-blue-200 p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                   style={{ backgroundColor: `${institution.primary_color}20` }}>
                <Icon name="creditCard" className="w-8 h-8" style={{ color: institution.primary_color }} />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {MONTHLY_PLAN.name}
              </h3>
              <p className="text-gray-600 mb-6">{MONTHLY_PLAN.description}</p>

              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900">
                  R$ {MONTHLY_PLAN.price.toFixed(2)}
                </span>
                <span className="text-gray-600 text-lg">/mês</span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {MONTHLY_PLAN.features.map((feature, index) => (
                <div key={index} className="flex items-center text-gray-700">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                    <Icon name="check" className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>

            {/* Available Assistants Preview */}
            {availableAssistants.length > 0 && (
              <div className="border-t pt-6 mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Assistentes Inclusos ({availableAssistants.length})
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {availableAssistants.slice(0, 4).map((assistant, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-lg mr-3 flex-shrink-0 flex items-center justify-center"
                           style={{ backgroundColor: `${assistant.color_theme || institution.primary_color}20` }}>
                        <span className="text-sm font-bold" style={{ color: assistant.color_theme || institution.primary_color }}>
                          {assistant.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {assistant.name}
                      </span>
                    </div>
                  ))}
                  {availableAssistants.length > 4 && (
                    <div className="col-span-2 text-center">
                      <span className="text-sm text-gray-500">
                        +{availableAssistants.length - 4} outros assistentes
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
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
              onClick={() => setPaymentMethod('credit_card')}
              className={cn(
                "p-4 rounded-lg border-2 text-left transition-all",
                paymentMethod === 'credit_card'
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
              <span className="font-medium text-gray-900">{MONTHLY_PLAN.name}</span>
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
                <span className="text-gray-900">R$ {MONTHLY_PLAN.price.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className={cn(
              "w-full py-3 px-6 rounded-xl font-semibold text-white transition-all",
              "hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center space-x-2"
            )}
            style={{ backgroundColor: institution.primary_color }}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Icon name="creditCard" className="w-4 h-4" />
                <span>Finalizar Pagamento - R$ {MONTHLY_PLAN.price.toFixed(2)}</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            Ao finalizar o pagamento, você concorda com nossos termos de uso e política de privacidade.
            Cancelamento pode ser feito a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
};