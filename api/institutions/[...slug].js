const { createClient } = require('@supabase/supabase-js');

/**
 * API Centralizada para Instituições (Vercel Dynamic Routes)
 * Rota: /api/institutions/[...slug]
 * Exemplos: /api/institutions/abpsi/auth, /api/institutions/abpsi/dashboard
 */
module.exports = async function handler(req, res) {
  console.log('🏛️ Institution Dynamic API v2.0');
  console.log('Request URL:', req.url);
  console.log('Query params:', req.query);

  // ============================================
  // CORS HEADERS (INLINE)
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

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                              process.env.SUPABASE_SERVICE_KEY ||
                              process.env.VITE_SUPABASE_SERVICE_KEY;

    // Allow anon key as fallback for limited functionality
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;

    if (!supabaseUrl || !supabaseKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('SUPABASE_URL');
      if (!supabaseKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');

      console.error('Dynamic route environment check:', {
        SUPABASE_URL: !!supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
        using_service_key: !!supabaseServiceKey
      });

      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta',
        details: `Missing environment variables: ${missingVars.join(', ')}`
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log(`🔧 Dynamic route using ${supabaseServiceKey ? 'service' : 'anon'} key`);

    // Parse slug from URL
    const { slug: slugArray } = req.query;
    const [institutionSlug, endpoint] = Array.isArray(slugArray) ? slugArray : [slugArray];

    if (!institutionSlug) {
      return res.status(400).json({
        success: false,
        error: 'Slug da instituição não informado'
      });
    }

    console.log(`🏛️ Processing: /institutions/${institutionSlug}/${endpoint || 'default'}`);

    // Route to appropriate handler based on endpoint
    switch (endpoint) {
      case 'auth':
        return handleAuth(req, res, supabase, institutionSlug);
      case 'dashboard':
        return handleDashboard(req, res, supabase, institutionSlug);
      case 'users':
        return handleUsers(req, res, supabase, institutionSlug);
      case 'chat':
        return handleChat(req, res, supabase, institutionSlug);
      default:
        // Default endpoint - return institution info
        return handleInstitutionInfo(req, res, supabase, institutionSlug);
    }

  } catch (error) {
    console.error('Institution API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// ============================================
// AUTH ENDPOINT HANDLER
// ============================================
async function handleAuth(req, res, supabase, institutionSlug) {
  if (req.method === 'GET') {
    // Verificar se instituição existe e está ativa
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select('id, name, slug, logo_url, primary_color, secondary_color, custom_message, is_active')
      .eq('slug', institutionSlug)
      .eq('is_active', true)
      .single();

    if (institutionError || !institution) {
      return res.status(404).json({
        success: false,
        error: 'Instituição não encontrada ou inativa'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        institution: {
          id: institution.id,
          name: institution.name,
          slug: institution.slug,
          logo_url: institution.logo_url,
          primary_color: institution.primary_color,
          secondary_color: institution.secondary_color,
          welcome_message: institution.custom_message,
          settings: {
            welcome_message: institution.custom_message,
            theme: {
              primary_color: institution.primary_color,
              secondary_color: institution.secondary_color
            }
          }
        }
      }
    });
  }

  if (req.method === 'POST') {
    const { action, token, email, password } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Ação não especificada'
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

    if (action === 'verify_access') {
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token de acesso necessário'
        });
      }

      try {
        // Create user-specific client to validate token (needs service key for user validation)
        const serviceKey = supabaseServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
        if (!serviceKey) {
          return res.status(500).json({
            success: false,
            error: 'Token validation requires service key'
          });
        }

        const userClient = createClient(supabaseUrl, serviceKey, {
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

        // Verificar se usuário pertence à instituição
        const { data: institutionUser, error: institutionUserError } = await supabase
          .from('institution_users')
          .select(`
            role,
            is_active,
            enrolled_at,
            institutions!inner(id, name, slug, logo_url, primary_color, custom_message)
          `)
          .eq('user_id', userId)
          .eq('institution_id', institution.id)
          .eq('is_active', true)
          .single();

        if (institutionUserError || !institutionUser) {
          return res.status(403).json({
            success: false,
            error: 'Usuário não tem acesso a esta instituição'
          });
        }

        // Obter assistentes disponíveis
        const { data: availableAssistants } = await supabase
          .from('institution_assistants')
          .select(`
            assistant_id,
            custom_name,
            custom_description,
            is_default,
            display_order,
            assistants!inner(name, description, icon, color_theme, openai_assistant_id)
          `)
          .eq('institution_id', institution.id)
          .eq('is_enabled', true)
          .order('display_order', { ascending: true });

        return res.status(200).json({
          success: true,
          data: {
            user_access: {
              role: institutionUser.role,
              is_admin: institutionUser.role === 'subadmin',
              permissions: institutionUser.role === 'subadmin' ? {
                manage_users: true,
                view_reports: true,
                manage_assistants: false,
                manage_settings: false,
                view_conversations: true,
                export_data: true
              } : {},
              joined_at: institutionUser.enrolled_at
            },
            institution: institutionUser.institutions,
            available_assistants: availableAssistants?.map(ia => ({
              id: ia.assistant_id,
              name: ia.custom_name || ia.assistants.name,
              description: ia.custom_description || ia.assistants.description,
              icon: ia.assistants.icon,
              color_theme: ia.assistants.color_theme,
              openai_assistant_id: ia.assistants.openai_assistant_id,
              is_primary: ia.is_default,
              display_order: ia.display_order
            })) || []
          }
        });

      } catch (error) {
        console.error('Error verifying access:', error);
        return res.status(401).json({
          success: false,
          error: 'Token inválido'
        });
      }
    }

    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email e senha são obrigatórios'
        });
      }

      try {
        // Primeiro, fazer login normal
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (authError) {
          return res.status(401).json({
            success: false,
            error: 'Credenciais inválidas'
          });
        }

        const userId = authData.user.id;

        // Verificar se usuário tem acesso à instituição
        const { data: institutionUser, error: accessError } = await supabase
          .from('institution_users')
          .select('role, is_active, enrolled_at')
          .eq('user_id', userId)
          .eq('institution_id', institution.id)
          .eq('is_active', true)
          .single();

        if (accessError || !institutionUser) {
          // Fazer logout se não tem acesso
          await supabase.auth.signOut();

          return res.status(403).json({
            success: false,
            error: 'Usuário não tem acesso a esta instituição'
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            user: authData.user,
            session: authData.session,
            institution_context: {
              role: institutionUser.role,
              institution_id: institution.id,
              institution_slug: institution.slug,
              joined_at: institutionUser.enrolled_at
            }
          }
        });

      } catch (error) {
        console.error('Institution login error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno no login'
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Ação não reconhecida'
    });
  }

  return res.status(405).json({
    success: false,
    error: 'Método não permitido'
  });
}

