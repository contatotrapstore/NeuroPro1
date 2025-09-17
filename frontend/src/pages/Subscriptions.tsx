import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { AssistantIcon } from '../components/ui/AssistantIcon';
import toast from 'react-hot-toast';

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: string;
  color_theme: string;
  monthly_price: number;
  semester_price: number;
}

interface Subscription {
  id: string;
  assistant_id: string;
  user_id: string;
  subscription_type: 'monthly' | 'semester';
  package_type: 'individual' | 'package_3' | 'package_6';
  package_id?: string;
  amount: number;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  asaas_subscription_id?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  assistants?: Assistant;
  user_packages?: {
    id: string;
    package_type: 'package_3' | 'package_6';
    total_amount: number;
  };
}

interface Package {
  id: string;
  user_id: string;
  package_type: 'package_3' | 'package_6';
  subscription_type: 'monthly' | 'semester';
  total_amount: number;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  asaas_subscription_id?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  user_subscriptions?: Array<{
    assistant_id: string;
    assistants: Assistant;
  }>;
}

export default function Subscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasLoadedRef.current) return;
    
    hasLoadedRef.current = true;
    
    // Debounce to prevent multiple rapid calls
    const timeoutId = setTimeout(() => {
      loadSubscriptions();
    }, 200);
    
    return () => {
      clearTimeout(timeoutId);
      hasLoadedRef.current = false;
    };
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar assinaturas e pacotes do usuário
      const [subscriptionsResult, packagesResult] = await Promise.all([
        apiService.getSubscriptions(),
        apiService.getUserPackages()
      ]);

      if (subscriptionsResult.success) {
        const subscriptions = subscriptionsResult.data || [];
        console.log('✅ Subscriptions loaded:', subscriptions);

        // Debug: Check for missing amount fields
        subscriptions.forEach((sub, index) => {
          if (!sub.amount && sub.amount !== 0) {
            console.warn(`⚠️ Subscription ${index} missing amount:`, sub);
          }
        });

        setSubscriptions(subscriptions);
      } else {
        console.error('❌ Erro ao carregar assinaturas:', subscriptionsResult.error);
      }

      if (packagesResult.success) {
        const packages = packagesResult.data || [];
        console.log('✅ Packages loaded:', packages);

        // Debug: Check for missing total_amount fields
        packages.forEach((pkg, index) => {
          if (!pkg.total_amount && pkg.total_amount !== 0) {
            console.warn(`⚠️ Package ${index} missing total_amount:`, pkg);
          }
        });

        setPackages(packages);
      } else {
        console.error('❌ Erro ao carregar pacotes:', packagesResult.error);
      }

    } catch (error: any) {
      console.error('Erro ao carregar assinaturas:', error);
      setError('Erro ao carregar suas assinaturas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (confirm('Tem certeza que deseja cancelar esta assinatura?')) {
      try {
        const result = await apiService.delete(`/subscriptions/${subscriptionId}`);
        
        if (result.success) {
          toast.success('Assinatura cancelada com sucesso!');
          loadSubscriptions(); // Recarregar a lista
        } else {
          toast.error(result.error || 'Erro ao cancelar assinatura');
        }
      } catch (error: any) {
        console.error('Erro ao cancelar assinatura:', error);
        toast.error('Erro ao cancelar assinatura. Tente novamente.');
      }
    }
  };

  const handleCancelPackage = async (packageId: string) => {
    if (confirm('Tem certeza que deseja cancelar este pacote?')) {
      try {
        const result = await apiService.delete(`/subscriptions/packages/${packageId}`);
        
        if (result.success) {
          toast.success('Pacote cancelado com sucesso!');
          loadSubscriptions(); // Recarregar a lista
        } else {
          toast.error(result.error || 'Erro ao cancelar pacote');
        }
      } catch (error: any) {
        console.error('Erro ao cancelar pacote:', error);
        toast.error('Erro ao cancelar pacote. Tente novamente.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) {
      console.warn('formatPrice called with invalid value:', price);
      return 'R$ 0,00';
    }
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (loading) {
    return <PageLoader message="Carregando suas assinaturas..." />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <h3 className="text-red-800 font-semibold mb-2">Erro ao carregar assinaturas</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadSubscriptions}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const hasActiveSubscriptions = subscriptions.length > 0 || packages.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-4">📋</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Minhas Assinaturas
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário'}, gerencie suas assinaturas e pacotes
        </p>
      </div>

      {!hasActiveSubscriptions ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="text-6xl mb-6">📦</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Você ainda não possui assinaturas ativas
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Explore nossa loja e escolha os assistentes especializados que mais se adequam à sua prática profissional
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/store"
              className="px-6 py-3 bg-neuro-primary text-white rounded-lg hover:bg-neuro-primary-hover transition-colors font-medium"
            >
              Explorar Loja
            </Link>
            <Link
              to="/store?packages=true"
              className="px-6 py-3 border border-neuro-primary text-neuro-primary rounded-lg hover:bg-neuro-primary hover:text-white transition-colors font-medium"
            >
              Ver Pacotes
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pacotes Ativos */}
          {packages.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Pacotes Ativos ({packages.length})
              </h2>
              
              <div className="space-y-4">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-neuro-primary rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {pkg.package_type === 'package_3' ? '3' : '6'}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              Pacote {pkg.package_type === 'package_3' ? '3' : '6'} Assistentes
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="capitalize">Plano {pkg.subscription_type}</span>
                              <span>•</span>
                              <span>Expira em {formatDate(pkg.expires_at)}</span>
                              <span>•</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                pkg.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {pkg.status === 'active' ? '✅ Ativo' : '⚠️ Inativo'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Assistentes do Pacote */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                          {pkg.user_subscriptions?.map((sub) => (
                            <div key={sub.assistant_id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                              <div 
                                className="w-8 h-8 rounded-md flex items-center justify-center text-white text-sm"
                                style={{ backgroundColor: sub.assistants.color_theme }}
                              >
                                <AssistantIcon iconType={sub.assistants.icon} color="white" size={20} />
                              </div>
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {sub.assistants.name}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatPrice(pkg.total_amount || 0)}
                            <span className="text-sm font-normal text-gray-600">
                              /{pkg.subscription_type === 'monthly' ? 'mês' : 'semestre'}
                            </span>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Link
                              to="/chat"
                              className="px-4 py-2 bg-neuro-primary text-white rounded-lg hover:bg-neuro-primary-hover transition-colors text-sm font-medium"
                            >
                              Usar Assistentes
                            </Link>
                            <button
                              onClick={() => handleCancelPackage(pkg.id)}
                              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Assinaturas Individuais */}
          {subscriptions.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Assinaturas Individuais ({subscriptions.length})
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: subscription.assistants?.color_theme || '#0E1E03' }}
                        >
                          <AssistantIcon iconType={subscription.assistants?.icon || 'target'} color="white" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {subscription.assistants?.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {subscription.assistants?.description}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        subscription.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {subscription.status === 'active' ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Plano:</span> {subscription.subscription_type === 'monthly' ? 'Mensal' : 'Semestral'}
                      </div>
                      <div>
                        <span className="font-medium">Expira em:</span> {formatDate(subscription.expires_at)}
                      </div>
                      <div>
                        <span className="font-medium">Tipo:</span> {subscription.package_type === 'individual' ? 'Individual' : 'Pacote'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatPrice(subscription.amount || 0)}
                        <span className="text-sm font-normal text-gray-600">
                          /{subscription.subscription_type === 'monthly' ? 'mês' : 'semestre'}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link
                          to={`/chat?assistant=${subscription.assistant_id}`}
                          className="px-4 py-2 bg-neuro-primary text-white rounded-lg hover:bg-neuro-primary-hover transition-colors text-sm font-medium"
                        >
                          Chat
                        </Link>
                        <button
                          onClick={() => handleCancelSubscription(subscription.id)}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Quick Actions */}
          <section className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <Link
                to="/store"
                className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-center"
              >
                <div className="text-2xl mb-2">🛒</div>
                <div className="font-medium text-gray-900">Adicionar Assistente</div>
                <div className="text-sm text-gray-600">Explore a loja</div>
              </Link>
              <Link
                to="/store?packages=true"
                className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-center"
              >
                <div className="text-2xl mb-2">📦</div>
                <div className="font-medium text-gray-900">Ver Pacotes</div>
                <div className="text-sm text-gray-600">Economize mais</div>
              </Link>
              <Link
                to="/profile"
                className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-center"
              >
                <div className="text-2xl mb-2">⚙️</div>
                <div className="font-medium text-gray-900">Configurações</div>
                <div className="text-sm text-gray-600">Editar perfil</div>
              </Link>
            </div>
          </section>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-neuro-primary text-white rounded-xl p-6">
        <div className="text-center">
          <h3 className="font-bold text-lg mb-2">💬 Precisa de Ajuda?</h3>
          <p className="text-sm opacity-90 mb-4">
            Nossa equipe está disponível para esclarecer dúvidas sobre assinaturas, 
            cancelamentos e renovações.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:suporte@neuroialab.com"
              className="px-4 py-2 bg-white text-neuro-primary rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Email Suporte
            </a>
            <a
              href="https://wa.me/5511999999999"
              className="px-4 py-2 bg-white bg-opacity-10 text-white rounded-lg hover:bg-opacity-20 transition-colors text-sm font-medium border border-white border-opacity-30"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}