/**
 * API Simplificada para Autenticação de Instituições
 * Endpoint: /api/institution-auth
 */
module.exports = async function handler(req, res) {
  console.log('🏛️ Institution Auth Simple API v1.0');
  console.log('Method:', req.method);
  console.log('Query:', req.query);

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

    // For GET requests (public data), allow anon key as fallback
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const isGetRequest = req.method === 'GET';

    let supabaseKey = supabaseServiceKey;
    if (!supabaseKey && isGetRequest && supabaseAnonKey) {
      console.log('🔓 Using anon key for GET request (public data)');
      supabaseKey = supabaseAnonKey;
    }

    if (!supabaseUrl || !supabaseKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('SUPABASE_URL');
      if (!supabaseKey) {
        if (isGetRequest) {
          missingVars.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
        } else {
          missingVars.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
        }
      }

      console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      console.error('Environment check:', {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
        REQUEST_METHOD: req.method
      });

      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta',
        details: `Missing environment variables: ${missingVars.join(', ')}`,
        debug_info: {
          request_method: req.method,
          has_service_key: !!supabaseServiceKey,
          has_anon_key: !!supabaseAnonKey,
          using_fallback: !supabaseServiceKey && isGetRequest
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ============================================
    // GET INSTITUTION SLUG
    // ============================================
    const institutionSlug = req.query.slug || req.query.institution_slug;

    if (!institutionSlug) {
      return res.status(400).json({
        success: false,
        error: 'Slug da instituição não informado (use ?slug=abpsi)'
      });
    }

    console.log(`🏛️ Processing institution: ${institutionSlug}`);

    // ============================================
    // REQUEST HANDLING BY METHOD
    // ============================================
    if (req.method === 'GET') {
      return handleGetInstitution(req, res, supabase, institutionSlug);
    } else if (req.method === 'POST') {
      return handleAuthAction(req, res, supabase, institutionSlug);
    } else {
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('Institution Auth API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ============================================
// GET - Institution Basic Info
// ============================================
async function handleGetInstitution(req, res, supabase, institutionSlug) {
  try {
    // Verificar se instituição existe e está ativa
    console.log(`🔍 Looking for institution with slug: ${institutionSlug}`);
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select('id, name, slug, logo_url, primary_color, secondary_color, is_active')
      .eq('slug', institutionSlug)
      .eq('is_active', true)
      .single();

    console.log('🏛️ Institution query result:', { institution, error: institutionError });

    if (institutionError || !institution) {
      console.error('Institution not found:', institutionError);
      return res.status(404).json({
        success: false,
        error: 'Instituição não encontrada ou inativa'
      });
    }

    console.log(`✅ Institution found: ${institution.name}`);

    // Create settings object from available institution data
    let settings = {
      welcome_message: institution.custom_message || `Bem-vindo à ${institution.name}`,
      subtitle: 'Formação, Supervisão e Prática',
      theme: {
        primary_color: institution.primary_color,
        secondary_color: institution.secondary_color
      }
    };

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
          welcome_message: settings.welcome_message,
          settings: settings
        }
      }
    });

  } catch (error) {
    console.error('Error in handleGetInstitution:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao carregar informações da instituição'
    });
  }
}

// ============================================
// POST - Authentication Actions
// ============================================
async function handleAuthAction(req, res, supabase, institutionSlug) {
  try {
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
          console.error('Token validation failed:', userError);
          return res.status(401).json({
            success: false,
            error: 'Token inválido ou expirado',
            details: userError?.message
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
            institutions!inner(id, name, slug, logo_url, primary_color, settings)
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

    return res.status(400).json({
      success: false,
      error: 'Ação não reconhecida'
    });

  } catch (error) {
    console.error('Error in handleAuthAction:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar ação de autenticação'
    });
  }
}