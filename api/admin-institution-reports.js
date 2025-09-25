/**
 * API de Relatórios de Instituições
 * Endpoint: /api/admin-institution-reports
 */
module.exports = async function handler(req, res) {
  console.log('📊 Admin Institution Reports API v1.0');
  console.log('Method:', req.method);
  console.log('Environment:', process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown');

  // ============================================
  // CORS HEADERS
  // ============================================
  const allowedOrigins = [
    'https://www.neuroialab.com.br',
    'https://neuroialab.com.br',
    'https://neuroai-lab.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    // ============================================
    // ADMIN CONFIGURATION (INLINE)
    // ============================================
    const ADMIN_EMAILS = [
      'gouveiarx@gmail.com',
      'psitales@gmail.com',
      'psitales.sales@gmail.com'
    ];

    const isAdminUser = (email, userMetadata = {}) => {
      if (!email) return false;
      const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase());
      const hasAdminRole = userMetadata?.role === 'admin';
      return isAdminEmail || hasAdminRole;
    };

    // ============================================
    // SUPABASE INITIALIZATION
    // ============================================
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                              process.env.SUPABASE_SERVICE_KEY ||
                              process.env.VITE_SUPABASE_SERVICE_KEY ||
                              process.env.SUPABASE_KEY ||
                              process.env.VITE_SUPABASE_KEY;

    const supabaseKey = supabaseServiceKey || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration');
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ============================================
    // AUTHENTICATION
    // ============================================
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    // Create user-specific client to validate token
    const userClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    // Get user from token using Supabase auth
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    const userId = user.id;
    const userEmail = user.email;

    // Verificar se é admin master
    if (!isAdminUser(userEmail)) {
      return res.status(403).json({
        success: false,
        error: 'Acesso restrito a administradores master'
      });
    }

    console.log(`👨‍💼 Admin ${userEmail} accessing institution reports API`);

    // ============================================
    // REQUEST HANDLING
    // ============================================
    const url = new URL(req.url, `http://${req.headers.host}`);
    const institutionId = url.searchParams.get('institution_id');
    const period = url.searchParams.get('period') || '30'; // dias

    if (!institutionId) {
      return res.status(400).json({
        success: false,
        error: 'ID da instituição é obrigatório'
      });
    }

    // Verificar se a instituição existe
    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .select('id, name, slug, created_at')
      .eq('id', institutionId)
      .single();

    if (instError || !institution) {
      return res.status(404).json({
        success: false,
        error: 'Instituição não encontrada'
      });
    }

    console.log(`📊 Generating reports for institution: ${institution.name} (${institutionId})`);

    // ============================================
    // GENERATE REPORTS DATA
    // ============================================

    const periodDays = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    console.log(`📊 Report period: ${periodDays} days, from ${startDate.toISOString()}`);

    // 1. ESTATÍSTICAS GERAIS
    let userStats = [];
    try {
      const { data: userStatsData, error: userError } = await supabase
        .from('institution_users')
        .select('*')
        .eq('institution_id', institutionId);

      if (userError) {
        console.error('Error fetching user stats:', userError);
        throw new Error(`Erro ao buscar usuários: ${userError.message}`);
      }

      userStats = userStatsData || [];
      console.log(`📊 Found ${userStats.length} users for institution`);
    } catch (error) {
      console.error('Critical error in user stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar dados dos usuários da instituição',
        details: error.message
      });
    }

    const totalUsers = userStats.length;
    const activeUsers = userStats.filter(u => u.is_active).length;

    // Usuários com último acesso recente
    const recentActiveUsers = userStats?.filter(u => {
      if (!u.last_access) return false;
      const lastAccess = new Date(u.last_access);
      return lastAccess >= startDate;
    })?.length || 0;

    // 2. ASSISTENTES
    let assistantStats = [];
    try {
      const { data: assistantStatsData, error: assistantError } = await supabase
        .from('institution_assistants')
        .select('*')
        .eq('institution_id', institutionId);

      if (assistantError) {
        console.error('Error fetching assistant stats:', assistantError);
        // Não falhar por conta dos assistentes - continuar com array vazio
      }

      assistantStats = assistantStatsData || [];
      console.log(`📊 Found ${assistantStats.length} assistants for institution`);
    } catch (error) {
      console.error('Error in assistant stats (non-critical):', error);
      assistantStats = [];
    }

    const totalAssistants = assistantStats.length;
    const enabledAssistants = assistantStats.filter(a => a.is_enabled).length;
    const defaultAssistant = assistantStats.find(a => a.is_default);

    // 3. CONVERSAS
    let conversationStats = { total: 0, recent: 0, byAssistant: [], byPeriod: [] };

    try {
      // Verificar se há usuários antes de buscar conversas
      const userIds = userStats?.map(u => u.user_id) || [];
      console.log(`📊 User IDs for conversations query:`, { count: userIds.length, sample: userIds.slice(0, 3) });

      let conversations = [];

      // Só buscar conversas se há usuários
      if (userIds.length > 0) {
        const { data: conversationsData, error: convError } = await supabase
          .from('conversations')
          .select(`
            id,
            assistant_id,
            created_at,
            updated_at,
            user_id
          `)
          .in('user_id', userIds);

        if (convError) {
          console.error('Error fetching conversations:', convError);
        } else {
          conversations = conversationsData || [];
        }
      }

      console.log(`📊 Conversations found:`, conversations.length);

      if (conversations && conversations.length > 0) {
        conversationStats.total = conversations.length;

        // Conversas recentes
        conversationStats.recent = conversations.filter(c =>
          new Date(c.created_at) >= startDate
        ).length;

        // Por assistente
        const assistantUsage = {};
        conversations.forEach(conv => {
          const aid = conv.assistant_id;
          assistantUsage[aid] = (assistantUsage[aid] || 0) + 1;
        });

        conversationStats.byAssistant = Object.entries(assistantUsage).map(([aid, count]) => {
          const assistant = assistantStats?.find(a => a.assistant_id === aid);
          return {
            assistant_id: aid,
            name: assistant?.custom_name || `Assistente ${aid}`,
            count: count,
            percentage: Math.round((count / conversations.length) * 100)
          };
        }).sort((a, b) => b.count - a.count);

        // Por período (últimos 7 dias)
        const dailyStats = {};
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().split('T')[0];
          dailyStats[dateKey] = 0;
        }

        conversations.forEach(conv => {
          if (conv.created_at) {
            const convDate = conv.created_at.split('T')[0];
            if (dailyStats.hasOwnProperty(convDate)) {
              dailyStats[convDate]++;
            }
          }
        });

        conversationStats.byPeriod = Object.entries(dailyStats).map(([date, count]) => ({
          date,
          count
        }));
      } else {
        console.log('📊 No conversations found or no users - initializing empty stats');
        // Inicializar período vazio para gráficos
        const dailyStats = {};
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().split('T')[0];
          dailyStats[dateKey] = 0;
        }
        conversationStats.byPeriod = Object.entries(dailyStats).map(([date, count]) => ({
          date,
          count
        }));
      }
    } catch (error) {
      console.error('Error fetching conversation stats:', error);
    }

    // 4. MÉTRICAS CALCULADAS
    const userRetentionRate = totalUsers > 0 ? Math.round((recentActiveUsers / totalUsers) * 100) : 0;
    const avgConversationsPerUser = totalUsers > 0 ? Math.round(conversationStats.total / totalUsers * 10) / 10 : 0;
    const conversationGrowth = conversationStats.byPeriod.length >= 2 ?
      conversationStats.byPeriod[conversationStats.byPeriod.length - 1].count -
      conversationStats.byPeriod[conversationStats.byPeriod.length - 2].count : 0;

    console.log('📊 Final metrics calculated:', {
      totalUsers,
      activeUsers,
      recentActiveUsers,
      userRetentionRate,
      totalAssistants,
      enabledAssistants,
      totalConversations: conversationStats.total,
      recentConversations: conversationStats.recent,
      avgConversationsPerUser,
      conversationGrowth
    });

    // ============================================
    // RESPONSE DATA
    // ============================================
    try {
      const reportData = {
        institution: {
          id: institution.id,
          name: institution.name,
          slug: institution.slug,
          created_at: institution.created_at
        },
        period: {
          days: periodDays,
          start_date: startDate.toISOString(),
          end_date: new Date().toISOString()
        },
        overview: {
          total_users: totalUsers,
          active_users: activeUsers,
          recent_active_users: recentActiveUsers,
          user_retention_rate: userRetentionRate,
          total_assistants: totalAssistants,
          enabled_assistants: enabledAssistants,
          total_conversations: conversationStats.total,
          recent_conversations: conversationStats.recent,
          avg_conversations_per_user: avgConversationsPerUser,
          conversation_growth: conversationGrowth
        },
        assistants: {
          default_assistant: defaultAssistant ? {
            id: defaultAssistant.assistant_id,
            name: defaultAssistant.custom_name || 'Assistente Padrão'
          } : null,
          usage_stats: conversationStats.byAssistant,
          most_used: conversationStats.byAssistant[0] || null
        },
        timeline: {
          daily_conversations: conversationStats.byPeriod
        },
        users: {
          breakdown: userStats.map(u => ({
            id: u.user_id,
            role: u.role,
            is_active: u.is_active,
            enrolled_at: u.enrolled_at,
            last_access: u.last_access
          }))
        },
        generated_at: new Date().toISOString()
      };

      console.log('✅ Report data generated successfully');

      return res.status(200).json({
        success: true,
        data: reportData
      });
    } catch (error) {
      console.error('Error generating report response:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao gerar resposta do relatório',
        details: error.message
      });
    }

  } catch (error) {
    console.error('Admin Institution Reports API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};