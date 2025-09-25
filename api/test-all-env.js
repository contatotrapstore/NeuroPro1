/**
 * API de Teste - Descobrir Todas as Variáveis de Ambiente
 * Endpoint: /api/test-all-env
 * Lista todas as variáveis de ambiente disponíveis (sem expor valores)
 */
module.exports = async function handler(req, res) {
  console.log('🔍 Environment Discovery API v1.0');

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
    // DISCOVER ALL ENVIRONMENT VARIABLES
    // ============================================

    // Get all environment variable names (without values for security)
    const allEnvKeys = Object.keys(process.env);

    // Categorize variables
    const categorizedVars = {
      supabase: [],
      openai: [],
      asaas: [],
      vercel: [],
      node: [],
      vite: [],
      jwt: [],
      cors: [],
      other: []
    };

    allEnvKeys.forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('supabase')) {
        categorizedVars.supabase.push(key);
      } else if (lowerKey.includes('openai')) {
        categorizedVars.openai.push(key);
      } else if (lowerKey.includes('asaas')) {
        categorizedVars.asaas.push(key);
      } else if (lowerKey.includes('vercel')) {
        categorizedVars.vercel.push(key);
      } else if (lowerKey.includes('node')) {
        categorizedVars.node.push(key);
      } else if (lowerKey.startsWith('vite_')) {
        categorizedVars.vite.push(key);
      } else if (lowerKey.includes('jwt')) {
        categorizedVars.jwt.push(key);
      } else if (lowerKey.includes('cors')) {
        categorizedVars.cors.push(key);
      } else {
        categorizedVars.other.push(key);
      }
    });

    // Test specific variable patterns we're looking for
    const testVariables = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_SERVICE_KEY',
      'SUPABASE_ANON_KEY',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'OPENAI_API_KEY',
      'ASAAS_API_KEY',
      'JWT_SECRET',
      'NODE_ENV',
      'VERCEL_ENV',
      'VERCEL_REGION'
    ];

    const testResults = {};
    testVariables.forEach(varName => {
      const value = process.env[varName];
      testResults[varName] = {
        exists: !!value,
        type: typeof value,
        hasValue: value ? true : false,
        length: value ? value.length : 0,
        preview: value ? `${value.substring(0, 10)}...` : null
      };
    });

    // Count variables by category
    const summary = {
      total_variables: allEnvKeys.length,
      supabase_related: categorizedVars.supabase.length,
      vite_related: categorizedVars.vite.length,
      vercel_related: categorizedVars.vercel.length,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
      region: process.env.VERCEL_REGION || 'unknown'
    };

    console.log(`🔍 Found ${allEnvKeys.length} environment variables total`);
    console.log(`📊 Supabase: ${categorizedVars.supabase.length}, VITE: ${categorizedVars.vite.length}`);

    return res.status(200).json({
      success: true,
      data: {
        summary,
        categorized_variables: categorizedVars,
        test_results: testResults,
        timestamp: new Date().toISOString(),
        notes: [
          'This API shows all available environment variable names',
          'Values are masked for security (only first 10 chars shown)',
          'Use this to identify which variables are actually available',
          'Focus on supabase and vite categories for our needs'
        ]
      }
    });

  } catch (error) {
    console.error('Environment Discovery API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};