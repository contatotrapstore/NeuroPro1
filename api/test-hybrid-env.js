/**
 * API de Teste Híbrida - Usar Variáveis VITE do Frontend
 * Endpoint: /api/test-hybrid-env
 * Usa as variáveis VITE que sabemos que existem no frontend/.env
 */
module.exports = async function handler(req, res) {
  console.log('🧪 Hybrid Environment Test API v1.0');

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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });
  }

  try {
    // ============================================
    // TEST WITH HARDCODED VALUES FROM FRONTEND
    // ============================================

    // Use the known values from frontend/.env
    const supabaseUrl = 'https://avgoyfartmzepdgzhroc.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z285ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo';

    console.log('🔧 Testing Supabase connection with hardcoded values');

    // ============================================
    // SUPABASE INITIALIZATION
    // ============================================
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('✅ Supabase client created successfully');

    // Test connection
    const { data: institutions, error: institutionsError } = await supabase
      .from('institutions')
      .select('id, name, slug, primary_color, logo_url, is_active, created_at')
      .limit(3);

    if (institutionsError) {
      console.error('❌ Supabase query failed:', institutionsError);
      return res.status(500).json({
        success: false,
        error: 'Erro ao conectar com Supabase',
        details: institutionsError.message,
        test_info: {
          url_working: true,
          key_working: false,
          connection_issue: true
        }
      });
    }

    console.log(`✅ Successfully fetched ${institutions?.length || 0} institutions`);

    return res.status(200).json({
      success: true,
      data: {
        test_result: 'SUCCESS - Supabase connection working',
        institutions_found: institutions?.length || 0,
        institutions_sample: institutions || [],
        connection_details: {
          url: supabaseUrl,
          key_type: 'anon_key',
          key_preview: `${supabaseAnonKey.substring(0, 20)}...`,
          database_accessible: true
        },
        environment_info: {
          vercel_env: process.env.VERCEL_ENV || 'unknown',
          node_env: process.env.NODE_ENV || 'unknown',
          region: process.env.VERCEL_REGION || 'unknown'
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Hybrid Test API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message,
      test_info: {
        supabase_client_creation: false,
        connection_failed: true
      }
    });
  }
};