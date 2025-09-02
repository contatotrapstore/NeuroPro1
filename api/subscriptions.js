const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // Enable CORS
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
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Initialize Supabase client with detailed logging
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    console.log('🔧 Subscriptions API - Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey,
      urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'null',
      serviceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
      anonKeyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
    });
    
    if (!supabaseUrl) {
      console.error('❌ SUPABASE_URL não configurada');
      return res.status(500).json({
        success: false,
        error: 'SUPABASE_URL não configurada'
      });
    }
    
    if (!supabaseAnonKey) {
      console.error('❌ SUPABASE_ANON_KEY não configurada');
      return res.status(500).json({
        success: false,
        error: 'SUPABASE_ANON_KEY não configurada'
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

    // Get user from auth token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔐 Token check:', {
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPrefix: token ? token.substring(0, 10) + '...' : 'null'
    });

    if (!token) {
      console.error('❌ Token não fornecido');
      return res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido'
      });
    }

    // Create user-specific client
    console.log('👤 Criando client autenticado...');
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
    console.log('🔍 Validando usuário com token...');
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    console.log('👤 User validation result:', {
      hasUser: !!user,
      userId: user ? user.id : 'null',
      userEmail: user ? user.email : 'null',
      authError: authError ? authError.message : 'none'
    });

    if (authError || !user) {
      console.error('❌ Erro de autenticação:', authError?.message || 'User não encontrado');
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    if (req.method === 'GET') {
      // Get user subscriptions
      console.log('📊 Buscando assinaturas do usuário:', user.id);
      
      const { data: subscriptions, error } = await userClient
        .from('user_subscriptions')
        .select(`
          *,
          assistants (
            id,
            name,
            description,
            icon,
            specialization
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      console.log('📊 Database query result:', {
        hasSubscriptions: !!subscriptions,
        subscriptionsCount: subscriptions ? subscriptions.length : 0,
        error: error ? error.message : 'none',
        errorCode: error ? error.code : 'none',
        errorDetails: error ? error.details : 'none'
      });

      if (error) {
        console.error('❌ Database error:', error);
        return res.status(500).json({
          success: false,
          error: `Erro ao buscar assinaturas: ${error.message}`
        });
      }

      return res.status(200).json({
        success: true,
        data: subscriptions || []
      });
    }

    if (req.method === 'POST') {
      // Create new subscription
      const { assistantId, plan } = req.body;

      if (!assistantId || !plan) {
        return res.status(400).json({
          success: false,
          error: 'assistantId e plan são obrigatórios'
        });
      }

      // Check if subscription already exists
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('assistant_id', assistantId)
        .eq('status', 'active')
        .single();

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Assinatura já existe para este assistente'
        });
      }

      // Calculate expiration date
      const now = new Date();
      const expiresAt = new Date(now);
      if (plan === 'monthly') {
        expiresAt.setMonth(now.getMonth() + 1);
      } else if (plan === 'semester') {
        expiresAt.setMonth(now.getMonth() + 6);
      }

      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          assistant_id: assistantId,
          plan,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          created_at: now.toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao criar assinatura'
        });
      }

      return res.status(201).json({
        success: true,
        data: subscription
      });
    }

    if (req.method === 'DELETE') {
      // Parse URL for routing
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathParts = url.pathname.split('/').filter(part => part);
      
      console.log('DELETE path parts:', pathParts);

      if (pathParts.length === 2) {
        // DELETE /subscriptions/:id - Cancel individual subscription
        const subscriptionId = pathParts[1];

        // Verify subscription belongs to user
        const { data: subscription, error: fetchError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('id', subscriptionId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !subscription) {
          return res.status(404).json({
            success: false,
            error: 'Assinatura não encontrada'
          });
        }

        // Update subscription status to cancelled
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', subscriptionId);

        if (updateError) {
          console.error('Database error:', updateError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao cancelar assinatura'
          });
        }

        return res.json({
          success: true,
          message: 'Assinatura cancelada com sucesso'
        });
      }

      else if (pathParts.length === 3 && pathParts[1] === 'packages') {
        // DELETE /subscriptions/packages/:id - Cancel package subscription
        const packageId = pathParts[2];

        // Verify package belongs to user
        const { data: userPackage, error: fetchError } = await supabase
          .from('user_packages')
          .select('*')
          .eq('id', packageId)
          .eq('user_id', user.id)
          .single();

        if (fetchError || !userPackage) {
          return res.status(404).json({
            success: false,
            error: 'Pacote não encontrado'
          });
        }

        // Update package status to cancelled
        const { error: updateError } = await supabase
          .from('user_packages')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', packageId);

        if (updateError) {
          console.error('Database error:', updateError);
          return res.status(500).json({
            success: false,
            error: 'Erro ao cancelar pacote'
          });
        }

        return res.json({
          success: true,
          message: 'Pacote cancelado com sucesso'
        });
      }

      else {
        return res.status(404).json({
          success: false,
          error: 'Rota não encontrada'
        });
      }
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}