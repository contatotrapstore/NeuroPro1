import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Icon } from '../../components/ui/Icon';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { AssistantIcon } from '../../components/ui/AssistantIcon';
import { ApiService } from '../../services/api.service';
import { cn } from '../../utils/cn';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

// Field length limits (must match backend limits)
const FIELD_LIMITS = {
  id: 100,
  name: 100,
  area: 50,
  icon: 50,
  color_theme: 30,
  icon_type: 10,
  specialization: 100,
  description: 1000,
  full_description: 5000
};

// Character counter component
const CharacterCounter = ({ current, max, className = '' }: { current: number; max: number; className?: string }) => {
  const remaining = max - current;
  const isNearLimit = remaining < max * 0.1; // 10% remaining
  const isOverLimit = remaining < 0;

  return (
    <div className={cn(
      'text-xs mt-1 text-right',
      isOverLimit ? 'text-red-600 font-medium' :
      isNearLimit ? 'text-amber-600' : 'text-gray-500',
      className
    )}>
      {current}/{max} caracteres
      {isOverLimit && (
        <span className="text-red-600 font-medium ml-1">
          (excede em {Math.abs(remaining)})
        </span>
      )}
    </div>
  );
};

// Validation function
const validateField = (field: string, value: string): { isValid: boolean; error?: string } => {
  const limit = FIELD_LIMITS[field as keyof typeof FIELD_LIMITS];
  if (!limit) return { isValid: true };

  if (value.length > limit) {
    return {
      isValid: false,
      error: `Campo excede o limite de ${limit} caracteres (atual: ${value.length})`
    };
  }

  return { isValid: true };
};

interface Assistant {
  id: string;
  name: string;
  description: string;
  full_description?: string;
  icon: string;
  icon_url?: string;
  icon_type?: 'svg' | 'image' | 'emoji';
  color_theme: string;
  area: 'Psicologia' | 'Psicopedagogia' | 'Fonoaudiologia' | 'Neuromodulação' | 'Terapia Ocupacional';
  monthly_price: number;
  semester_price: number;
  is_active: boolean;
  openai_assistant_id?: string;
  specialization?: string;
  features?: string[];
  order_index?: number;
}

interface AssistantEditorProps {
  assistant: Assistant | null;
  onClose: (saved: boolean) => void;
}

const PREDEFINED_ICONS = [
  // Ícones especializados para psicologia/saúde mental
  { id: 'psychology-brain', name: 'Cérebro Psicanálise', category: 'specialized' },
  { id: 'brain-gear', name: 'Cérebro Cognitivo', category: 'specialized' },
  { id: 'conversation', name: 'Conversa/Terapia', category: 'specialized' },
  { id: 'balance-scale', name: 'Balança Ética', category: 'specialized' },
  { id: 'test-clipboard', name: 'Avaliação', category: 'specialized' },
  { id: 'document-seal', name: 'Laudo/Relatório', category: 'specialized' },
  { id: 'target', name: 'Foco Terapêutico', category: 'specialized' },
  { id: 'family-tree', name: 'Terapia Familiar', category: 'specialized' },
  { id: 'rings', name: 'Terapia Casal', category: 'specialized' },
  { id: 'home-heart', name: 'Acolhimento', category: 'specialized' },
  { id: 'trending-up', name: 'Progresso', category: 'specialized' },

  // Ícones para planejamento e sessões
  { id: 'map-route', name: 'Planejamento', category: 'planning' },
  { id: 'calendar-clock', name: 'Agendamento', category: 'planning' },
  { id: 'compass', name: 'Orientação', category: 'planning' },
  { id: 'clipboard-check', name: 'Checklist', category: 'planning' },

  // Ícones educacionais e desenvolvimento
  { id: 'graduation-brain', name: 'Neuroeducação', category: 'education' },
  { id: 'book-search', name: 'Pesquisa/Base', category: 'education' },
  { id: 'puzzle', name: 'Quebra-cabeça/ABA', category: 'education' },
  { id: 'graduationCap', name: 'Formação', category: 'education' },
  { id: 'book', name: 'Livro', category: 'education' },

  // Ícones básicos úteis
  { id: 'brain', name: 'Cérebro Básico', category: 'basic' },
  { id: 'heart', name: 'Coração', category: 'basic' },
  { id: 'mic', name: 'Comunicação', category: 'basic' },
  { id: 'users', name: 'Grupo/Equipe', category: 'basic' },
  { id: 'shield', name: 'Proteção', category: 'basic' },
  { id: 'star', name: 'Excelência', category: 'basic' },
  { id: 'lightBulb', name: 'Inovação', category: 'basic' },

  // Ícones para gestão e análise
  { id: 'calculator-dollar', name: 'Gestão Financeira', category: 'business' },
];

