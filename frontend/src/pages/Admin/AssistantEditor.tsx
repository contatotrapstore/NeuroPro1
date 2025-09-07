import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Icon } from '../../components/ui/Icon';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { AssistantIcon } from '../../components/ui/AssistantIcon';
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
  { id: 'brain', name: 'Cérebro', category: 'medical' },
  { id: 'heart', name: 'Coração', category: 'medical' },
  { id: 'book', name: 'Livro', category: 'education' },
  { id: 'graduation-cap', name: 'Capelo', category: 'education' },
  { id: 'mic', name: 'Microfone', category: 'communication' },
  { id: 'users', name: 'Usuários', category: 'social' },
  { id: 'target', name: 'Alvo', category: 'business' },
  { id: 'compass', name: 'Bússola', category: 'navigation' },
  { id: 'shield', name: 'Escudo', category: 'security' },
  { id: 'star', name: 'Estrela', category: 'misc' },
  { id: 'lightbulb', name: 'Lâmpada', category: 'misc' },
  { id: 'puzzle', name: 'Quebra-cabeça', category: 'misc' },
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

    if (!formData.id && isEditing) {
      toast.error('Salve o assistente primeiro antes de fazer upload do ícone.');
      return;
    }

    try {
      setUploading(true);
      
      const uploadFormData = new FormData();
      uploadFormData.append('icon', file);

      // Upload via our custom endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/upload/assistant-icon/${formData.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
          },
          body: uploadFormData
        }
      );

      const result = await response.json();

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          icon_url: result.data.iconUrl,
          icon_type: 'image'
        }));
        toast.success('Ícone atualizado com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao fazer upload do ícone');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao fazer upload do ícone');
    } finally {
      setUploading(false);
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

    try {
      setSaving(true);

      const saveData = {
        ...formData,
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              
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
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Se não fornecido, será gerado automaticamente baseado no nome
                      </p>
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
                    />
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
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary",
                        errors.description ? "border-red-300" : "border-gray-300"
                      )}
                    />
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
                      placeholder="Descrição detalhada para o painel admin"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Especialização
                      </label>
                      <Input
                        value={formData.specialization || ''}
                        onChange={(e) => handleInputChange('specialization', e.target.value)}
                        placeholder="Área específica"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Características</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        placeholder="Digite uma característica"
                        onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                      />
                      <Button
                        type="button"
                        onClick={addFeature}
                        leftIcon={<Icon name="plus" className="w-4 h-4" />}
                      >
                        Adicionar
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formData.features?.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-neuro-primary/10 text-neuro-primary rounded-full text-sm"
                        >
                          {feature}
                          <button
                            onClick={() => removeFeature(feature)}
                            className="hover:text-red-600"
                          >
                            <Icon name="x" className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ordem de Exibição
                      </label>
                      <Input
                        type="number"
                        value={formData.order_index || 0}
                        onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 0)}
                        min={0}
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
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
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Visual Settings */}
            <div className="space-y-6">
              
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
                      {formData.icon_url && formData.icon_type === 'image' ? (
                        <img 
                          src={formData.icon_url} 
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
                        disabled={!formData.id && isEditing}
                      />
                      <label
                        htmlFor="icon-upload"
                        className={cn(
                          "flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                          (!formData.id && isEditing)
                            ? "border-gray-200 text-gray-400 cursor-not-allowed" 
                            : "border-gray-300 hover:border-neuro-primary hover:bg-neuro-primary/5"
                        )}
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
                        {(!formData.id && isEditing) && " - Salve primeiro"}
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
                        />
                      </div>
                      
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

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Preços</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço Mensal (R$) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.monthly_price || ''}
                      onChange={(e) => handleInputChange('monthly_price', parseFloat(e.target.value) || 0)}
                      error={errors.monthly_price}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço Semestral (R$) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.semester_price || ''}
                      onChange={(e) => handleInputChange('semester_price', parseFloat(e.target.value) || 0)}
                      error={errors.semester_price}
                    />
                  </div>

                  {formData.monthly_price && formData.semester_price && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Economia semestral:</strong>{' '}
                        {((1 - (formData.semester_price / (formData.monthly_price * 6))) * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}
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