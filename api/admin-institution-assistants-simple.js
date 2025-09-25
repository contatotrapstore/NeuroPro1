/**
 * API de Gestão de Assistentes por Instituição - Versão Simplificada (Sem Dependências)
 * Endpoint: /api/admin-institution-assistants-simple
 */
module.exports = async function handler(req, res) {
  console.log('🏛️🤖 Institution Assistants Simple API v1.0');
  console.log('Environment:', process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown');
  console.log('Region:', process.env.VERCEL_REGION || 'unknown');

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

    // Try multiple environment variable patterns
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                              process.env.SUPABASE_SERVICE_KEY ||
                              process.env.VITE_SUPABASE_SERVICE_KEY ||
                              process.env.SUPABASE_KEY ||
                              process.env.VITE_SUPABASE_KEY;

    // If no service key, try anon key as fallback (limited functionality)
    const supabaseKey = supabaseServiceKey || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    // Detailed error logging for missing environment variables
    if (!supabaseUrl || !supabaseKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('SUPABASE_URL');
      if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');

      console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      console.error('Environment check:', {
        SUPABASE_URL: supabaseUrl ? 'SET' : 'MISSING',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING',
        VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_SET',
        NODE_ENV: process.env.NODE_ENV || 'NOT_SET'
      });

      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta',
        details: `Missing environment variables: ${missingVars.join(', ')}`,
        help: 'Configure the missing variables in Vercel Dashboard → Settings → Environment Variables'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔧 Supabase initialized for institution-assistants API');

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
    // GET INSTITUTION ID FROM QUERY
    // ============================================
    const url = new URL(req.url, `http://${req.headers.host}`);
    const institutionId = url.searchParams.get('institution_id');

    if (!institutionId) {
      return res.status(400).json({
        success: false,
        error: 'ID da instituição não informado'
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

    console.log(`🏛️🤖 Processing ${req.method} for institution: ${institution.name} (${institution.slug})`);

    // ============================================
    // REQUEST HANDLING BY METHOD
    // ============================================
    if (req.method === 'GET') {
      return handleGetAssistants(req, res, supabase, institutionId);
    } else if (req.method === 'PUT') {
      return handleUpdateAssistants(req, res, supabase, institutionId);
    } else if (req.method === 'POST') {
      return handleAddAssistant(req, res, supabase, institutionId);
    } else if (req.method === 'DELETE') {
      return handleRemoveAssistant(req, res, supabase, institutionId);
    } else {
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('Institution Assistants Simple API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ============================================
// GET - List Institution Assistants
// ============================================
async function handleGetAssistants(req, res, supabase, institutionId) {
  try {
    // Get all assistants configured for this institution
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
        created_at,
        updated_at,
        assistants!inner(
          id,
          name,
          description,
          icon,
          icon_url,
          color_theme,
          area,
          is_active,
          openai_assistant_id
        )
      `)
      .eq('institution_id', institutionId)
      .eq('assistants.is_active', true)
      .order('display_order', { ascending: true });

    if (assistantsError) {
      console.error('Error fetching institution assistants:', assistantsError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar assistentes da instituição'
      });
    }

    return res.status(200).json({
      success: true,
      data: institutionAssistants || []
    });

  } catch (error) {
    console.error('Error in handleGetAssistants:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao carregar assistentes'
    });
  }
}

// ============================================
// PUT - Update Institution Assistants Configuration
// ============================================
async function handleUpdateAssistants(req, res, supabase, institutionId) {
  try {
    const { assistants } = req.body;

    if (!Array.isArray(assistants)) {
      return res.status(400).json({
        success: false,
        error: 'Lista de assistentes inválida'
      });
    }

    console.log(`🏛️🤖 Updating ${assistants.length} assistants for institution ${institutionId}`);

    // Start transaction - delete existing configurations and recreate
    const { error: deleteError } = await supabase
      .from('institution_assistants')
      .delete()
      .eq('institution_id', institutionId);

    if (deleteError) {
      console.error('Error deleting existing assistants:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao limpar configurações existentes'
      });
    }

    // Insert new configurations for enabled assistants only
    const enabledAssistants = assistants.filter(a => a.is_enabled);

    if (enabledAssistants.length > 0) {
      // Ensure only one default
      let hasDefault = false;
      const assistantsToInsert = enabledAssistants.map((assistant, index) => {
        const isDefault = assistant.is_default && !hasDefault;
        if (isDefault) hasDefault = true;

        return {
          institution_id: institutionId,
          assistant_id: assistant.assistant_id,
          custom_name: assistant.custom_name?.trim() || null,
          custom_description: assistant.custom_description?.trim() || null,
          is_enabled: true,
          is_default: isDefault,
          display_order: assistant.display_order || index,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      // If no default was set, make the first one default
      if (!hasDefault && assistantsToInsert.length > 0) {
        assistantsToInsert[0].is_default = true;
      }

      const { error: insertError } = await supabase
        .from('institution_assistants')
        .insert(assistantsToInsert);

      if (insertError) {
        console.error('Error inserting assistants:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao salvar configurações dos assistentes'
        });
      }
    }

    console.log(`✅ Successfully updated ${enabledAssistants.length} assistants for institution`);

    return res.status(200).json({
      success: true,
      message: `Configurações atualizadas com sucesso. ${enabledAssistants.length} assistentes habilitados.`,
      data: {
        enabled_count: enabledAssistants.length,
        total_configured: assistants.length
      }
    });

  } catch (error) {
    console.error('Error in handleUpdateAssistants:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar assistentes'
    });
  }
}

// ============================================
// POST - Add Single Assistant to Institution
// ============================================
async function handleAddAssistant(req, res, supabase, institutionId) {
  try {
    const {
      assistant_id,
      custom_name,
      custom_description,
      is_default = false
    } = req.body;

    if (!assistant_id) {
      return res.status(400).json({
        success: false,
        error: 'ID do assistente é obrigatório'
      });
    }

    // Verify assistant exists and is active
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('id, name, is_active')
      .eq('id', assistant_id)
      .eq('is_active', true)
      .single();

    if (assistantError || !assistant) {
      return res.status(404).json({
        success: false,
        error: 'Assistente não encontrado ou inativo'
      });
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('institution_assistants')
      .select('id')
      .eq('institution_id', institutionId)
      .eq('assistant_id', assistant_id)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Assistente já está configurado para esta instituição'
      });
    }

    // Get next display order
    const { data: lastAssistant } = await supabase
      .from('institution_assistants')
      .select('display_order')
      .eq('institution_id', institutionId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const displayOrder = (lastAssistant?.display_order || 0) + 1;

    // If setting as default, remove default from others
    if (is_default) {
      await supabase
        .from('institution_assistants')
        .update({ is_default: false })
        .eq('institution_id', institutionId);
    }

    // Insert new assistant configuration
    const { data: newAssistant, error: insertError } = await supabase
      .from('institution_assistants')
      .insert({
        institution_id: institutionId,
        assistant_id: assistant_id,
        custom_name: custom_name?.trim() || null,
        custom_description: custom_description?.trim() || null,
        is_enabled: true,
        is_default: is_default,
        display_order: displayOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding assistant:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao adicionar assistente'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Assistente adicionado com sucesso',
      data: newAssistant
    });

  } catch (error) {
    console.error('Error in handleAddAssistant:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao adicionar assistente'
    });
  }
}

// ============================================
// DELETE - Remove Assistant from Institution
// ============================================
async function handleRemoveAssistant(req, res, supabase, institutionId) {
  try {
    const { assistant_id } = req.body;

    if (!assistant_id) {
      return res.status(400).json({
        success: false,
        error: 'ID do assistente é obrigatório'
      });
    }

    // Check if assistant is configured for this institution
    const { data: existing, error: findError } = await supabase
      .from('institution_assistants')
      .select('id, is_default')
      .eq('institution_id', institutionId)
      .eq('assistant_id', assistant_id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Assistente não está configurado para esta instituição'
      });
    }

    // Remove the assistant
    const { error: deleteError } = await supabase
      .from('institution_assistants')
      .delete()
      .eq('id', existing.id);

    if (deleteError) {
      console.error('Error removing assistant:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao remover assistente'
      });
    }

    // If removed assistant was default, set another as default
    if (existing.is_default) {
      const { data: nextAssistant } = await supabase
        .from('institution_assistants')
        .select('id')
        .eq('institution_id', institutionId)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      if (nextAssistant) {
        await supabase
          .from('institution_assistants')
          .update({ is_default: true })
          .eq('id', nextAssistant.id);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Assistente removido com sucesso'
    });

  } catch (error) {
    console.error('Error in handleRemoveAssistant:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao remover assistente'
    });
  }
}