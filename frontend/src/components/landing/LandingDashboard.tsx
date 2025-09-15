import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { cn } from '../../utils/cn';
import { FloatingParticles, GradientOrb } from '../ui/AdvancedEffects';

interface LandingDashboardProps {
  onAuthAction: (action: () => void, message: string) => void;
}

export const LandingDashboard: React.FC<LandingDashboardProps> = ({ onAuthAction }) => {
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
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Bem-vindo ao
            <span className="block bg-gradient-to-r from-neuro-primary to-blue-600 bg-clip-text text-transparent">
              NeuroIA Lab
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            A plataforma completa de assistentes de IA especializados para profissionais da saúde mental.
            Potencialize sua prática clínica com tecnologia de ponta.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="text-lg px-8 py-4"
            >
              Começar Agora
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-lg px-8 py-4"
            >
              <Link to="/store">
                Explorar IAs
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Recursos Principais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                variant="glow"
                className="group hover:scale-105 transition-all duration-300 cursor-pointer"
                onClick={() => onAuthAction(() => {}, 'Para acessar todos os recursos, faça login ou crie sua conta')}
              >
                <CardContent className="p-6 text-center">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors",
                    feature.color === 'blue' && "bg-blue-100 text-blue-600 group-hover:bg-blue-200",
                    feature.color === 'green' && "bg-green-100 text-green-600 group-hover:bg-green-200",
                    feature.color === 'purple' && "bg-purple-100 text-purple-600 group-hover:bg-purple-200",
                    feature.color === 'orange' && "bg-orange-100 text-orange-600 group-hover:bg-orange-200"
                  )}>
                    <Icon name={feature.icon as any} className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card variant="glow" className="bg-gradient-to-br from-neuro-primary/5 to-blue-50 border-neuro-primary/20">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Pronto para transformar sua prática?
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Junte-se a centenas de profissionais que já estão usando NeuroIA Lab
                para potencializar seus atendimentos e resultados.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="text-lg px-8 py-4"
                >
                  Criar Conta Grátis
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4"
                >
                  <Link to="/store">
                    Ver Assistentes
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-neuro-primary mb-2">19+</div>
            <div className="text-gray-600">Assistentes Especializados</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-neuro-primary mb-2">500+</div>
            <div className="text-gray-600">Profissionais Ativos</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-neuro-primary mb-2">10k+</div>
            <div className="text-gray-600">Sessões Realizadas</div>
          </div>
        </div>
      </div>
    </div>
  );
};