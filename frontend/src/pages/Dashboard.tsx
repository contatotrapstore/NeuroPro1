import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AssistantCard } from '../components/AssistantCard';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../hooks/useAuthModal';
import { AuthModal } from '../components/auth/AuthModal';
import { LandingDashboard } from '../components/landing/LandingDashboard';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { ApiService } from '../services/api.service';

const apiService = ApiService.getInstance();
import Logo from '../assets/Logo.png';

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  color_theme: string;
  monthly_price: number;
  semester_price: number;
  is_active: boolean;
  area: 'Psicologia' | 'Psicopedagogia' | 'Fonoaudiologia';
}

interface Subscription {
  assistant_id: string;
  is_active: boolean;
  expires_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const {
    modalState,
    hideAuthModal,
    switchMode,
    executeIntendedAction,
    requireAuth
  } = useAuthModal();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    activeSubscriptions: 0,
    subscribedAssistants: 0,
    availableAssistants: 0,
    conversationsCount: 0
  });
  const hasLoadedRef = useRef(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasLoadedRef.current) return;
    
    hasLoadedRef.current = true;
    
    // Debounce to prevent multiple rapid calls
    const timeoutId = setTimeout(() => {
      loadDashboardData();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      // Reset ref when component unmounts
      hasLoadedRef.current = false;
    };
  }, []);

  const loadDashboardData = async () => {
    // Evitar múltiplas requisições simultâneas
    if (isLoadingData) {
      console.log('🛑 Requisição já em andamento, pulando...');
      return;
    }
    
    try {
      setLoading(true);
      setIsLoadingData(true);
      setError(null);
      
      if (!user) {
        setLoading(false);
        setIsLoadingData(false);
        return;
      }

      // Carregar todos os assistentes
      const assistantsResult = await apiService.getAssistants();
      
      if (!assistantsResult.success) {
        throw new Error(assistantsResult.error || 'Erro ao carregar assistentes');
      }

      setAssistants(assistantsResult.data || []);
      
      // Calcular estatísticas
      const totalAssistants = assistantsResult.data?.length || 0;

      // Carregar assinaturas do usuário apenas se estiver logado
      if (user?.id) {
        try {
          console.log('Usuário logado, carregando subscriptions...');
          const subscriptionsResult = await apiService.getSubscriptions();
          
          if (subscriptionsResult.success && subscriptionsResult.data) {
            const userSubscriptions = subscriptionsResult.data.map((sub: any) => ({
              assistant_id: sub.assistant_id,
              is_active: sub.status === 'active',
              expires_at: sub.expires_at
            }));
            
            setSubscriptions(userSubscriptions);
            
            const activeSubscriptions = userSubscriptions.filter((sub: any) => sub.is_active).length;
            const availableAssistants = totalAssistants - activeSubscriptions;

            // Carregar conversas do usuário
            let conversationsCount = 0;
            try {
              const conversationsResult = await apiService.getConversations();
              if (conversationsResult.success && conversationsResult.data) {
                conversationsCount = conversationsResult.data.length;
              }
            } catch (error) {
              console.warn('Erro ao carregar conversas:', error);
            }
            
            setStats({
              activeSubscriptions,
              subscribedAssistants: activeSubscriptions,
              availableAssistants: Math.max(0, availableAssistants),
              conversationsCount
            });
          } else {
            console.log('Nenhuma subscription encontrada ou erro na requisição');
            setSubscriptions([]);
            setStats({
              activeSubscriptions: 0,
              subscribedAssistants: 0,
              availableAssistants: totalAssistants,
              conversationsCount: 0
            });
          }
        } catch (error) {
          console.warn('Erro ao carregar subscriptions (usuário pode não estar autenticado):', error);
          setSubscriptions([]);
          setStats({
            activeSubscriptions: 0,
            subscribedAssistants: 0,
            availableAssistants: totalAssistants,
            conversationsCount: 0
          });
        }
      } else {
        console.log('Usuário não logado, exibindo apenas assistentes disponíveis');
        setSubscriptions([]);
        setStats({
          activeSubscriptions: 0,
          subscribedAssistants: 0,
          availableAssistants: totalAssistants,
          conversationsCount: 0
        });
      }

    } catch (error: any) {
      setError(error.message || 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
  };

  const subscribedAssistants = assistants.filter(assistant => 
    subscriptions.some(sub => sub.assistant_id === assistant.id && sub.is_active)
  );

  const availableAssistants = assistants.filter(assistant => 
    !subscriptions.some(sub => sub.assistant_id === assistant.id && sub.is_active)
  );

  // Group subscribed assistants by area
  const groupedSubscribedAssistants = subscribedAssistants.reduce((groups, assistant) => {
    const area = assistant.area || 'Psicologia';
    if (!groups[area]) {
      groups[area] = [];
    }
    groups[area].push(assistant);
    return groups;
  }, {} as Record<string, Assistant[]>);

  // Area display configuration
  const areaConfig = {
    'Psicologia': {
      name: 'Psicologia',
      color: '#2D5A1F',
      bgColor: '#2D5A1F',
      icon: 'brain'
    },
    'Psicopedagogia': {
      name: 'Psicopedagogia', 
      color: '#1E40AF',
      bgColor: '#1E40AF',
      icon: 'book'
    },
    'Fonoaudiologia': {
      name: 'Fonoaudiologia',
      color: '#7C3AED', 
      bgColor: '#7C3AED',
      icon: 'mic'
    }
  };

  const handleSubscribe = (assistantId: string) => {
    window.location.href = `/store?assistant=${assistantId}`;
  };

  // Se não está logado, mostrar landing page
  if (!user) {
    return (
      <>
        <LandingDashboard onAuthAction={requireAuth} />
        <AuthModal
          modalState={modalState}
          onClose={hideAuthModal}
          onModeSwitch={switchMode}
          onSuccess={executeIntendedAction}
        />
      </>
    );
  }

  if (loading) {
    return <PageLoader message="Carregando seu dashboard..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar dashboard"
        message={error}
        onRetry={loadDashboardData}
        retryText="Recarregar Dashboard"
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="text-center py-8">
        {/* Logo com efeito visual */}
        <div className="flex justify-center mb-6 animate-fade-in">
          <div className="relative">
            <img
              src={Logo}
              alt="NeuroIA Lab"
              className="h-20 lg:h-24 w-auto object-contain drop-shadow-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-neuro-primary/10 to-blue-600/10 rounded-2xl blur-2xl -z-10"></div>
          </div>
        </div>

        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 animate-slide-up">
          Bem-vindo de volta ao <span className="bg-gradient-to-r from-neuro-primary via-green-600 to-blue-600 bg-clip-text text-transparent">NeuroIA Lab</span>
        </h1>

        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed animate-slide-up delay-200">
          {user ? (
            <>
              Olá <span className="font-bold text-neuro-primary bg-neuro-primary/10 px-2 py-1 rounded-lg">
                {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}
              </span>, seus assistentes especializados estão prontos para potencializar sua prática clínica
            </>
          ) : (
            <>
              Conheça nossos <span className="font-semibold text-neuro-primary">assistentes especializados</span> em psicologia, prontos para revolucionar sua prática clínica
            </>
          )}
        </p>

        {/* Quick Start CTA for new users */}
        {subscribedAssistants.length === 0 && (
          <div className="mt-8 animate-slide-up delay-400">
            <div className="bg-gradient-to-br from-neuro-primary/5 via-green-50 to-blue-50 border border-neuro-primary/20 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-neuro-primary to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Icon name="rocket" className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 text-center">
                Comece sua <span className="text-neuro-primary">jornada profissional</span>!
              </h3>

              <p className="text-gray-600 text-base sm:text-lg mb-6 text-center leading-relaxed">
                Você ainda não possui assinaturas ativas. Explore nossa loja e escolha os assistentes que mais se adequam à sua prática.
              </p>

              <Button asChild className="w-full bg-gradient-to-r from-neuro-primary to-green-600 hover:from-neuro-primary-hover hover:to-green-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                <Link to="/store" className="flex items-center justify-center gap-2 px-6 py-3">
                  <Icon name="store" className="w-5 h-5 flex-shrink-0" />
                  <span className="text-base font-semibold">Explorar Assistentes</span>
                </Link>
              </Button>

              {/* Mini stats */}
              <div className="mt-6 flex justify-center items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{assistants.length}+ Especialistas</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>500+ Profissionais</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>4.9/5 ⭐</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Stats */}
      <DashboardStats stats={stats} />

      {/* Assistentes Assinados */}
      {subscribedAssistants.length > 0 && (
        <section className="animate-slide-up space-y-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                <Icon name="checkCircle" className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Seus Assistentes
                </h2>
                <p className="text-sm text-gray-500">
                  {subscribedAssistants.length} assistente{subscribedAssistants.length !== 1 ? 's' : ''} ativo{subscribedAssistants.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <Link
              to="/subscriptions"
              className="flex items-center space-x-2 text-neuro-primary hover:text-neuro-primary-hover text-sm font-medium card-hover px-3 py-2 rounded-lg"
            >
              <Icon name="settings" className="w-4 h-4" />
              <span>Gerenciar</span>
              <Icon name="arrowRight" className="w-4 h-4" />
            </Link>
          </div>
          
          {/* Group assistants by area */}
          {Object.entries(groupedSubscribedAssistants).map(([area, areaAssistants]) => {
            const config = areaConfig[area as keyof typeof areaConfig];
            return (
              <div key={area} className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: config.bgColor }}
                  >
                    <Icon name={config.icon as any} className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {config.name}
                  </h3>
                  <span className="text-sm text-gray-500">
                    ({areaAssistants.length} assistente{areaAssistants.length !== 1 ? 's' : ''})
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {areaAssistants.map((assistant) => (
                    <AssistantCard
                      key={assistant.id}
                      assistant={assistant}
                      isSubscribed={true}
                      showChatLink={true}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Assistentes Disponíveis */}
      <section className="animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
              <Icon name="sparkles" className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {subscribedAssistants.length > 0 ? 'Outros Assistentes' : 'Assistentes Especializados'}
              </h2>
              <p className="text-sm text-gray-500">
                Disponíveis para assinatura
              </p>
            </div>
          </div>
          
          <Link
            to="/store"
            className="flex items-center space-x-2 text-neuro-primary hover:text-neuro-primary-hover text-sm font-medium card-hover px-3 py-2 rounded-lg"
          >
            <Icon name="store" className="w-4 h-4" />
            <span>Ver Loja</span>
            <Icon name="arrowRight" className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {availableAssistants.slice(0, subscribedAssistants.length > 0 ? 3 : 6).map((assistant) => (
            <AssistantCard
              key={assistant.id}
              assistant={assistant}
              isSubscribed={false}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>
        
        {availableAssistants.length > (subscribedAssistants.length > 0 ? 3 : 6) && (
          <div className="text-center mt-8">
            <Button asChild size="lg" variant="outline">
              <Link to="/store" className="inline-flex items-center">
                <Icon name="eye" className="w-4 h-4 mr-2" />
                Ver Todos os {assistants.length} Assistentes
              </Link>
            </Button>
          </div>
        )}
      </section>

    </div>
  );
}