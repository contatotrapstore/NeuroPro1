/**
 * API para executar seed completo do banco de dados
 * Endpoint: /api/seed-database
 * IMPORTANTE: Este endpoint deve ser usado apenas para setup inicial
 */
module.exports = async function handler(req, res) {
  console.log('🌱 Database Seed API v1.0');
  console.log('Environment:', process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown');

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

  // Só permitir POST com parâmetro de confirmação
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido - use POST com ?execute=true'
    });
  }

  const executeParam = req.query.execute;
  if (executeParam !== 'true') {
    return res.status(400).json({
      success: false,
      error: 'Para executar o seed, use ?execute=true'
    });
  }

  try {
    // ============================================
    // SUPABASE INITIALIZATION
    // ============================================
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                              process.env.SUPABASE_SERVICE_KEY ||
                              process.env.VITE_SUPABASE_SERVICE_KEY;

    // Use anon key as fallback with warning
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta - necessário SUPABASE_URL e uma chave válida'
      });
    }

    if (!supabaseServiceKey) {
      console.warn('⚠️ Using anon key for seed operations - some operations may fail');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🌱 Starting comprehensive database seed...');

    const seedResults = {
      assistants: { success: [], failed: [] },
      institutions: { success: [], failed: [] },
      institution_assistants: { success: [], failed: [] }
    };

    // ============================================
    // 1. SEED ASSISTANTS
    // ============================================
    console.log('🤖 Seeding assistants...');

    const assistants = [
      {
        id: 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
        name: 'ClinReplay',
        description: 'Simulador interativo para prática de sessões psicanalíticas. Atue como analisando em diferentes cenários clínicos e desenvolva suas habilidades terapêuticas.',
        icon: '🎭',
        color_theme: '#8b5cf6',
        area: 'Psicologia',
        system_prompt: 'Você é um simulador de psicanálise especializado para formação de psicanalistas. Atue como analisando (paciente) em sessões de treinamento para psicanalistas em formação.',
        welcome_message: 'Olá! Sou o ClinReplay, seu simulador de sessões psicanalíticas. Posso interpretar diferentes perfis de pacientes para você praticar suas habilidades clínicas. Como podemos começar?',
        openai_assistant_id: 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
        is_active: true
      },
      {
        id: 'asst_Ohn9w46OmgwLJhxw08jSbM2f',
        name: 'NeuroCase',
        description: 'Assistente especializado em análise e supervisão de casos clínicos, oferecendo insights e orientações baseados em evidências.',
        icon: '🔍',
        color_theme: '#059669',
        area: 'Psicologia',
        system_prompt: 'Você é um supervisor clínico especializado em análise de casos. Auxilie profissionais na compreensão e manejo de situações clínicas complexas.',
        welcome_message: 'Sou o NeuroCase! Estou aqui para ajudar você na análise e supervisão de casos clínicos. Compartilhe seu caso e vamos explorar juntos as melhores abordagens.',
        openai_assistant_id: 'asst_Ohn9w46OmgwLJhxw08jSbM2f',
        is_active: true
      },
      {
        id: 'asst_hH374jNSOTSqrsbC9Aq5MKo3',
        name: 'Guia Ético',
        description: 'Consultor especializado em questões éticas na prática psicológica e psicanalítica, baseado nos códigos de ética profissional.',
        icon: '⚖️',
        color_theme: '#dc2626',
        area: 'Psicologia',
        system_prompt: 'Você é um consultor ético especializado em psicologia e psicanálise. Oriente profissionais sobre dilemas éticos e condutas profissionais adequadas.',
        welcome_message: 'Olá! Sou o Guia Ético. Estou aqui para ajudá-lo a navegar questões éticas complexas na prática clínica. Qual situação você gostaria de discutir?',
        openai_assistant_id: 'asst_hH374jNSOTSqrsbC9Aq5MKo3',
        is_active: true
      },
      {
        id: 'asst_9RGTNpAvpwBtNps5krM051km',
        name: 'TheraTrack',
        description: 'Assistente para acompanhamento e documentação do progresso terapêutico, auxiliando no registro e análise da evolução do processo analítico.',
        icon: '📊',
        color_theme: '#2563eb',
        area: 'Psicologia',
        system_prompt: 'Você é um assistente especializado em acompanhamento terapêutico. Ajude profissionais a documentar, analisar e acompanhar a evolução de seus casos clínicos.',
        welcome_message: 'Sou o TheraTrack! Vou ajudá-lo a acompanhar e documentar o progresso de seus casos clínicos. Como posso auxiliar no registro de sua prática?',
        openai_assistant_id: 'asst_9RGTNpAvpwBtNps5krM051km',
        is_active: true
      },
      {
        id: 'asst_PsicoEdu12345678901234567890',
        name: 'PsicoEdu',
        description: 'Especialista em psicoeducação, oferecendo informações acessíveis sobre saúde mental, desenvolvimento emocional e bem-estar psicológico.',
        icon: '📚',
        color_theme: '#7c3aed',
        area: 'Psicoeducação',
        system_prompt: 'Você é um especialista em psicoeducação. Forneça informações claras, acessíveis e cientificamente embasadas sobre temas de saúde mental e desenvolvimento humano.',
        welcome_message: 'Olá! Sou o PsicoEdu, seu assistente de psicoeducação. Estou aqui para compartilhar conhecimentos sobre saúde mental de forma clara e acessível. O que você gostaria de aprender?',
        openai_assistant_id: 'asst_PsicoEdu12345678901234567890',
        is_active: true
      }
    ];

    for (const assistant of assistants) {
      try {
        console.log(`🤖 Seeding assistant: ${assistant.name}`);

        const { data, error } = await supabase
          .from('assistants')
          .upsert(assistant, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          console.error(`❌ Error seeding ${assistant.name}:`, error);
          seedResults.assistants.failed.push({ name: assistant.name, error: error.message });
        } else {
          console.log(`✅ Successfully seeded ${assistant.name}`);
          seedResults.assistants.success.push(assistant.name);
        }
      } catch (err) {
        console.error(`💥 Exception seeding ${assistant.name}:`, err);
        seedResults.assistants.failed.push({ name: assistant.name, error: err.message });
      }
    }

    // ============================================
    // 2. SEED ABPSI INSTITUTION
    // ============================================
    console.log('🏛️ Seeding ABPSI institution...');

    const abpsiInstitution = {
      slug: 'abpsi',
      name: 'Academia Brasileira de Psicanálise',
      logo_url: '/assets/institutions/abpsi/logo.png',
      primary_color: '#c39c49',
      secondary_color: '#8b6914',
      is_active: true,
      // Only include settings if it's a JSON field in the database
      // settings: JSON.stringify({
      //   welcome_message: "Bem-vindo à Academia Brasileira de Psicanálise",
      //   subtitle: "Formação, Supervisão e Prática Psicanalítica"
      // })
    };

    try {
      const { data: institutionData, error: institutionError } = await supabase
        .from('institutions')
        .upsert(abpsiInstitution, {
          onConflict: 'slug',
          ignoreDuplicates: false
        })
        .select();

      if (institutionError) {
        console.error('❌ Error seeding ABPSI institution:', institutionError);
        seedResults.institutions.failed.push({ name: 'ABPSI', error: institutionError.message });
      } else {
        console.log('✅ Successfully seeded ABPSI institution');
        seedResults.institutions.success.push('ABPSI');

        // ============================================
        // 3. SEED INSTITUTION ASSISTANTS FOR ABPSI
        // ============================================
        if (institutionData && institutionData[0]) {
          console.log('🔗 Seeding ABPSI institution assistants...');

          const institutionId = institutionData[0].id;
          const institutionAssistants = [
            {
              institution_id: institutionId,
              assistant_id: 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
              custom_name: 'Simulador de Psicanálise',
              custom_description: 'Simulador interativo para prática de sessões psicanalíticas. Atue como analisando em diferentes cenários clínicos.',
              is_enabled: true,
              is_default: true,
              display_order: 1
            },
            {
              institution_id: institutionId,
              assistant_id: 'asst_Ohn9w46OmgwLJhxw08jSbM2f',
              custom_name: 'Supervisor de Casos Clínicos',
              custom_description: 'Auxiliar na revisão e análise de casos clínicos sob perspectiva psicanalítica.',
              is_enabled: true,
              is_default: false,
              display_order: 2
            },
            {
              institution_id: institutionId,
              assistant_id: 'asst_hH374jNSOTSqrsbC9Aq5MKo3',
              custom_name: 'Consultor Ético Psicanalítico',
              custom_description: 'Orientação sobre questões éticas na prática psicanalítica.',
              is_enabled: true,
              is_default: false,
              display_order: 3
            },
            {
              institution_id: institutionId,
              assistant_id: 'asst_9RGTNpAvpwBtNps5krM051km',
              custom_name: 'Acompanhamento de Análise',
              custom_description: 'Auxiliar no acompanhamento da evolução do processo analítico.',
              is_enabled: true,
              is_default: false,
              display_order: 4
            }
          ];

          for (const instAssistant of institutionAssistants) {
            try {
              console.log(`🔗 Linking assistant: ${instAssistant.custom_name}`);

              const { error: linkError } = await supabase
                .from('institution_assistants')
                .upsert(instAssistant, {
                  onConflict: 'institution_id,assistant_id',
                  ignoreDuplicates: false
                });

              if (linkError) {
                console.error(`❌ Error linking ${instAssistant.custom_name}:`, linkError);
                seedResults.institution_assistants.failed.push({
                  name: instAssistant.custom_name,
                  error: linkError.message
                });
              } else {
                console.log(`✅ Successfully linked ${instAssistant.custom_name}`);
                seedResults.institution_assistants.success.push(instAssistant.custom_name);
              }
            } catch (err) {
              console.error(`💥 Exception linking ${instAssistant.custom_name}:`, err);
              seedResults.institution_assistants.failed.push({
                name: instAssistant.custom_name,
                error: err.message
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('💥 Exception seeding ABPSI institution:', err);
      seedResults.institutions.failed.push({ name: 'ABPSI', error: err.message });
    }

    // ============================================
    // 4. FINAL VERIFICATION
    // ============================================
    console.log('🔍 Performing final verification...');

    const { count: assistantsCount } = await supabase
      .from('assistants')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    const { count: institutionsCount } = await supabase
      .from('institutions')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    const { count: institutionAssistantsCount } = await supabase
      .from('institution_assistants')
      .select('id', { count: 'exact' })
      .eq('is_enabled', true);

    console.log('📊 Final counts:', {
      assistants: assistantsCount,
      institutions: institutionsCount,
      institution_assistants: institutionAssistantsCount
    });

    return res.status(200).json({
      success: true,
      message: 'Database seed executado com sucesso!',
      data: {
        seed_results: seedResults,
        final_counts: {
          active_assistants: assistantsCount || 0,
          active_institutions: institutionsCount || 0,
          enabled_institution_assistants: institutionAssistantsCount || 0
        },
        summary: {
          assistants_seeded: seedResults.assistants.success.length,
          assistants_failed: seedResults.assistants.failed.length,
          institutions_seeded: seedResults.institutions.success.length,
          institutions_failed: seedResults.institutions.failed.length,
          links_created: seedResults.institution_assistants.success.length,
          links_failed: seedResults.institution_assistants.failed.length
        }
      }
    });

  } catch (error) {
    console.error('💥 Database seed error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao executar seed do banco de dados',
      details: error.message
    });
  }
};