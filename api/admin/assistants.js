const { createClient } = require('@supabase/supabase-js');
const { ADMIN_EMAILS, isAdminUser } = require('../config/admin');
const { applyCors } = require('../utils/cors');

/**
 * API de Gestão de Assistentes para Admin Master
 * Lista todos os assistentes disponíveis no sistema
 */
module.exports = async function handler(req, res) {
  console.log('🤖 Admin Assistants API v1.0');

  // Apply CORS
  const corsHandled = applyCors(req, res);
  if (corsHandled) {
    return;
  }

  if (req.method !== 'GET') {
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

    console.log(`👨‍💼 Admin ${userEmail} accessing assistants list`);

    // Buscar todos os assistentes ativos
    const { data: assistants, error: assistantsError } = await supabase
      .from('assistants')
      .select(`
        id,
        name,
        description,
        area,
        is_active,
        icon,
        color_theme,
        monthly_price,
        semester_price,
        subscription_count,
        total_conversations,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (assistantsError) {
      console.error('Error fetching assistants:', assistantsError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar assistentes'
      });
    }

    // Buscar estatísticas de uso por instituição
    const { data: institutionAssistants, error: iaError } = await supabase
      .from('institution_assistants')
      .select(`
        assistant_id,
        institution_id,
        is_enabled,
        institutions!inner(name, slug)
      `)
      .eq('is_enabled', true);

    if (iaError) {
      console.error('Error fetching institution assistants:', iaError);
    }

    // Mapear assistentes com estatísticas de uso institucional
    const assistantsWithStats = (assistants || []).map(assistant => {
      const institutionUsage = (institutionAssistants || [])
        .filter(ia => ia.assistant_id === assistant.id)
        .map(ia => ({
          institution_name: ia.institutions.name,
          institution_slug: ia.institutions.slug
        }));

      return {
        ...assistant,
        institution_usage: institutionUsage,
        institutions_count: institutionUsage.length
      };
    });

    console.log(`📊 Returning ${assistantsWithStats.length} assistants`);

    return res.status(200).json({
      success: true,
      data: {
        assistants: assistantsWithStats,
        summary: {
          total_assistants: assistantsWithStats.length,
          active_assistants: assistantsWithStats.filter(a => a.is_active).length,
          total_subscriptions: assistantsWithStats.reduce((sum, a) => sum + (a.subscription_count || 0), 0),
          total_conversations: assistantsWithStats.reduce((sum, a) => sum + (a.total_conversations || 0), 0)
        }
      }
    });

  } catch (error) {
    console.error('Admin Assistants API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};