const { createClient } = require('@supabase/supabase-js');
const { ADMIN_EMAILS, isAdminUser } = require('../../config/admin');
const { applyCors } = require('../../utils/cors');

/**
 * API para geração de relatórios detalhados de instituições
 * Rota: /api/admin/reports/institutions
 */
module.exports = async function handler(req, res) {
  console.log('📊 Institution Reports API v1.0');

  // Apply CORS
  const corsHandled = applyCors(req, res);
  if (corsHandled) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    let userId, userEmail;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.sub;
      userEmail = payload.email;
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Verificar se é admin master
    if (!isAdminUser(userEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso restrito a administradores master'
      });
    }

    const {
      institution_ids,
      report_type = 'summary',
      period = 'month',
      date_range,
      include_audit = false
    } = req.body;

    if (!Array.isArray(institution_ids) || institution_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de instituições é obrigatória'
      });
    }

    console.log(`📊 Generating ${report_type} report for ${institution_ids.length} institutions`);

    // Calcular período de análise
    const endDate = date_range?.end ? new Date(date_range.end) : new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'quarter':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'month':
      default:
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    if (date_range?.start) {
      startDate = new Date(date_range.start);
    }

    // Gerar relatórios para cada instituição
    const reports = await Promise.all(
      institution_ids.map(async (institutionId) => {
        return await generateInstitutionReport(
          supabase,
          institutionId,
          startDate,
          endDate,
          report_type,
          period,
          include_audit
        );
      })
    );

    // Filtrar relatórios válidos
    const validReports = reports.filter(report => report !== null);

    return res.status(200).json({
      success: true,
      data: validReports,
      meta: {
        total_institutions: validReports.length,
        period: period,
        date_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        report_type,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Institution Reports API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// ============================================
// GENERATE INSTITUTION REPORT
// ============================================
async function generateInstitutionReport(supabase, institutionId, startDate, endDate, reportType, period, includeAudit) {
  try {
    // Buscar dados da instituição
    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .select('id, name, slug, is_active, created_at')
      .eq('id', institutionId)
      .single();

    if (instError || !institution) {
      console.error(`Institution not found: ${institutionId}`);
      return null;
    }

    console.log(`📊 Generating report for institution: ${institution.name}`);

    // Buscar usuários da instituição
    const { data: institutionUsers, error: usersError } = await supabase
      .from('institution_users')
      .select('user_id, role, is_active, enrolled_at, last_access')
      .eq('institution_id', institutionId);

    if (usersError) {
      console.error('Error fetching institution users:', usersError);
      return null;
    }

    const allUserIds = (institutionUsers || []).map(u => u.user_id);
    const activeUserIds = (institutionUsers || []).filter(u => u.is_active).map(u => u.user_id);

    // Contagens básicas
    const totalUsers = institutionUsers?.length || 0;
    const activeUsers = activeUserIds.length;

    // Usuários novos no período
    const newUsers = (institutionUsers || []).filter(u =>
      new Date(u.enrolled_at) >= startDate && new Date(u.enrolled_at) <= endDate
    ).length;

    // Simulação de dados de conversas (implementar quando houver tabela real)
    const totalConversations = Math.floor(Math.random() * (activeUsers * 10)) + activeUsers;
    const totalSessions = Math.floor(totalConversations * 0.7);
    const avgSessionDuration = Math.floor(Math.random() * 30) + 15; // 15-45 min

    // Dados de crescimento
    const conversationsGrowth = Math.floor((Math.random() - 0.5) * 40); // -20% to +20%

    // Assistentes mais usados (simulado)
    const { data: institutionAssistants } = await supabase
      .from('institution_assistants')
      .select(`
        custom_name,
        assistants!inner(name)
      `)
      .eq('institution_id', institutionId)
      .eq('is_enabled', true)
      .limit(5);

    const assistantsUsage = (institutionAssistants || []).map((ia, index) => ({
      name: ia.custom_name || ia.assistants.name,
      usage_count: Math.floor(Math.random() * totalConversations * 0.5) + 1,
      percentage: Math.floor(Math.random() * 50) + 10
    }));

    const mostUsedAssistant = assistantsUsage.length > 0 ? assistantsUsage[0].name : 'N/A';

    // Retenção de usuários (simulada)
    const userRetention = Math.floor(Math.random() * 30) + 60; // 60-90%

    // Distribuição de atividade dos usuários
    const userActivityDistribution = {
      very_active: Math.floor(activeUsers * 0.1),
      active: Math.floor(activeUsers * 0.3),
      occasional: Math.floor(activeUsers * 0.4),
      inactive: totalUsers - activeUsers
    };

    // Atividade diária (últimos 7 dias)
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);

      dailyActivity.push({
        date: date.toISOString().split('T')[0],
        conversations: Math.floor(Math.random() * (totalConversations / 7)) + 1,
        active_users: Math.floor(Math.random() * activeUsers) + 1
      });
    }

    // Logs de auditoria (simulados se solicitados)
    let auditLogs = [];
    if (includeAudit) {
      // Na implementação real, buscar logs de uma tabela de auditoria
      auditLogs = await generateMockAuditLogs(institutionId, startDate, endDate, 10);
    }

    // Construir relatório
    const report = {
      institution_id: institutionId,
      institution_name: institution.name,
      institution_slug: institution.slug,
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      stats: {
        total_users: totalUsers,
        active_users: activeUsers,
        new_users: newUsers,
        total_conversations: totalConversations,
        conversations_growth: conversationsGrowth,
        most_used_assistant: mostUsedAssistant,
        avg_session_duration: avgSessionDuration,
        user_retention: userRetention,
        total_sessions: totalSessions,
        assistants_usage: assistantsUsage,
        daily_activity: dailyActivity,
        user_activity_distribution: userActivityDistribution
      },
      audit_logs: auditLogs
    };

    return report;

  } catch (error) {
    console.error(`Error generating report for institution ${institutionId}:`, error);
    return null;
  }
}

// ============================================
// GENERATE MOCK AUDIT LOGS
// ============================================
async function generateMockAuditLogs(institutionId, startDate, endDate, limit = 10) {
  const mockActions = [
    'LOGIN_ATTEMPT',
    'CONVERSATION_STARTED',
    'ASSISTANT_ACCESSED',
    'PROFILE_UPDATED',
    'PASSWORD_CHANGED',
    'LOGOUT',
    'SUBSCRIPTION_VIEWED',
    'REPORT_GENERATED',
    'SETTINGS_UPDATED',
    'USER_INVITE_SENT'
  ];

  const mockUserEmails = [
    'usuario1@abpsi.org',
    'usuario2@abpsi.org',
    'admin@abpsi.org',
    'professor@abpsi.org',
    'estudante@abpsi.org'
  ];

  const logs = [];
  const timeDiff = endDate.getTime() - startDate.getTime();

  for (let i = 0; i < limit; i++) {
    const randomTime = startDate.getTime() + Math.random() * timeDiff;
    const randomAction = mockActions[Math.floor(Math.random() * mockActions.length)];
    const randomUser = mockUserEmails[Math.floor(Math.random() * mockUserEmails.length)];

    logs.push({
      timestamp: new Date(randomTime).toISOString(),
      event_type: 'USER_ACTION',
      user_id: `user_${i + 1}`,
      user_email: randomUser,
      action: randomAction,
      details: `Ação ${randomAction.toLowerCase().replace('_', ' ')} executada pelo usuário`,
      ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`
    });
  }

  // Ordenar por timestamp (mais recente primeiro)
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}