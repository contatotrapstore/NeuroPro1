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
      console.log('⚠️ Database error occurred, returning all 14 default assistants');
      
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
          icon: 'clipboard-check',
          specialization: 'Case Analysis',
          status: 'active'
        },
        {
          id: 'asst_hH374jNSOTSqrsbC9Aq5MKo3',
          name: 'Guia Ético',
          description: 'Professional Ethics Guide',
          icon: 'balance-scale',
          specialization: 'Professional Ethics',
          status: 'active'
        },
        {
          id: 'asst_jlRLzTb4OrBKYWLtjscO3vJN',
          name: 'SessãoMap',
          description: 'Session Structure Formulator',
          icon: 'calendar-clock',
          specialization: 'Session Planning',
          status: 'active'
        },
        {
          id: 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
          name: 'ClinReplay',
          description: 'Session Trainer (AI Patient)',
          icon: 'conversation',
          specialization: 'Training Simulation',
          status: 'active'
        },
        {
          id: 'asst_WdzCxpQ3s04GqyDKfUsmxWRg',
          name: 'CognitiMap',
          description: 'Cognitive Restructuring Builder',
          icon: 'brain-gear',
          specialization: 'Cognitive Therapy',
          status: 'active'
        },
        {
          id: 'asst_Gto0pHqdCHdM7iBtdB9XUvkU',
          name: 'MindRoute',
          description: 'Psychological Approaches Guide',
          icon: 'compass',
          specialization: 'Treatment Approaches',
          status: 'active'
        },
        {
          id: 'asst_9RGTNpAvpwBtNps5krM051km',
          name: 'TheraTrack',
          description: 'Therapeutic Evolution Evaluator',
          icon: 'trending-up',
          specialization: 'Progress Tracking',
          status: 'active'
        },
        {
          id: 'asst_FHXh63UfotWmtzfwdAORvH1s',
          name: 'NeuroLaudo',
          description: 'Psychological Report Elaborator',
          icon: 'document-seal',
          specialization: 'Clinical Reports',
          status: 'active'
        },
        {
          id: 'asst_ZtY1hAFirpsA3vRdCuuOEebf',
          name: 'PsicoTest',
          description: 'Psychological Tests Consultant',
          icon: 'test-clipboard',
          specialization: 'Psychological Assessment',
          status: 'active'
        },
        {
          id: 'asst_bdfbravG0rjZfp40SFue89ge',
          name: 'TheraFocus',
          description: 'Specific Disorder Interventions Organizer',
          icon: 'target',
          specialization: 'Disorder Interventions',
          status: 'active'
        },
        {
          id: 'asst_nqL5L0hIfOMe2wNQn9wambGr',
          name: 'PsicoBase',
          description: 'Evidence-Based Clinical Strategies',
          icon: 'book-search',
          specialization: 'Evidence-Based Practice',
          status: 'active'
        },
        {
          id: 'asst_62QzPGQdr9KJMqqJIRVI787r',
          name: 'MindHome',
          description: 'Therapeutic Home Activities Elaborator',
          icon: 'home-heart',
          specialization: 'Home Activities',
          status: 'active'
        },
        {
          id: 'asst_NoCnwSoviZBasOxgbac9USkg',
          name: 'ClinPrice',
          description: 'Clinical Session Cost Evaluator',
          icon: 'calculator-dollar',
          specialization: 'Cost Analysis',
          status: 'active'
        }
      ];

      return res.status(200).json({
        success: true,
        data: defaultAssistants,
        count: defaultAssistants.length,
        source: 'database-error-fallback'
      });
    }

    // If no assistants found, return default set
    if (!assistants || assistants.length === 0) {
      console.log('⚠️ No assistants in database, returning all 14 defaults');
      
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
          icon: 'clipboard-check',
          specialization: 'Case Analysis',
          status: 'active'
        },
        {
          id: 'asst_hH374jNSOTSqrsbC9Aq5MKo3',
          name: 'Guia Ético',
          description: 'Professional Ethics Guide',
          icon: 'balance-scale',
          specialization: 'Professional Ethics',
          status: 'active'
        },
        {
          id: 'asst_jlRLzTb4OrBKYWLtjscO3vJN',
          name: 'SessãoMap',
          description: 'Session Structure Formulator',
          icon: 'calendar-clock',
          specialization: 'Session Planning',
          status: 'active'
        },
        {
          id: 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
          name: 'ClinReplay',
          description: 'Session Trainer (AI Patient)',
          icon: 'conversation',
          specialization: 'Training Simulation',
          status: 'active'
        },
        {
          id: 'asst_WdzCxpQ3s04GqyDKfUsmxWRg',
          name: 'CognitiMap',
          description: 'Cognitive Restructuring Builder',
          icon: 'brain-gear',
          specialization: 'Cognitive Therapy',
          status: 'active'
        },
        {
          id: 'asst_Gto0pHqdCHdM7iBtdB9XUvkU',
          name: 'MindRoute',
          description: 'Psychological Approaches Guide',
          icon: 'compass',
          specialization: 'Treatment Approaches',
          status: 'active'
        },
        {
          id: 'asst_9RGTNpAvpwBtNps5krM051km',
          name: 'TheraTrack',
          description: 'Therapeutic Evolution Evaluator',
          icon: 'trending-up',
          specialization: 'Progress Tracking',
          status: 'active'
        },
        {
          id: 'asst_FHXh63UfotWmtzfwdAORvH1s',
          name: 'NeuroLaudo',
          description: 'Psychological Report Elaborator',
          icon: 'document-seal',
          specialization: 'Clinical Reports',
          status: 'active'
        },
        {
          id: 'asst_ZtY1hAFirpsA3vRdCuuOEebf',
          name: 'PsicoTest',
          description: 'Psychological Tests Consultant',
          icon: 'test-clipboard',
          specialization: 'Psychological Assessment',
          status: 'active'
        },
        {
          id: 'asst_bdfbravG0rjZfp40SFue89ge',
          name: 'TheraFocus',
          description: 'Specific Disorder Interventions Organizer',
          icon: 'target',
          specialization: 'Disorder Interventions',
          status: 'active'
        },
        {
          id: 'asst_nqL5L0hIfOMe2wNQn9wambGr',
          name: 'PsicoBase',
          description: 'Evidence-Based Clinical Strategies',
          icon: 'book-search',
          specialization: 'Evidence-Based Practice',
          status: 'active'
        },
        {
          id: 'asst_62QzPGQdr9KJMqqJIRVI787r',
          name: 'MindHome',
          description: 'Therapeutic Home Activities Elaborator',
          icon: 'home-heart',
          specialization: 'Home Activities',
          status: 'active'
        },
        {
          id: 'asst_NoCnwSoviZBasOxgbac9USkg',
          name: 'ClinPrice',
          description: 'Clinical Session Cost Evaluator',
          icon: 'calculator-dollar',
          specialization: 'Cost Analysis',
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
    
    // Return default assistants if there's any error
    console.log('⚠️ Returning default assistants due to error');
    
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
        icon: 'clipboard-check',
        specialization: 'Case Analysis',
        status: 'active'
      },
      {
        id: 'asst_hH374jNSOTSqrsbC9Aq5MKo3',
        name: 'Guia Ético',
        description: 'Professional Ethics Guide',
        icon: 'balance-scale',
        specialization: 'Professional Ethics',
        status: 'active'
      },
      {
        id: 'asst_jlRLzTb4OrBKYWLtjscO3vJN',
        name: 'SessãoMap',
        description: 'Session Structure Formulator',
        icon: 'calendar-clock',
        specialization: 'Session Planning',
        status: 'active'
      },
      {
        id: 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
        name: 'ClinReplay',
        description: 'Session Trainer (AI Patient)',
        icon: 'conversation',
        specialization: 'Training Simulation',
        status: 'active'
      },
      {
        id: 'asst_WdzCxpQ3s04GqyDKfUsmxWRg',
        name: 'CognitiMap',
        description: 'Cognitive Restructuring Builder',
        icon: 'brain-gear',
        specialization: 'Cognitive Therapy',
        status: 'active'
      },
      {
        id: 'asst_Gto0pHqdCHdM7iBtdB9XUvkU',
        name: 'MindRoute',
        description: 'Psychological Approaches Guide',
        icon: 'compass',
        specialization: 'Treatment Approaches',
        status: 'active'
      },
      {
        id: 'asst_9RGTNpAvpwBtNps5krM051km',
        name: 'TheraTrack',
        description: 'Therapeutic Evolution Evaluator',
        icon: 'trending-up',
        specialization: 'Progress Tracking',
        status: 'active'
      },
      {
        id: 'asst_FHXh63UfotWmtzfwdAORvH1s',
        name: 'NeuroLaudo',
        description: 'Psychological Report Elaborator',
        icon: 'document-seal',
        specialization: 'Clinical Reports',
        status: 'active'
      },
      {
        id: 'asst_ZtY1hAFirpsA3vRdCuuOEebf',
        name: 'PsicoTest',
        description: 'Psychological Tests Consultant',
        icon: 'test-clipboard',
        specialization: 'Psychological Assessment',
        status: 'active'
      },
      {
        id: 'asst_bdfbravG0rjZfp40SFue89ge',
        name: 'TheraFocus',
        description: 'Specific Disorder Interventions Organizer',
        icon: 'target',
        specialization: 'Disorder Interventions',
        status: 'active'
      },
      {
        id: 'asst_nqL5L0hIfOMe2wNQn9wambGr',
        name: 'PsicoBase',
        description: 'Evidence-Based Clinical Strategies',
        icon: 'book-search',
        specialization: 'Evidence-Based Practice',
        status: 'active'
      },
      {
        id: 'asst_62QzPGQdr9KJMqqJIRVI787r',
        name: 'MindHome',
        description: 'Therapeutic Home Activities Elaborator',
        icon: 'home-heart',
        specialization: 'Home Activities',
        status: 'active'
      },
      {
        id: 'asst_NoCnwSoviZBasOxgbac9USkg',
        name: 'ClinPrice',
        description: 'Clinical Session Cost Evaluator',
        icon: 'calculator-dollar',
        specialization: 'Cost Analysis',
        status: 'active'
      }
    ];

    return res.status(200).json({
      success: true,
      data: defaultAssistants,
      count: defaultAssistants.length,
      source: 'fallback'
    });
  }
};