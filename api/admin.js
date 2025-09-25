module.exports = async function handler(req, res) {
  // 🚨 CORS HEADERS PRIMEIRO - PREVENTIVO CONTRA FALHAS
  console.log('🚀 Admin function started');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request origin:', req.headers.origin);

  // CORS Headers - SEMPRE definidos primeiro
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
    console.log('✅ Admin preflight handled');
    return res.status(200).end();
  }

  try {
    // Import modules INSIDE try/catch to prevent import failures
    const { createClient } = require('@supabase/supabase-js');

    // Admin configuration inline
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

    console.log('✅ Modules imported successfully');
    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('🔑 Supabase Configuration Check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length || 0,
      serviceKeyValid: supabaseServiceKey && supabaseServiceKey !== 'YOUR_SERVICE_ROLE_KEY_HERE',
      hasAnonKey: !!supabaseAnonKey
    });
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase configuration incomplete:', {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey
      });
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta',
        debug: {
          hasUrl: !!supabaseUrl,
          hasAnonKey: !!supabaseAnonKey
        }
      });
    }

    // Check if Service Role Key is properly configured
    if (!supabaseServiceKey || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
      console.error('❌ Service Role Key not configured properly');
      return res.status(500).json({
        success: false,
        error: 'Service Role Key não configurada. Configure a chave no arquivo .env',
        debug: {
          serviceKeySet: !!supabaseServiceKey,
          isPlaceholder: supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY_HERE'
        }
      });
    }
    
    // Use service key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Supabase admin client initialized with Service Role Key');

    // Field length limits for validation
    const ASSISTANT_FIELD_LIMITS = {
      id: 100,
      name: 100,
      area: 50,
      icon: 50,
      color_theme: 30,
      icon_type: 10,
      specialization: 100,
      description: 1000,        // TEXT field but reasonable limit
      full_description: 5000    // TEXT field but reasonable limit
    };

    // Validation functions
    const validateFieldLengths = (data, fieldLimits = ASSISTANT_FIELD_LIMITS) => {
      const errors = {};

      Object.keys(fieldLimits).forEach(field => {
        if (data[field] && typeof data[field] === 'string') {
          const value = data[field];
          const limit = fieldLimits[field];

          if (value.length > limit) {
            errors[field] = `Campo '${field}' excede o limite de ${limit} caracteres (atual: ${value.length})`;
          }
        }
      });

      return { errors, isValid: Object.keys(errors).length === 0 };
    };

    const truncateFields = (data, fieldLimits = ASSISTANT_FIELD_LIMITS) => {
      const truncated = { ...data };
      const truncatedFields = [];

      Object.keys(fieldLimits).forEach(field => {
        if (truncated[field] && typeof truncated[field] === 'string') {
          const limit = fieldLimits[field];
          if (truncated[field].length > limit) {
            truncated[field] = truncated[field].substring(0, limit);
            truncatedFields.push(`${field} (${limit} chars)`);
          }
        }
      });

      return { data: truncated, truncatedFields };
    };

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

    // Check admin role using shared admin configuration
    const isAdmin = isAdminUser(user.email, user.user_metadata);
    
    // Debug log for admin access
    console.log('🔍 Admin Access Check:', {
      userEmail: user.email,
      userMetadata: user.user_metadata,
      isAdmin: isAdmin
    });
    
    if (!isAdmin) {
      console.log('❌ Admin access denied for:', user.email);
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Privilégios de administrador necessários.',
        debug: {
          userEmail: user.email,
          isAdmin: isAdmin
        }
      });
    }
    
    console.log('✅ Admin access granted for:', user.email);

    // Route handling based on URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(part => part);
    
    console.log('Admin path parts:', pathParts);

    // Handle different admin endpoints
    
    if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'debug') {
      // GET /admin/debug - Debug endpoint for troubleshooting
      console.log('🔧 Debug endpoint called by:', user.email);
      
      return res.json({
        success: true,
        data: {
          userInfo: {
            email: user.email,
            emailLower: user.email?.toLowerCase(),
            hasAdminRole: user.user_metadata?.role === 'admin',
            userMetadata: user.user_metadata,
            userId: user.id
          },
          adminConfig: {
            adminEmails: ADMIN_EMAILS,
            isAdmin: isAdminUser(user.email, user.user_metadata),
            emailMatches: ADMIN_EMAILS.map(email => ({
              adminEmail: email,
              matches: email === user.email?.toLowerCase()
            }))
          },
          systemConfig: {
            serviceKeyConfigured: !!supabaseServiceKey && supabaseServiceKey !== 'YOUR_SERVICE_ROLE_KEY_HERE',
            serviceKeyLength: supabaseServiceKey?.length || 0,
            hasSupabaseUrl: !!supabaseUrl,
            nodeEnv: process.env.NODE_ENV
          },
          finalAccess: {
            isAdmin: isAdmin,
            accessGranted: true // Se chegou aqui, tem acesso
          }
        },
        message: 'Informações de debug coletadas'
      });
    }

    else if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'stats') {
      // GET /admin/stats - Get system statistics excluding admin accounts

      // Admin emails that should be excluded from stats
      const adminEmails = ['gouveiarx@gmail.com', 'psitales@gmail.com', 'psitales.sales@gmail.com'];

      // FALLBACK: Get users from database tables instead of auth.admin API
      let allUserIds = new Set();
      let adminUserIds = [];
      let totalUsers = 0;

      try {
        // Try auth.admin.listUsers() first
        const { data: allUsers, error: allUsersError } = await supabase.auth.admin.listUsers();

        if (allUsersError) {
          console.error('Error with auth.admin.listUsers, using fallback method:', {
            message: allUsersError.message,
            code: allUsersError.code,
            details: allUsersError.details,
            hint: allUsersError.hint,
            status: allUsersError.status
          });
          throw new Error('Using fallback method');
        }

        // Extract admin user IDs for filtering subscriptions
        const adminUsers = allUsers.users?.filter(user =>
          adminEmails.includes(user.email?.toLowerCase() || '')
        ) || [];
        adminUserIds = adminUsers.map(user => user.id);

        // Count total users excluding admins
        totalUsers = allUsers.users?.filter(user =>
          !adminEmails.includes(user.email?.toLowerCase() || '')
        ).length || 0;

        console.log('✅ Successfully used auth.admin.listUsers method');

      } catch (error) {
        console.log('🔄 Using fallback method to count users from database tables with real data');

        // Fallback: Get unique user IDs from subscriptions, conversations, and real profiles
        const [subscriptionsResult, conversationsResult, profilesResult] = await Promise.all([
          supabase.from('user_subscriptions').select('user_id').not('user_id', 'is', null),
          supabase.from('conversations').select('user_id').not('user_id', 'is', null),
          supabase.from('user_profiles').select('*') // Buscar dados reais dos perfis
        ]);

        // Combine all user IDs
        const subscriptionUserIds = subscriptionsResult.data?.map(s => s.user_id) || [];
        const conversationUserIds = conversationsResult.data?.map(c => c.user_id) || [];

        allUserIds = new Set([...subscriptionUserIds, ...conversationUserIds]);

        // Now we can identify admin users by email from real profiles data
        const realProfiles = profilesResult.data || [];
        const adminUsers = realProfiles.filter(profile =>
          adminEmails.includes(profile.email?.toLowerCase() || '')
        );
        adminUserIds = adminUsers.map(user => user.id);

        // Count total users excluding admins (using real profile data)
        const realUserIds = new Set(realProfiles.map(p => p.id));
        const nonAdminProfiles = realProfiles.filter(profile =>
          !adminEmails.includes(profile.email?.toLowerCase() || '')
        );

        // Use intersection of users found in activities and real profiles
        const activeUserIds = [...allUserIds].filter(id => realUserIds.has(id));
        const nonAdminActiveUsers = activeUserIds.filter(id => !adminUserIds.includes(id));
        totalUsers = nonAdminActiveUsers.length;

        console.log(`📊 Fallback method found ${totalUsers} real users (${realProfiles.length} total profiles, ${adminUserIds.length} admins excluded)`);
      }

      // Get active subscriptions (excluding admin subscriptions)
      const { data: allActiveSubscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      const nonAdminActiveSubscriptions = allActiveSubscriptions?.filter(sub => 
        !adminUserIds.includes(sub.user_id)
      ) || [];
      const activeSubscriptions = nonAdminActiveSubscriptions.length;

      // Get total conversations
      const { count: totalConversations, error: convsError } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true });

      // Calculate monthly revenue (excluding admin subscriptions)
      const currentMonth = new Date().toISOString().slice(0, 7);
      const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 7);
      
      const { data: allMonthlySubscriptions, error: revenueError } = await supabase
        .from('user_subscriptions')
        .select('subscription_type, assistant_id, user_id')
        .gte('created_at', `${currentMonth}-01T00:00:00.000Z`)
        .lt('created_at', `${nextMonth}-01T00:00:00.000Z`)
        .eq('status', 'active');

      const monthlySubscriptions = allMonthlySubscriptions?.filter(sub => 
        !adminUserIds.includes(sub.user_id)
      ) || [];

      // Get assistant prices for revenue calculation
      const { data: assistants, error: assistantsError } = await supabase
        .from('assistants')
        .select('id, monthly_price, semester_price');

      let monthlyRevenue = 0;
      if (monthlySubscriptions && assistants && !revenueError && !assistantsError) {
        const assistantPrices = {};
        assistants.forEach(a => {
          assistantPrices[a.id] = {
            monthly: a.monthly_price || 39.90,
            semester: a.semester_price || 199.00
          };
        });

        monthlyRevenue = monthlySubscriptions.reduce((sum, sub) => {
          const prices = assistantPrices[sub.assistant_id] || { monthly: 39.90, semester: 199.00 };
          return sum + (sub.subscription_type === 'monthly' ? prices.monthly : prices.semester);
        }, 0);
      }

      // Get recent conversations (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const { count: recentConversations, error: recentConvsError } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Calculate total active revenue (all active subscriptions excluding admins)
      const { data: allActiveSubscriptionsData, error: activeRevError } = await supabase
        .from('user_subscriptions')
        .select('subscription_type, assistant_id, user_id')
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      const activeSubscriptionsData = allActiveSubscriptionsData?.filter(sub => 
        !adminUserIds.includes(sub.user_id)
      ) || [];

      let totalActiveRevenue = 0;
      if (activeSubscriptionsData && assistants && !activeRevError && !assistantsError) {
        const assistantPrices = {};
        assistants.forEach(a => {
          assistantPrices[a.id] = {
            monthly: a.monthly_price || 39.90,
            semester: a.semester_price || 199.00
          };
        });

        totalActiveRevenue = activeSubscriptionsData.reduce((sum, sub) => {
          const prices = assistantPrices[sub.assistant_id] || { monthly: 39.90, semester: 199.00 };
          return sum + (sub.subscription_type === 'monthly' ? prices.monthly : prices.semester);
        }, 0);
      }

      return res.json({
        success: true,
        data: {
          totalUsers: totalUsers,
          activeSubscriptions: activeSubscriptions || 0,
          activePackages: 0, // Packages não implementados ainda
          recentConversations: recentConversations || 0,
          monthlyRevenue: monthlyRevenue,
          totalActiveRevenue: totalActiveRevenue
        },
        message: 'Estatísticas recuperadas com sucesso'
      });
    }

    else if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'users') {
      // GET /admin/users - List ALL users (with and without subscriptions)
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      let allUsers = { users: [] };
      let usersError = null;

      try {
        // Try to get ALL users from auth.users using Service Role Key
        const result = await supabase.auth.admin.listUsers();

        if (result.error) {
          console.error('Error with auth.admin.listUsers for /admin/users, using fallback:', {
            message: result.error.message,
            code: result.error.code,
            details: result.error.details,
            hint: result.error.hint,
            status: result.error.status
          });
          throw new Error('Using fallback method for users endpoint');
        }

        allUsers = result.data;
        console.log('✅ Successfully used auth.admin.listUsers for /admin/users endpoint');

      } catch (error) {
        console.log('🔄 Using fallback method for /admin/users endpoint with real data');

        // Fallback: Build user list from subscription, conversation data AND real profiles
        const [subscriptionsResult, conversationsResult, profilesResult] = await Promise.all([
          supabase.from('user_subscriptions').select('user_id, created_at').not('user_id', 'is', null),
          supabase.from('conversations').select('user_id, created_at').not('user_id', 'is', null),
          supabase.from('user_profiles').select('*') // Buscar dados reais dos perfis
        ]);

        // Create map of real profiles
        const profilesMap = {};
        const realProfiles = profilesResult.data || [];
        realProfiles.forEach(profile => {
          profilesMap[profile.id] = profile;
        });

        // Get active user IDs from subscriptions and conversations
        const userIds = new Set([
          ...(subscriptionsResult.data?.map(s => s.user_id) || []),
          ...(conversationsResult.data?.map(c => c.user_id) || [])
        ]);

        // Build user list using REAL profile data when available
        allUsers = {
          users: Array.from(userIds).map(userId => {
            const profile = profilesMap[userId];

            if (profile) {
              // Use REAL data from profile
              return {
                id: profile.id,
                email: profile.email,
                created_at: profile.created_at,
                last_sign_in_at: profile.last_sign_in_at,
                email_confirmed_at: profile.email_confirmed_at,
                user_metadata: profile.user_metadata || {},
                full_name: profile.full_name,
                updated_at: profile.updated_at
              };
            } else {
              // Only use fallback if profile doesn't exist
              const firstActivity = subscriptionsResult.data?.find(s => s.user_id === userId) ||
                                  conversationsResult.data?.find(c => c.user_id === userId);

              return {
                id: userId,
                email: `user-${userId.slice(-8)}@neuroialab.com.br`, // Better fallback domain
                created_at: firstActivity?.created_at || new Date().toISOString(),
                last_sign_in_at: null,
                email_confirmed_at: null,
                user_metadata: {}
              };
            }
          })
        };

        const realDataCount = allUsers.users.filter(u => profilesMap[u.id]).length;
        const fallbackCount = allUsers.users.length - realDataCount;
        console.log(`📊 Fallback method: ${realDataCount} users with REAL data, ${fallbackCount} with fallback data (${allUsers.users.length} total)`);
      }

      if (usersError) {
        console.error('Error fetching all users:', usersError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar usuários',
          error: usersError.message
        });
      }

      // Then get subscription data to enrich user information
      const { data: allSubscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('user_id, created_at, status, expires_at, package_type, assistant_id')
        .order('created_at', { ascending: false });

      if (subsError) {
        console.error('Error fetching subscriptions:', subsError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar assinaturas',
          error: subsError.message
        });
      }

      // Admin emails that should be marked
      const adminEmails = ['gouveiarx@gmail.com', 'psitales@gmail.com', 'psitales.sales@gmail.com'];

      // Create user map from ALL users (with and without subscriptions)
      const userMap = new Map();

      // Initialize ALL users first from auth.users
      if (allUsers.users) {
        allUsers.users.forEach(user => {
          const isAdmin = adminEmails.includes(user.email?.toLowerCase() || '');
          userMap.set(user.id, {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            email_confirmed_at: user.email_confirmed_at,
            user_metadata: user.user_metadata,
            active_subscriptions: 0,
            active_packages: 0,
            is_admin: isAdmin
          });
        });
      }
      
      // Add subscription and package counts
      if (allSubscriptions) {
        allSubscriptions.forEach(sub => {
          if (!sub.user_id || !userMap.has(sub.user_id)) return;
          
          const user = userMap.get(sub.user_id);
          
          if (sub.status === 'active' && new Date(sub.expires_at) > new Date()) {
            // Se tem package_type e é um pacote, conta como pacote
            if (sub.package_type === 'package_3' || sub.package_type === 'package_6') {
              user.active_packages++;
            } else {
              // Senão conta como assinatura individual (inclusive quando package_type é null, undefined ou 'individual')
              user.active_subscriptions++;
            }
          }
        });
      }

      // Get all assistants to calculate available assistants for each user
      const { data: allAssistants, error: assistantsError } = await supabase
        .from('assistants')
        .select('id, name, icon, icon_url, icon_type, color_theme')
        .eq('is_active', true);

      if (assistantsError) {
        console.error('Error fetching assistants for user calculation:', assistantsError);
      }

      // Add available assistants information to each user
      for (const [userId, user] of userMap) {
        if (allAssistants) {
          // Get user's subscribed assistants
          const userSubscriptions = allSubscriptions?.filter(sub => 
            sub.user_id === userId && 
            sub.status === 'active' && 
            new Date(sub.expires_at) > new Date()
          ) || [];

          const subscribedAssistantIds = userSubscriptions.map(sub => sub.assistant_id);
          
          // Filter available assistants
          const availableAssistants = allAssistants
            .filter(assistant => !subscribedAssistantIds.includes(assistant.id))
            .slice(0, 5); // Limit to 5 for display

          user.availableAssistants = availableAssistants;
        } else {
          user.availableAssistants = [];
        }
      }

      // Convert map to array, sort by creation date (newest first), and paginate
      const allUsersList = Array.from(userMap.values());
      allUsersList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const paginatedUsers = allUsersList.slice(offset, offset + limit);
      const totalUsers = allUsersList.length;

      return res.json({
        success: true,
        data: paginatedUsers,
        pagination: {
          totalUsers: totalUsers,
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          limit: limit
        },
        message: 'Usuários recuperados com sucesso'
      });
    }

    else if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'subscriptions') {
      // GET /admin/subscriptions - List subscriptions with assistant info
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      // Get subscriptions with assistant data
      const { data: subscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          assistants (
            id,
            name,
            icon,
            description
          )
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (subsError) {
        console.error('Error fetching subscriptions:', subsError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar assinaturas',
          error: subsError.message
        });
      }

      // Format subscriptions with user placeholder data
      const formattedSubscriptions = (subscriptions || []).map(sub => ({
        ...sub,
        user: {
          email: `user_${sub.user_id.slice(0, 8)}@neuroialab.com`,
          full_name: `Usuário ${sub.user_id.slice(0, 8)}`
        }
      }));

      // Get total count
      const { count: totalSubscriptions, error: countError } = await supabase
        .from('user_subscriptions')
        .select('id', { count: 'exact', head: true });

      return res.json({
        success: true,
        data: {
          subscriptions: formattedSubscriptions,
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

    else if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'assistants') {
      // GET /admin/assistants - List all assistants with stats
      const { data: assistants, error: assistantsError } = await supabase
        .from('assistants')
        .select('*')
        .order('name', { ascending: true });

      if (assistantsError) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar assistentes',
          error: assistantsError.message
        });
      }

      // Get stats for each assistant
      const assistantsWithStats = await Promise.all(
        (assistants || []).map(async (assistant) => {
          // Count active subscriptions for this assistant
          const { count: activeCount } = await supabase
            .from('user_subscriptions')
            .select('id', { count: 'exact', head: true })
            .eq('assistant_id', assistant.id)
            .eq('status', 'active')
            .gte('expires_at', new Date().toISOString());

          // Count recent conversations
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const { count: conversationCount } = await supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('assistant_id', assistant.id)
            .gte('created_at', thirtyDaysAgo.toISOString());

          return {
            ...assistant,
            stats: {
              activeSubscriptions: activeCount || 0,
              recentConversations: conversationCount || 0,
              monthlyRevenue: (activeCount || 0) * (assistant.monthly_price || 39.90)
            }
          };
        })
      );

      return res.json({
        success: true,
        data: assistantsWithStats,
        message: 'Assistentes recuperados com sucesso'
      });
    }

    else if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'assistants') {
      // POST /admin/assistants - Create new assistant
      const newAssistant = req.body;

      console.log('🆕 Creating new assistant:', {
        name: newAssistant.name,
        area: newAssistant.area,
        hasId: !!newAssistant.id
      });
      
      // Validate required fields
      if (!newAssistant.name || !newAssistant.description) {
        return res.status(400).json({
          success: false,
          error: 'Nome e descrição são obrigatórios'
        });
      }

      // Generate ID if not provided (for new assistants)
      if (!newAssistant.id) {
        // Generate a safe ID from the name
        const safeId = newAssistant.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
          .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
          .replace(/-+/g, '-') // Replace multiple hyphens with single
          .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
          .substring(0, 30); // Limit to 30 chars to leave room for timestamp

        // Use last 8 digits of timestamp for uniqueness
        const timestamp = Date.now().toString().slice(-8);
        newAssistant.id = `${safeId}-${timestamp}`.substring(0, 100); // Updated to new limit

        console.log('🆔 Generated ID:', newAssistant.id, '(length:', newAssistant.id.length, ')');
      }

      // Validate all field lengths using our validation function
      const validation = validateFieldLengths(newAssistant);
      if (!validation.isValid) {
        console.error('❌ Field validation failed:', validation.errors);
        const errorMessages = Object.values(validation.errors);
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos: ' + errorMessages.join(', '),
          details: validation.errors
        });
      }

      // Add audit trail data
      newAssistant.created_by = user.id;
      newAssistant.updated_by = user.id;
      newAssistant.created_at = new Date().toISOString();
      newAssistant.updated_at = new Date().toISOString();
      
      // Set defaults if not provided
      newAssistant.monthly_price = newAssistant.monthly_price || 39.90;
      newAssistant.semester_price = newAssistant.semester_price || 199.00;
      newAssistant.area = newAssistant.area || 'Psicologia';
      newAssistant.is_active = newAssistant.is_active !== undefined ? newAssistant.is_active : true;
      newAssistant.icon_type = newAssistant.icon_type || 'svg';
      newAssistant.icon = newAssistant.icon || 'brain';
      newAssistant.color_theme = newAssistant.color_theme || '#2D5A1F';
      newAssistant.features = newAssistant.features || [];
      newAssistant.order_index = newAssistant.order_index || 0;
      newAssistant.openai_assistant_id = newAssistant.openai_assistant_id || newAssistant.id;

      console.log('📝 Assistant data prepared:', {
        id: newAssistant.id,
        name: newAssistant.name,
        area: newAssistant.area,
        monthly_price: newAssistant.monthly_price,
        is_active: newAssistant.is_active
      });

      const { data: assistant, error } = await supabase
        .from('assistants')
        .insert(newAssistant)
        .select()
        .single();

      if (error) {
        console.error('Error creating assistant:', error);

        // Check for specific database constraint errors
        let errorMessage = 'Erro ao criar assistente';
        if (error.message.includes('value too long')) {
          errorMessage = 'Nome do assistente é muito longo. Tente um nome mais curto.';
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'Já existe um assistente com esse ID. Tente novamente.';
        }

        return res.status(500).json({
          success: false,
          message: errorMessage,
          error: error.message
        });
      }

      // Auto-create subscriptions for admin users using RPC function
      console.log('🔄 Auto-creating admin subscriptions for new assistant:', assistant.id);

      try {
        const { error: rpcError } = await supabase.rpc('setup_admin_subscriptions_for_assistant', {
          p_assistant_id: assistant.id
        });

        if (rpcError) {
          console.warn('⚠️ Note: Could not create admin subscriptions:', rpcError.message);
          // Don't fail the assistant creation if subscription creation fails
        } else {
          console.log('✅ Created admin subscriptions via RPC function');
        }
      } catch (adminSubError) {
        console.warn('⚠️ Note: Admin subscription creation failed:', adminSubError.message);
        // Don't fail the assistant creation if subscription creation fails
      }

      // Log action in audit trail
      await supabase
        .from('admin_audit_log')
        .insert({
          admin_id: user.id,
          action: 'create',
          entity_type: 'assistant',
          entity_id: assistant.id,
          new_data: assistant,
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent']
        });

      return res.status(201).json({
        success: true,
        data: assistant,
        message: 'Assistente criado com sucesso'
      });
    }

    else if (req.method === 'PUT' && pathParts.length === 3 && pathParts[1] === 'assistants') {
      // PUT /admin/assistants/:id - Update assistant
      const assistantId = pathParts[2];
      const updateData = req.body;

      console.log('📝 Updating assistant:', {
        id: assistantId,
        fields: Object.keys(updateData),
        name: updateData.name
      });

      // Get current data for audit log
      const { data: oldAssistant, error: fetchError } = await supabase
        .from('assistants')
        .select('*')
        .eq('id', assistantId)
        .single();

      if (fetchError || !oldAssistant) {
        console.error('Assistant not found for update:', fetchError);
        return res.status(404).json({
          success: false,
          error: 'Assistente não encontrado'
        });
      }

      // Clean and prepare update data - remove only calculated/non-editable fields
      const {
        subscription_count,
        total_conversations,
        last_used_at,
        stats, // Remove stats field that might be sent from frontend
        id, // Don't allow ID changes
        ...validFields
      } = updateData;

      const cleanUpdateData = { ...validFields };
      
      // Add audit trail
      cleanUpdateData.updated_by = user.id;
      cleanUpdateData.updated_at = new Date().toISOString();

      // Ensure numeric fields are properly typed
      if (cleanUpdateData.monthly_price) {
        cleanUpdateData.monthly_price = parseFloat(cleanUpdateData.monthly_price);
      }
      if (cleanUpdateData.semester_price) {
        cleanUpdateData.semester_price = parseFloat(cleanUpdateData.semester_price);
      }
      if (cleanUpdateData.order_index) {
        cleanUpdateData.order_index = parseInt(cleanUpdateData.order_index);
      }

      // Validate all field lengths for update
      const validation = validateFieldLengths(cleanUpdateData);
      if (!validation.isValid) {
        console.error('❌ Update validation failed:', validation.errors);
        const errorMessages = Object.values(validation.errors);
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos: ' + errorMessages.join(', '),
          details: validation.errors
        });
      }

      console.log('🔄 Clean update data:', {
        fieldsToUpdate: Object.keys(cleanUpdateData),
        monthly_price: cleanUpdateData.monthly_price,
        is_active: cleanUpdateData.is_active
      });

      const { data: assistant, error } = await supabase
        .from('assistants')
        .update(cleanUpdateData)
        .eq('id', assistantId)
        .select()
        .single();

      if (error) {
        console.error('Error updating assistant:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar assistente',
          error: error.message
        });
      }

      // Log action in audit trail
      if (oldAssistant) {
        const changes = {};
        Object.keys(updateData).forEach(key => {
          if (oldAssistant[key] !== updateData[key]) {
            changes[key] = {
              old: oldAssistant[key],
              new: updateData[key]
            };
          }
        });

        await supabase
          .from('admin_audit_log')
          .insert({
            admin_id: user.id,
            action: 'update',
            entity_type: 'assistant',
            entity_id: assistantId,
            old_data: oldAssistant,
            new_data: assistant,
            changes: changes,
            ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
          });
      }

      return res.json({
        success: true,
        data: assistant,
        message: 'Assistente atualizado com sucesso'
      });
    }

    else if (req.method === 'DELETE' && pathParts.length === 3 && pathParts[1] === 'assistants') {
      // DELETE /admin/assistants/:id - Delete assistant (hard delete)
      const assistantId = pathParts[2];
      
      console.log('🗑️ Iniciando exclusão de assistente:', assistantId);

      // Get current data for audit log
      const { data: assistantToDelete, error: findError } = await supabase
        .from('assistants')
        .select('*')
        .eq('id', assistantId)
        .single();
        
      console.log('🔍 Assistente encontrado:', assistantToDelete, 'Erro:', findError);

      if (!assistantToDelete) {
        console.log('❌ Assistente não encontrado para exclusão');
        return res.status(404).json({
          success: false,
          message: 'Assistente não encontrado'
        });
      }

      // Check if assistant has active subscriptions (excluding admin subscriptions)
      const adminUserIds = [
        'b31367e7-a725-41b9-8cc2-d583a6ea84cd', // gouveiarx@gmail.com
        'b421c5fd-c416-4cee-a9a6-5e680ee18e63'  // psitales.sales@gmail.com
      ];

      const { count: activeSubscriptions, error: subError } = await supabase
        .from('user_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('assistant_id', assistantId)
        .eq('status', 'active')
        .not('user_id', 'in', `(${adminUserIds.join(',')})`); // Exclude admin subscriptions

      console.log('📊 Assinaturas ativas (excluindo admins):', activeSubscriptions, 'Erro:', subError);

      if (activeSubscriptions > 0) {
        return res.status(400).json({
          success: false,
          message: `Não é possível excluir assistente. Existem ${activeSubscriptions} usuário(s) pagante(s) com assinatura ativa.`
        });
      }

      // Hard delete - remove completely from database
      console.log('💥 Procedendo com exclusão física do assistente');
      const { error } = await supabase
        .from('assistants')
        .delete()
        .eq('id', assistantId);

      if (error) {
        console.error('Error deleting assistant:', error);
        return res.status(500).json({
          success: false,
          message: 'Erro ao excluir assistente',
          error: error.message
        });
      }

      // Log action in audit trail
      await supabase
        .from('admin_audit_log')
        .insert({
          admin_id: user.id,
          action: 'delete',
          entity_type: 'assistant',
          entity_id: assistantId,
          old_data: assistantToDelete,
          new_data: null,
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent']
        });

      return res.json({
        success: true,
        data: null,
        message: 'Assistente excluído com sucesso'
      });
    }

    else if (req.method === 'GET' && pathParts.length === 4 && pathParts[1] === 'assistants' && pathParts[3] === 'stats') {
      // GET /admin/assistants/:id/stats - Get assistant statistics
      const assistantId = pathParts[2];

      const [
        { count: subscriptionCount },
        { count: conversationCount },
        { data: recentActivity }
      ] = await Promise.all([
        // Active subscriptions count
        supabase
          .from('user_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('assistant_id', assistantId)
          .eq('status', 'active'),
        
        // Total conversations count
        supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('assistant_id', assistantId),
        
        // Recent activity (last 30 days)
        supabase
          .from('conversations')
          .select('created_at')
          .eq('assistant_id', assistantId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      // Calculate monthly revenue
      const monthlyRevenue = subscriptionCount * 39.90;

      // Update assistant stats
      await supabase
        .from('assistants')
        .update({
          subscription_count: subscriptionCount,
          total_conversations: conversationCount,
          last_used_at: recentActivity?.[0]?.created_at
        })
        .eq('id', assistantId);

      return res.json({
        success: true,
        data: {
          subscriptionCount,
          conversationCount,
          monthlyRevenue,
          recentActivity: recentActivity?.length || 0,
          lastUsed: recentActivity?.[0]?.created_at
        },
        message: 'Estatísticas recuperadas com sucesso'
      });
    }

    else if (req.method === 'GET' && pathParts.length === 4 && pathParts[1] === 'users' && pathParts[3] === 'available-assistants') {
      // GET /admin/users/:id/available-assistants - List all assistants with user access info
      const userId = pathParts[2];

      console.log('📋 Getting available assistants for user:', userId);

      try {
        // Get all assistants
        const { data: assistants, error: assistantsError } = await supabase
          .from('assistants')
          .select('id, name, icon, icon_url, is_active')
          .eq('is_active', true)
          .order('name');

        if (assistantsError) {
          console.error('Error fetching assistants:', assistantsError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao buscar assistentes'
          });
        }

        // Get user's current subscriptions
        const { data: userSubscriptions, error: subscriptionsError } = await supabase
          .from('user_subscriptions')
          .select('assistant_id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .gte('expires_at', new Date().toISOString());

        if (subscriptionsError) {
          console.error('Error fetching user subscriptions:', subscriptionsError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao buscar assinaturas do usuário'
          });
        }

        const userAssistantIds = userSubscriptions?.map(sub => sub.assistant_id) || [];

        // Combine data
        const availableAssistants = assistants?.map(assistant => ({
          id: assistant.id,
          name: assistant.name,
          icon: assistant.icon_url || assistant.icon,
          hasAccess: userAssistantIds.includes(assistant.id)
        })) || [];

        console.log('✅ Available assistants loaded:', availableAssistants.length);

        return res.json({
          success: true,
          data: availableAssistants,
          message: 'Assistentes disponíveis carregados com sucesso'
        });

      } catch (error) {
        console.error('Error getting available assistants:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    }

    else if (req.method === 'POST' && pathParts.length === 4 && pathParts[1] === 'users' && pathParts[3] === 'assistants') {
      // POST /admin/users/:id/assistants - Manage user assistant access
      const userId = pathParts[2];
      const { assistantIds, action } = req.body;

      console.log('🔄 Managing user assistants:', { userId, assistantIds, action });

      if (!assistantIds || !Array.isArray(assistantIds) || assistantIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'assistantIds é obrigatório e deve ser um array não vazio'
        });
      }

      if (!['add', 'remove'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'action deve ser "add" ou "remove"'
        });
      }

      try {
        if (action === 'add') {
          // First, get assistant pricing information
          const { data: assistants, error: assistantsError } = await supabase
            .from('assistants')
            .select('id, monthly_price, semester_price')
            .in('id', assistantIds);

          if (assistantsError) {
            console.error('Error fetching assistants:', assistantsError);
            return res.status(500).json({
              success: false,
              error: 'Erro ao buscar informações dos assistentes'
            });
          }

          if (!assistants || assistants.length === 0) {
            return res.status(400).json({
              success: false,
              error: 'Nenhum assistente encontrado com os IDs fornecidos'
            });
          }

          // Create a map for quick price lookup with proper type conversion
          console.log('📊 Raw assistant data from DB:', assistants);
          
          const assistantPriceMap = assistants.reduce((map, assistant) => {
            const monthlyPrice = parseFloat(assistant.monthly_price) || 39.90;
            const semesterPrice = parseFloat(assistant.semester_price) || 199.00;
            
            console.log(`💰 Processing prices for ${assistant.id}:`, {
              raw_monthly: assistant.monthly_price,
              raw_semester: assistant.semester_price,
              parsed_monthly: monthlyPrice,
              parsed_semester: semesterPrice
            });
            
            map[assistant.id] = {
              monthly_price: monthlyPrice,
              semester_price: semesterPrice
            };
            return map;
          }, {});
          
          console.log('🗂️ Final price map:', assistantPriceMap);

          // Add subscriptions with proper amount field
          const subscriptionsToAdd = assistantIds.map(assistantId => {
            const priceInfo = assistantPriceMap[assistantId];
            if (!priceInfo) {
              throw new Error(`Assistente ${assistantId} não encontrado`);
            }
            
            // Ensure amount is a valid number
            const amount = Number(priceInfo.monthly_price);
            if (isNaN(amount) || amount <= 0) {
              console.error(`Invalid amount for assistant ${assistantId}:`, priceInfo.monthly_price);
              throw new Error(`Preço inválido para assistente ${assistantId}`);
            }
            
            return {
              user_id: userId,
              assistant_id: assistantId,
              subscription_type: 'monthly',
              amount: amount,
              status: 'active',
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          });

          const { error: insertError } = await supabase
            .from('user_subscriptions')
            .insert(subscriptionsToAdd);

          if (insertError) {
            console.error('Error adding subscriptions:', insertError);
            console.error('Insert error details:', insertError.details);
            console.error('Insert error code:', insertError.code);
            
            // Handle specific errors
            let errorMessage = 'Erro ao adicionar assinaturas';
            
            if (insertError.code === '23505') { // Unique constraint violation
              errorMessage = 'Usuário já possui assinatura para um ou mais assistentes selecionados';
            } else if (insertError.code === '23503') { // Foreign key violation
              errorMessage = 'Assistente ou usuário não encontrado no sistema';
            } else if (insertError.code === '23514') { // Check constraint violation
              errorMessage = 'Dados inválidos fornecidos para a assinatura';
            }
            
            return res.status(400).json({
              success: false,
              error: errorMessage,
              details: insertError.message,
              code: insertError.code
            });
          }

          console.log('✅ Added assistants to user:', assistantIds);
        } else {
          // Remove subscriptions
          const { error: deleteError } = await supabase
            .from('user_subscriptions')
            .delete()
            .eq('user_id', userId)
            .in('assistant_id', assistantIds);

          if (deleteError) {
            console.error('Error removing subscriptions:', deleteError);
            return res.status(500).json({
              success: false,
              error: 'Erro ao remover assinaturas'
            });
          }

          console.log('✅ Removed assistants from user:', assistantIds);
        }

        // Log audit trail
        await supabase
          .from('admin_audit_log')
          .insert({
            admin_id: user.id,
            action: action === 'add' ? 'create' : 'delete',
            entity_type: 'subscription',
            entity_id: userId,
            changes: {
              assistants: assistantIds,
              action: action
            },
            ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            user_agent: req.headers['user-agent']
          });

        return res.json({
          success: true,
          data: { assistantIds, action },
          message: `Assistentes ${action === 'add' ? 'adicionados' : 'removidos'} com sucesso`
        });

      } catch (error) {
        console.error('Error managing user assistants:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    }

    else if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'seed') {
      // POST /admin/seed - Seed database with test data (development only)
      if (process.env.NODE_ENV === 'production' && !url.searchParams.get('force')) {
        return res.status(403).json({
          success: false,
          error: 'Seed endpoint is disabled in production. Add ?force=true to override.'
        });
      }

      console.log('🌱 Starting database seed...');

      // Check if we already have data
      const { count: existingCount } = await supabase
        .from('user_subscriptions')
        .select('id', { count: 'exact', head: true });

      if (existingCount && existingCount > 10) {
        return res.json({
          success: true,
          message: 'Database already has sufficient data',
          data: { existingCount }
        });
      }

      // Get all assistants
      const { data: assistants, error: assistantsError } = await supabase
        .from('assistants')
        .select('id, name');

      if (assistantsError || !assistants || assistants.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'No assistants found in database'
        });
      }

      // Create test subscriptions
      const testUserIds = [
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        'c3d4e5f6-a7b8-9012-cdef-345678901234',
        'd4e5f6a7-b8c9-0123-defa-456789012345',
        'e5f6a7b8-c9d0-1234-efab-567890123456'
      ];

      const subscriptionTypes = ['monthly', 'semester'];
      const statuses = ['active', 'active', 'active', 'cancelled', 'expired'];
      
      const subscriptions = [];
      const now = new Date();

      testUserIds.forEach((userId, userIndex) => {
        // Each user gets 1-3 subscriptions
        const numSubscriptions = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numSubscriptions; i++) {
          const assistant = assistants[Math.floor(Math.random() * assistants.length)];
          const type = subscriptionTypes[Math.floor(Math.random() * 2)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          // Calculate dates
          const createdAt = new Date(now);
          createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 90)); // Random date in last 90 days
          
          const expiresAt = new Date(createdAt);
          if (type === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          } else {
            expiresAt.setMonth(expiresAt.getMonth() + 6);
          }
          
          // Adjust expiry for cancelled/expired
          if (status === 'expired') {
            expiresAt.setDate(expiresAt.getDate() - Math.floor(Math.random() * 30));
          }

          subscriptions.push({
            user_id: userId,
            assistant_id: assistant.id,
            subscription_type: type,
            status: status,
            created_at: createdAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            updated_at: createdAt.toISOString()
          });
        }
      });

      // Insert subscriptions
      const { data: insertedSubs, error: insertError } = await supabase
        .from('user_subscriptions')
        .insert(subscriptions)
        .select();

      if (insertError) {
        console.error('Error inserting test subscriptions:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Failed to insert test data',
          details: insertError.message
        });
      }

      // Create some test conversations
      const conversations = [];
      testUserIds.forEach(userId => {
        const numConversations = Math.floor(Math.random() * 5) + 1;
        
        for (let i = 0; i < numConversations; i++) {
          const assistant = assistants[Math.floor(Math.random() * assistants.length)];
          const createdAt = new Date(now);
          createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
          
          conversations.push({
            user_id: userId,
            assistant_id: assistant.id,
            title: `Conversa teste ${i + 1} - ${assistant.name}`,
            created_at: createdAt.toISOString(),
            updated_at: createdAt.toISOString()
          });
        }
      });

      const { data: insertedConvs, error: convError } = await supabase
        .from('conversations')
        .insert(conversations)
        .select();

      if (convError) {
        console.error('Error inserting test conversations:', convError);
      }

      return res.json({
        success: true,
        message: 'Test data created successfully',
        data: {
          subscriptions: insertedSubs?.length || 0,
          conversations: insertedConvs?.length || 0
        }
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
    console.error('💥 Error stack:', error.stack);
    console.error('💥 Error at line:', error.stack?.split('\n')[1]);

    // Ensure CORS headers are set even in error cases (fallback protection)
    if (!res.headersSent) {
      const origin = req.headers.origin;
      const allowedOrigins = [
        'https://neuroai-lab.vercel.app',
        'https://neuro-pro-frontend.vercel.app',
        'https://www.neuroialab.com.br',
        'https://neuroialab.com.br',
        'http://localhost:5173',
        'http://localhost:3000'
      ];

      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }

      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        errorType: error.name,
        url: req.url,
        method: req.method,
        origin: req.headers.origin
      }
    });
  }
};