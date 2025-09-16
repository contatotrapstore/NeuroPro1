const { createClient } = require('@supabase/supabase-js');
const { ADMIN_EMAILS, isAdminUser } = require('./config/admin');

module.exports = async function handler(req, res) {
  console.log('🚀 Function started - assistants endpoint');
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  
  // Always set CORS headers first
  const allowedOrigins = [
    'https://neuroai-lab.vercel.app',
    'https://www.neuroialab.com.br',
    'https://neuroialab.com.br',
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
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight OPTIONS request handled');
    return res.status(200).end();
  }

  // Route handling based on URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(part => part);
  
  console.log('Assistants path parts:', pathParts);

  try {
    console.log('🔧 Initializing Supabase client...');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }
    
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key length:', supabaseKey ? supabaseKey.length : 0);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');

    // Handle different assistant endpoints
    if (req.method === 'GET' && pathParts.length === 1) {
      // GET /assistants - List all assistants (public)
      console.log('📊 Querying assistants table...');
      
      // Query database for assistants
      const { data: assistants, error } = await supabase
        .from('assistants')
        .select('id, name, description, icon, icon_url, icon_type, color_theme, monthly_price, semester_price, is_active, area, created_at, updated_at')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .order('name', { ascending: true });

      console.log('Database response:', { 
        assistants: assistants ? `${assistants.length} records` : 'null',
        error: error ? error.message : 'none',
        errorCode: error ? error.code : 'none'
      });

      if (error) {
      console.error('❌ Database error:', error);
      console.log('⚠️ Database error occurred, returning all 19 default assistants');
      
      const defaultAssistants = [
        {
          id: 'asst_8kNKRg68rR8zguhYzdlMEvQc',
          name: 'PsicoPlano',
          description: 'Therapeutic Route Formulator',
          icon: 'map-route',
          color_theme: '#2D5A1F',
          area: 'Psicologia',
          monthly_price: 39.90,
          semester_price: 199.00,
          specialization: 'Therapeutic Planning',
          status: 'active'
        },
        {
          id: 'asst_Ohn9w46OmgwLJhxw08jSbM2f',
          name: 'NeuroCase',
          description: 'Clinical Case Reviewer',
          icon: 'clipboard-check',
          color_theme: '#2D5A1F',
          area: 'Psicologia',
          monthly_price: 39.90,
          semester_price: 199.00,
          specialization: 'Case Analysis',
          status: 'active'
        },
        {
          id: 'asst_hH374jNSOTSqrsbC9Aq5MKo3',
          name: 'Guia Ético',
          description: 'Professional Ethics Guide',
          icon: 'balance-scale',
          color_theme: '#2D5A1F',
          area: 'Psicologia',
          monthly_price: 39.90,
          semester_price: 199.00,
          specialization: 'Professional Ethics',
          status: 'active'
        },
        {
          id: 'asst_jlRLzTb4OrBKYWLtjscO3vJN',
          name: 'SessãoMap',
          description: 'Session Structure Formulator',
          icon: 'calendar-clock',
          color_theme: '#2D5A1F',
          area: 'Psicologia',
          monthly_price: 39.90,
          semester_price: 199.00,
          specialization: 'Session Planning',
          status: 'active'
        },
        {
          id: 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
          name: 'Simulador de Paciente',
          description: 'Session Trainer (AI Patient)',
          icon: 'conversation',
          area: 'Psicologia',
          specialization: 'Training Simulation',
          status: 'active'
        },
        {
          id: 'asst_WdzCxpQ3s04GqyDKfUsmxWRg',
          name: 'CognitiMap',
          description: 'Cognitive Restructuring Builder',
          icon: 'brain-gear',
          area: 'Psicologia',
          specialization: 'Cognitive Therapy',
          status: 'active'
        },
        {
          id: 'asst_Gto0pHqdCHdM7iBtdB9XUvkU',
          name: 'MindRoute',
          description: 'Psychological Approaches Guide',
          icon: 'compass',
          area: 'Psicologia',
          specialization: 'Treatment Approaches',
          status: 'active'
        },
        {
          id: 'asst_9RGTNpAvpwBtNps5krM051km',
          name: 'TheraTrack',
          description: 'Therapeutic Evolution Evaluator',
          icon: 'trending-up',
          area: 'Psicologia',
          specialization: 'Progress Tracking',
          status: 'active'
        },
        {
          id: 'asst_FHXh63UfotWmtzfwdAORvH1s',
          name: 'NeuroLaudo',
          description: 'Psychological Report Elaborator',
          icon: 'document-seal',
          area: 'Psicologia',
          specialization: 'Clinical Reports',
          status: 'active'
        },
        {
          id: 'asst_ZtY1hAFirpsA3vRdCuuOEebf',
          name: 'PsicoTest',
          description: 'Psychological Tests Consultant',
          icon: 'test-clipboard',
          area: 'Psicologia',
          specialization: 'Psychological Assessment',
          status: 'active'
        },
        {
          id: 'asst_bdfbravG0rjZfp40SFue89ge',
          name: 'TheraFocus',
          description: 'Specific Disorder Interventions Organizer',
          icon: 'target',
          area: 'Psicologia',
          specialization: 'Disorder Interventions',
          status: 'active'
        },
        {
          id: 'asst_nqL5L0hIfOMe2wNQn9wambGr',
          name: 'PsicoBase',
          description: 'Evidence-Based Clinical Strategies',
          icon: 'book-search',
          area: 'Psicologia',
          specialization: 'Evidence-Based Practice',
          status: 'active'
        },
        {
          id: 'asst_62QzPGQdr9KJMqqJIRVI787r',
          name: 'MindHome',
          description: 'Therapeutic Home Activities Elaborator',
          icon: 'home-heart',
          area: 'Psicologia',
          specialization: 'Home Activities',
          status: 'active'
        },
        {
          id: 'asst_NoCnwSoviZBasOxgbac9USkg',
          name: 'ClinPrice',
          description: 'Clinical Session Cost Evaluator',
          icon: 'calculator-dollar',
          area: 'Psicologia',
          specialization: 'Cost Analysis',
          status: 'active'
        },
        {
          id: 'harmonia-sistemica',
          name: 'Harmonia Sistêmica',
          description: 'Family and Systemic Therapy Assistant',
          icon: 'family-tree',
          area: 'Psicologia',
          specialization: 'Family Therapy',
          status: 'active'
        },
        {
          id: 'neuroaba',
          name: 'NeuroABA',
          description: 'Applied Behavior Analysis Assistant',
          icon: 'brain-circuit',
          area: 'Psicologia',
          specialization: 'Behavioral Analysis',
          status: 'active'
        },
        {
          id: 'psicopedia',
          name: 'PsicopedIA',
          description: 'Psychopedagogy and Learning Assistant',
          icon: 'graduation-cap',
          area: 'Psicopedagogia',
          specialization: 'Educational Psychology',
          status: 'active'
        },
        {
          id: 'theracasal',
          name: 'TheraCasal',
          description: 'Couple Therapy Assistant',
          icon: 'heart-duo',
          area: 'Psicologia',
          specialization: 'Couple Therapy',
          status: 'active'
        },
        {
          id: 'asst_9vDTodTAQIJV1mu2xPzXpBs8',
          name: 'Simulador de Paciente de Psicanálise',
          description: 'Psychoanalysis Patient Simulator with Clinical Feedback',
          icon: 'psychology-brain',
          area: 'Psicologia',
          specialization: 'Psychoanalytic Training',
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
      console.log('⚠️ No assistants in database, returning all 19 defaults');
      
      const defaultAssistants = [
        {
          id: 'asst_8kNKRg68rR8zguhYzdlMEvQc',
          name: 'PsicoPlano',
          description: 'Therapeutic Route Formulator',
          icon: 'map-route',
          color_theme: '#2D5A1F',
          area: 'Psicologia',
          monthly_price: 39.90,
          semester_price: 199.00,
          specialization: 'Therapeutic Planning',
          status: 'active'
        },
        {
          id: 'asst_Ohn9w46OmgwLJhxw08jSbM2f',
          name: 'NeuroCase',
          description: 'Clinical Case Reviewer',
          icon: 'clipboard-check',
          color_theme: '#2D5A1F',
          area: 'Psicologia',
          monthly_price: 39.90,
          semester_price: 199.00,
          specialization: 'Case Analysis',
          status: 'active'
        },
        {
          id: 'asst_hH374jNSOTSqrsbC9Aq5MKo3',
          name: 'Guia Ético',
          description: 'Professional Ethics Guide',
          icon: 'balance-scale',
          color_theme: '#2D5A1F',
          area: 'Psicologia',
          monthly_price: 39.90,
          semester_price: 199.00,
          specialization: 'Professional Ethics',
          status: 'active'
        },
        {
          id: 'asst_jlRLzTb4OrBKYWLtjscO3vJN',
          name: 'SessãoMap',
          description: 'Session Structure Formulator',
          icon: 'calendar-clock',
          color_theme: '#2D5A1F',
          area: 'Psicologia',
          monthly_price: 39.90,
          semester_price: 199.00,
          specialization: 'Session Planning',
          status: 'active'
        },
        {
          id: 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
          name: 'Simulador de Paciente',
          description: 'Session Trainer (AI Patient)',
          icon: 'conversation',
          area: 'Psicologia',
          specialization: 'Training Simulation',
          status: 'active'
        },
        {
          id: 'asst_WdzCxpQ3s04GqyDKfUsmxWRg',
          name: 'CognitiMap',
          description: 'Cognitive Restructuring Builder',
          icon: 'brain-gear',
          area: 'Psicologia',
          specialization: 'Cognitive Therapy',
          status: 'active'
        },
        {
          id: 'asst_Gto0pHqdCHdM7iBtdB9XUvkU',
          name: 'MindRoute',
          description: 'Psychological Approaches Guide',
          icon: 'compass',
          area: 'Psicologia',
          specialization: 'Treatment Approaches',
          status: 'active'
        },
        {
          id: 'asst_9RGTNpAvpwBtNps5krM051km',
          name: 'TheraTrack',
          description: 'Therapeutic Evolution Evaluator',
          icon: 'trending-up',
          area: 'Psicologia',
          specialization: 'Progress Tracking',
          status: 'active'
        },
        {
          id: 'asst_FHXh63UfotWmtzfwdAORvH1s',
          name: 'NeuroLaudo',
          description: 'Psychological Report Elaborator',
          icon: 'document-seal',
          area: 'Psicologia',
          specialization: 'Clinical Reports',
          status: 'active'
        },
        {
          id: 'asst_ZtY1hAFirpsA3vRdCuuOEebf',
          name: 'PsicoTest',
          description: 'Psychological Tests Consultant',
          icon: 'test-clipboard',
          area: 'Psicologia',
          specialization: 'Psychological Assessment',
          status: 'active'
        },
        {
          id: 'asst_bdfbravG0rjZfp40SFue89ge',
          name: 'TheraFocus',
          description: 'Specific Disorder Interventions Organizer',
          icon: 'target',
          area: 'Psicologia',
          specialization: 'Disorder Interventions',
          status: 'active'
        },
        {
          id: 'asst_nqL5L0hIfOMe2wNQn9wambGr',
          name: 'PsicoBase',
          description: 'Evidence-Based Clinical Strategies',
          icon: 'book-search',
          area: 'Psicologia',
          specialization: 'Evidence-Based Practice',
          status: 'active'
        },
        {
          id: 'asst_62QzPGQdr9KJMqqJIRVI787r',
          name: 'MindHome',
          description: 'Therapeutic Home Activities Elaborator',
          icon: 'home-heart',
          area: 'Psicologia',
          specialization: 'Home Activities',
          status: 'active'
        },
        {
          id: 'asst_NoCnwSoviZBasOxgbac9USkg',
          name: 'ClinPrice',
          description: 'Clinical Session Cost Evaluator',
          icon: 'calculator-dollar',
          area: 'Psicologia',
          specialization: 'Cost Analysis',
          status: 'active'
        },
        {
          id: 'harmonia-sistemica',
          name: 'Harmonia Sistêmica',
          description: 'Family and Systemic Therapy Assistant',
          icon: 'family-tree',
          area: 'Psicologia',
          specialization: 'Family Therapy',
          status: 'active'
        },
        {
          id: 'neuroaba',
          name: 'NeuroABA',
          description: 'Applied Behavior Analysis Assistant',
          icon: 'brain-circuit',
          area: 'Psicologia',
          specialization: 'Behavioral Analysis',
          status: 'active'
        },
        {
          id: 'psicopedia',
          name: 'PsicopedIA',
          description: 'Psychopedagogy and Learning Assistant',
          icon: 'graduation-cap',
          area: 'Psicopedagogia',
          specialization: 'Educational Psychology',
          status: 'active'
        },
        {
          id: 'theracasal',
          name: 'TheraCasal',
          description: 'Couple Therapy Assistant',
          icon: 'heart-duo',
          area: 'Psicologia',
          specialization: 'Couple Therapy',
          status: 'active'
        },
        {
          id: 'asst_9vDTodTAQIJV1mu2xPzXpBs8',
          name: 'Simulador de Paciente de Psicanálise',
          description: 'Psychoanalysis Patient Simulator with Clinical Feedback',
          icon: 'psychology-brain',
          area: 'Psicologia',
          specialization: 'Psychoanalytic Training',
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
    }

    else if (req.method === 'GET' && pathParts.length === 2 && pathParts[1] === 'user') {
      // GET /assistants/user - List assistants available to authenticated user

      // Extract user token for authentication
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token de acesso não fornecido'
        });
      }

      // Create user-specific client
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

      // Get user from token
      const { data: { user }, error: userError } = await userClient.auth.getUser();

      if (userError || !user) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido'
        });
      }

      const userId = user.id;
      const userEmail = user.email;

      // Check if user is admin - if so, give access to all assistants
      if (isAdminUser(userEmail)) {
        console.log('👑 Admin user detected, returning all assistants:', userEmail);

        // Get all active assistants for admin
        const { data: allAssistants, error: adminError } = await supabase
          .from('assistants')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (adminError) {
          console.error('Error getting assistants for admin:', adminError);
        }

        return res.json({
          success: true,
          data: allAssistants || [],
          count: allAssistants ? allAssistants.length : 0,
          message: 'Assistentes do admin recuperados com sucesso',
          access_type: 'admin'
        });
      }

      // Get user's subscriptions (individual + packages)
      const { data: subscriptions, error: subError } = await userClient
        .from('user_subscriptions')
        .select(`
          assistant_id,
          assistants (
            id, name, description, icon, icon_url, icon_type, color_theme,
            monthly_price, semester_price, is_active, area
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      if (subError) {
        console.error('Error getting subscriptions:', subError);
      }

      // Get user's package assistants from user_packages table
      const { data: userPackages, error: packageError } = await userClient
        .from('user_packages')
        .select('assistant_ids, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      let packageAssistantIds = [];
      if (userPackages && userPackages.length > 0) {
        packageAssistantIds = userPackages.flatMap(pkg => pkg.assistant_ids || []);
      }

      console.log('Package assistants from user_packages:', {
        packages: userPackages ? userPackages.length : 0,
        assistantIds: packageAssistantIds
      });

      if (packageError) {
        console.error('Error getting package assistants:', packageError);
      }

      // Combine and deduplicate assistants
      const userAssistants = new Map();
      
      // Add individual subscriptions
      if (subscriptions) {
        subscriptions.forEach(sub => {
          if (sub.assistants) {
            userAssistants.set(sub.assistants.id, sub.assistants);
          }
        });
      }

      // Add package assistants
      if (packageAssistantIds.length > 0) {
        const { data: packageAssistantsData } = await userClient
          .from('assistants')
          .select('*')
          .in('id', packageAssistantIds)
          .eq('is_active', true);

        if (packageAssistantsData) {
          packageAssistantsData.forEach(assistant => {
            userAssistants.set(assistant.id, assistant);
          });
        }
      }

      const availableAssistants = Array.from(userAssistants.values());

      return res.json({
        success: true,
        data: availableAssistants,
        count: availableAssistants.length,
        message: 'Assistentes do usuário recuperados com sucesso'
      });
    }

    else if (req.method === 'GET' && pathParts.length === 2) {
      // GET /assistants/:id - Get specific assistant
      const assistantId = pathParts[1];

      const { data: assistant, error } = await supabase
        .from('assistants')
        .select('*')
        .eq('id', assistantId)
        .eq('is_active', true)
        .single();

      if (error || !assistant) {
        return res.status(404).json({
          success: false,
          error: 'Assistente não encontrado'
        });
      }

      return res.json({
        success: true,
        data: assistant,
        message: 'Assistente recuperado com sucesso'
      });
    }

    else if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'validate-access') {
      // POST /assistants/:id/validate-access - Validate user access to assistant
      const assistantId = pathParts[1];

      // Extract user token for authentication
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token de acesso não fornecido'
        });
      }

      // Create user-specific client
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

      // Get user from token
      const { data: { user }, error: userError } = await userClient.auth.getUser();

      if (userError || !user) {
        return res.status(401).json({
          success: false,
          error: 'Token inválido'
        });
      }

      const userId = user.id;
      const userEmail = user.email;

      // Check if user is admin - if so, always allow access
      if (isAdminUser(userEmail)) {
        console.log('👑 Admin user detected, granting access to assistant:', userEmail, assistantId);
        return res.json({
          success: true,
          data: {
            hasAccess: true,
            accessType: 'admin'
          },
          message: 'Admin tem acesso total'
        });
      }

      // Check individual subscription
      const { data: subscription, error: subError } = await userClient
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('assistant_id', assistantId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .single();

      if (!subError && subscription) {
        return res.json({
          success: true,
          data: {
            hasAccess: true,
            accessType: 'individual_subscription'
          },
          message: 'Usuário tem acesso via assinatura individual'
        });
      }

      // Check package subscription  
      const { data: userPackagesCheck, error: packageError } = await userClient
        .from('user_packages')
        .select('assistant_ids, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      const hasPackageAccess = userPackagesCheck && userPackagesCheck.some(pkg => 
        pkg.assistant_ids && pkg.assistant_ids.includes(assistantId)
      );

      if (!packageError && hasPackageAccess) {
        return res.json({
          success: true,
          data: {
            hasAccess: true,
            accessType: 'package_subscription'
          },
          message: 'Usuário tem acesso via pacote'
        });
      }

      // No access found
      return res.json({
        success: true,
        data: {
          hasAccess: false,
          accessType: 'none'
        },
        message: 'Usuário não possui acesso a este assistente'
      });
    }

    else {
      return res.status(404).json({
        success: false,
        error: 'Endpoint não encontrado'
      });
    }

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