const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  console.log('🚀 Admin function started');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // CORS Headers
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'https://neuro-pro-frontend.vercel.app',
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

    // Lista de emails admin autorizados
    const ADMIN_EMAILS = [
      'admin@neuroialab.com',
      'admin@neuroia.lab', // Email usado no frontend
      'gouveiarx@gmail.com',
      'psitales@gmail.com' // Correção do email
    ];
    
    // Check admin role
    const hasAdminRole = user.user_metadata?.role === 'admin';
    const isInAdminList = ADMIN_EMAILS.includes(user.email?.toLowerCase());
    const isAdmin = hasAdminRole || isInAdminList;
    
    // Debug logs para troubleshooting
    console.log('🔍 Admin Access Check:', {
      userEmail: user.email,
      userEmailLower: user.email?.toLowerCase(),
      hasAdminRole: hasAdminRole,
      userMetadata: user.user_metadata,
      isInAdminList: isInAdminList,
      adminEmails: ADMIN_EMAILS,
      emailMatch: ADMIN_EMAILS.map(email => ({
        adminEmail: email,
        userEmail: user.email?.toLowerCase(),
        matches: email === user.email?.toLowerCase()
      })),
      finalIsAdmin: isAdmin,
      serviceKeyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'YOUR_SERVICE_ROLE_KEY_HERE'
    });
    
    if (!isAdmin) {
      console.log('❌ Admin access denied for:', user.email);
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Privilégios de administrador necessários.',
        debug: {
          userEmail: user.email,
          hasAdminRole: hasAdminRole,
          isInAdminList: isInAdminList
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
            isInAdminList: ADMIN_EMAILS.includes(user.email?.toLowerCase()),
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
      // GET /admin/stats - Get system statistics using only public tables
      
      // Get unique users from subscriptions
      const { data: uniqueUsers, error: uniqueUsersError } = await supabase
        .from('user_subscriptions')
        .select('user_id')
        .not('user_id', 'is', null);
      
      const totalUsers = uniqueUsers ? [...new Set(uniqueUsers.map(u => u.user_id))].length : 0;

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

      // Calculate monthly revenue
      const currentMonth = new Date().toISOString().slice(0, 7);
      const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().slice(0, 7);
      
      const { data: monthlySubscriptions, error: revenueError } = await supabase
        .from('user_subscriptions')
        .select('subscription_type, assistant_id')
        .gte('created_at', `${currentMonth}-01T00:00:00.000Z`)
        .lt('created_at', `${nextMonth}-01T00:00:00.000Z`)
        .eq('status', 'active');

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

      // Calculate total active revenue (all active subscriptions)
      const { data: activeSubscriptionsData, error: activeRevError } = await supabase
        .from('user_subscriptions')
        .select('subscription_type, assistant_id')
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

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
      // GET /admin/users - List users from subscription data
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = (page - 1) * limit;

      // Get all unique users from subscriptions with aggregated data
      const { data: allSubscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('user_id, created_at, status, expires_at')
        .order('created_at', { ascending: false });

      if (subsError) {
        console.error('Error fetching subscriptions for users:', subsError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar usuários',
          error: subsError.message
        });
      }

      // Get actual user data from auth.users
      const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
      
      if (authUsersError) {
        console.error('Error fetching auth users:', authUsersError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao buscar usuários de autenticação',
          error: authUsersError.message
        });
      }

      // Create user map with real user data
      const userMap = new Map();
      const realUsers = authUsers?.users || [];
      
      // Initialize with real user data
      realUsers.forEach(authUser => {
        userMap.set(authUser.id, {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || null,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          email_confirmed_at: authUser.email_confirmed_at,
          user_metadata: authUser.user_metadata,
          active_subscriptions: 0
        });
      });
      
      // Add subscription counts
      if (allSubscriptions) {
        allSubscriptions.forEach(sub => {
          if (!sub.user_id || !userMap.has(sub.user_id)) return;
          
          const user = userMap.get(sub.user_id);
          
          if (sub.status === 'active' && new Date(sub.expires_at) > new Date()) {
            user.active_subscriptions++;
          }
        });
      }

      // Convert map to array and paginate
      const allUsers = Array.from(userMap.values());
      const paginatedUsers = allUsers.slice(offset, offset + limit);
      const totalUsers = allUsers.length;

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
          .substring(0, 50); // Limit length
        
        newAssistant.id = `${safeId}-${Date.now()}`;
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
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar assistente',
          error: error.message
        });
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

      // Clean and prepare update data
      const cleanUpdateData = { ...updateData };
      delete cleanUpdateData.id; // Don't update ID
      
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
      // DELETE /admin/assistants/:id - Delete assistant (soft delete)
      const assistantId = pathParts[2];

      // Get current data for audit log
      const { data: assistantToDelete } = await supabase
        .from('assistants')
        .select('*')
        .eq('id', assistantId)
        .single();

      if (!assistantToDelete) {
        return res.status(404).json({
          success: false,
          message: 'Assistente não encontrado'
        });
      }

      // Check if assistant has active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('user_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('assistant_id', assistantId)
        .eq('status', 'active');

      if (activeSubscriptions > 0) {
        return res.status(400).json({
          success: false,
          message: `Não é possível excluir assistente com ${activeSubscriptions} assinatura(s) ativa(s). Desative primeiro.`
        });
      }

      // Soft delete - just deactivate
      const { data: assistant, error } = await supabase
        .from('assistants')
        .update({ 
          is_active: false, 
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', assistantId)
        .select()
        .single();

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
          new_data: assistant,
          ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          user_agent: req.headers['user-agent']
        });

      return res.json({
        success: true,
        data: assistant,
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
          // Add subscriptions
          const subscriptionsToAdd = assistantIds.map(assistantId => ({
            user_id: userId,
            assistant_id: assistantId,
            subscription_type: 'monthly',
            status: 'active',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { error: insertError } = await supabase
            .from('user_subscriptions')
            .insert(subscriptionsToAdd);

          if (insertError) {
            console.error('Error adding subscriptions:', insertError);
            return res.status(500).json({
              success: false,
              error: 'Erro ao adicionar assinaturas'
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
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};