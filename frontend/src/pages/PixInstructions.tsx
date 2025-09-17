import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, AlertTriangle, Phone, Mail } from 'lucide-react';

interface PixInstructionsState {
  payment_id?: string;
  message?: string;
  support_email?: string;
  error_details?: string;
}

const PixInstructions: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as PixInstructionsState;

  const copyPaymentId = () => {
    if (state?.payment_id) {
      navigator.clipboard.writeText(state.payment_id);
      // You could add a toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar ao Dashboard
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Status Header */}
          <div className="flex items-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mr-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                PIX Temporariamente Indisponível
              </h1>
              <p className="text-gray-600">
                Seu pagamento foi criado com sucesso
              </p>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              ✅ Pagamento Registrado
            </h2>
            <p className="text-green-700">
              Sua assinatura foi criada e está aguardando confirmação do pagamento.
              O problema é apenas na geração automática do QR Code PIX.
            </p>
          </div>

          {/* Payment ID */}
          {state?.payment_id && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-md font-semibold text-gray-800 mb-2">
                ID do Pagamento
              </h3>
              <div className="flex items-center justify-between">
                <code className="text-sm bg-white px-3 py-2 rounded border">
                  {state.payment_id}
                </code>
                <button
                  onClick={copyPaymentId}
                  className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                📋 Próximos Passos
              </h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full mr-3 mt-0.5 font-semibold text-sm">
                    1
                  </div>
                  <div>
                    <p className="text-gray-700">
                      <strong>Entre em contato conosco</strong> através do WhatsApp ou email
                      para solicitar a geração manual do PIX
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full mr-3 mt-0.5 font-semibold text-sm">
                    2
                  </div>
                  <div>
                    <p className="text-gray-700">
                      <strong>Informe o ID do pagamento</strong> que está destacado acima
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full mr-3 mt-0.5 font-semibold text-sm">
                    3
                  </div>
                  <div>
                    <p className="text-gray-700">
                      <strong>Receba o QR Code PIX</strong> e realize o pagamento normalmente
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full mr-3 mt-0.5 font-semibold text-sm">
                    4
                  </div>
                  <div>
                    <p className="text-gray-700">
                      <strong>Sua assinatura será ativada</strong> automaticamente após a confirmação
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📞 Suporte ao Cliente
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <Phone className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-800">WhatsApp</p>
                    <p className="text-sm text-gray-600">Resposta rápida</p>
                  </div>
                </a>

                <a
                  href={`mailto:${state?.support_email || 'suporte@neuroialab.com'}`}
                  className="flex items-center p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Mail className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-800">Email</p>
                    <p className="text-sm text-gray-600">
                      {state?.support_email || 'suporte@neuroialab.com'}
                    </p>
                  </div>
                </a>
              </div>
            </div>

            {/* FAQ */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ❓ Perguntas Frequentes
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800">
                    Por que o PIX não foi gerado automaticamente?
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Pode ser um problema temporário na API do Asaas ou configuração específica
                    da conta. Nosso suporte pode resolver rapidamente.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">
                    Meu pagamento já foi registrado?
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Sim! Sua assinatura foi criada e está aguardando apenas o pagamento.
                    Você deve ter recebido um email de confirmação.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">
                    Quanto tempo demora para ativar?
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Após o pagamento via PIX, a ativação é automática e instantânea.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t pt-6 mt-8">
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
              >
                Falar no WhatsApp
              </a>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Ir para Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixInstructions;