-- ==========================================
-- SCRIPT DE SEED DATA - ASSISTENTES
-- ==========================================
-- Este script popula dados iniciais dos assistentes no sistema
-- Pode ser executado múltiplas vezes (usa ON CONFLICT)
-- Data: 2025-01-25
-- Autor: Claude Code

-- ==========================================
-- 1. INSERIR ASSISTENTES BÁSICOS
-- ==========================================

-- ClinReplay - Simulador de Psicanálise
INSERT INTO public.assistants (
    id,
    name,
    description,
    icon,
    color_theme,
    area,
    system_prompt,
    welcome_message,
    openai_assistant_id,
    is_active
) VALUES (
    'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
    'ClinReplay',
    'Simulador interativo para prática de sessões psicanalíticas. Atue como analisando em diferentes cenários clínicos e desenvolva suas habilidades terapêuticas.',
    '🎭',
    '#8b5cf6',
    'Psicologia',
    'Você é um simulador de psicanálise especializado para formação de psicanalistas. Atue como analisando (paciente) em sessões de treinamento para psicanalistas em formação.',
    'Olá! Sou o ClinReplay, seu simulador de sessões psicanalíticas. Posso interpretar diferentes perfis de pacientes para você praticar suas habilidades clínicas. Como podemos começar?',
    'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    system_prompt = EXCLUDED.system_prompt,
    welcome_message = EXCLUDED.welcome_message,
    updated_at = NOW();

-- NeuroCase - Supervisor de Casos Clínicos
INSERT INTO public.assistants (
    id,
    name,
    description,
    icon,
    color_theme,
    area,
    system_prompt,
    welcome_message,
    openai_assistant_id,
    is_active
) VALUES (
    'asst_Ohn9w46OmgwLJhxw08jSbM2f',
    'NeuroCase',
    'Assistente especializado em análise e supervisão de casos clínicos, oferecendo insights e orientações baseados em evidências.',
    '🔍',
    '#059669',
    'Psicologia',
    'Você é um supervisor clínico especializado em análise de casos. Auxilie profissionais na compreensão e manejo de situações clínicas complexas.',
    'Sou o NeuroCase! Estou aqui para ajudar você na análise e supervisão de casos clínicos. Compartilhe seu caso e vamos explorar juntos as melhores abordagens.',
    'asst_Ohn9w46OmgwLJhxw08jSbM2f',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    system_prompt = EXCLUDED.system_prompt,
    welcome_message = EXCLUDED.welcome_message,
    updated_at = NOW();

-- Guia Ético - Consultor Ético
INSERT INTO public.assistants (
    id,
    name,
    description,
    icon,
    color_theme,
    area,
    system_prompt,
    welcome_message,
    openai_assistant_id,
    is_active
) VALUES (
    'asst_hH374jNSOTSqrsbC9Aq5MKo3',
    'Guia Ético',
    'Consultor especializado em questões éticas na prática psicológica e psicanalítica, baseado nos códigos de ética profissional.',
    '⚖️',
    '#dc2626',
    'Psicologia',
    'Você é um consultor ético especializado em psicologia e psicanálise. Oriente profissionais sobre dilemas éticos e condutas profissionais adequadas.',
    'Olá! Sou o Guia Ético. Estou aqui para ajudá-lo a navegar questões éticas complexas na prática clínica. Qual situação você gostaria de discutir?',
    'asst_hH374jNSOTSqrsbC9Aq5MKo3',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    system_prompt = EXCLUDED.system_prompt,
    welcome_message = EXCLUDED.welcome_message,
    updated_at = NOW();

-- TheraTrack - Acompanhamento de Análise
INSERT INTO public.assistants (
    id,
    name,
    description,
    icon,
    color_theme,
    area,
    system_prompt,
    welcome_message,
    openai_assistant_id,
    is_active
) VALUES (
    'asst_9RGTNpAvpwBtNps5krM051km',
    'TheraTrack',
    'Assistente para acompanhamento e documentação do progresso terapêutico, auxiliando no registro e análise da evolução do processo analítico.',
    '📊',
    '#2563eb',
    'Psicologia',
    'Você é um assistente especializado em acompanhamento terapêutico. Ajude profissionais a documentar, analisar e acompanhar a evolução de seus casos clínicos.',
    'Sou o TheraTrack! Vou ajudá-lo a acompanhar e documentar o progresso de seus casos clínicos. Como posso auxiliar no registro de sua prática?',
    'asst_9RGTNpAvpwBtNps5krM051km',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    system_prompt = EXCLUDED.system_prompt,
    welcome_message = EXCLUDED.welcome_message,
    updated_at = NOW();

-- PsicoEdu - Assistente de Psicoeducação
INSERT INTO public.assistants (
    id,
    name,
    description,
    icon,
    color_theme,
    area,
    system_prompt,
    welcome_message,
    openai_assistant_id,
    is_active
) VALUES (
    'asst_PsicoEdu12345678901234567890',
    'PsicoEdu',
    'Especialista em psicoeducação, oferecendo informações acessíveis sobre saúde mental, desenvolvimento emocional e bem-estar psicológico.',
    '📚',
    '#7c3aed',
    'Psicoeducação',
    'Você é um especialista em psicoeducação. Forneça informações claras, acessíveis e cientificamente embasadas sobre temas de saúde mental e desenvolvimento humano.',
    'Olá! Sou o PsicoEdu, seu assistente de psicoeducação. Estou aqui para compartilhar conhecimentos sobre saúde mental de forma clara e acessível. O que você gostaria de aprender?',
    'asst_PsicoEdu12345678901234567890',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    system_prompt = EXCLUDED.system_prompt,
    welcome_message = EXCLUDED.welcome_message,
    updated_at = NOW();

-- ==========================================
-- 2. VERIFICAÇÃO DOS DADOS INSERIDOS
-- ==========================================

-- Query para verificar se os assistentes foram inseridos corretamente
SELECT
    'VERIFICAÇÃO SEED ASSISTENTES' as status,
    'Assistente criado' as item,
    a.name,
    a.area,
    a.is_active::text as ativo,
    a.created_at
FROM public.assistants a
WHERE a.id IN (
    'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
    'asst_Ohn9w46OmgwLJhxw08jSbM2f',
    'asst_hH374jNSOTSqrsbC9Aq5MKo3',
    'asst_9RGTNpAvpwBtNps5krM051km',
    'asst_PsicoEdu12345678901234567890'
)
ORDER BY a.created_at DESC;

-- Contagem total
SELECT COUNT(*) as total_assistants FROM public.assistants WHERE is_active = true;

-- ==========================================
-- 3. COMENTÁRIOS FINAIS
-- ==========================================

COMMENT ON TABLE public.assistants IS 'Tabela atualizada com dados seed dos assistentes básicos';

-- Log de execução
INSERT INTO public.assistants (
    id,
    name,
    description,
    area,
    is_active
) VALUES (
    '_seed_assistants_log',
    'Assistants Seed Log',
    'Log de execução do script de seed dos assistants - executado em ' || NOW(),
    'Sistema',
    false
) ON CONFLICT (id) DO UPDATE SET
    description = 'Log de execução do script de seed dos assistants - atualizado em ' || NOW(),
    updated_at = NOW();