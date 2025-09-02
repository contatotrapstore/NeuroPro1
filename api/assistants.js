import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://avgoyfartmzepdgzhroc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS for production frontend
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'http://localhost:5173', // Development
    'http://localhost:3000'  // Development backend
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get all assistants (public endpoint)
      const { data: assistants, error } = await supabase
        .from('assistants')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao buscar assistentes'
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
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}