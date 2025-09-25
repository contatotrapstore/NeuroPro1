/**
 * API para Toggle de Assistentes de Instituições
 * Endpoint: /api/admin-institution-toggle-assistant
 */
module.exports = async function handler(req, res) {
  console.log('🔄 Admin Institution Toggle Assistant API v1.0');
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

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    // ============================================
    // ADMIN CONFIGURATION
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

    console.log(`👨‍💼 Admin ${userEmail} toggling assistant`);

    // ============================================
    // REQUEST HANDLING
    // ============================================
    const { institution_id, assistant_id, is_enabled, set_as_default } = req.body;

    if (!institution_id || !assistant_id) {
      return res.status(400).json({
        success: false,
        error: 'institution_id e assistant_id são obrigatórios'
      });
    }

    try {
      // Verificar se a instituição existe
      const { data: institution, error: instError } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('id', institution_id)
        .single();

      if (instError || !institution) {
        return res.status(404).json({
          success: false,
          error: 'Instituição não encontrada'
        });
      }

      // Verificar se o assistant existe na instituição
      const { data: existingAssistant, error: findError } = await supabase
        .from('institution_assistants')
        .select('*')
        .eq('institution_id', institution_id)
        .eq('assistant_id', assistant_id)
        .single();

      if (findError || !existingAssistant) {
        return res.status(404).json({
          success: false,
          error: 'Assistente não está configurado para esta instituição'
        });
      }

      let updateData = {
        updated_at: new Date().toISOString()
      };

      // Se está definindo como padrão
      if (set_as_default === true) {
        // Primeiro, remover default de todos os outros assistentes da instituição
        await supabase
          .from('institution_assistants')
          .update({ is_default: false })
          .eq('institution_id', institution_id)
          .neq('id', existingAssistant.id);

        updateData.is_default = true;
        updateData.is_enabled = true; // Assistente padrão deve estar habilitado

        console.log(`✅ Setting assistant ${assistant_id} as default for institution ${institution_id}`);
      }

      // Se está alternando enabled/disabled
      if (typeof is_enabled === 'boolean') {
        updateData.is_enabled = is_enabled;

        // Se está desabilitando o assistente padrão, precisa definir outro como padrão
        if (!is_enabled && existingAssistant.is_default) {
          updateData.is_default = false;

          // Buscar outro assistente habilitado para ser o padrão
          const { data: otherAssistants } = await supabase
            .from('institution_assistants')
            .select('id')
            .eq('institution_id', institution_id)
            .eq('is_enabled', true)
            .neq('id', existingAssistant.id)
            .order('display_order', { ascending: true })
            .limit(1);

          if (otherAssistants && otherAssistants.length > 0) {
            await supabase
              .from('institution_assistants')
              .update({ is_default: true })
              .eq('id', otherAssistants[0].id);

            console.log(`🔄 Set new default assistant for institution after disabling current default`);
          }
        }

        console.log(`🔄 ${is_enabled ? 'Enabling' : 'Disabling'} assistant ${assistant_id} for institution ${institution_id}`);
      }

      // Atualizar o assistente
      const { data: updatedAssistant, error: updateError } = await supabase
        .from('institution_assistants')
        .update(updateData)
        .eq('id', existingAssistant.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating assistant:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao atualizar assistente'
        });
      }

      const actionMsg = set_as_default ? 'definido como padrão' :
                       (typeof is_enabled === 'boolean' ?
                        (is_enabled ? 'habilitado' : 'desabilitado') : 'atualizado');

      return res.status(200).json({
        success: true,
        message: `Assistente ${actionMsg} com sucesso`,
        data: {
          updated: updatedAssistant,
          institution: institution.name
        }
      });

    } catch (error) {
      console.error('Error toggling assistant:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao alterar assistente'
      });
    }

  } catch (error) {
    console.error('Admin Institution Toggle Assistant API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};