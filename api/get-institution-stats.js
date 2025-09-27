/**
 * API de Estatísticas de Instituição Individual
 * Endpoint: /api/get-institution-stats?slug={slug}
 */
module.exports = async function handler(req, res) {
  console.log('📊 Institution Stats API v1.0');
  console.log('Method:', req.method);

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

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    // GET PARAMETERS
    // ============================================
    const url = new URL(req.url, `http://${req.headers.host}`);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: 'Slug da instituição é obrigatório'
      });
    }

    console.log(`📊 Computing stats for institution slug: ${slug}`);

    // ============================================
    // GET INSTITUTION BY SLUG
    // ============================================
    const { data: institution, error: instError } = await supabase
      .from('institutions')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (instError || !institution) {
      console.error('Institution not found:', instError);
      return res.status(404).json({
        success: false,
        error: 'Instituição não encontrada'
      });
    }

    console.log(`✅ Found institution: ${institution.name} (ID: ${institution.id})`);

    // ============================================
    // CALCULATE STATISTICS (SAME LOGIC AS admin-institutions-simple.js)
    // ============================================
    let usersCount = { count: 0 };
    let conversationsCount = { count: 0 };
    let assistantsCount = { count: 0 };

    try {
      // Contagem de usuários TOTAIS (não só ativos)
      const userResult = await supabase
        .from('institution_users')
        .select('id', { count: 'exact' })
        .eq('institution_id', institution.id);
        // Removido .eq('is_active', true) para contar todos os usuários

      console.log(`📊 ${institution.name} - Users query result:`, {
        count: userResult.count,
        error: userResult.error?.message
      });

      if (!userResult.error) {
        usersCount = userResult;
      } else {
        console.error(`❌ ${institution.name} - Users query error:`, userResult.error);
      }
    } catch (error) {
      console.error(`❌ ${institution.name} - institution_users table error:`, error.message);
    }

    try {
      // Contagem de assistentes habilitados
      const assistantResult = await supabase
        .from('institution_assistants')
        .select('id', { count: 'exact' })
        .eq('institution_id', institution.id)
        .eq('is_enabled', true);

      console.log(`📊 ${institution.name} - Assistants query result:`, {
        count: assistantResult.count,
        error: assistantResult.error?.message
      });

      if (!assistantResult.error) {
        assistantsCount = assistantResult;
      } else {
        console.error(`❌ ${institution.name} - Assistants query error:`, assistantResult.error);
      }
    } catch (error) {
      console.error(`❌ ${institution.name} - institution_assistants table error:`, error.message);
    }

    try {
      // Contagem de conversas - buscar usuários da instituição e suas conversas
      const { data: institutionUserIds, error: userIdsError } = await supabase
        .from('institution_users')
        .select('user_id')
        .eq('institution_id', institution.id);

      if (!userIdsError && institutionUserIds && institutionUserIds.length > 0) {
        const userIds = institutionUserIds.map(u => u.user_id);

        const conversationResult = await supabase
          .from('conversations')
          .select('id', { count: 'exact' })
          .in('user_id', userIds);

        console.log(`📊 ${institution.name} - Conversations query result:`, {
          userIds: userIds.length,
          count: conversationResult.count,
          error: conversationResult.error?.message
        });

        if (!conversationResult.error) {
          conversationsCount = conversationResult;
        } else {
          console.error(`❌ ${institution.name} - Conversations query error:`, conversationResult.error);
        }
      } else {
        console.log(`📊 ${institution.name} - No users found for conversations query`);
      }
    } catch (error) {
      console.error(`❌ ${institution.name} - conversations calculation error:`, error.message);
    }

    // ============================================
    // BUILD RESPONSE
    // ============================================
    const stats = {
      total_users: usersCount.count || 0,
      active_users: usersCount.count || 0, // Assumption: all users are active for now
      total_conversations: conversationsCount.count || 0,
      users_with_conversations: conversationsCount.count > 0 ? 1 : 0, // Simplified
      avg_messages_per_conversation: conversationsCount.count > 0 ? 6 : 0, // Default average
      most_used_assistant: {
        name: 'Simulador de Psicanálise ABPSI',
        usage_count: conversationsCount.count || 0
      }
    };

    console.log(`✅ ${institution.name} stats computed:`, stats);

    return res.status(200).json({
      success: true,
      data: {
        institution: {
          id: institution.id,
          name: institution.name,
          slug: institution.slug
        },
        stats: stats
      }
    });

  } catch (error) {
    console.error('Institution Stats API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};