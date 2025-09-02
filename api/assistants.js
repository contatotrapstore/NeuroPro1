import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Always set CORS headers first
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'http://localhost:5173', // Development
    'http://localhost:3000'  // Development backend
  ];
  
  const origin = req.headers.origin;
  console.log('Request origin:', origin);
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    console.log('CORS origin allowed:', origin);
  } else {
    // Allow all origins temporarily for debugging
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log('CORS fallback to * for origin:', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  
  if (req.method === 'OPTIONS') {
    console.log('Preflight OPTIONS request handled');
    res.status(200).end();
    return;
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL || 'https://avgoyfartmzepdgzhroc.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo';
  
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key available:', !!supabaseKey);
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Request method:', req.method);
    
    if (req.method === 'GET') {
      console.log('Fetching assistants from database...');
      
      // Get all assistants (public endpoint)
      const { data: assistants, error } = await supabase
        .from('assistants')
        .select('*')
        .eq('status', 'active')
        .order('name');

      console.log('Database query result:', { 
        assistants: assistants ? assistants.length + ' records' : 'null',
        error: error ? error.message : 'none'
      });

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar assistentes',
          details: error.message
        });
      }

      // If no assistants in database, return default list
      if (!assistants || assistants.length === 0) {
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
          },
          {
            id: 'asst_hH374jNSOTSqrsbC9Aq5MKo3',
            name: 'Guia Ético',
            description: 'Professional Ethics Guide',
            icon: 'shield-check',
            specialization: 'Professional Ethics',
            status: 'active'
          },
          {
            id: 'asst_jlRLzTb4OrBKYWLtjscO3vJN',
            name: 'SessãoMap',
            description: 'Session Structure Formulator',
            icon: 'session-map',
            specialization: 'Session Planning',
            status: 'active'
          },
          {
            id: 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
            name: 'ClinReplay',
            description: 'Session Trainer (AI Patient)',
            icon: 'replay-circle',
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
            icon: 'compass-mind',
            specialization: 'Therapeutic Approaches',
            status: 'active'
          },
          {
            id: 'asst_9RGTNpAvpwBtNps5krM051km',
            name: 'TheraTrack',
            description: 'Therapeutic Evolution Evaluator',
            icon: 'progress-chart',
            specialization: 'Progress Tracking',
            status: 'active'
          },
          {
            id: 'asst_FHXh63UfotWmtzfwdAORvH1s',
            name: 'NeuroLaudo',
            description: 'Psychological Report Elaborator',
            icon: 'document-report',
            specialization: 'Report Writing',
            status: 'active'
          },
          {
            id: 'asst_ZtY1hAFirpsA3vRdCuuOEebf',
            name: 'PsicoTest',
            description: 'Psychological Tests Consultant',
            icon: 'test-clipboard',
            specialization: 'Psychological Testing',
            status: 'active'
          },
          {
            id: 'asst_bdfbravG0rjZfp40SFue89ge',
            name: 'TheraFocus',
            description: 'Specific Disorder Interventions Organizer',
            icon: 'target-focus',
            specialization: 'Disorder-Specific Treatment',
            status: 'active'
          },
          {
            id: 'asst_nqL5L0hIfOMe2wNQn9wambGr',
            name: 'PsicoBase',
            description: 'Evidence-Based Clinical Strategies',
            icon: 'database-brain',
            specialization: 'Evidence-Based Practice',
            status: 'active'
          },
          {
            id: 'asst_62QzPGQdr9KJMqqJIRVI787r',
            name: 'MindHome',
            description: 'Therapeutic Home Activities Elaborator',
            icon: 'home-heart',
            specialization: 'Home-Based Therapy',
            status: 'active'
          },
          {
            id: 'asst_NoCnwSoviZBasOxgbac9USkg',
            name: 'ClinPrice',
            description: 'Clinical Session Cost Evaluator',
            icon: 'calculator-cost',
            specialization: 'Cost Analysis',
            status: 'active'
          }
        ];

        return res.status(200).json({
          success: true,
          data: defaultAssistants
        });
      }

      return res.status(200).json({
        success: true,
        data: assistants
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Método não permitido'
    });

  } catch (error) {
    console.error('API Error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message,
      type: error.name
    });
  }
}