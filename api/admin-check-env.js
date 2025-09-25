/**
 * API de Debug - Verificação de Variáveis de Ambiente
 * Endpoint: /api/admin-check-env
 * Permite verificar se as variáveis necessárias estão configuradas no Vercel
 */
module.exports = async function handler(req, res) {
  console.log('🔍 Environment Check API v1.0');

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

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    // ============================================
    // ENVIRONMENT VARIABLES CHECK
    // ============================================
    const envChecks = {
      // Supabase Configuration
      supabase_url: {
        variable: 'SUPABASE_URL',
        value: process.env.SUPABASE_URL,
        status: !!process.env.SUPABASE_URL,
        masked_value: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 20)}...` : null
      },
      supabase_service_key: {
        variable: 'SUPABASE_SERVICE_ROLE_KEY',
        value: process.env.SUPABASE_SERVICE_ROLE_KEY,
        status: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        masked_value: process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : null
      },
      supabase_service_key_alt: {
        variable: 'SUPABASE_SERVICE_KEY',
        value: process.env.SUPABASE_SERVICE_KEY,
        status: !!process.env.SUPABASE_SERVICE_KEY,
        masked_value: process.env.SUPABASE_SERVICE_KEY ? `${process.env.SUPABASE_SERVICE_KEY.substring(0, 20)}...` : null
      },
      supabase_anon_key: {
        variable: 'SUPABASE_ANON_KEY',
        value: process.env.SUPABASE_ANON_KEY,
        status: !!process.env.SUPABASE_ANON_KEY,
        masked_value: process.env.SUPABASE_ANON_KEY ? `${process.env.SUPABASE_ANON_KEY.substring(0, 20)}...` : null
      },
      // OpenAI Configuration
      openai_api_key: {
        variable: 'OPENAI_API_KEY',
        value: process.env.OPENAI_API_KEY,
        status: !!process.env.OPENAI_API_KEY,
        masked_value: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : null
      },
      // Node Environment
      node_env: {
        variable: 'NODE_ENV',
        value: process.env.NODE_ENV,
        status: !!process.env.NODE_ENV,
        masked_value: process.env.NODE_ENV
      },
      // Vercel Environment
      vercel_env: {
        variable: 'VERCEL_ENV',
        value: process.env.VERCEL_ENV,
        status: !!process.env.VERCEL_ENV,
        masked_value: process.env.VERCEL_ENV
      },
      vercel_region: {
        variable: 'VERCEL_REGION',
        value: process.env.VERCEL_REGION,
        status: !!process.env.VERCEL_REGION,
        masked_value: process.env.VERCEL_REGION
      }
    };

    // Determine if we have the minimum required variables
    const hasSupabaseUrl = envChecks.supabase_url.status;
    const hasSupabaseServiceKey = envChecks.supabase_service_key.status || envChecks.supabase_service_key_alt.status;
    const isConfigured = hasSupabaseUrl && hasSupabaseServiceKey;

    // Create summary
    const summary = {
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
      region: process.env.VERCEL_REGION || 'unknown',
      is_configured: isConfigured,
      missing_critical: []
    };

    if (!hasSupabaseUrl) {
      summary.missing_critical.push('SUPABASE_URL');
    }
    if (!hasSupabaseServiceKey) {
      summary.missing_critical.push('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY');
    }

    // Remove sensitive values for response
    const responseChecks = {};
    Object.keys(envChecks).forEach(key => {
      responseChecks[key] = {
        variable: envChecks[key].variable,
        status: envChecks[key].status,
        masked_value: envChecks[key].masked_value
      };
    });

    console.log(`🔍 Environment check complete. Configured: ${isConfigured}`);

    return res.status(200).json({
      success: true,
      data: {
        summary,
        checks: responseChecks,
        timestamp: new Date().toISOString(),
        recommendations: isConfigured ? [] : [
          'Configure missing environment variables in Vercel Dashboard',
          'Go to Settings → Environment Variables',
          'Add the missing variables listed above',
          'Redeploy the application after adding variables'
        ]
      }
    });

  } catch (error) {
    console.error('Environment Check API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};