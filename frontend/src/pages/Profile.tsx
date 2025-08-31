import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  profession: string;
  crp: string;
  specialties: string[];
}

const specialtyOptions = [
  'Psicologia Clínica',
  'Neuropsicologia',
  'Psicoterapia Cognitivo-Comportamental',
  'Psicologia Hospitalar',
  'Psicologia do Esporte',
  'Psicologia Organizacional',
  'Psicologia Educacional',
  'Psicologia Social',
  'Terapia de Casal e Família',
  'Psicologia Infantil',
  'Gerontopsicologia',
  'Psicologia Forense'
];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    profession: '',
    crp: '',
    specialties: []
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'personal'>('personal');

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.user_metadata?.name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        profession: user.user_metadata?.profession || '',
        crp: user.user_metadata?.crp || '',
        specialties: user.user_metadata?.specialties || []
      }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleSpecialtyToggle = (specialty: string) => {
    setProfile(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage(null);

      // Update Supabase user metadata
      const { error } = await updateProfile({
        name: profile.name,
        phone: profile.phone,
        profession: profile.profession,
        crp: profile.crp,
        specialties: profile.specialties
      });

      if (error) {
        throw error;
      }

      // TODO: Save notifications and preferences to database
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar perfil' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Informações Pessoais', icon: '👤' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-4">👤</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Meu Perfil
        </h1>
        <p className="text-xl text-gray-600">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className="text-lg mr-2">
              {message.type === 'success' ? '✅' : '❌'}
            </div>
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-neuro-primary text-neuro-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSave} className="p-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Para alterar seu email, entre em contato com o suporte
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profissão
                  </label>
                  <input
                    type="text"
                    value={profile.profession}
                    onChange={(e) => handleInputChange('profession', e.target.value)}
                    placeholder="Ex: Psicólogo(a) Clínico(a)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número do CRP
                  </label>
                  <input
                    type="text"
                    value={profile.crp}
                    onChange={(e) => handleInputChange('crp', e.target.value)}
                    placeholder="Ex: 06/123456"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-neuro-primary focus:border-neuro-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Opcional - ajuda a personalizar as recomendações dos assistentes
                  </p>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Especialidades
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {specialtyOptions.map((specialty) => (
                    <label
                      key={specialty}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        profile.specialties.includes(specialty)
                          ? 'border-neuro-primary bg-neuro-primary bg-opacity-5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={profile.specialties.includes(specialty)}
                        onChange={() => handleSpecialtyToggle(specialty)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
                        profile.specialties.includes(specialty)
                          ? 'border-neuro-primary bg-neuro-primary'
                          : 'border-gray-300'
                      }`}>
                        {profile.specialties.includes(specialty) && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                      <span className="text-sm">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-neuro-primary text-white rounded-lg hover:bg-neuro-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
            >
              {saving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-4">⚠️ Zona de Perigo</h3>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Cancelar Todas as Assinaturas</h4>
              <p className="text-sm text-gray-600">
                Cancela todas suas assinaturas ativas imediatamente
              </p>
            </div>
            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
              Cancelar Todas
            </button>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Excluir Conta</h4>
              <p className="text-sm text-gray-600">
                Remove permanentemente sua conta e todos os dados associados
              </p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
              Excluir Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}