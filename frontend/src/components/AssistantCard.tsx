import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { AssistantIcon } from './ui/AssistantIcon';
import { Card, CardContent, CardHeader } from './ui/Card';
import { cn } from '../utils/cn';
import { getAssistantPricingInfo, calculatePackageSavings } from '../config/pricing';

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

interface AssistantCardProps {
  assistant: Assistant;
  isSubscribed?: boolean;
  onSubscribe?: (assistantId: string) => void;
  showChatLink?: boolean;
}

export function AssistantCard({ 
  assistant, 
  isSubscribed = false, 
  onSubscribe, 
  showChatLink = false 
}: AssistantCardProps) {
  
  // Get pricing information from centralized config
  const pricingInfo = getAssistantPricingInfo();

  return (
    <Card 
      variant="interactive" 
      hoverScale={true}
      className="group relative h-full flex flex-col overflow-hidden"
      size="md"
    >
      {/* Header com gradiente sutil da cor do assistente */}
      <div 
        className="h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-60"
        style={{ color: assistant.color_theme }}
      />
      
      <div className="p-6 pb-4">
        {/* Ícone e Nome */}
        <div className="mb-6">
          <div className="relative">
            <div className="flex items-center mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-lg"
                style={{ backgroundColor: assistant.color_theme }}
              >
                <AssistantIcon 
                  iconType={assistant.icon} 
                  color="white" 
                  size={24} 
                />
              </div>
              <h3 className="font-bold text-2xl text-gray-900 leading-tight font-display group-hover:text-gray-700 transition-colors">
                {assistant.name}
              </h3>
            </div>
            <p className="text-base text-gray-600 leading-relaxed">
              {assistant.description}
            </p>
          </div>
        </div>

        {/* Pricing Section - Design Simplificado */}
        <div className="mb-6 relative">
          <div className="bg-gradient-to-br from-white to-gray-50 p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {pricingInfo.monthly.formatted}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                por mês, por assistente
              </div>
              
              {/* Comparativo de Planos */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded-xl border border-blue-100">
                <div className="text-xs font-medium text-gray-700 mb-1">💡 Dica Inteligente</div>
                <div className="text-xs text-gray-600">
                  <span className="font-semibold text-blue-600">3 IAs: R$ 99,90</span> (economize 17%) <br/>
                  <span className="font-semibold text-green-600">6 IAs: R$ 179,90</span> (economize 25%)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Section - Design Premium */}
      <div className="px-6 pb-6 mt-auto">
        <div className="space-y-3">
          {isSubscribed ? (
            <>
              {showChatLink && (
                <Button 
                  asChild 
                  className="w-full h-12 rounded-2xl text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                  style={{ backgroundColor: assistant.color_theme }}
                >
                  <Link to={`/chat/${assistant.id}`} className="flex items-center justify-center gap-3">
                    <Icon name="message" className="w-5 h-5 flex-shrink-0" />
                    <span>Iniciar Chat</span>
                  </Link>
                </Button>
              )}
              <div className="flex items-center justify-center gap-3 text-emerald-600 text-sm font-semibold bg-emerald-50 py-3 rounded-2xl border-2 border-emerald-100">
                <Icon name="checkCircle" className="w-4 h-4" />
                <span>Assinatura Ativa</span>
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={() => onSubscribe?.(assistant.id)}
                className="w-full h-12 rounded-2xl text-base font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                style={{ backgroundColor: assistant.color_theme }}
              >
                <Icon name="plus" className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>Assinar Agora</span>
              </Button>
              
              {/* Sugestão de Pacote */}
              <div className="text-center">
                <Link 
                  to="/store?packages=true" 
                  className="text-xs text-gray-500 hover:text-gray-700 underline decoration-dotted transition-colors"
                >
                  💰 Ou economize com pacotes de 3 ou 6 IAs
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status indicator */}
      {isSubscribed && (
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 bg-neuro-success rounded-full border-2 border-white shadow-sm" />
        </div>
      )}
    </Card>
  );
}