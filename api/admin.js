const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  console.log('🚀 Admin function started');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // CORS Headers
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
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
    console.log('✅ Admin preflight handled');
    return res.status(200).end();
  }

  try {
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
    const isAdmin = user.user_metadata?.role === 'admin' || user.email === 'admin@neuroialab.com';
    
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Privilégios de administrador necessários.'
      });
    }

    // Route handling based on URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    
    console.log('Admin path parts:', pathParts);

    // Handle different admin endpoints
    if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'stats') {
      // GET /admin/stats - Get system statistics
      
      // Get total users
      const { count: totalUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: activeSubscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      // Get total conversations
      const { count: totalConversations, error: convsError } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true });

      // Calculate monthly revenue (simplified)
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const { data: monthlySubscriptions, error: revenueError } = await supabase
        .from('user_subscriptions')
        .select('plan, created_at')
        .gte('created_at', currentMonth + '-01T00:00:00.000Z')
        .lt('created_at', (parseInt(currentMonth.slice(0, 4)) + (currentMonth.slice(5, 7) === '12' ? 1 : 0)) + '-' + 
              String(parseInt(currentMonth.slice(5, 7)) === 12 ? 1 : parseInt(currentMonth.slice(5, 7)) + 1).padStart(2, '0') + 
              '-01T00:00:00.000Z');

      let monthlyRevenue = 0;
      if (monthlySubscriptions && !revenueError) {
        monthlyRevenue = monthlySubscriptions.reduce((sum, sub) => {
          return sum + (sub.plan === 'monthly' ? 39.9 : 199);
        }, 0);
      }

      return res.json({
        success: true,
        data: {
          totalUsers: totalUsers || 0,
          activeSubscriptions: activeSubscriptions || 0,
          monthlyRevenue: monthlyRevenue,
          totalConversations: totalConversations || 0
        },
        message: 'Estatísticas recuperadas com sucesso'
      });
    }

    else if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'users') {
      // GET /admin/users - List users with pagination
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_subscriptions!inner(count)
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (usersError) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar usuários',
          error: usersError.message
        });
      }

      // Get total count
      const { count: totalUsers, error: countError } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true });

      return res.json({
        success: true,
        data: {
          users: users || [],
          totalUsers: totalUsers || 0,
          currentPage: page,
          totalPages: Math.ceil((totalUsers || 0) / limit)
        },
        message: 'Usuários recuperados com sucesso'
      });
    }

    else if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'subscriptions') {
      // GET /admin/subscriptions - List subscriptions
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      const { data: subscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          user_profiles!inner(email, full_name),
          assistants!inner(name, icon)
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (subsError) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar assinaturas',
          error: subsError.message
        });
      }

      // Get total count
      const { count: totalSubscriptions, error: countError } = await supabase
        .from('user_subscriptions')
        .select('id', { count: 'exact', head: true });

      return res.json({
        success: true,
        data: {
          subscriptions: subscriptions || [],
          totalSubscriptions: totalSubscriptions || 0,
          currentPage: page,
          totalPages: Math.ceil((totalSubscriptions || 0) / limit)
        },
        message: 'Assinaturas recuperadas com sucesso'
      });
    }

    else if (req.method === 'PUT' && pathParts.length === 3 && pathParts[1] === 'subscriptions') {
      // PUT /admin/subscriptions/:id - Update subscription
      const subscriptionId = pathParts[2];
      const updateData = req.body;

      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar assinatura',
          error: error.message
        });
      }

      return res.json({
        success: true,
        data: subscription,
        message: 'Assinatura atualizada com sucesso'
      });
    }

    else if (req.method === 'PUT' && pathParts.length === 3 && pathParts[1] === 'assistants') {
      // PUT /admin/assistants/:id - Update assistant
      const assistantId = pathParts[2];
      const updateData = req.body;

      const { data: assistant, error } = await supabase
        .from('assistants')
        .update(updateData)
        .eq('id', assistantId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar assistente',
          error: error.message
        });
      }

      return res.json({
        success: true,
        data: assistant,
        message: 'Assistente atualizado com sucesso'
      });
    }

    else {
      return res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado'
      });
    }

  } catch (error) {
    console.error('💥 Admin function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};