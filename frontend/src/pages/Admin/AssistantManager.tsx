import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Icon } from '../../components/ui/Icon';
import { Card, CardContent } from '../../components/ui/Card';
import { AssistantIcon } from '../../components/ui/AssistantIcon';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { ErrorState } from '../../components/ui/ErrorState';
import { AssistantEditor } from './AssistantEditor';
import { ApiService } from '../../services/api.service';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

interface Assistant {
  id: string;
  name: string;
  description: string;
  full_description?: string;
  icon: string;
  icon_url?: string;
  icon_type?: 'svg' | 'image' | 'emoji';
  color_theme: string;
  area: 'Psicologia' | 'Psicopedagogia' | 'Fonoaudiologia';
  monthly_price: number;
  semester_price: number;
  is_active: boolean;
  subscription_count?: number;
  total_conversations?: number;
  last_used_at?: string;
  created_at: string;
  updated_at?: string;
  openai_assistant_id?: string;
  specialization?: string;
  features?: string[];
  order_index?: number;
}

interface AssistantStats {
  subscriptionCount: number;
  conversationCount: number;
  monthlyRevenue: number;
  recentActivity: number;
  lastUsed?: string;
}

export function AssistantManager() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [assistantStats, setAssistantStats] = useState<Record<string, AssistantStats>>({});
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});

  const apiService = ApiService.getInstance();

  useEffect(() => {
    console.log('🚀 AssistantManager montado! Carregando dados...');
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      console.log('📥 Carregando assistentes do admin...');
      setLoading(true);
      setError(null);
      
      const result = await apiService.get('/admin/assistants');
      console.log('📥 Resultado da API:', result);
      
      if (result.success) {
        console.log('✅ Assistentes carregados:', result.data?.length || 0);
        setAssistants(result.data || []);
      } else {
        console.error('❌ Erro da API:', result.error);
        
        // Handle specific errors
        if (result.error?.includes('Service Role Key')) {
          setError('⚠️ Service Role Key não configurada. Configure no arquivo .env e no Vercel para acessar o admin.');
        } else if (result.error?.includes('Acesso negado')) {
          setError('❌ Acesso negado. Verifique se você tem privilégios de administrador.');
        } else {
          setError(result.error || 'Erro ao carregar assistentes');
        }
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar assistentes:', error);
      setError('Erro ao carregar assistentes');
    } finally {
      setLoading(false);
    }
  };

  const loadAssistantStats = async (assistantId: string) => {
    if (loadingStats[assistantId] || assistantStats[assistantId]) return;

    try {
      setLoadingStats(prev => ({ ...prev, [assistantId]: true }));
      
      const result = await apiService.get(`/admin/assistants/${assistantId}/stats`);
      
      if (result.success) {
        setAssistantStats(prev => ({
          ...prev,
          [assistantId]: result.data
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoadingStats(prev => ({ ...prev, [assistantId]: false }));
    }
  };

  const handleToggleStatus = async (assistant: Assistant) => {
    try {
      console.log('🔄 Alterando status do assistente:', assistant.name, 'de', assistant.is_active, 'para', !assistant.is_active);
      
      const result = await apiService.put(`/admin/assistants/${assistant.id}`, {
        is_active: !assistant.is_active
      });

      console.log('🔄 Resultado toggle:', result);

      if (result.success) {
        setAssistants(prev => prev.map(a => 
          a.id === assistant.id 
            ? { ...a, is_active: !a.is_active }
            : a
        ));
        toast.success(
          assistant.is_active 
            ? 'Assistente desativado com sucesso!' 
            : 'Assistente ativado com sucesso!'
        );
      } else {
        console.error('❌ Erro no toggle:', result.error);
        
        if (result.error?.includes('Service Role Key')) {
          toast.error('Service Role Key não configurada - verifique configurações');
        } else {
          toast.error(result.error || 'Erro ao atualizar assistente');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar assistente:', error);
      toast.error('Erro ao atualizar assistente');
    }
  };

  const handleEdit = (assistant: Assistant) => {
    console.log('🔧 Editando assistente:', assistant.name, assistant.id);
    
    // Clean assistant object to remove only calculated fields
    const {
      subscription_count,
      total_conversations,
      last_used_at,
      stats, // Remove stats field that's added locally
      ...cleanAssistant
    } = assistant;
    
    setEditingAssistant(cleanAssistant);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingAssistant(null);
    setShowEditor(true);
  };

  const handleDelete = async (assistant: Assistant) => {
    if (!confirm(`Tem certeza que deseja excluir o assistente "${assistant.name}"?`)) {
      return;
    }

    try {
      console.log('🗑️ Tentando excluir assistente:', assistant.id, assistant.name);
      
      const result = await apiService.delete(`/admin/assistants/${assistant.id}`);
      
      console.log('🗑️ Resultado da exclusão:', result);

      if (result.success) {
        console.log('✅ Assistente excluído com sucesso, recarregando lista...');
        await loadAssistants(); // Reload to get updated list
        toast.success('Assistente excluído com sucesso!');
      } else {
        console.error('❌ Erro na exclusão:', result.error);
        toast.error(result.error || 'Erro ao excluir assistente');
      }
    } catch (error: any) {
      console.error('❌ Erro ao excluir assistente:', error);
      console.error('❌ Error details:', error.message, error.stack);
      toast.error(`Erro ao excluir assistente: ${error.message}`);
    }
  };

  const handleEditorClose = async (saved: boolean) => {
    setShowEditor(false);
    setEditingAssistant(null);
    
    if (saved) {
      await loadAssistants(); // Reload assistants after save
    }
  };


  // Filter assistants
  const filteredAssistants = assistants.filter(assistant => {
    const matchesSearch = assistant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assistant.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = selectedArea === 'all' || assistant.area === selectedArea;
    
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && assistant.is_active) ||
                         (selectedStatus === 'inactive' && !assistant.is_active);
    
    return matchesSearch && matchesArea && matchesStatus;
  });

  // Sort assistants by order_index, then by name
  const sortedAssistants = filteredAssistants.sort((a, b) => {
    if (a.order_index !== undefined && b.order_index !== undefined) {
      return a.order_index - b.order_index;
    }
    return a.name.localeCompare(b.name);
  });

  if (loading) {
    return <PageLoader message="Carregando assistentes..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar assistentes"
        message={error}
        onRetry={loadAssistants}
        retryText="Tentar Novamente"
        icon={<Icon name="alertCircle" className="w-12 h-12 text-red-500" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Assistentes</h1>
          <p className="text-gray-600">Controle total sobre todos os assistentes da plataforma</p>
        </div>
        <Button 
          onClick={handleCreate}
          className="bg-neuro-primary hover:bg-neuro-primary-hover"
          leftIcon={<Icon name="plus" className="w-4 h-4 text-white" />}
        >
          Nova IA
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de IAs</p>
                <p className="text-2xl font-bold">{assistants.length}</p>
              </div>
              <Icon name="brain" className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">IAs Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {assistants.filter(a => a.is_active).length}
                </p>
              </div>
              <Icon name="checkCircle" className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Psicologia</p>
                <p className="text-2xl font-bold">
                  {assistants.filter(a => a.area === 'Psicologia').length}
                </p>
              </div>
              <Icon name="brain" className="w-8 h-8 text-neuro-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Psicopedagogia</p>
                <p className="text-2xl font-bold text-blue-600">
                  {assistants.filter(a => a.area === 'Psicopedagogia').length}
                </p>
              </div>
              <Icon name="book" className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Buscar assistentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Icon name="search" className="w-4 h-4" />}
              />
            </div>
            
            <div>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary"
              >
                <option value="all">Todas as áreas</option>
                <option value="Psicologia">Psicologia</option>
                <option value="Psicopedagogia">Psicopedagogia</option>
                <option value="Fonoaudiologia">Fonoaudiologia</option>
              </select>
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary"
              >
                <option value="all">Todos os status</option>
                <option value="active">Apenas ativas</option>
                <option value="inactive">Apenas inativas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assistants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(() => {
          console.log('🎨 Renderizando assistentes:', sortedAssistants.length, 'filtrados de', assistants.length);
          return null;
        })()}
        {sortedAssistants.map((assistant, index) => {
          const stats = assistantStats[assistant.id];
          
          return (
            <motion.div
              key={assistant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Card 
                className={cn(
                  "relative overflow-hidden transition-all duration-200",
                  assistant.is_active 
                    ? "border-l-4 border-l-green-500" 
                    : "border-l-4 border-l-gray-300"
                )}
                hover="lift"
              >
                <CardContent className="p-8">
                  {/* Header with icon and status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: assistant.color_theme }}
                      >
                        {assistant.icon_url && assistant.icon_type === 'image' ? (
                          <img 
                            src={assistant.icon_url} 
                            alt={assistant.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <AssistantIcon 
                            iconType={assistant.icon} 
                            color="white" 
                            size={20} 
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{assistant.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            assistant.area === 'Psicologia' && "bg-green-100 text-green-800",
                            assistant.area === 'Psicopedagogia' && "bg-blue-100 text-blue-800",
                            assistant.area === 'Fonoaudiologia' && "bg-purple-100 text-purple-800"
                          )}>
                            {assistant.area}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        assistant.is_active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-600"
                      )}>
                        {assistant.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                      
                      <button
                        onClick={() => loadAssistantStats(assistant.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Carregar estatísticas"
                      >
                        <Icon 
                          name={loadingStats[assistant.id] ? "loader" : "barChart"} 
                          className={cn(
                            "w-4 h-4 text-gray-500",
                            loadingStats[assistant.id] && "animate-spin"
                          )} 
                        />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {assistant.description}
                  </p>

                  {/* Stats */}
                  {stats && (
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-bold text-neuro-primary">{stats.subscriptionCount}</p>
                        <p className="text-xs text-gray-600">Assinaturas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{stats.conversationCount}</p>
                        <p className="text-xs text-gray-600">Conversas</p>
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 mb-1">Plano Mensal</p>
                        <p className="text-xl font-bold text-green-600">R$ {assistant.monthly_price.toFixed(2)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-700 mb-1">Plano Semestral</p>
                        <p className="text-xl font-bold text-blue-600">R$ {assistant.semester_price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(assistant)}
                      leftIcon={<Icon name="edit" className="w-3 h-3" />}
                      className="w-full"
                    >
                      Editar
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={assistant.is_active ? "outline" : "default"}
                        onClick={() => handleToggleStatus(assistant)}
                        className={cn(
                          "flex-1",
                          assistant.is_active 
                            ? "text-red-600 border-red-200 hover:bg-red-50" 
                            : "bg-green-600 hover:bg-green-700 text-white"
                        )}
                      >
                        {assistant.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(assistant)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        title="Excluir assistente"
                      >
                        <Icon name="trash" className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedAssistants.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Icon name="search" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum assistente encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Tente ajustar os filtros ou criar um novo assistente
            </p>
            <Button 
              onClick={handleCreate}
              leftIcon={<Icon name="plus" className="w-4 h-4 text-white" />}
            >
              Criar Nova IA
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Assistant Editor Modal */}
      {showEditor && (
        <AssistantEditor
          assistant={editingAssistant}
          onClose={handleEditorClose}
        />
      )}
    </div>
  );
}