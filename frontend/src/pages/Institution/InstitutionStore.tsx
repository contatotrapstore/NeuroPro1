import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { AssistantIcon } from '../../components/ui/AssistantIcon';
import { Icon } from '../../components/ui/Icon';
import { Input } from '../../components/ui/Input';
import { cn } from '../../utils/cn';

export const InstitutionStore: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { institution, availableAssistants, isInstitutionUser } = useInstitution();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!institution) return null;

  // Filtrar assistentes baseado na busca e categoria
  const filteredAssistants = availableAssistants.filter(assistant => {
    const matchesSearch = assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assistant.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
                           (selectedCategory === 'simulator' && assistant.is_simulator) ||
                           (selectedCategory === 'primary' && assistant.is_primary);

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'Todos', count: availableAssistants.length },
    { id: 'simulator', name: 'Simuladores', count: availableAssistants.filter(a => a.is_simulator).length },
    { id: 'primary', name: 'Principais', count: availableAssistants.filter(a => a.is_primary).length }
  ];

  const featuredAssistant = availableAssistants.find(a => a.is_simulator) || availableAssistants[0];

  // Função para lidar com ações que exigem autenticação
  const handleAuthRequiredAction = (targetPath: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!user || !isInstitutionUser) {
      // Salvar URL de destino e redirecionar para login
      const returnUrl = encodeURIComponent(targetPath);
      navigate(`/i/${slug}/login?returnUrl=${returnUrl}`);
      return;
    }

    // Se já autenticado, navegar normalmente
    navigate(targetPath);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Hero Section */}
      <div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div
          className="px-6 py-10 text-white relative"
          style={{
            background: `linear-gradient(135deg, ${institution.primary_color} 0%, ${institution.secondary_color || institution.primary_color} 100%)`
          }}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-white/10 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '20px 20px'
            }} />
          </div>

          <div className="relative z-10">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Assistentes de IA Especializados
              </h1>
              <p className="text-lg text-white/90 mb-6">
                Descubra e converse com nossos assistentes especializados em psicanálise e formação acadêmica
              </p>

              <div className="flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2">
                  <Icon name="check-circle" className="w-4 h-4" />
                  <span className="text-sm font-medium">{availableAssistants.length} assistentes disponíveis</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2">
                  <Icon name="shield-check" className="w-4 h-4" />
                  <span className="text-sm font-medium">Acesso completo</span>
                </div>
              </div>
            </div>

            {institution.logo_url && (
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2 hidden lg:block">
                <img
                  src={institution.logo_url}
                  alt={`${institution.name} Logo`}
                  className="h-24 w-auto opacity-30"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Assistant */}
      {featuredAssistant && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Assistente em Destaque
                </h2>
                <p className="text-gray-600">
                  Recomendado especialmente para você
                </p>
              </div>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: institution.primary_color }}
              >
                Destaque
              </span>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-l-4"
                 style={{ borderLeftColor: institution.primary_color }}>
              <div className="flex items-start space-x-4">
                <AssistantIcon
                  iconType={featuredAssistant.icon}
                  className="w-16 h-16 flex-shrink-0"
                  color={featuredAssistant.color_theme || institution.primary_color}
                />

                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {featuredAssistant.name}
                    </h3>
                    {featuredAssistant.is_simulator && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        Simulador
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 mb-4">
                    {featuredAssistant.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                      Psicanálise
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                      Prática Clínica
                    </span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                      ABPSI
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleAuthRequiredAction(`/i/${slug}/chat/${featuredAssistant.id}`, e)}
                    className="inline-flex items-center px-6 py-3 rounded-xl text-white font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    style={{
                      backgroundColor: institution.primary_color,
                      boxShadow: `0 4px 15px ${institution.primary_color}30`
                    }}
                  >
                    <Icon name="play" className="w-5 h-5 mr-2" />
                    {user && isInstitutionUser ? 'Iniciar Simulação' : 'Fazer Login para Simular'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar assistentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex space-x-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "px-4 py-2 rounded-lg font-medium transition-colors text-sm",
                  selectedCategory === category.id
                    ? "text-white shadow-md"
                    : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                )}
                style={selectedCategory === category.id ? {
                  backgroundColor: institution.primary_color
                } : {}}
              >
                {category.name}
                <span className={cn(
                  "ml-2 px-2 py-0.5 rounded-full text-xs",
                  selectedCategory === category.id
                    ? "bg-white/20 text-white"
                    : "bg-white text-gray-600"
                )}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assistants Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Todos os Assistentes
            </h2>
            <p className="text-gray-600 mt-1">
              {filteredAssistants.length} {filteredAssistants.length === 1 ? 'assistente encontrado' : 'assistentes encontrados'}
            </p>
          </div>
        </div>

        {filteredAssistants.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="search-x" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum assistente encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Tente ajustar os filtros ou termos de busca
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: institution.primary_color }}
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssistants.map((assistant) => (
              <div
                key={assistant.id}
                onClick={(e) => handleAuthRequiredAction(`/i/${slug}/chat/${assistant.id}`, e)}
                className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-center mb-4">
                  <AssistantIcon
                    iconType={assistant.icon}
                    className="w-12 h-12 mr-4 flex-shrink-0"
                    color={assistant.color_theme || institution.primary_color}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {assistant.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {assistant.is_primary && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                          Principal
                        </span>
                      )}
                      {assistant.is_simulator && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium">
                          Simulador
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {assistant.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {user && isInstitutionUser ? 'Clique para conversar' : 'Login necessário'}
                  </span>
                  <Icon
                    name={user && isInstitutionUser ? "arrow-right" : "lock"}
                    className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};