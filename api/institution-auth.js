/**
 * API Simplificada para Autenticação de Instituições
 * Endpoint: /api/institution-auth
 */
module.exports = async function handler(req, res) {
  console.log('🏛️ Institution Auth Simple API v1.0');
  console.log('Method:', req.method);
  console.log('Query:', req.query);

  // ============================================
  // CORS HEADERS (INLINE)
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

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ============================================
    // SUPABASE INITIALIZATION
    // ============================================
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                              process.env.SUPABASE_SERVICE_KEY ||
                              process.env.VITE_SUPABASE_SERVICE_KEY ||
                              process.env.SUPABASE_KEY ||
                              process.env.VITE_SUPABASE_KEY;

    // For GET requests and verify_access (public data), allow anon key as fallback
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const isGetRequest = req.method === 'GET';
    const isVerifyAccess = req.method === 'POST' && req.body?.action === 'verify_access';

    let supabaseKey = supabaseServiceKey;
    if (!supabaseKey && (isGetRequest || isVerifyAccess) && supabaseAnonKey) {
      console.log('🔓 Using anon key for public request');
      supabaseKey = supabaseAnonKey;
    }

    if (!supabaseUrl || !supabaseKey) {
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('SUPABASE_URL');
      if (!supabaseKey) {
        if (isGetRequest || isVerifyAccess) {
          missingVars.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
        } else {
          missingVars.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
        }
      }

      console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
      console.error('Environment check:', {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
        VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
        REQUEST_METHOD: req.method
      });

      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta',
        details: `Missing environment variables: ${missingVars.join(', ')}`,
        debug_info: {
          request_method: req.method,
          action: req.body?.action,
          has_service_key: !!supabaseServiceKey,
          has_anon_key: !!supabaseAnonKey,
          using_fallback: !supabaseServiceKey && (isGetRequest || isVerifyAccess)
        }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ============================================
    // GET INSTITUTION SLUG
    // ============================================
    const institutionSlug = req.query.slug || req.query.institution_slug;

    if (!institutionSlug) {
      return res.status(400).json({
        success: false,
        error: 'Slug da instituição não informado (use ?slug=abpsi)'
      });
    }

    console.log(`🏛️ Processing institution: ${institutionSlug}`);

    // ============================================
    // REQUEST HANDLING BY METHOD
    // ============================================
    if (req.method === 'GET') {
      return handleGetInstitution(req, res, supabase, institutionSlug);
    } else if (req.method === 'POST') {
      return handleAuthAction(req, res, supabase, institutionSlug, supabaseUrl, supabaseServiceKey, supabaseAnonKey);
    } else {
      return res.status(405).json({
        success: false,
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('Institution Auth API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};

// ============================================
// GET - Institution Basic Info
// ============================================
async function handleGetInstitution(req, res, supabase, institutionSlug) {
  try {
    console.log(`🔍 Getting public info for institution: ${institutionSlug}`);

    // Usar RPC para obter dados públicos
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('get_institution_public_info', {
        p_institution_slug: institutionSlug
      });

    console.log('🏛️ RPC Result:', { success: rpcResult?.success, error: rpcError });

    if (!rpcError && rpcResult?.success) {
      return res.status(200).json(rpcResult);
    }

    return res.status(404).json({
      success: false,
      error: rpcResult?.error || 'Instituição não encontrada'
    });

  } catch (error) {
    console.error('Error in handleGetInstitution:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao carregar informações da instituição'
    });
  }
}

// ============================================
// POST - Authentication Actions
// ============================================
async function handleAuthAction(req, res, supabase, institutionSlug, supabaseUrl, supabaseServiceKey, supabaseAnonKey) {
  try {
    const { action, token, email, password } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Ação não especificada'
      });
    }

    // Verificar se instituição existe
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select('id, name, slug, is_active')
      .eq('slug', institutionSlug)
      .eq('is_active', true)
      .single();

    if (institutionError || !institution) {
      return res.status(404).json({
        success: false,
        error: 'Instituição não encontrada'
      });
    }

    if (action === 'verify_access') {
      // Get token from Authorization header or request body
      const authHeader = req.headers.authorization;
      const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      const tokenFromBody = req.body?.token;
      const token = tokenFromHeader || tokenFromBody;

      console.log('🔑 Token sources:', {
        hasAuthHeader: !!authHeader,
        hasTokenInBody: !!tokenFromBody,
        usingHeader: !!tokenFromHeader,
        usingBody: !!tokenFromBody && !tokenFromHeader
      });

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token de acesso necessário (envie no Authorization header ou no body)'
        });
      }

      try {
        console.log('🔐 Verifying institution access via RPC...');

        // Criar client com o token do usuário
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

        // Chamar função RPC para verificar acesso
        const { data: rpcResult, error: rpcError } = await userClient
          .rpc('verify_institution_access', {
            p_institution_slug: institutionSlug
          });

        console.log('📊 RPC Result:', {
          success: rpcResult?.success,
          error: rpcError?.message || rpcResult?.error,
          hasData: !!rpcResult?.data
        });

        if (!rpcError && rpcResult?.success) {
          return res.status(200).json(rpcResult);
        }

        // Se RPC falhou, retornar erro
        return res.status(403).json({
          success: false,
          error: rpcResult?.error || rpcError?.message || 'Acesso negado',
          debug_info: {
            rpc_error: rpcError?.message,
            rpc_result_error: rpcResult?.error,
            token_source: tokenFromHeader ? 'Authorization header' : 'Request body'
          }
        });

      } catch (error) {
        console.error('❌ RPC verification failed:', error);
        return res.status(401).json({
          success: false,
          error: 'Falha na verificação de acesso',
          details: error.message
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Ação não reconhecida'
    });

  } catch (error) {
    console.error('Error in handleAuthAction:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar ação de autenticação'
    });
  }
}