const { createClient } = require('@supabase/supabase-js');
const { ADMIN_EMAILS, isAdminUser } = require('./config/admin');
const { applyCors } = require('./utils/cors');

module.exports = async function handler(req, res) {
  console.log('🚀 Subscriptions API v2.1 - Fixed query structure');

  // Apply CORS
  const corsHandled = applyCors(req, res);
  if (corsHandled) {
    return; // Preflight request handled
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

    // Create user-specific client to validate token
    console.log('🔍 Validating token with Supabase auth...');

    const userClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
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

    // Get user from token using Supabase auth
    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error('❌ Token validation failed:', userError?.message);
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    const userId = user.id;

    console.log('👤 Token validated successfully:', {
      userId: userId,
      email: user.email || 'not-available'
    });

    if (!userId) {
      console.error('❌ User ID não encontrado no token');
      return res.status(401).json({
        success: false,
        error: 'Token inválido - sem user ID'
      });
    }

    // Extract email from user object for admin check
    const userEmail = user.email;

    if (req.method === 'GET') {
      // Check if user is admin - return all assistants as active subscriptions
      if (isAdminUser(userEmail)) {
        console.log('👑 Admin user detected in subscriptions, returning all assistants:', userEmail);

        // Get all active assistants for admin
        const { data: allAssistants, error: adminError } = await supabase
          .from('assistants')
          .select('id, name, description, icon, openai_assistant_id, color_theme')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (adminError) {
          console.error('Error getting assistants for admin subscriptions:', adminError);
          return res.status(500).json({
            success: false,
            error: `Erro ao buscar assistentes para admin: ${adminError.message}`
          });
        }

        // Create virtual subscriptions for all assistants
        const virtualSubscriptions = allAssistants.map(assistant => ({
          id: `admin-${assistant.id}`,
          user_id: userId,
          assistant_id: assistant.id,
          plan: 'admin',
          status: 'active',
          amount: 0, // Admin access is free
          subscription_type: 'admin',
          package_type: 'admin',
          expires_at: '2099-12-31T23:59:59Z', // Far future date
          created_at: new Date().toISOString(),
          assistants: assistant
        }));

        console.log('✅ Returning admin virtual subscriptions:', virtualSubscriptions.length);

        return res.status(200).json({
          success: true,
          data: virtualSubscriptions,
          access_type: 'admin'
        });
      }
      // Get user subscriptions using service key
      console.log('📊 Buscando assinaturas do usuário:', {
        userId: userId,
        userIdType: typeof userId,
        userIdLength: userId ? userId.length : 0
      });
      
      // First, let's check if user exists at all
      const { data: allUserSubs, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('user_id, status')
        .eq('user_id', userId);
      
      console.log('🔍 Verificando se usuário tem subscriptions:', {
        found: allUserSubs ? allUserSubs.length : 0,
        subs: allUserSubs,
        error: checkError ? checkError.message : 'none'
      });
      
      // First get the user subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      console.log('📊 Subscriptions query result:', {
        hasSubscriptions: !!subscriptions,
        subscriptionsCount: subscriptions ? subscriptions.length : 0,
        subsError: subsError ? subsError.message : 'none',
        userId: userId,
        userIdType: typeof userId
      });

      if (subsError) {
        console.error('❌ Subscriptions query error:', subsError);
        return res.status(500).json({
          success: false,
          error: `Erro ao buscar assinaturas: ${subsError.message}`
        });
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log('⚠️ No subscriptions found for user:', userId);
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      // Get assistant details separately
      const assistantIds = subscriptions.map(sub => sub.assistant_id);
      console.log('🔍 Looking for assistants:', assistantIds);

      const { data: assistants, error: assistError } = await supabase
        .from('assistants')
        .select('id, name, description, icon, openai_assistant_id, color_theme')
        .in('id', assistantIds);

      console.log('🤖 Assistants query result:', {
        hasAssistants: !!assistants,
        assistantsCount: assistants ? assistants.length : 0,
        assistError: assistError ? assistError.message : 'none'
      });

      if (assistError) {
        console.error('❌ Assistants query error:', assistError);
        // Return subscriptions without assistant details if assistant query fails
        return res.status(200).json({
          success: true,
          data: subscriptions
        });
      }

      // Merge subscription and assistant data
      const enrichedSubscriptions = subscriptions.map(subscription => {
        const assistant = assistants?.find(a => a.id === subscription.assistant_id);
        return {
          ...subscription,
          assistants: assistant || null
        };
      });

      console.log('✅ Final enriched subscriptions:', {
        count: enrichedSubscriptions.length,
        sample: enrichedSubscriptions[0] ? {
          id: enrichedSubscriptions[0].id,
          assistant_id: enrichedSubscriptions[0].assistant_id,
          hasAssistantData: !!enrichedSubscriptions[0].assistants
        } : null
      });

      return res.status(200).json({
        success: true,
        data: enrichedSubscriptions
      });
    }

    if (req.method === 'POST') {
      // Create new subscription (legacy endpoint - use /payment/create for new payments)
      const { assistantId, plan, assistant_id, subscription_type } = req.body;

      // Support both old and new parameter names
      const finalAssistantId = assistant_id || assistantId;
      const finalSubscriptionType = subscription_type || plan;

      if (!finalAssistantId || !finalSubscriptionType) {
        return res.status(400).json({
          success: false,
          error: 'assistant_id e subscription_type são obrigatórios'
        });
      }

      // Check if subscription already exists
      const { data: existing } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('assistant_id', finalAssistantId)
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
      if (finalSubscriptionType === 'monthly') {
        expiresAt.setMonth(now.getMonth() + 1);
      } else if (finalSubscriptionType === 'semester') {
        expiresAt.setMonth(now.getMonth() + 6);
      }

      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          assistant_id: finalAssistantId,
          subscription_type: finalSubscriptionType,
          package_type: 'individual',
          amount: finalSubscriptionType === 'monthly' ? 39.90 : 199.90,
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
          .eq('user_id', userId)
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
          .eq('user_id', userId)
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