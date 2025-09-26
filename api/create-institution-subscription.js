/**
 * Vercel Serverless Function for creating institution user subscription
 * Endpoint: /api/create-institution-subscription
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
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    // ============================================
    // REQUEST HANDLING
    // ============================================
    const { institution_slug, subscription_type, amount, payment_method } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticação necessário' });
    }

    if (!institution_slug || !subscription_type || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros obrigatórios: institution_slug, subscription_type, amount'
      });
    }

    // Validate subscription_type
    const validTypes = ['monthly', 'semester', 'annual'];
    if (!validTypes.includes(subscription_type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de assinatura inválido'
      });
    }

    // Create authenticated client for user verification
    const { createClient: createAuthClient } = require('@supabase/supabase-js');
    const supabaseAuth = createAuthClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY, {
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
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }

    // Create service role client for subscription creation
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🛒 Creating subscription for user ${user.id} in institution ${institution_slug}`);

    // Create subscription using RPC function
    const { data, error } = await supabase.rpc('create_institution_user_subscription', {
      p_user_id: user.id,
      p_institution_slug: institution_slug,
      p_subscription_type: subscription_type,
      p_amount: amount,
      p_payment_provider: payment_method === 'pix' ? 'pix' : 'asaas',
      p_payment_id: null // Will be updated after payment confirmation
    });

    if (error) {
      console.error('❌ RPC error:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Erro ao criar assinatura'
      });
    }

    console.log('✅ Subscription created:', data);

    // Generate payment reference
    const paymentReference = `INST_${institution_slug.toUpperCase()}_${user.id.slice(-8)}_${Date.now()}`;

    return res.status(200).json({
      success: true,
      subscription_id: data,
      payment_reference: paymentReference,
      message: 'Assinatura criada com sucesso'
    });

  } catch (error) {
    console.error('❌ Create institution subscription error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}