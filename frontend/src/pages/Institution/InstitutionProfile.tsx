import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { Icon } from '../../components/ui/Icon';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

interface InstitutionProfileData {
  name: string;
  email: string;
  phone: string;
  profession: string;
  crp: string;
  specialties: string[];
  registration_number?: string;
  department?: string;
  semester?: number;
}

const specialtyOptions = [
  'Psicanálise Clínica',
  'Psicanálise de Crianças',
  'Psicanálise de Adolescentes',
  'Psicanálise Lacaniana',
  'Psicanálise Freudiana',
  'Supervisão Clínica',
  'Formação Analítica',
  'Pesquisa em Psicanálise',
  'Teoria Psicanalítica',
  'Clínica do Trauma',
  'Neurose Obsessiva',
  'Histeria'
];

export const InstitutionProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, updateProfile, updatePassword } = useAuth();
  const { institution, userAccess, isInstitutionUser } = useInstitution();

  const [profile, setProfile] = useState<InstitutionProfileData>({
    name: '',
    email: '',
    phone: '',
    profession: '',
    crp: '',
    specialties: [],
    registration_number: '',
    department: '',
    semester: undefined
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'institution' | 'security'>('personal');

  // Redirect if not authenticated or not institution user
  useEffect(() => {
    if (!user || !isInstitutionUser) {
      navigate(`/i/${slug}/login`);
    }
  }, [user, isInstitutionUser, navigate, slug]);

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.user_metadata?.name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        profession: user.user_metadata?.profession || '',
        crp: user.user_metadata?.crp || '',
        specialties: user.user_metadata?.specialties || [],
        registration_number: userAccess?.registration_number || '',
        department: userAccess?.department || '',
        semester: userAccess?.semester
      }));
    }
  }, [user, userAccess]);

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

      // TODO: Update institution-specific data in institution_users table
      // This would need API integration to update registration_number, department, semester

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar perfil' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 8 caracteres' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const { error } = await updatePassword(passwordData.newPassword);

      if (error) {
        throw error;
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao alterar senha' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Informações Pessoais', icon: 'user' },
    { id: 'institution', label: 'Dados Institucionais', icon: 'graduationCap' },
    { id: 'security', label: 'Segurança', icon: 'lock' }
  ];

  if (!institution) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: institution.primary_color }}
        >
          <Icon name="user" className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Meu Perfil
        </h1>
        <p className="text-xl text-gray-600">
          Gerencie suas informações pessoais e institucionais
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={cn(
          "rounded-lg p-4",
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        )}>
          <div className="flex items-center">
            <Icon
              name={message.type === 'success' ? 'checkCircle' : 'xCircle'}
              className="w-5 h-5 mr-2"
            />
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
                className={cn(
                  "py-4 px-6 border-b-2 font-medium text-sm transition-colors flex items-center",
                  activeTab === tab.id
                    ? 'text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
                style={activeTab === tab.id ? {
                  borderBottomColor: institution.primary_color,
                  color: institution.primary_color
                } : {}}
              >
                <Icon name={tab.icon as any} className="w-4 h-4 mr-2" />
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': institution.primary_color } as React.CSSProperties}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': institution.primary_color } as React.CSSProperties}
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
                    placeholder="Ex: Psicanalista"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': institution.primary_color } as React.CSSProperties}
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': institution.primary_color } as React.CSSProperties}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Opcional - ajuda a personalizar as recomendações dos assistentes
                  </p>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Especialidades em Psicanálise
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {specialtyOptions.map((specialty) => (
                    <label
                      key={specialty}
                      className={cn(
                        "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                        profile.specialties.includes(specialty)
                          ? 'border-gray-400'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                      style={profile.specialties.includes(specialty) ? {
                        borderColor: institution.primary_color,
                        backgroundColor: institution.primary_color + '10'
                      } : {}}
                    >
                      <input
                        type="checkbox"
                        checked={profile.specialties.includes(specialty)}
                        onChange={() => handleSpecialtyToggle(specialty)}
                        className="sr-only"
                      />
                      <div
                        className={cn(
                          "w-4 h-4 rounded border-2 mr-3 flex items-center justify-center",
                          profile.specialties.includes(specialty)
                            ? 'border-gray-400 text-white'
                            : 'border-gray-300'
                        )}
                        style={profile.specialties.includes(specialty) ? {
                          borderColor: institution.primary_color,
                          backgroundColor: institution.primary_color
                        } : {}}
                      >
                        {profile.specialties.includes(specialty) && (
                          <Icon name="check" className="w-3 h-3" />
                        )}
                      </div>
                      <span className="text-sm">{specialty}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Institution Tab */}
          {activeTab === 'institution' && (
            <div className="space-y-6">
              <div
                className="rounded-lg p-4 border"
                style={{
                  backgroundColor: institution.primary_color + '10',
                  borderColor: institution.primary_color + '40'
                }}
              >
                <div className="flex items-start">
                  <Icon name="info" className="w-5 h-5 mt-0.5 mr-3" style={{ color: institution.primary_color }} />
                  <div>
                    <h3 className="font-medium mb-1" style={{ color: institution.primary_color }}>
                      Dados Institucionais
                    </h3>
                    <p className="text-sm" style={{ color: institution.primary_color }}>
                      Estas informações são gerenciadas pela {institution.name}.
                      Para alterações, entre em contato com a administração.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instituição
                  </label>
                  <input
                    type="text"
                    value={institution.name}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Papel na Instituição
                  </label>
                  <input
                    type="text"
                    value={
                      userAccess?.role === 'student' ? 'Estudante' :
                      userAccess?.role === 'professor' ? 'Professor' :
                      userAccess?.role === 'subadmin' ? 'Administrador' :
                      'Não definido'
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Matrícula
                  </label>
                  <input
                    type="text"
                    value={profile.registration_number}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={profile.department}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    disabled
                  />
                </div>

                {userAccess?.role === 'student' && profile.semester && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Semestre Atual
                    </label>
                    <input
                      type="text"
                      value={`${profile.semester}º Semestre`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                      disabled
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div
                className="rounded-lg p-4 border"
                style={{
                  backgroundColor: institution.primary_color + '10',
                  borderColor: institution.primary_color + '40'
                }}
              >
                <div className="flex items-start">
                  <Icon name="lock" className="w-5 h-5 mt-0.5 mr-3" style={{ color: institution.primary_color }} />
                  <div>
                    <h3 className="font-medium mb-1" style={{ color: institution.primary_color }}>
                      Alteração de Senha
                    </h3>
                    <p className="text-sm" style={{ color: institution.primary_color }}>
                      Para sua segurança, confirme sua senha atual e digite uma nova senha com pelo menos 8 caracteres.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual *
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': institution.primary_color } as React.CSSProperties}
                    required
                    placeholder="Digite sua senha atual"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha *
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': institution.primary_color } as React.CSSProperties}
                    required
                    minLength={8}
                    placeholder="Digite sua nova senha (mínimo 8 caracteres)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': institution.primary_color } as React.CSSProperties}
                    required
                    minLength={8}
                    placeholder="Confirme sua nova senha"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="px-6 py-3 text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center"
                  style={{ backgroundColor: institution.primary_color }}
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {saving ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          )}

          {/* Save Button for Personal and Institution Info */}
          {(activeTab === 'personal' || activeTab === 'institution') && (
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving || activeTab === 'institution'}
                className="px-6 py-3 text-white rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center"
                style={{ backgroundColor: institution.primary_color }}
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {activeTab === 'institution' ? 'Somente Leitura' : saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};