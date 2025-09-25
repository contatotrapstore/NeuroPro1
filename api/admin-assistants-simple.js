/**
 * API de Assistentes - Versão Simplificada (Sem Dependências)
 * Endpoint: /api/admin-assistants-simple
 */
module.exports = async function handler(req, res) {
  console.log('🤖 Admin Assistants Simple API v1.0');
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

    console.log('🔧 Supabase initialized for assistants API');

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

    console.log(`👨‍💼 Admin ${userEmail} accessing assistants API`);

    // ============================================
    // REQUEST HANDLING BY METHOD
    // ============================================
    if (req.method === 'GET') {
      return handleGetAssistants(req, res, supabase);
    } else if (req.method === 'POST') {
      return handleCreateAssistant(req, res, supabase);
    } else if (req.method === 'PUT') {
      return handleUpdateAssistant(req, res, supabase);
    } else if (req.method === 'DELETE') {
      return handleDeleteAssistant(req, res, supabase);
    } else {
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('Admin Assistants Simple API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ============================================
// GET - List All Assistants
// ============================================
async function handleGetAssistants(req, res, supabase) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const search = url.searchParams.get('search');
    const areaFilter = url.searchParams.get('area_filter');
    const statusFilter = url.searchParams.get('status_filter');
    const action = url.searchParams.get('action');

    if (action === 'list') {
      // Simple list for dropdowns
      const { data: assistants, error } = await supabase
        .from('assistants')
        .select('id, name, description, icon, area, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching assistants list:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar lista de assistentes'
        });
      }

      return res.status(200).json({
        success: true,
        data: assistants || []
      });
    }

    // Paginação
    const offset = (page - 1) * limit;

    let query = supabase
      .from('assistants')
      .select('*');

    // Filtros
    if (statusFilter === 'active') {
      query = query.eq('is_active', true);
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (areaFilter) {
      query = query.eq('area', areaFilter);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,area.ilike.%${search}%`);
    }

    const { data: assistants, error: assistantsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (assistantsError) {
      console.error('Error fetching assistants:', assistantsError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar assistentes'
      });
    }

    // Contagem total
    const { count: totalCount } = await supabase
      .from('assistants')
      .select('*', { count: 'exact', head: true });

    const totalPages = Math.ceil((totalCount || 0) / limit);

    console.log(`📊 Returning ${assistants.length} assistants`);

    return res.status(200).json({
      success: true,
      data: {
        assistants: assistants || [],
        pagination: {
          current_page: page,
          per_page: limit,
          total_items: totalCount || 0,
          total_pages: totalPages
        }
      }
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
// POST - Create New Assistant
// ============================================
async function handleCreateAssistant(req, res, supabase) {
  try {
    const {
      name,
      description,
      icon,
      icon_url,
      color_theme,
      area,
      system_prompt,
      welcome_message,
      openai_assistant_id,
      is_active = true
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Nome e descrição são obrigatórios'
      });
    }

    // Verificar se já existe assistente com mesmo nome
    const { data: existing } = await supabase
      .from('assistants')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Já existe um assistente com este nome'
      });
    }

    const { data: newAssistant, error } = await supabase
      .from('assistants')
      .insert({
        name: name.trim(),
        description: description.trim(),
        icon: icon || 'bot',
        icon_url: icon_url?.trim() || null,
        color_theme: color_theme || '#3b82f6',
        area: area?.trim() || 'Geral',
        system_prompt: system_prompt?.trim() || null,
        welcome_message: welcome_message?.trim() || null,
        openai_assistant_id: openai_assistant_id?.trim() || null,
        is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assistant:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao criar assistente'
      });
    }

    console.log(`✅ Created new assistant: ${name}`);

    return res.status(201).json({
      success: true,
      message: 'Assistente criado com sucesso',
      data: newAssistant
    });

  } catch (error) {
    console.error('Error in handleCreateAssistant:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao criar assistente'
    });
  }
}

// ============================================
// PUT - Update Assistant
// ============================================
async function handleUpdateAssistant(req, res, supabase) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const assistantId = url.searchParams.get('id');

    if (!assistantId) {
      return res.status(400).json({
        success: false,
        error: 'ID do assistente não informado'
      });
    }

    const {
      name,
      description,
      icon,
      icon_url,
      color_theme,
      area,
      system_prompt,
      welcome_message,
      openai_assistant_id,
      is_active
    } = req.body;

    // Verificar se o assistente existe
    const { data: existing, error: findError } = await supabase
      .from('assistants')
      .select('id, name')
      .eq('id', assistantId)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Assistente não encontrado'
      });
    }

    // Se mudou o nome, verificar se não conflita
    if (name && name !== existing.name) {
      const { data: nameConflict } = await supabase
        .from('assistants')
        .select('id')
        .eq('name', name)
        .neq('id', assistantId)
        .single();

      if (nameConflict) {
        return res.status(409).json({
          success: false,
          error: 'Já existe um assistente com este nome'
        });
      }
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Adicionar campos modificados
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (icon !== undefined) updateData.icon = icon;
    if (icon_url !== undefined) updateData.icon_url = icon_url?.trim() || null;
    if (color_theme !== undefined) updateData.color_theme = color_theme;
    if (area !== undefined) updateData.area = area?.trim() || 'Geral';
    if (system_prompt !== undefined) updateData.system_prompt = system_prompt?.trim() || null;
    if (welcome_message !== undefined) updateData.welcome_message = welcome_message?.trim() || null;
    if (openai_assistant_id !== undefined) updateData.openai_assistant_id = openai_assistant_id?.trim() || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedAssistant, error } = await supabase
      .from('assistants')
      .update(updateData)
      .eq('id', assistantId)
      .select()
      .single();

    if (error) {
      console.error('Error updating assistant:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao atualizar assistente'
      });
    }

    console.log(`✅ Updated assistant: ${updatedAssistant.name}`);

    return res.status(200).json({
      success: true,
      message: 'Assistente atualizado com sucesso',
      data: updatedAssistant
    });

  } catch (error) {
    console.error('Error in handleUpdateAssistant:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao atualizar assistente'
    });
  }
}

// ============================================
// DELETE - Delete Assistant
// ============================================
async function handleDeleteAssistant(req, res, supabase) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const assistantId = url.searchParams.get('id');

    if (!assistantId) {
      return res.status(400).json({
        success: false,
        error: 'ID do assistente não informado'
      });
    }

    // Verificar se o assistente existe
    const { data: existing, error: findError } = await supabase
      .from('assistants')
      .select('id, name')
      .eq('id', assistantId)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Assistente não encontrado'
      });
    }

    // Verificar se está sendo usado por alguma instituição
    const { data: institutionUsage } = await supabase
      .from('institution_assistants')
      .select('id')
      .eq('assistant_id', assistantId)
      .limit(1)
      .single();

    if (institutionUsage) {
      return res.status(409).json({
        success: false,
        error: 'Este assistente está sendo usado por uma ou mais instituições e não pode ser excluído'
      });
    }

    // Excluir o assistente
    const { error } = await supabase
      .from('assistants')
      .delete()
      .eq('id', assistantId);

    if (error) {
      console.error('Error deleting assistant:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao excluir assistente'
      });
    }

    console.log(`🗑️ Deleted assistant: ${existing.name}`);

    return res.status(200).json({
      success: true,
      message: 'Assistente excluído com sucesso'
    });

  } catch (error) {
    console.error('Error in handleDeleteAssistant:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao excluir assistente'
    });
  }
}