/**
 * Vercel Serverless Function for Institution RPC calls
 * Endpoint: /api/institution-rpc
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
    const { function_name, params = [] } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticação necessário' });
    }

    if (!function_name) {
      return res.status(400).json({ success: false, error: 'Nome da função é obrigatório' });
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

    console.log(`🔧 Calling RPC function: ${function_name} with params:`, params);

    let result;

    switch (function_name) {
      case 'get_institution_users':
        result = await supabase.rpc('get_institution_users', { p_institution_slug: params[0] });
        break;

      case 'approve_institution_user':
        result = await supabase.rpc('approve_institution_user', {
          p_institution_slug: params[0],
          p_user_id: params[1]
        });
        break;

      case 'reject_institution_user':
        result = await supabase.rpc('reject_institution_user', {
          p_institution_slug: params[0],
          p_user_id: params[1]
        });
        break;

      case 'get_institution_pending_count':
        result = await supabase.rpc('get_institution_pending_count', { p_institution_slug: params[0] });
        break;

      default:
        return res.status(400).json({ success: false, error: 'Função não encontrada' });
    }

    if (result.error) {
      console.error(`❌ RPC error for ${function_name}:`, result.error);
      return res.status(400).json({
        success: false,
        error: result.error.message || 'Erro na função RPC'
      });
    }

    console.log(`✅ RPC success for ${function_name}:`, result.data);

    // Handle different response types from RPC functions
    let responseData;

    if (typeof result.data === 'string') {
      try {
        responseData = JSON.parse(result.data);
      } catch (parseError) {
        responseData = result.data;
      }
    } else {
      responseData = result.data;
    }

    // For get_institution_pending_count, return the count directly
    if (function_name === 'get_institution_pending_count') {
      if (responseData && responseData.success && typeof responseData.count === 'number') {
        return res.status(200).json(responseData.count);
      }
    }

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Institution RPC error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}