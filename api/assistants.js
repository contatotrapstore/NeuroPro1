const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  console.log('🚀 Function started - assistants endpoint');
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  
  // Always set CORS headers first
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  console.log('Request origin:', origin);
  
  // Set CORS headers
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log('✅ CORS origin allowed:', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log('⚠️ CORS fallback to * for origin:', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight OPTIONS request handled');
    return res.status(200).end();
  }

  // Only handle GET requests
  if (req.method !== 'GET') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    console.log('🔧 Initializing Supabase client...');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL || 'https://avgoyfartmzepdgzhroc.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                       process.env.SUPABASE_ANON_KEY || 
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo';
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key length:', supabaseKey ? supabaseKey.length : 0);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');

    console.log('📊 Querying assistants table...');
    
    // Query database for assistants
    const { data: assistants, error } = await supabase
      .from('assistants')
      .select('*')
      .eq('status', 'active')
      .order('name');

    console.log('Database response:', { 
      assistants: assistants ? `${assistants.length} records` : 'null',
      error: error ? error.message : 'none',
      errorCode: error ? error.code : 'none'
    });

    if (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        details: error.message,
        code: error.code
      });
    }

    // If no assistants found, return default set
    if (!assistants || assistants.length === 0) {
      console.log('⚠️ No assistants in database, returning defaults');
      
      const defaultAssistants = [
        {
          id: 'asst_8kNKRg68rR8zguhYzdlMEvQc',
          name: 'PsicoPlano',
          description: 'Therapeutic Route Formulator',
          icon: 'map-route',
          specialization: 'Therapeutic Planning',
          status: 'active'
        },
        {
          id: 'asst_Ohn9w46OmgwLJhxw08jSbM2f',
          name: 'NeuroCase', 
          description: 'Clinical Case Reviewer',
          icon: 'brain-case',
          specialization: 'Case Analysis',
          status: 'active'
        }
      ];

      return res.status(200).json({
        success: true,
        data: defaultAssistants,
        count: defaultAssistants.length,
        source: 'default'
      });
    }

    // Return database results
    console.log('✅ Returning', assistants.length, 'assistants from database');
    
    return res.status(200).json({
      success: true,
      data: assistants,
      count: assistants.length,
      source: 'database'
    });

  } catch (error) {
    console.error('💥 Function error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      type: error.name
    });
  }
};