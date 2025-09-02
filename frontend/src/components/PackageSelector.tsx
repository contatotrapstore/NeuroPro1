import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssistantIcon } from './ui/AssistantIcon';
import { ApiService } from '../services/api.service';

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  color_theme: string;
  monthly_price: number;
  semester_price: number;
  is_active: boolean;
}

interface PackageSelectorProps {
  packageType: 3 | 6;
  onClose: () => void;
}

export function PackageSelector({ packageType, onClose }: PackageSelectorProps) {
  const navigate = useNavigate();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planType, setPlanType] = useState<'monthly' | 'semester'>('monthly');

  const packagePrices = {
    3: { monthly: 99.90, semester: 499.00 },
    6: { monthly: 179.90, semester: 899.00 }
  };

  const individualPrice = planType === 'monthly' ? 39.90 : 199.00;
  const packagePriceInfo = packagePrices[packageType as keyof typeof packagePrices];
  
  if (!packagePriceInfo) {
    console.error(`Invalid package type: ${packageType}`);
    return <div className="text-red-500">Erro: Tipo de pacote inválido</div>;
  }

  const packagePrice = packagePriceInfo[planType];
  const individualTotal = packageType * individualPrice;
  const discount = Math.round(((individualTotal - packagePrice) / individualTotal) * 100);

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiService = ApiService.getInstance();
      const result = await apiService.getAssistants();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar assistentes');
      }

      setAssistants(result.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar assistentes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssistantToggle = (assistantId: string) => {
    setSelectedAssistants(prev => {
      if (prev.includes(assistantId)) {
        return prev.filter(id => id !== assistantId);
      } else if (prev.length < packageType) {
        return [...prev, assistantId];
      }
      return prev;
    });
  };

  const handleProceedToCheckout = () => {
    if (selectedAssistants.length !== packageType) {
      alert(`Selecione exatamente ${packageType} assistentes`);
      return;
    }

    const checkoutData = {
      type: 'package' as const,
      package_type: `package_${packageType}` as 'package_3' | 'package_6',
      subscription_type: planType,
      selected_assistants: selectedAssistants,
      total_price: packagePrice
    };

    navigate('/checkout', { state: checkoutData });
    onClose();
  };

  const getColorStyle = (colorHex: string) => ({
    backgroundColor: colorHex
  });

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neuro-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando assistentes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-2xl mb-2">⚠️</div>
            <h3 className="text-red-800 font-semibold mb-2">Erro ao carregar</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex space-x-3">
              <button
                onClick={loadAssistants}
                className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Escolha {packageType} Assistentes
              </h2>
              <p className="text-gray-600 mt-1">
                Selecione exatamente {packageType} assistentes para seu pacote personalizado
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row" style={{ height: 'calc(90vh - 120px)' }}>
          {/* Assistant Selection */}
          <div className="flex-1 p-6 overflow-y-auto max-h-full">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assistentes Disponíveis
                </h3>
                <div className="text-sm text-gray-600">
                  {selectedAssistants.length}/{packageType} selecionados
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div 
                  className="bg-neuro-primary h-2 rounded-full transition-all"
                  style={{ width: `${(selectedAssistants.length / packageType) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Assistants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assistants.map((assistant) => {
                const isSelected = selectedAssistants.includes(assistant.id);
                const canSelect = selectedAssistants.length < packageType;
                
                return (
                  <div
                    key={assistant.id}
                    onClick={() => handleAssistantToggle(assistant.id)}
                    className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'border-neuro-primary bg-neuro-primary bg-opacity-5'
                        : canSelect
                        ? 'border-gray-200 hover:border-neuro-primary hover:shadow-md'
                        : 'border-gray-100 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                        style={getColorStyle(assistant.color_theme)}
                      >
                        <AssistantIcon iconType={assistant.icon} color="white" size={24} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {assistant.name}
                          </h4>
                          {isSelected && (
                            <div className="w-5 h-5 bg-neuro-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {assistant.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar - Package Summary */}
          <div className="lg:w-80 bg-gray-50 p-6 flex-shrink-0 overflow-y-auto max-h-full">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resumo do Pacote
              </h3>

              {/* Plan Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Plano
                </label>
                <div className="space-y-3">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors">
                    <input
                      type="radio"
                      value="monthly"
                      checked={planType === 'monthly'}
                      onChange={(e) => setPlanType(e.target.value as 'monthly')}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Mensal</div>
                      <div className="text-sm text-gray-600">
                        R$ {packagePrices[packageType].monthly.toFixed(2)}/mês
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors">
                    <input
                      type="radio"
                      value="semester"
                      checked={planType === 'semester'}
                      onChange={(e) => setPlanType(e.target.value as 'semester')}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Semestral</div>
                      <div className="text-sm text-gray-600">
                        R$ {packagePrices[packageType].semester.toFixed(2)}/semestre
                      </div>
                      <div className="text-xs text-green-600 font-medium">
                        {discount}% de desconto
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Selected Assistants */}
              {selectedAssistants.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Assistentes Selecionados ({selectedAssistants.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedAssistants.map(assistantId => {
                      const assistant = assistants.find(a => a.id === assistantId);
                      return assistant ? (
                        <div key={assistantId} className="flex items-center space-x-2 p-2 bg-white rounded-lg">
                          <div 
                            className="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
                            style={getColorStyle(assistant.color_theme)}
                          >
                            <AssistantIcon iconType={assistant.icon} color="white" size={16} />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {assistant.name}
                          </span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Price Summary */}
              <div className="mb-6 p-4 bg-white rounded-lg border">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Preço individual ({packageType}x)</span>
                    <span>R$ {individualTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Desconto do pacote</span>
                    <span>-R$ {(individualTotal - packagePrice).toFixed(2)}</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>R$ {packagePrice.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-gray-600 text-center">
                    Economia de {discount}% = R$ {(individualTotal - packagePrice).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleProceedToCheckout}
                  disabled={selectedAssistants.length !== packageType}
                  className="w-full px-4 py-3 bg-neuro-primary text-white rounded-lg hover:bg-neuro-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {selectedAssistants.length === packageType 
                    ? `Prosseguir para Pagamento`
                    : `Selecione ${packageType - selectedAssistants.length} mais`
                  }
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-800">
                  💡 <strong>Dica:</strong> Você pode alterar a seleção de assistentes a qualquer momento após a compra do pacote.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}