/**
 * API para executar seed data dos assistentes
 * Endpoint: /api/seed-assistants
 * IMPORTANTE: Este endpoint deve ser usado apenas para desenvolvimento/setup inicial
 */
module.exports = async function handler(req, res) {
  console.log('🌱 Assistants Seed API v1.0');

  // Só permitir em desenvolvimento ou com parâmetro especial
  if (process.env.VERCEL_ENV === 'production' && !req.query.force_seed) {
    return res.status(403).json({
      success: false,
      error: 'Seed endpoint não disponível em produção (use ?force_seed=true se necessário)'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Método não permitido - use POST'
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

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuração do servidor incompleta'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🌱 Starting assistants seed...');

    // ============================================
    // SEED ASSISTANTS DATA
    // ============================================
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

    const results = [];

    for (const assistant of assistants) {
      try {
        console.log(`🤖 Inserting assistant: ${assistant.name}`);

        const { data, error } = await supabase
          .from('assistants')
          .upsert(assistant, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          console.error(`❌ Error inserting ${assistant.name}:`, error);
          results.push({
            assistant: assistant.name,
            success: false,
            error: error.message
          });
        } else {
          console.log(`✅ Successfully inserted ${assistant.name}`);
          results.push({
            assistant: assistant.name,
            success: true,
            data: data
          });
        }
      } catch (err) {
        console.error(`💥 Exception inserting ${assistant.name}:`, err);
        results.push({
          assistant: assistant.name,
          success: false,
          error: err.message
        });
      }
    }

    // Verificar quantos assistentes foram criados
    const { count: totalAssistants } = await supabase
      .from('assistants')
      .select('id', { count: 'exact' })
      .eq('is_active', true);

    console.log(`📊 Total active assistants in database: ${totalAssistants}`);

    return res.status(200).json({
      success: true,
      message: 'Seed dos assistentes executado com sucesso',
      data: {
        results,
        total_assistants_created: results.filter(r => r.success).length,
        total_assistants_in_db: totalAssistants,
        seed_results: results
      }
    });

  } catch (error) {
    console.error('💥 Seed assistants error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao executar seed dos assistentes',
      details: error.message
    });
  }
};