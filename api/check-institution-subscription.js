/**
 * Vercel Serverless Function for checking institution user subscription
 * Endpoint: /api/check-institution-subscription
 */
module.exports = async function handler(req, res) {
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

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // ============================================
    // SUPABASE INITIALIZATION
    // ============================================
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    // ============================================
    // REQUEST HANDLING
    // ============================================
    const { institution_slug } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticação necessário' });
    }

    if (!institution_slug) {
      return res.status(400).json({ success: false, error: 'Slug da instituição é obrigatório' });
    }

    // Create authenticated Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }

    console.log(`🔍 Checking subscription for user ${user.id} in institution ${institution_slug}`);

    // Check user subscription using RPC function
    const { data, error } = await supabase.rpc('check_institution_user_subscription', {
      p_user_id: user.id,
      p_institution_slug: institution_slug
    });

    if (error) {
      console.error('❌ RPC error:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Erro ao verificar assinatura'
      });
    }

    console.log('✅ Subscription check result:', data);

    // Return subscription status
    const subscriptionData = data[0] || {
      has_subscription: false,
      subscription_status: null,
      expires_at: null,
      days_remaining: null
    };

    // Determine error type for frontend handling
    let errorType = null;
    let errorMessage = null;

    if (!subscriptionData.has_subscription) {
      if (subscriptionData.subscription_status === 'expired') {
        errorType = 'SUBSCRIPTION_EXPIRED';
        errorMessage = 'Sua assinatura para esta instituição expirou';
      } else {
        errorType = 'NO_SUBSCRIPTION';
        errorMessage = 'Você precisa de uma assinatura para usar os recursos desta instituição';
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        has_subscription: subscriptionData.has_subscription,
        subscription_status: subscriptionData.subscription_status,
        expires_at: subscriptionData.expires_at,
        days_remaining: subscriptionData.days_remaining,
        error_type: errorType,
        error_message: errorMessage
      }
    });

  } catch (error) {
    console.error('❌ Check institution subscription error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}