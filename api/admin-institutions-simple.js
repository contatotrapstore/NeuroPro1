const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  console.log('🏛️ Admin Institutions Simple API');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  // CORS Headers
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'https://neuro-pro-frontend.vercel.app',
    'https://www.neuroialab.com.br',
    'https://neuroialab.com.br',
    'http://localhost:5173',
    'http://localhost:3000'
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

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Admin emails configuration
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

    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

    // Extract user token for authentication
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    // Create user-specific client for auth
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
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

    // Get user from token and verify admin role
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Check admin role
    const isAdmin = isAdminUser(user.email, user.user_metadata);

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Privilégios de administrador necessários.'
      });
    }

    // Parse query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const statusFilter = url.searchParams.get('status_filter') || 'all';
    const offset = (page - 1) * limit;

    console.log('📋 Query params:', { page, limit, search, statusFilter, offset });

    // GET - List institutions with stats
    if (req.method === 'GET') {
      // Build query
      let query = supabase
        .from('institutions')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      // Apply status filter
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      // Apply pagination
      query = query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      const { data: institutions, error: institutionsError, count } = await query;

      if (institutionsError) {
        console.error('Error fetching institutions:', institutionsError);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar instituições',
          details: institutionsError.message
        });
      }

      // Get stats for each institution
      const institutionsWithStats = await Promise.all(
        (institutions || []).map(async (institution) => {
          // Count users for this institution
          const { count: totalUsers } = await supabase
            .from('institution_users')
            .select('id', { count: 'exact', head: true })
            .eq('institution_id', institution.id);

          // Count active users (accessed in last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const { count: activeUsers } = await supabase
            .from('institution_users')
            .select('id', { count: 'exact', head: true })
            .eq('institution_id', institution.id)
            .eq('is_active', true)
            .gte('last_access', thirtyDaysAgo.toISOString());

          // Count assistants for this institution
          const { count: totalAssistants } = await supabase
            .from('institution_assistants')
            .select('id', { count: 'exact', head: true })
            .eq('institution_id', institution.id)
            .eq('is_enabled', true);

          // Get institution user IDs for conversation count
          const { data: institutionUserIds } = await supabase
            .from('institution_users')
            .select('user_id')
            .eq('institution_id', institution.id);

          let totalConversations = 0;
          if (institutionUserIds && institutionUserIds.length > 0) {
            const userIds = institutionUserIds.map(u => u.user_id);
            const { count: convCount } = await supabase
              .from('conversations')
              .select('id', { count: 'exact', head: true })
              .in('user_id', userIds);
            totalConversations = convCount || 0;
          }

          // Determine license status (simplified)
          let licenseStatus = 'unlimited';
          let licenseExpires = null;

          // Check if there's an institution subscription
          const { data: subscription } = await supabase
            .from('institution_user_subscriptions')
            .select('expires_at, status')
            .eq('institution_id', institution.id)
            .eq('status', 'active')
            .order('expires_at', { ascending: false })
            .limit(1)
            .single();

          if (subscription) {
            licenseExpires = subscription.expires_at;
            const expiresDate = new Date(subscription.expires_at);
            if (expiresDate < new Date()) {
              licenseStatus = 'expired';
            } else {
              licenseStatus = 'active';
            }
          }

          return {
            ...institution,
            stats: {
              total_users: totalUsers || 0,
              active_users: activeUsers || 0,
              total_conversations: totalConversations,
              total_assistants: totalAssistants || 0,
              license_status: licenseStatus,
              license_expires: licenseExpires
            }
          };
        })
      );

      const totalPages = Math.ceil((count || 0) / limit);

      console.log('✅ Returning', institutionsWithStats.length, 'institutions');

      return res.json({
        success: true,
        data: {
          institutions: institutionsWithStats,
          pagination: {
            total: count || 0,
            page,
            limit,
            total_pages: totalPages
          }
        },
        message: 'Instituições carregadas com sucesso'
      });
    }

    // POST - Create new institution
    else if (req.method === 'POST') {
      const newInstitution = req.body;

      if (!newInstitution.name || !newInstitution.slug) {
        return res.status(400).json({
          success: false,
          error: 'Nome e slug são obrigatórios'
        });
      }

      // Check if slug is unique
      const { data: existingSlug } = await supabase
        .from('institutions')
        .select('id')
        .eq('slug', newInstitution.slug)
        .single();

      if (existingSlug) {
        return res.status(400).json({
          success: false,
          error: 'Já existe uma instituição com esse slug'
        });
      }

      const { data: institution, error } = await supabase
        .from('institutions')
        .insert({
          name: newInstitution.name,
          slug: newInstitution.slug,
          logo_url: newInstitution.logo_url || null,
          primary_color: newInstitution.primary_color || '#0E1E03',
          secondary_color: newInstitution.secondary_color || '#1A3A0F',
          accent_color: newInstitution.accent_color || '#2D5A1F',
          contact_email: newInstitution.contact_email || null,
          phone: newInstitution.phone || null,
          website_url: newInstitution.website_url || null,
          custom_message: newInstitution.custom_message || null,
          is_active: true,
          settings: newInstitution.settings || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating institution:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao criar instituição',
          details: error.message
        });
      }

      return res.status(201).json({
        success: true,
        data: institution,
        message: 'Instituição criada com sucesso'
      });
    }

    else {
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('💥 Admin Institutions Simple error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};
