import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { cn } from '../../utils/cn';

interface InstitutionSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  institutionName: string;
  institutionSlug: string;
  errorType: 'NO_SUBSCRIPTION' | 'SUBSCRIPTION_EXPIRED';
  daysExpired?: number;
  expiredAt?: string;
}

export const InstitutionSubscriptionModal: React.FC<InstitutionSubscriptionModalProps> = ({
  isOpen,
  onClose,
  institutionName,
  institutionSlug,
  errorType,
  daysExpired,
  expiredAt
}) => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setIsNavigating(true);
    try {
      // Navegar para a página de checkout institucional
      navigate(`/i/${institutionSlug}/checkout`);
    } catch (error) {
      console.error('Error navigating to checkout:', error);
      setIsNavigating(false);
    }
  };

  const isExpired = errorType === 'SUBSCRIPTION_EXPIRED';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Icon name={isExpired ? 'clockX' : 'lock'} className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {isExpired ? 'Assinatura Expirada' : 'Assinatura Necessária'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="x" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mb-4">
              <p className="text-gray-700 leading-relaxed">
                {isExpired ? (
                  <>
                    Sua assinatura da <strong>{institutionName}</strong> expirou{' '}
                    {daysExpired && (
                      <span className="text-red-600 font-medium">
                        há {daysExpired} dia{daysExpired !== 1 ? 's' : ''}
                      </span>
                    )}
                    {expiredAt && (
                      <span className="text-gray-500 text-sm block mt-1">
                        em {new Date(expiredAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Para acessar os recursos da <strong>{institutionName}</strong>,
                    você precisa de uma assinatura ativa.
                  </>
                )}
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                {isExpired
                  ? 'Renove sua assinatura para continuar usando os assistentes especializados.'
                  : 'Adquira sua assinatura para ter acesso completo aos assistentes especializados desta instituição.'
                }
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center space-x-3">
              <Icon name="check" className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Acesso a todos os assistentes especializados</span>
            </div>
            <div className="flex items-center space-x-3">
              <Icon name="check" className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Chat ilimitado com IAs especializadas</span>
            </div>
            <div className="flex items-center space-x-3">
              <Icon name="check" className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Recursos exclusivos da instituição</span>
            </div>
            <div className="flex items-center space-x-3">
              <Icon name="check" className="w-5 h-5 text-green-500" />
              <span className="text-gray-700">Suporte técnico especializado</span>
            </div>
          </div>

          {/* Price Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                R$ 47,00
                <span className="text-sm font-normal text-gray-600">/mês</span>
              </div>
              <p className="text-sm text-gray-600">
                Plano mensal • Cancele quando quiser
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleSubscribe}
              disabled={isNavigating}
              className={cn(
                "w-full py-3 px-6 rounded-xl font-semibold text-white transition-all",
                "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                "transform hover:scale-105 shadow-lg hover:shadow-xl",
                "disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed",
                "flex items-center justify-center space-x-2"
              )}
            >
              {isNavigating ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Redirecionando...</span>
                </>
              ) : (
                <>
                  <Icon name="creditCard" className="w-4 h-4" />
                  <span>{isExpired ? 'Renovar Assinatura' : 'Assinar Agora'}</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-xl font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-colors border border-gray-200"
            >
              Voltar
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              💳 Pagamento seguro • 🔒 Dados protegidos • ⚡ Ativação instantânea
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};