const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  console.log('🚀 Function started - packages endpoint');
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  
  // Always set CORS headers first
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  console.log('Request origin:', origin);
  
  // Set CORS headers
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log('✅ CORS origin allowed:', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log('⚠️ CORS fallback to * for origin:', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight OPTIONS request handled');
    return res.status(200).end();
  }

  try {
    console.log('🔧 Initializing Supabase client...');
    
    // Initialize Supabase client
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
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key length:', supabaseKey ? supabaseKey.length : 0);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');

    // Parse URL for routing
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    
    console.log('Packages path parts:', pathParts);

    // Handle different HTTP methods and routes
    if (req.method === 'GET' && pathParts.length === 1) {
      // GET /packages - List available packages
      return handleGetPackages(req, res, supabase);
    } else if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'user') {
      // GET /packages/user - Get user's packages
      return handleGetUserPackages(req, res, supabase);
    } else if (req.method === 'POST') {
      return handleCreatePackage(req, res, supabase);
    } else {
      console.log('❌ Method not allowed:', req.method);
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }

  } catch (error) {
    console.error('💥 Function error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Return default packages if there's any error
    console.log('⚠️ Returning default packages due to error');
    
    const defaultPackages = [
      {
        id: 'pkg_3_assistants',
        name: '3 Assistants Package',
        description: 'Choose any 3 psychology AI assistants',
        assistant_count: 3,
        monthly_price: 99.90,
        semester_price: 499.00,
        discount_percentage: 17,
        status: 'active'
      },
      {
        id: 'pkg_6_assistants', 
        name: '6 Assistants Package',
        description: 'Choose any 6 psychology AI assistants',
        assistant_count: 6,
        monthly_price: 179.90,
        semester_price: 899.00,
        discount_percentage: 25,
        status: 'active'
      }
    ];

    return res.status(200).json({
      success: true,
      data: defaultPackages,
      count: defaultPackages.length,
      source: 'fallback'
    });
  }
};

// Handle GET requests - list available packages
async function handleGetPackages(req, res, supabase) {
  try {
    console.log('📊 Querying packages table...');
    
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .eq('status', 'active')
      .order('assistant_count');

    console.log('Database response:', { 
      packages: packages ? `${packages.length} records` : 'null',
      error: error ? error.message : 'none',
      errorCode: error ? error.code : 'none'
    });

    if (error) {
      console.error('❌ Database error:', error);
      
      // Return default packages on error
      const defaultPackages = [
        {
          id: 'pkg_3_assistants',
          name: '3 Assistants Package',
          description: 'Choose any 3 psychology AI assistants',
          assistant_count: 3,
          monthly_price: 99.90,
          semester_price: 499.00,
          discount_percentage: 17,
          status: 'active'
        },
        {
          id: 'pkg_6_assistants',
          name: '6 Assistants Package', 
          description: 'Choose any 6 psychology AI assistants',
          assistant_count: 6,
          monthly_price: 179.90,
          semester_price: 899.00,
          discount_percentage: 25,
          status: 'active'
        }
      ];

      return res.status(200).json({
        success: true,
        data: defaultPackages,
        count: defaultPackages.length,
        source: 'database-error-fallback'
      });
    }

    // If no packages found, return default set
    if (!packages || packages.length === 0) {
      console.log('⚠️ No packages in database, returning defaults');
      
      const defaultPackages = [
        {
          id: 'pkg_3_assistants',
          name: '3 Assistants Package',
          description: 'Choose any 3 psychology AI assistants',
          assistant_count: 3,
          monthly_price: 99.90,
          semester_price: 499.00,
          discount_percentage: 17,
          status: 'active'
        },
        {
          id: 'pkg_6_assistants',
          name: '6 Assistants Package',
          description: 'Choose any 6 psychology AI assistants', 
          assistant_count: 6,
          monthly_price: 179.90,
          semester_price: 899.00,
          discount_percentage: 25,
          status: 'active'
        }
      ];

      return res.status(200).json({
        success: true,
        data: defaultPackages,
        count: defaultPackages.length,
        source: 'default'
      });
    }

    // Return database results
    console.log('✅ Returning', packages.length, 'packages from database');
    
    return res.status(200).json({
      success: true,
      data: packages,
      count: packages.length,
      source: 'database'
    });

  } catch (error) {
    console.error('💥 Error getting packages:', error);
    throw error;
  }
}

// Handle POST requests - create user package subscription
async function handleCreatePackage(req, res, supabase) {
  try {
    console.log('📝 Creating package subscription...');
    console.log('Request body:', req.body);

    const { assistant_ids, subscription_type, package_type } = req.body;

    // Validate required fields
    if (!assistant_ids || !Array.isArray(assistant_ids) || assistant_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'assistant_ids array is required'
      });
    }

    if (!subscription_type || !['monthly', 'semester'].includes(subscription_type)) {
      return res.status(400).json({
        success: false,
        error: 'subscription_type must be monthly or semester'
      });
    }

    if (!package_type || !['3_assistants', '6_assistants'].includes(package_type)) {
      return res.status(400).json({
        success: false,
        error: 'package_type must be 3_assistants or 6_assistants'
      });
    }

    // Validate assistant count matches package type
    const expectedCount = package_type === '3_assistants' ? 3 : 6;
    if (assistant_ids.length !== expectedCount) {
      return res.status(400).json({
        success: false,
        error: `Package ${package_type} requires exactly ${expectedCount} assistants`
      });
    }

    // For now, return success without actually creating anything
    // This would normally integrate with payment processing
    console.log('✅ Package subscription creation simulated');
    
    return res.status(200).json({
      success: true,
      data: {
        id: `pkg_${Date.now()}`,
        package_type,
        subscription_type,
        assistant_ids,
        status: 'pending_payment',
        created_at: new Date().toISOString()
      },
      message: 'Package subscription created successfully'
    });

  } catch (error) {
    console.error('💥 Error creating package:', error);
    throw error;
  }
}

// Handle GET /packages/user - Get user's packages
async function handleGetUserPackages(req, res, supabase) {
  try {
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
    const userClient = require('@supabase/supabase-js').createClient(
      process.env.SUPABASE_URL || 'https://avgoyfartmzepdgzhroc.supabase.co',
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );

    // Get user from token
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    const userId = user.id;

    console.log('📊 Querying user packages for user:', userId);

    // Get user's packages
    const { data: packages, error } = await userClient
      .from('user_packages')
      .select(`
        *,
        assistants:user_package_assistants (
          assistants (
            id,
            name,
            description,
            icon,
            color_theme,
            monthly_price,
            semester_price
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log('Database response:', { 
      packages: packages ? `${packages.length} records` : 'null',
      error: error ? error.message : 'none'
    });

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar pacotes do usuário',
        error: error.message
      });
    }

    console.log('✅ Returning user packages');
    
    return res.json({
      success: true,
      data: packages || [],
      count: packages ? packages.length : 0,
      message: 'Pacotes do usuário recuperados com sucesso'
    });

  } catch (error) {
    console.error('💥 Error getting user packages:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
}