// ============================================
// INSTITUTION INFO HANDLER
// ============================================
async function handleInstitutionInfo(req, res, supabase, institutionSlug) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  const { data: institution, error } = await supabase
    .from('institutions')
    .select('*')
    .eq('slug', institutionSlug)
    .eq('is_active', true)
    .single();

  if (error || !institution) {
    return res.status(404).json({
      success: false,
      error: 'Instituição não encontrada'
    });
  }

  return res.status(200).json({
    success: true,
    data: { institution }
  });
}

// ============================================
// DASHBOARD HANDLER
// ============================================
async function handleDashboard(req, res, supabase, institutionSlug) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    // Buscar instituição
    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .select('id, name')
      .eq('slug', institutionSlug)
      .eq('is_active', true)
      .single();

    if (instError || !institution) {
      return res.status(404).json({
        success: false,
        error: 'Instituição não encontrada'
      });
    }

    // Estatísticas de usuários
    const { data: usersStats } = await supabase
      .from('institution_users')
      .select('id, is_active, enrolled_at, last_access')
      .eq('institution_id', institution.id);

    const totalUsers = usersStats?.length || 0;
    const activeUsers = usersStats?.filter(u => u.is_active)?.length || 0;

    // Usuários ativos hoje (simulado - na implementação real, verificar last_access)
    const activeToday = Math.min(activeUsers, 1);

    // Novos usuários este mês
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = usersStats?.filter(u =>
      new Date(u.enrolled_at) >= thisMonth
    )?.length || 0;

    // Estatísticas de conversas (placeholder - implementar quando houver tabela de conversas institucionais)
    const conversationStats = {
      total_conversations: 0,
      conversations_today: 0,
      conversations_this_month: 0,
      avg_session_duration: 25.5
    };

    // Assistente mais usado (buscar da configuração)
    const { data: topAssistant } = await supabase
      .from('institution_assistants')
      .select(`
        custom_name,
        assistants!inner(name)
      `)
      .eq('institution_id', institution.id)
      .eq('is_enabled', true)
      .eq('is_default', true)
      .single();

    const mostUsedAssistant = {
      name: topAssistant?.custom_name || topAssistant?.assistants?.name || 'N/A',
      usage_count: 0
    };

    // Status da licença
    const licenseStatus = 'active'; // Implementar verificação real
    const licenseInfo = {
      plan_type: 'unlimited',
      max_users: null
    };

    return res.status(200).json({
      success: true,
      data: {
        total_users: totalUsers,
        active_users_today: activeToday,
        new_users_this_month: newThisMonth,
        total_conversations: conversationStats.total_conversations,
        conversations_today: conversationStats.conversations_today,
        conversations_this_month: conversationStats.conversations_this_month,
        avg_session_duration: conversationStats.avg_session_duration,
        most_used_assistant: mostUsedAssistant,
        license_status: licenseStatus,
        license_info: licenseInfo
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao carregar dashboard'
    });
  }
}

