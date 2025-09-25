const { createClient } = require('@supabase/supabase-js');
const { applyCors } = require('../utils/cors');

/**
 * API de Dashboard para Instituições
 * Fornece estatísticas e informações para o painel da instituição
 */
module.exports = async function handler(req, res) {
  console.log('📊 Institution Dashboard API v1.0');

  // Apply CORS
  const corsHandled = applyCors(req, res);
  if (corsHandled) {
    return;
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

    let userId;
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      userId = payload.sub;
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Parse URL for institution slug
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    const institutionSlug = pathParts[1]; // /institutions/[slug]/dashboard

    if (!institutionSlug) {
      return res.status(400).json({
        success: false,
        error: 'Slug da instituição não informado'
      });
    }

    // Verificar se instituição existe
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select('id, name, slug, is_active')
      .eq('slug', institutionSlug)
      .eq('is_active', true)
      .single();

    if (institutionError || !institution) {
      return res.status(404).json({
        success: false,
        error: 'Instituição não encontrada'
      });
    }

    // Verificar se usuário tem acesso à instituição
    const { data: userAccess, error: accessError } = await supabase
      .from('institution_users')
      .select('role, is_active')
      .eq('user_id', userId)
      .eq('institution_id', institution.id)
      .eq('is_active', true)
      .single();

    if (accessError || !userAccess) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado à instituição'
      });
    }

    if (req.method === 'GET') {
      const { stats_type } = url.searchParams;

      if (stats_type === 'overview' || !stats_type) {
        // Estatísticas gerais da instituição

        // 1. Contadores básicos
        const [
          totalUsersResult,
          activeUsersResult,
          totalAssistantsResult,
          totalConversationsResult
        ] = await Promise.all([
          // Total de usuários
          supabase
            .from('institution_users')
            .select('id', { count: 'exact' })
            .eq('institution_id', institution.id)
            .eq('is_active', true),

          // Usuários ativos (logaram nos últimos 30 dias)
          supabase
            .from('institution_users_detailed')
            .select('id', { count: 'exact' })
            .eq('institution_id', institution.id)
            .eq('is_active', true)
            .gte('last_sign_in_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

          // Total de assistentes disponíveis
          supabase
            .from('institution_assistants')
            .select('id', { count: 'exact' })
            .eq('institution_id', institution.id)
            .eq('is_active', true),

          // Total de conversas (aproximação via query de usuários da instituição)
          supabase
            .from('conversations')
            .select('id', { count: 'exact' })
            .in('user_id', await supabase
              .from('institution_users')
              .select('user_id')
              .eq('institution_id', institution.id)
              .eq('is_active', true)
              .then(result => result.data?.map(u => u.user_id) || [])
            )
        ]);

        // 2. Distribuição por roles
        const { data: roleDistribution } = await supabase
          .from('institution_users')
          .select('role')
          .eq('institution_id', institution.id)
          .eq('is_active', true);

        const roleStats = roleDistribution?.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {}) || {};

        // 3. Assistentes mais usados (aproximação)
        const { data: assistantUsage } = await supabase
          .from('institution_assistants')
          .select(`
            assistant_id,
            custom_name,
            assistants!inner(name, icon)
          `)
          .eq('institution_id', institution.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .limit(5);

        // 4. Atividade recente (últimos 7 dias)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentActivity } = await supabase
          .from('institution_users')
          .select('user_id, updated_at')
          .eq('institution_id', institution.id)
          .eq('is_active', true)
          .gte('updated_at', sevenDaysAgo)
          .order('updated_at', { ascending: false })
          .limit(10);

        // 5. Status da licença
        const { data: licenseInfo } = await supabase
          .rpc('get_institution_license_info', {
            institution_slug: institutionSlug
          });

        return res.status(200).json({
          success: true,
          data: {
            overview: {
              total_users: totalUsersResult.count || 0,
              active_users: activeUsersResult.count || 0,
              available_assistants: totalAssistantsResult.count || 0,
              total_conversations: totalConversationsResult.count || 0,
              role_distribution: roleStats,
              license_info: licenseInfo?.[0] || null
            },
            assistant_usage: assistantUsage?.map(a => ({
              id: a.assistant_id,
              name: a.custom_name || a.assistants.name,
              icon: a.assistants.icon,
              // Usage count seria implementado com tracking específico
              usage_count: 0
            })) || [],
            recent_activity: recentActivity?.length || 0,
            institution: {
              id: institution.id,
              name: institution.name,
              slug: institution.slug
            }
          }
        });
      }

      if (stats_type === 'users') {
        // Estatísticas detalhadas de usuários
        const { page = 1, limit = 20, role_filter } = url.searchParams;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabase
          .from('institution_users_detailed')
          .select('*')
          .eq('institution_id', institution.id)
          .eq('is_active', true);

        if (role_filter && role_filter !== 'all') {
          query = query.eq('role', role_filter);
        }

        const { data: users, error: usersError } = await query
          .order('joined_at', { ascending: false })
          .range(offset, offset + parseInt(limit) - 1);

        if (usersError) {
          return res.status(500).json({
            success: false,
            error: 'Erro ao buscar usuários'
          });
        }

        // Contagem total para paginação
        const { count: totalUsers } = await supabase
          .from('institution_users')
          .select('id', { count: 'exact' })
          .eq('institution_id', institution.id)
          .eq('is_active', true);

        return res.status(200).json({
          success: true,
          data: {
            users: users || [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: totalUsers || 0,
              pages: Math.ceil((totalUsers || 0) / parseInt(limit))
            }
          }
        });
      }

      if (stats_type === 'assistants') {
        // Estatísticas de assistentes
        const { data: assistantsStats } = await supabase
          .from('institution_assistants_detailed')
          .select('*')
          .eq('institution_id', institution.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        return res.status(200).json({
          success: true,
          data: {
            assistants: assistantsStats?.map(a => ({
              id: a.assistant_id,
              name: a.display_name,
              description: a.display_description,
              icon: a.assistant_icon,
              color_theme: a.assistant_color,
              is_simulator: a.is_simulator,
              is_primary: a.is_primary,
              display_order: a.display_order,
              // Métricas específicas seriam implementadas conforme necessário
              usage_stats: {
                total_sessions: 0,
                active_users: 0,
                avg_session_duration: 0
              }
            })) || []
          }
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Tipo de estatística não reconhecido'
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });

  } catch (error) {
    console.error('Institution Dashboard API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};