import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { cn } from '../../utils/cn';
import { Bot, Sparkles, Users, BookOpen, TrendingUp, ArrowRight, Play } from 'lucide-react';

export const InstitutionHome: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    institution,
    userAccess,
    availableAssistants,
    getPrimaryAssistant,
    getSimulatorAssistant,
    isInstitutionUser,
    loading
  } = useInstitution();

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!loading && !user) {
      navigate(`/i/${slug}/login`);
    }
  }, [user, loading, navigate, slug]);

  // Redirecionar para verificar acesso se necessário
  useEffect(() => {
    if (user && institution && !isInstitutionUser && !loading) {
      // Usuário logado mas sem acesso à instituição
      navigate(`/i/${slug}/login`);
    }
  }, [user, institution, isInstitutionUser, loading, navigate, slug]);

  if (loading || !institution || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" color={institution?.primary_color} />
          <p className="mt-4 text-gray-600">Carregando portal...</p>
        </div>
      </div>
    );
  }

  if (!isInstitutionUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-10 text-center border border-yellow-200">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-yellow-100 flex items-center justify-center">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Acesso Restrito
            </h1>
            <p className="text-gray-600 mb-8">
              Você não tem acesso ao portal da {institution.name}.
            </p>
            <button
              onClick={() => navigate(`/i/${slug}/login`)}
              className="inline-block px-6 py-3 text-white rounded-lg transition-colors"
              style={{ backgroundColor: institution.primary_color }}
            >
              Fazer Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryAssistant = getPrimaryAssistant();
  const simulatorAssistant = getSimulatorAssistant();

  const handleStartChat = (assistantId?: string) => {
    const targetAssistant = assistantId || primaryAssistant?.id;
    if (targetAssistant) {
      navigate(`/i/${slug}/chat/${targetAssistant}`);
    } else {
      navigate(`/i/${slug}/chat`);
    }
  };

  const handleStartSimulator = () => {
    if (simulatorAssistant) {
      navigate(`/i/${slug}/chat/${simulatorAssistant.id}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              {institution.logo_url ? (
                <img
                  src={institution.logo_url}
                  alt={`${institution.name} Logo`}
                  className="h-20 w-auto"
                />
              ) : (
                <div
                  className="h-20 w-20 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: institution.primary_color }}
                >
                  <span className="text-white font-bold text-3xl">
                    {institution.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {institution.custom_message || `Bem-vindo à ${institution.name}`}
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Plataforma de Inteligência Artificial para Formação Psicanalítica
            </p>

            <div className="flex items-center justify-center mb-6">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                <Users className="w-4 h-4 inline mr-2" />
                {userAccess?.role === 'student' && 'Estudante'}
                {userAccess?.role === 'teacher' && 'Professor'}
                {userAccess?.role === 'subadmin' && 'Administrador'}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Chat Principal */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-l-4" style={{ borderLeftColor: institution.primary_color }}>
              <div className="flex items-center mb-4">
                <Bot className="w-8 h-8 mr-3" style={{ color: institution.primary_color }} />
                <h3 className="text-xl font-bold text-gray-900">
                  {primaryAssistant ? primaryAssistant.name : 'Chat com IA'}
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                {primaryAssistant
                  ? primaryAssistant.description
                  : 'Converse com nossos assistentes de IA especializados'
                }
              </p>
              <button
                onClick={() => handleStartChat()}
                className="flex items-center px-6 py-3 text-white rounded-xl font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  backgroundColor: institution.primary_color,
                  boxShadow: `0 4px 15px ${institution.primary_color}30`
                }}
              >
                Iniciar Conversa
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            </div>

            {/* Simulador de Psicanálise - Destaque Principal */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-8 border-l-4" style={{ borderLeftColor: institution.primary_color }}>
              <div className="flex items-center mb-4">
                <Play className="w-8 h-8 mr-3" style={{ color: institution.primary_color }} />
                <h3 className="text-xl font-bold text-gray-900">
                  Simulador de Psicanálise ABPSI
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                Simulador interativo para prática de sessões psicanalíticas. Atue como analisando em diferentes cenários clínicos e desenvolva suas habilidades terapêuticas em um ambiente seguro e controlado.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  Neurose Obsessiva
                </span>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  Histeria
                </span>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  Estrutura Borderline
                </span>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  + outros cenários
                </span>
              </div>
              <button
                onClick={() => handleStartChat('asst_9vDTodTAQIJV1mu2xPzXpBs8')}
                className="flex items-center px-6 py-3 text-white rounded-xl font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  backgroundColor: institution.primary_color,
                  boxShadow: `0 4px 15px ${institution.primary_color}30`
                }}
              >
                Iniciar Simulação
                <Sparkles className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Assistentes Disponíveis */}
      {availableAssistants.length > 1 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Assistentes Especializados
              </h2>
              <p className="text-lg text-gray-600">
                Escolha o assistente mais adequado para sua necessidade
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableAssistants.map((assistant) => (
                <div
                  key={assistant.id}
                  className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="flex items-center mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
                      style={{ backgroundColor: assistant.color_theme + '20' }}
                    >
                      <span className="text-2xl">{assistant.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{assistant.name}</h3>
                      {assistant.is_primary && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Principal
                        </span>
                      )}
                      {assistant.is_simulator && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          Simulador
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {assistant.description}
                  </p>

                  <button
                    onClick={() => handleStartChat(assistant.id)}
                    className="w-full py-2 px-4 rounded-lg font-medium transition-colors hover:shadow-md"
                    style={{
                      backgroundColor: assistant.color_theme + '15',
                      color: assistant.color_theme,
                      border: `1px solid ${assistant.color_theme}30`
                    }}
                  >
                    Conversar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Estatísticas/Status */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Sua Atividade
            </h3>

            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div className="p-6">
                <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: institution.primary_color }} />
                <h4 className="font-bold text-gray-900 mb-2">Sessões</h4>
                <p className="text-3xl font-bold" style={{ color: institution.primary_color }}>
                  --
                </p>
                <p className="text-sm text-gray-600">Total realizadas</p>
              </div>

              <div className="p-6">
                <TrendingUp className="w-8 h-8 mx-auto mb-3" style={{ color: institution.primary_color }} />
                <h4 className="font-bold text-gray-900 mb-2">Progresso</h4>
                <p className="text-3xl font-bold" style={{ color: institution.primary_color }}>
                  --
                </p>
                <p className="text-sm text-gray-600">Horas de estudo</p>
              </div>

              <div className="p-6">
                <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: institution.primary_color }} />
                <h4 className="font-bold text-gray-900 mb-2">Licença</h4>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Ativa
                </div>
                <p className="text-sm text-gray-600 mt-1">Acesso ilimitado</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              Links Úteis
            </h3>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate(`/i/${slug}/subscription`)}
                className="px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                Ver Licença
              </button>

              {userAccess?.is_admin && (
                <button
                  onClick={() => navigate(`/i/${slug}/admin`)}
                  className="px-6 py-3 text-white rounded-lg transition-colors"
                  style={{ backgroundColor: institution.primary_color }}
                >
                  Painel Admin
                </button>
              )}

              {institution.website_url && (
                <a
                  href={institution.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  Website ABPSI
                </a>
              )}

              <a
                href={`mailto:${institution.contact_email}`}
                className="px-6 py-3 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                Contato
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};