import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useInstitution } from '../../contexts/InstitutionContext';
import { Icon } from '../../components/ui/Icon';

export const InstitutionPendingApproval: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { institution, userAccess } = useInstitution();

  const handleLogout = async () => {
    await signOut();
    navigate(`/i/${slug}/login`);
  };

  if (!institution) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          {/* Institution Logo */}
          <div className="mb-6">
            {institution.logo_url ? (
              <img
                src={institution.logo_url}
                alt={`${institution.name} Logo`}
                className="h-16 w-auto mx-auto mb-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : (
              <div
                className="h-16 w-16 mx-auto mb-4 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: institution.primary_color }}
              >
                <span className="text-white font-bold text-2xl">
                  {institution.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Status Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
              <Icon name="clock" className="w-10 h-10 text-orange-600" />
            </div>
          </div>

          {/* Main Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Aguardando Aprovação
          </h1>

          <p className="text-gray-600 mb-6">
            Sua conta na <strong>{institution.name}</strong> foi criada com sucesso e está aguardando aprovação do administrador.
          </p>

          {/* Info Cards */}
          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <div className="flex items-start space-x-3">
                <Icon name="info" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">O que acontece agora?</h3>
                  <p className="text-sm text-blue-700">
                    O administrador da instituição irá revisar sua solicitação e aprovar seu acesso aos assistentes de IA.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 text-left">
              <div className="flex items-start space-x-3">
                <Icon name="mail" className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-green-900 mb-1">Como ser notificado?</h3>
                  <p className="text-sm text-green-700">
                    Você receberá um email assim que sua conta for aprovada e poderá acessar todos os recursos.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            {(institution.settings?.contact?.email || institution.settings?.contact?.phone) && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="flex items-start space-x-3">
                  <Icon name="phone" className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Precisa de ajuda?</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {institution.settings?.contact?.email && (
                        <p>Email: {institution.settings.contact.email}</p>
                      )}
                      {institution.settings?.contact?.phone && (
                        <p>Telefone: {institution.settings.contact.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Sua Conta</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Status:</span> Aguardando aprovação</p>
              <p><span className="font-medium">Papel:</span> {userAccess?.role === 'student' ? 'Estudante' : 'Usuário'}</p>
              <p><span className="font-medium">Solicitado em:</span> {userAccess?.joined_at ? new Date(userAccess.joined_at).toLocaleDateString('pt-BR') : 'Hoje'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Fazer Logout
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <Icon name="refresh" className="w-4 h-4 mr-2 inline" />
              Verificar Status
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Tempo estimado de aprovação: 1-2 dias úteis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};