/**
 * API de Gestão de Assistentes de Instituições
 * Endpoint: /api/admin-institution-assistants
 */
module.exports = async function handler(req, res) {
  console.log('🤖 Admin Institution Assistants API v2.0');
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

    console.log(`👨‍💼 Admin ${userEmail} accessing institution assistants API`);

    // ============================================
    // REQUEST HANDLING
    // ============================================
    const url = new URL(req.url, `http://${req.headers.host}`);
    const institutionId = url.searchParams.get('institution_id');

    if (!institutionId) {
      return res.status(400).json({
        success: false,
        error: 'ID da instituição é obrigatório'
      });
    }

    // Verify institution exists
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select('id, name, slug')
      .eq('id', institutionId)
      .single();

    if (institutionError || !institution) {
      return res.status(404).json({
        success: false,
        error: 'Instituição não encontrada'
      });
    }

    console.log(`🏛️🤖 Processing GET for institution: ${institution.name} (${institution.slug})`);

    // List assistants for institution
    try {
      // Buscar assistentes vinculados à instituição
      const { data: institutionAssistants, error: assistantsError } = await supabase
        .from('institution_assistants')
        .select(`
          id,
          assistant_id,
          custom_name,
          custom_description,
          is_enabled,
          is_default,
          display_order,
          created_at
        `)
        .eq('institution_id', institutionId)
        .order('display_order', { ascending: true });

      if (assistantsError) {
        console.error('Error fetching institution assistants:', assistantsError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar assistentes da instituição'
        });
      }

      // Buscar dados dos assistentes na tabela principal
      const assistantsWithDetails = [];
      if (institutionAssistants && institutionAssistants.length > 0) {
        for (const institutionAssistant of institutionAssistants) {
          try {
            const { data: assistant, error: assistantError } = await supabase
              .from('assistants')
              .select('name, description, icon')
              .eq('openai_assistant_id', institutionAssistant.assistant_id)
              .single();

            const assistantData = {
              ...institutionAssistant,
              name: assistant?.name || `Assistente ${institutionAssistant.assistant_id}`,
              description: assistant?.description || 'Descrição não disponível',
              icon: assistant?.icon || 'bot'
            };

            assistantsWithDetails.push(assistantData);
          } catch (error) {
            console.error(`Error fetching assistant ${institutionAssistant.assistant_id}:`, error);
            // Incluir mesmo sem dados completos
            assistantsWithDetails.push({
              ...institutionAssistant,
              name: `Assistente ${institutionAssistant.assistant_id}`,
              description: 'Erro ao carregar dados do assistente',
              icon: 'bot'
            });
          }
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          assistants: assistantsWithDetails,
          count: assistantsWithDetails.length
        }
      });

    } catch (error) {
      console.error('Error listing institution assistants:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar assistentes'
      });
    }

  } catch (error) {
    console.error('Admin Institution Assistants API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};