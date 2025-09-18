import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from './Button';

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  assistantName?: string;
  assistantId?: string;
  subscriptionId?: string;
  daysExpired?: number;
  expiredAt?: string;
}

export function RenewalModal({
  isOpen,
  onClose,
  assistantName = 'assistente',
  assistantId,
  subscriptionId,
  daysExpired = 0,
  expiredAt
}: RenewalModalProps) {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  if (!isOpen) return null;

  const handleRenewSubscription = async () => {
    setIsNavigating(true);
    try {
      // Navegar para a página de assinatura específica do assistente
      if (assistantId) {
        navigate(`/checkout/individual/${assistantId}?renewal=true&subscriptionId=${subscriptionId}`);
      } else {
        // Fallback para loja geral
        navigate('/store');
      }
      onClose();
    } catch (error) {
      console.error('Erro ao navegar para renovação:', error);
      setIsNavigating(false);
    }
  };

  const handleViewStore = () => {
    navigate('/store');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Assinatura Expirada
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>

            <p className="text-gray-700 mb-2">
              Sua assinatura do <strong>{assistantName}</strong> expirou{' '}
              {daysExpired > 0 && (
                <>há <strong>{daysExpired} {daysExpired === 1 ? 'dia' : 'dias'}</strong></>
              )}.
            </p>

            {expiredAt && (
              <p className="text-sm text-gray-500 mb-4">
                Expirou em: {new Date(expiredAt).toLocaleDateString('pt-BR')}
              </p>
            )}

            <p className="text-gray-600">
              Renove sua assinatura para continuar conversando com este assistente.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleRenewSubscription}
              disabled={isNavigating}
              className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {isNavigating ? 'Redirecionando...' : 'Renovar Assinatura'}
              </span>
            </Button>

            <Button
              onClick={handleViewStore}
              variant="outline"
              className="w-full"
            >
              Ver Todos os Assistentes
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-gray-500"
            >
              Fechar
            </Button>
          </div>
        </div>

        {/* Info Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-600">
              <strong>Novo sistema de pagamento:</strong> Agora você paga apenas quando usar (30 dias de acesso).
              Sem cobrança automática recorrente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}