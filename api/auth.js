const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  console.log('🚀 Auth function started');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // CORS Headers
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
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
    console.log('✅ Auth preflight handled');
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
    
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;

    // Extract user token for authentication
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    // Create user-specific client
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

    // Get user from token
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Route handling based on URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    
    console.log('Auth path parts:', pathParts);

    // Handle different auth endpoints
    if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'profile') {
      // GET /auth/profile - Get user profile
      return res.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata,
          created_at: user.created_at,
          updated_at: user.updated_at
        },
        message: 'Perfil recuperado com sucesso'
      });
    }
    
    else if (req.method === 'PUT' && pathParts.length === 2 && pathParts[1] === 'profile') {
      // PUT /auth/profile - Update user profile
      const updateData = req.body;
      
      // Use service role key for user updates
      const serviceClient = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await serviceClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          ...updateData
        }
      });

      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar perfil',
          error: error.message
        });
      }

      return res.json({
        success: true,
        data: data.user,
        message: 'Perfil atualizado com sucesso'
      });
    }

    else if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'access') {
      // GET /auth/access - Get user subscriptions and access
      const userId = user.id;

      // Get user subscriptions
      const { data: subscriptions, error: subError } = await userClient
        .from('user_subscriptions')
        .select(`
          *,
          assistants (
            id,
            name,
            description,
            icon,
            color_theme,
            monthly_price,
            semester_price
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      if (subError) {
        console.error('Error getting subscriptions:', subError);
      }

      // Get user packages
      const { data: packages, error: packageError } = await userClient
        .from('user_packages')
        .select(`
          *,
          assistants:user_package_assistants (
            assistants (
              id,
              name,
              description,
              icon,
              color_theme
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      if (packageError) {
        console.error('Error getting packages:', packageError);
      }

      return res.json({
        success: true,
        data: {
          subscriptions: subscriptions || [],
          packages: packages || []
        },
        message: 'Acesso do usuário recuperado com sucesso'
      });
    }

    else {
      return res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado'
      });
    }

  } catch (error) {
    console.error('💥 Auth function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};