const PREDEFINED_COLORS = [
  '#0E1E03', '#2D5A1F', '#1A3A0F', '#4A9A3F', '#10B981',
  '#1E40AF', '#3B82F6', '#06B6D4', '#8B5CF6', '#A855F7',
  '#DC2626', '#EF4444', '#F59E0B', '#F97316', '#EC4899'
];

export function AssistantEditor({ assistant, onClose }: AssistantEditorProps) {
  const [formData, setFormData] = useState<Partial<Assistant>>({
    name: '',
    description: '',
    full_description: '',
    icon: 'brain',
    icon_type: 'svg',
    color_theme: '#2D5A1F',
    area: 'Psicologia',
    monthly_price: 39.90,
    semester_price: 199.00,
    is_active: true,
    openai_assistant_id: '',
    specialization: '',
    features: [],
    order_index: 0,
    ...assistant
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [pendingImage, setPendingImage] = useState<{ base64: string; fileName: string } | null>(null);

  const apiService = ApiService.getInstance();

  const isEditing = Boolean(assistant?.id);

  const handleInputChange = (field: keyof Assistant, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use PNG, JPG ou SVG.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return;
    }

    try {
      setUploading(true);

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Generate filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `assistant-${Date.now()}.${fileExtension}`;

      // Store image for later upload after assistant creation
      setPendingImage({ base64, fileName });

      // Update form data to show image will be used
      setFormData(prev => ({
        ...prev,
        icon_type: 'image'
      }));

      toast.success('Imagem selecionada! Será enviada após criar o assistente.');

    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Erro ao processar arquivo de imagem');
    } finally {
      setUploading(false);
    }
  };

  const uploadPendingImage = async (assistantId: string): Promise<void> => {
    if (!pendingImage) return;

    try {
      // Get proper auth token from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        toast.error('Erro de autenticação. Faça login novamente.');
        return;
      }

      // Update filename with actual assistant ID
      const fileExtension = pendingImage.fileName.split('.').pop();
      const fileName = `assistant-${assistantId}-${Date.now()}.${fileExtension}`;

      // Upload via simplified base64 endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/upload-simple`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            imageBase64: pendingImage.base64,
            fileName: fileName,
            assistantId: assistantId
          })
        }
      );

      const result = await response.json();

      if (result.success) {
        // Clear pending image
        setPendingImage(null);
        toast.success('Imagem do assistente enviada com sucesso!');
      } else {
        console.error('Upload failed:', result);
        toast.error(result.error || 'Erro ao fazer upload da imagem');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro inesperado ao fazer upload da imagem');
    }
  };

  const addFeature = () => {
    if (featureInput.trim() && !formData.features?.includes(featureInput.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...(prev.features || []), featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter(f => f !== feature) || []
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.monthly_price || formData.monthly_price <= 0) {
      newErrors.monthly_price = 'Preço mensal deve ser maior que 0';
    }

    if (!formData.semester_price || formData.semester_price <= 0) {
      newErrors.semester_price = 'Preço semestral deve ser maior que 0';
    }

    // ID não é mais obrigatório para novos assistentes - será gerado automaticamente
    // if (!isEditing && !formData.id?.trim()) {
    //   newErrors.id = 'ID é obrigatório para novo assistente';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    // Validate field lengths
    const fieldErrors: string[] = [];
    Object.keys(FIELD_LIMITS).forEach(field => {
      const value = formData[field as keyof typeof formData];
      if (typeof value === 'string') {
        const validation = validateField(field, value);
        if (!validation.isValid) {
          fieldErrors.push(validation.error!);
        }
      }
    });

    if (fieldErrors.length > 0) {
      toast.error('Erro de validação: ' + fieldErrors.join(', '));
      return;
    }

    try {
      setSaving(true);

      // Filter out only calculated/non-editable fields
      const {
        subscription_count,
        total_conversations,
        last_used_at,
        created_at,
        updated_at,
        created_by,
        updated_by,
        stats, // Remove stats field that might be added locally
        ...editableFields
      } = formData;

      const saveData = {
        ...editableFields,
        features: formData.features || [],
        monthly_price: Number(formData.monthly_price),
        semester_price: Number(formData.semester_price),
        order_index: Number(formData.order_index || 0)
      };

      let result;
      
      if (isEditing) {
        result = await apiService.put(`/admin/assistants/${formData.id}`, saveData);
      } else {
        result = await apiService.post('/admin/assistants', saveData);
      }

      if (result.success) {
        // Se há imagem pendente e foi criado um novo assistente, fazer upload da imagem
        if (pendingImage && !isEditing && result.data?.id) {
          await uploadPendingImage(result.data.id);
        }

        // Invalidar cache para sincronizar com loja e clientes
        apiService.clearCache('assistants');
        apiService.clearCache('/assistants');
        apiService.clearCache(); // Clear all cache for full sync

        toast.success(
          isEditing
            ? 'Assistente atualizado com sucesso!'
            : 'Assistente criado com sucesso!'
        );
        onClose(true);
      } else {
        console.error('API Error:', result);
        const errorMessage = result.error || 'Erro ao salvar assistente';
        
        // Handle specific errors
        if (result.error?.includes('Service Role Key')) {
          toast.error('Erro de configuração: Service Role Key não configurada');
        } else if (result.error?.includes('Acesso negado')) {
          toast.error('Acesso negado: Você precisa ter privilégios de administrador');
        } else if (result.error?.includes('não encontrado')) {
          toast.error('Assistente não encontrado');
        } else {
          toast.error(errorMessage);
        }

        // Show debug info in development
        if (import.meta.env.DEV && result.debug) {
          console.warn('Debug info:', result.debug);
        }
      }
    } catch (error: any) {
      console.error('Save error:', error);
      
      // Handle network errors
      if (error.message?.includes('Failed to fetch')) {
        toast.error('Erro de rede: Verifique sua conexão');
      } else if (error.message?.includes('NetworkError')) {
        toast.error('Erro de rede: Não foi possível conectar ao servidor');
      } else {
        toast.error('Erro inesperado ao salvar assistente');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Assistente' : 'Criar Nova IA'}
            </h2>
            <p className="text-gray-600 mt-1">
              {isEditing ? 'Modifique os dados do assistente' : 'Configure um novo assistente especializado'}
            </p>
          </div>
          <button
            onClick={() => onClose(false)}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <Icon name="x" className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pb-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-1 xl:col-span-2 space-y-6">
              
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Informações Básicas</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isEditing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID do Assistente (opcional)
                      </label>
                      <Input
                        value={formData.id || ''}
                        onChange={(e) => handleInputChange('id', e.target.value)}
                        placeholder="Deixe em branco para gerar automaticamente"
                        error={errors.id}
                        maxLength={FIELD_LIMITS.id}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          Se não fornecido, será gerado automaticamente baseado no nome
                        </p>
                        <CharacterCounter current={formData.id?.length || 0} max={FIELD_LIMITS.id} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nome do assistente"
                      error={errors.name}
                      maxLength={FIELD_LIMITS.name}
                    />
                    <CharacterCounter current={formData.name?.length || 0} max={FIELD_LIMITS.name} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição Curta *
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descrição resumida para exibição na loja"
                      rows={3}
                      maxLength={FIELD_LIMITS.description}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary",
                        errors.description ? "border-red-300" : "border-gray-300"
                      )}
                    />
                    <CharacterCounter current={formData.description?.length || 0} max={FIELD_LIMITS.description} />
                    {errors.description && (
                      <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição Completa
                    </label>
                    <textarea
                      value={formData.full_description || ''}
                      onChange={(e) => handleInputChange('full_description', e.target.value)}
                      placeholder="Descrição detalhada do assistente para o painel administrativo"
                      rows={4}
                      maxLength={FIELD_LIMITS.full_description}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary"
                    />
                    <CharacterCounter current={formData.full_description?.length || 0} max={FIELD_LIMITS.full_description} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Área *
                    </label>
                    <select
                      value={formData.area || 'Psicologia'}
                      onChange={(e) => handleInputChange('area', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary"
                    >
                      <option value="Psicologia">Psicologia</option>
                      <option value="Psicopedagogia">Psicopedagogia</option>
                      <option value="Fonoaudiologia">Fonoaudiologia</option>
                      <option value="Neuromodulação">Neuromodulação</option>
                      <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                    </select>
                  </div>
                </CardContent>
              </Card>


              {/* Technical Settings */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Configurações Técnicas</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OpenAI Assistant ID
                    </label>
                    <Input
                      value={formData.openai_assistant_id || ''}
                      onChange={(e) => handleInputChange('openai_assistant_id', e.target.value)}
                      placeholder="asst_xxxxxxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialização
                    </label>
                    <Input
                      value={formData.specialization || ''}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      placeholder="Ex: Terapia cognitivo-comportamental, Avaliação neuropsicológica"
                      maxLength={FIELD_LIMITS.specialization}
                    />
                    <CharacterCounter current={formData.specialization?.length || 0} max={FIELD_LIMITS.specialization} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordem de Exibição
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.order_index || 0}
                      onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Menor número aparece primeiro na lista
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      className="rounded border-gray-300 text-neuro-primary focus:ring-neuro-primary"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Assistente Ativo
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Características</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adicionar Característica
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        placeholder="Ex: Suporte 24/7, Relatórios detalhados"
                        onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                      />
                      <Button
                        type="button"
                        onClick={addFeature}
                        variant="outline"
                        className="shrink-0"
                      >
                        <Icon name="plus" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {formData.features && formData.features.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Características Atuais
                      </label>
                      <div className="space-y-2">
                        {formData.features.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm">{feature}</span>
                            <button
                              type="button"
                              onClick={() => removeFeature(feature)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Icon name="x" className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing - In main column below Technical Settings */}
              <div className="rounded-2xl border shadow-neuro transition-all duration-300 glass-card p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Icon name="dollarSign" className="w-5 h-5 text-green-600" />
                  Configuração de Preços
                </h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        💰 Preço Mensal (R$) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monthly_price || ''}
                        onChange={(e) => handleInputChange('monthly_price', parseFloat(e.target.value) || 0)}
                        error={errors.monthly_price}
                        className="w-full text-lg font-semibold rounded-xl border-2 focus:border-green-500 focus:ring-green-500/20"
                        placeholder="39.90"
                      />
                      <p className="text-xs text-gray-500">Valor cobrado mensalmente por usuário</p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        💎 Preço Semestral (R$) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.semester_price || ''}
                        onChange={(e) => handleInputChange('semester_price', parseFloat(e.target.value) || 0)}
                        error={errors.semester_price}
                        className="w-full text-lg font-semibold rounded-xl border-2 focus:border-blue-500 focus:ring-blue-500/20"
                        placeholder="199.00"
                      />
                      <p className="text-xs text-gray-500">Valor para pagamento semestral (6 meses)</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Right Column - Visual Settings */}
            <div className="lg:col-span-1 xl:col-span-1 space-y-6">
              
              {/* Icon and Color */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Aparência</h3>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Preview */}
                  <div className="text-center">
                    <div 
                      className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: formData.color_theme }}
                    >
                      {(formData.icon_url && formData.icon_type === 'image') || pendingImage ? (
                        <img
                          src={pendingImage ? pendingImage.base64 : formData.icon_url}
                          alt="Preview"
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <AssistantIcon
                          iconType={formData.icon || 'brain'}
                          color="white"
                          size={32}
                        />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Preview</p>
                  </div>

                  {/* Icon Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ícone Personalizado
                    </label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*,.svg"
                        onChange={handleIconUpload}
                        className="hidden"
                        id="icon-upload"
                        disabled={false}
                      />
                      <label
                        htmlFor="icon-upload"
                        className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-gray-300 hover:border-neuro-primary hover:bg-neuro-primary/5"
                      >
                        <Icon 
                          name={uploading ? "loader" : "upload"} 
                          className={cn(
                            "w-4 h-4",
                            uploading && "animate-spin"
                          )} 
                        />
                        {uploading ? 'Enviando...' : 'Upload de Ícone'}
                      </label>
                      <p className="text-xs text-gray-500">
                        PNG, JPG ou SVG (max 5MB)
                        {pendingImage && " - Imagem selecionada"}
                      </p>
                    </div>
                  </div>

                  {/* Predefined Icons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ícones Predefinidos
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {PREDEFINED_ICONS.map((iconOption) => (
                        <button
                          key={iconOption.id}
                          type="button"
                          onClick={() => {
                            handleInputChange('icon', iconOption.id);
                            handleInputChange('icon_type', 'svg');
                            handleInputChange('icon_url', '');
                          }}
                          className={cn(
                            "p-3 rounded-lg border-2 transition-all",
                            formData.icon === iconOption.id && formData.icon_type === 'svg'
                              ? "border-neuro-primary bg-neuro-primary/10"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                          title={iconOption.name}
                        >
                          <Icon name={iconOption.id as any} className="w-5 h-5 mx-auto" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor do Tema
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.color_theme || '#2D5A1F'}
                          onChange={(e) => handleInputChange('color_theme', e.target.value)}
                          className="w-12 h-8 rounded border border-gray-300"
                        />
                        <Input
                          value={formData.color_theme || '#2D5A1F'}
                          onChange={(e) => handleInputChange('color_theme', e.target.value)}
                          className="flex-1 font-mono text-sm"
                          maxLength={FIELD_LIMITS.color_theme}
                        />
                      </div>

                      <CharacterCounter current={formData.color_theme?.length || 0} max={FIELD_LIMITS.color_theme} />

                      <div className="grid grid-cols-5 gap-2">
                        {PREDEFINED_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleInputChange('color_theme', color)}
                            className={cn(
                              "w-full h-8 rounded border-2 transition-all",
                              formData.color_theme === color
                                ? "border-gray-800 scale-110"
                                : "border-gray-200 hover:border-gray-400"
                            )}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            leftIcon={saving ? <Icon name="loader" className="w-4 h-4 animate-spin" /> : undefined}
            className="bg-neuro-primary hover:bg-neuro-primary-hover"
          >
            {saving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Assistente')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}