// ============================================
// USERS HANDLER
// ============================================
async function handleUsers(req, res, supabase, institutionSlug) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    // Buscar instituição
    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .select('id, name')
      .eq('slug', institutionSlug)
      .eq('is_active', true)
      .single();

    if (instError || !institution) {
      return res.status(404).json({
        success: false,
        error: 'Instituição não encontrada'
      });
    }

    // Buscar usuários da instituição
    const { data: institutionUsers, error: usersError } = await supabase
      .from('institution_users')
      .select(`
        id,
        user_id,
        role,
        registration_number,
        department,
        semester,
        is_active,
        enrolled_at,
        last_access,
        notes
      `)
      .eq('institution_id', institution.id)
      .order('enrolled_at', { ascending: false });

    if (usersError) {
      throw usersError;
    }

    // Buscar dados dos usuários do auth.users
    const userIds = institutionUsers?.map(iu => iu.user_id) || [];
    const { data: authUsers, error: authError } = userIds.length > 0
      ? await supabase
          .from('users') // Note: usar view ou função personalizada se necessário
          .select('id, email, created_at, last_sign_in_at, email_confirmed_at')
          .in('id', userIds)
      : { data: [], error: null };

    // Simular dados de conversas por usuário (implementar quando tiver tabela real)
    const conversationCounts: { [key: string]: number } = {};

    // Combinar dados
    const users = institutionUsers?.map(iu => {
      const authUser = authUsers?.find(au => au.id === iu.user_id);
      return {
        id: iu.id,
        user_id: iu.user_id,
        email: authUser?.email || 'N/A',
        role: iu.role,
        registration_number: iu.registration_number,
        department: iu.department,
        semester: iu.semester,
        is_active: iu.is_active,
        enrolled_at: iu.enrolled_at,
        last_access: iu.last_access,
        total_conversations: conversationCounts[iu.user_id] || 0,
        last_conversation_at: null, // Implementar quando tiver tabela de conversas
        user_created_at: authUser?.created_at,
        last_sign_in: authUser?.last_sign_in_at,
        email_confirmed: !!authUser?.email_confirmed_at
      };
    }) || [];

    return res.status(200).json({
      success: true,
      data: {
        users,
        institution: {
          id: institution.id,
          name: institution.name,
          slug: institutionSlug
        },
        total: users.length,
        active_users: users.filter(u => u.is_active).length
      }
    });

  } catch (error) {
    console.error('Users handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao carregar usuários'
    });
  }
}

// ============================================
// CHAT HANDLER (Placeholder)
// ============================================
async function handleChat(req, res, supabase, institutionSlug) {
  return res.status(501).json({
    success: false,
    error: 'Chat endpoint em desenvolvimento'
  });
}