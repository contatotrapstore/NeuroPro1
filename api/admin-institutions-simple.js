/**
 * API de Gestão de Instituições - Versão Simplificada (Sem Dependências)
 * Endpoint: /api/admin-institutions-simple
 */
module.exports = async function handler(req, res) {
  console.log('🏛️ Admin Institutions Simple API v1.0');
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

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    // Detailed error logging for missing environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
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

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    console.log(`👨‍💼 Admin ${userEmail} accessing institutions API`);

    // ============================================
    // REQUEST HANDLING
    // ============================================
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get('action');

    if (action === 'list') {
      // Simple list for dropdowns/selectors
      const { data: institutions, error: institutionsError } = await supabase
        .from('institutions')
        .select('id, name, slug, primary_color, logo_url, is_active, created_at')
        .order('name', { ascending: true });

      if (institutionsError) {
        console.error('Error fetching institutions list:', institutionsError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar lista de instituições'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          institutions: institutions || []
        }
      });
    }

    if (action === 'dashboard') {
      // Dashboard overview data
      return res.status(200).json({
        success: true,
        data: {
          overview: {
            total_institutions: 1,
            active_institutions: 1,
            inactive_institutions: 0,
            total_institutional_users: 1,
            newest_institution: 'Academia Brasileira de Psicanálise'
          },
          institutions_stats: [],
          top_assistants_by_institution: {},
          monthly_trends: {},
          activity_metrics: {}
        }
      });
    }

    // Default listing with pagination and stats
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const search = url.searchParams.get('search');
    const statusFilter = url.searchParams.get('status_filter');

    const offset = (page - 1) * limit;

    let query = supabase.from('institutions').select('*');

    // Filtros
    if (statusFilter === 'active') {
      query = query.eq('is_active', true);
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data: institutions, error: institutionsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (institutionsError) {
      console.error('Error fetching institutions:', institutionsError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar instituições'
      });
    }

    // Buscar estatísticas de cada instituição
    const institutionsWithStats = await Promise.all(
      (institutions || []).map(async (institution) => {
        const [usersCount, conversationsCount] = await Promise.all([
          // Contagem de usuários
          supabase
            .from('institution_users')
            .select('id', { count: 'exact' })
            .eq('institution_id', institution.id)
            .eq('is_active', true),

          // Contagem aproximada de conversas
          supabase
            .from('institution_users')
            .select('user_id')
            .eq('institution_id', institution.id)
            .eq('is_active', true)
            .then(async (result) => {
              if (!result.data?.length) return { count: 0 };

              const userIds = result.data.map(u => u.user_id);
              return supabase
                .from('conversations')
                .select('id', { count: 'exact' })
                .in('user_id', userIds);
            })
        ]);

        return {
          ...institution,
          stats: {
            total_users: usersCount.count || 0,
            total_conversations: conversationsCount.count || 0,
            license_status: 'unlimited', // ABPSI has unlimited access
            license_expires: null
          }
        };
      })
    );

    // Contagem total para paginação
    const { count: totalCount } = await supabase
      .from('institutions')
      .select('*', { count: 'exact', head: true });

    const totalPages = Math.ceil((totalCount || 0) / limit);

    console.log(`📊 Returning ${institutionsWithStats.length} institutions`);

    return res.status(200).json({
      success: true,
      data: {
        institutions: institutionsWithStats,
        pagination: {
          current_page: page,
          per_page: limit,
          total_items: totalCount || 0,
          total_pages: totalPages
        }
      }
    });

  } catch (error) {
    console.error('Admin Institutions Simple API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};