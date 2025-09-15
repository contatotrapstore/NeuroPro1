import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { cn } from '../../utils/cn';
import { FloatingParticles, GradientOrb } from '../ui/AdvancedEffects';
import { ApiService } from '../../services/api.service';
import Logo from '../../assets/Logo.png';

interface LandingDashboardProps {
  onAuthAction: (action: () => void, message: string) => void;
}

export const LandingDashboard: React.FC<LandingDashboardProps> = ({ onAuthAction }) => {
  const [totalAssistants, setTotalAssistants] = useState(19); // Fallback para não quebrar o layout

  useEffect(() => {
    const loadAssistantCount = async () => {
      try {
        const apiService = ApiService.getInstance();
        const result = await apiService.getAssistants();
        if (result.success && result.data) {
          setTotalAssistants(result.data.length);
        }
      } catch (error) {
        console.warn('Erro ao carregar contagem de assistentes:', error);
        // Mantém o valor padrão em caso de erro
      }
    };

    loadAssistantCount();
  }, []);

  const features = [
    {
      icon: 'brain',
      title: 'IAs Especializadas',
      description: 'Assistentes desenvolvidos especificamente para profissionais de psicologia, psicopedagogia e fonoaudiologia',
      color: 'blue'
    },
    {
      icon: 'message',
      title: 'Chat Inteligente',
      description: 'Converse naturalmente com suas IAs e obtenha respostas personalizadas para cada caso',
      color: 'green'
    },
    {
      icon: 'chart',
      title: 'Relatórios Detalhados',
      description: 'Acompanhe seu progresso e obtenha insights valiosos sobre suas sessões',
      color: 'purple'
    },
    {
      icon: 'users',
      title: 'Gestão de Pacientes',
      description: 'Organize e acompanhe todos os seus casos de forma profissional e segura',
      color: 'orange'
    }
  ];

  const handleGetStarted = () => {
    onAuthAction(() => {
      // Esta ação será executada após o login/registro
      window.location.href = '/dashboard';
    }, 'Para acessar o dashboard completo, faça login ou crie sua conta');
  };

  return (
    <div className="min-h-screen bg-gradient-mesh relative overflow-hidden">
      {/* Background Effects */}
      <FloatingParticles count={6} />
      <GradientOrb
        size="lg"
        color="blue"
        className="absolute -top-32 -right-32 opacity-20"
      />
      <GradientOrb
        size="md"
        color="purple"
        className="absolute bottom-32 -left-16 opacity-15"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Hero Section */}
        <div className="text-center mb-16">
          {/* Logo Principal */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="relative">
              <img
                src={Logo}
                alt="NeuroIA Lab"
                className="h-24 md:h-32 lg:h-40 w-auto object-contain drop-shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-neuro-primary/20 to-blue-600/20 rounded-2xl blur-3xl -z-10 animate-pulse"></div>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-slide-up">
            Bem-vindo à Revolução da
            <span className="block bg-gradient-to-r from-neuro-primary via-green-600 to-blue-600 bg-clip-text text-transparent">
              Prática Clínica Digital
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed animate-slide-up delay-200">
            A plataforma mais avançada de assistentes de IA especializados para profissionais da saúde mental.
            <span className="block mt-2 font-medium text-neuro-primary">
              Potencialize sua prática clínica com tecnologia de ponta desenvolvida especificamente para você.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-400">
            <Button
              onClick={handleGetStarted}
              size="lg"
              leftIcon={<Icon name="rocket" className="w-5 h-5" />}
              className="text-lg px-8 py-4 bg-gradient-to-r from-neuro-primary to-green-600 hover:from-neuro-primary-hover hover:to-green-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              Começar Agora
            </Button>
            <Link to="/store">
              <Button
                variant="outline"
                size="lg"
                leftIcon={<Icon name="eye" className="w-5 h-5" />}
                className="text-lg px-8 py-4 border-2 border-neuro-primary text-neuro-primary hover:bg-neuro-primary hover:text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Explorar Assistentes
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 animate-fade-in delay-600">
            <div className="flex items-center gap-2">
              <Icon name="shield" className="w-4 h-4 text-green-500" />
              <span>100% Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="users" className="w-4 h-4 text-blue-500" />
              <span>500+ Profissionais</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="star" className="w-4 h-4 text-yellow-500" />
              <span>Avaliação 4.9/5</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="zap" className="w-4 h-4 text-purple-500" />
              <span>{totalAssistants}+ Assistentes</span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-slide-up">
              Por que escolher o <span className="text-neuro-primary">NeuroIA Lab</span>?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto animate-slide-up delay-200">
              Descubra os recursos que estão transformando a prática clínica de milhares de profissionais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:scale-105 hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:border-neuro-primary/30 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => onAuthAction(() => {}, 'Para acessar todos os recursos, faça login ou crie sua conta')}
              >
                <CardContent className="p-6 text-center relative overflow-hidden">
                  {/* Background Gradient Effect */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                    feature.color === 'blue' && "bg-gradient-to-br from-blue-400 to-blue-600",
                    feature.color === 'green' && "bg-gradient-to-br from-green-400 to-green-600",
                    feature.color === 'purple' && "bg-gradient-to-br from-purple-400 to-purple-600",
                    feature.color === 'orange' && "bg-gradient-to-br from-orange-400 to-orange-600"
                  )} />

                  <div className="relative z-10">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:scale-110",
                      feature.color === 'blue' && "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 group-hover:from-blue-200 group-hover:to-blue-300",
                      feature.color === 'green' && "bg-gradient-to-br from-green-100 to-green-200 text-green-600 group-hover:from-green-200 group-hover:to-green-300",
                      feature.color === 'purple' && "bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 group-hover:from-purple-200 group-hover:to-purple-300",
                      feature.color === 'orange' && "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600 group-hover:from-orange-200 group-hover:to-orange-300"
                    )}>
                      <Icon name={feature.icon as any} className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-neuro-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed group-hover:text-gray-700 transition-colors">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-4">
            Números que <span className="text-neuro-primary">impressionam</span>
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Veja o impacto que estamos causando na vida profissional de psicólogos, psicopedagogos e fonoaudiólogos
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="brain" className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{totalAssistants}+</div>
                <div className="text-blue-700 font-medium">Assistentes Especializados</div>
              </CardContent>
            </Card>

            <Card className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="users" className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">500+</div>
                <div className="text-green-700 font-medium">Profissionais Ativos</div>
              </CardContent>
            </Card>

            <Card className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="message" className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">10k+</div>
                <div className="text-purple-700 font-medium">Sessões Realizadas</div>
              </CardContent>
            </Card>

            <Card className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon name="star" className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">4.9</div>
                <div className="text-orange-700 font-medium">Avaliação Média</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-br from-neuro-primary/10 via-green-50 to-blue-50 border-neuro-primary/30 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <CardContent className="p-8 md:p-12 relative overflow-hidden">
              {/* Background Effects */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-neuro-primary/20 to-transparent rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl"></div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-neuro-primary to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Icon name="rocket" className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Pronto para <span className="text-neuro-primary">revolucionar</span> sua prática?
                </h2>
                <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Junte-se a <span className="font-bold text-neuro-primary">centenas de profissionais</span> que já estão usando NeuroIA Lab
                  para potencializar seus atendimentos e resultados.
                  <span className="block mt-2 text-base">
                    Transforme sua prática profissional e veja a diferença em sua primeira sessão!
                  </span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    leftIcon={<Icon name="user" className="w-5 h-5" />}
                    className="text-lg px-8 py-4 bg-gradient-to-r from-neuro-primary to-green-600 hover:from-neuro-primary-hover hover:to-green-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    Criar Conta
                  </Button>
                  <Link to="/store">
                    <Button
                      variant="outline"
                      size="lg"
                      leftIcon={<Icon name="store" className="w-5 h-5" />}
                      className="text-lg px-8 py-4 border-2 border-neuro-primary text-neuro-primary hover:bg-neuro-primary hover:text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      Ver Assistentes
                    </Button>
                  </Link>
                </div>

                {/* Additional Trust Elements */}
                <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Icon name="shield" className="w-4 h-4 text-green-500" />
                    <span>Dados 100% seguros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="zap" className="w-4 h-4 text-green-500" />
                    <span>Ativação instantânea</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="star" className="w-4 h-4 text-green-500" />
                    <span>Suporte profissional</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};