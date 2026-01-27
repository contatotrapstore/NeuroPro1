-- ==========================================
-- SCRIPT DE SEED DATA - ACADEMIA BRASILEIRA DE PSICANÁLISE
-- ==========================================
-- Este script popula dados iniciais da ABPSI no sistema
-- Pode ser executado múltiplas vezes (usa ON CONFLICT)
-- Data: 2025-01-24

-- ==========================================
-- 1. INSERIR INSTITUIÇÃO ABPSI
-- ==========================================

INSERT INTO public.institutions (
    slug,
    name,
    logo_url,
    primary_color,
    secondary_color,
    settings,
    max_users,
    is_active
) VALUES (
    'abpsi',
    'Academia Brasileira de Psicanálise',
    '/assets/institutions/abpsi/logo.png',
    '#c39c49',
    '#8b6914', -- Versão mais escura da cor primária
    '{
        "welcome_message": "Bem-vindo à Academia Brasileira de Psicanálise",
        "subtitle": "Formação, Supervisão e Prática Psicanalítica",
        "features": [
            "psychoanalysis_simulator",
            "unlimited_sessions",
            "specialized_content"
        ],
        "theme": {
            "font_family": "Inter, system-ui, sans-serif",
            "border_radius": "8px",
            "gradient": "linear-gradient(135deg, #c39c49 0%, #8b6914 100%)"
        },
        "contact": {
            "email": "contato@abpsi.org.br",
            "phone": "+55 11 9999-9999",
            "website": "https://abpsi.org.br"
        },
        "branding": {
            "show_neurolab_footer": false,
            "custom_favicon": "/assets/institutions/abpsi/favicon.ico",
            "meta_description": "Academia Brasileira de Psicanálise - Plataforma de IA para formação psicanalítica"
        }
    }',
    NULL, -- Usuários ilimitados
    true
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    logo_url = EXCLUDED.logo_url,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    settings = EXCLUDED.settings,
    max_users = EXCLUDED.max_users,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ==========================================
-- 2. CONFIGURAR LICENÇA ILIMITADA PARA ABPSI
-- ==========================================

INSERT INTO public.institution_subscriptions (
    institution_id,
    plan_type,
    max_users,
    max_assistants,
    monthly_fee,
    valid_from,
    valid_until,
    payment_status,
    payment_provider,
    payment_reference,
    auto_renew,
    settings
) VALUES (
    (SELECT id FROM public.institutions WHERE slug = 'abpsi'),
    'unlimited',
    NULL, -- Usuários ilimitados
    NULL, -- Assistentes ilimitados
    0.00, -- Gratuito para configuração inicial
    CURRENT_DATE,
    NULL, -- Sem expiração
    'active',
    'manual',
    'ABPSI_INITIAL_LICENSE_2025',
    false, -- Sem renovação automática
    '{
        "description": "Licença inicial da Academia Brasileira de Psicanálise",
        "features": [
            "unlimited_users",
            "unlimited_assistants",
            "psychoanalysis_simulator",
            "advanced_analytics",
            "custom_branding",
            "priority_support"
        ],
        "notes": "Licença de configuração inicial - atualizada em 2025"
    }'
) ON CONFLICT (institution_id, payment_reference) DO UPDATE SET
    plan_type = EXCLUDED.plan_type,
    payment_status = EXCLUDED.payment_status,
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- ==========================================
-- 3. CONFIGURAR ASSISTENTES DA ABPSI
-- ==========================================

-- Simulador de Psicanálise (ClinReplay)
INSERT INTO public.institution_assistants (
    institution_id,
    assistant_id,
    custom_name,
    custom_description,
    custom_prompt,
    is_simulator,
    is_primary,
    display_order,
    is_active,
    settings
) VALUES (
    (SELECT id FROM public.institutions WHERE slug = 'abpsi'),
    'asst_ZuPRuYG9eqxmb6tIIcBNSSWd', -- ClinReplay
    'Simulador de Psicanálise',
    'Simulador interativo para prática de sessões psicanalíticas. Atue como analisando em diferentes cenários clínicos e desenvolva suas habilidades terapêuticas.',
    'Você é um simulador de psicanálise especializado para a Academia Brasileira de Psicanálise. Atue como analisando (paciente) em sessões de treinamento para psicanalistas em formação.

INSTRUÇÕES:
1. Assuma diferentes perfis de pacientes baseados no contexto
2. Apresente resistências, transferências e material inconsciente típicos
3. Responda de forma realista às interpretações do terapeuta
4. Use linguagem apropriada para o contexto psicanalítico brasileiro

CENÁRIOS: neurose obsessiva, histeria, estrutura borderline, melancolia, fobia, perversão, psicose.

Após cada sessão, ofereça feedback construtivo sobre a técnica utilizada.',
    true, -- É simulador
    true, -- É principal
    1,    -- Primeira posição
    true,
    '{
        "simulation_modes": ["obsessive_neurosis", "hysteria", "borderline", "melancholy", "phobia", "perversion", "psychosis"],
        "session_duration": 50,
        "feedback_enabled": true,
        "difficulty_levels": ["beginner", "intermediate", "advanced"],
        "cultural_context": "brazilian",
        "theoretical_approach": "lacanian"
    }'
) ON CONFLICT (institution_id, assistant_id) DO UPDATE SET
    custom_name = EXCLUDED.custom_name,
    custom_description = EXCLUDED.custom_description,
    custom_prompt = EXCLUDED.custom_prompt,
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Outros assistentes para psicanálise
INSERT INTO public.institution_assistants (
    institution_id,
    assistant_id,
    custom_name,
    custom_description,
    display_order,
    is_active
) VALUES
    -- Supervisor de Casos Clínicos
    (
        (SELECT id FROM public.institutions WHERE slug = 'abpsi'),
        'asst_Ohn9w46OmgwLJhxw08jSbM2f', -- NeuroCase
        'Supervisor de Casos Clínicos',
        'Auxiliar na revisão e análise de casos clínicos sob perspectiva psicanalítica.',
        2,
        true
    ),
    -- Consultor Ético
    (
        (SELECT id FROM public.institutions WHERE slug = 'abpsi'),
        'asst_hH374jNSOTSqrsbC9Aq5MKo3', -- Guia Ético
        'Consultor Ético Psicanalítico',
        'Orientação sobre questões éticas na prática psicanalítica.',
        3,
        true
    ),
    -- Acompanhamento de Análise
    (
        (SELECT id FROM public.institutions WHERE slug = 'abpsi'),
        'asst_9RGTNpAvpwBtNps5krM051km', -- TheraTrack
        'Acompanhamento de Análise',
        'Auxiliar no acompanhamento da evolução do processo analítico.',
        4,
        true
    )
ON CONFLICT (institution_id, assistant_id) DO UPDATE SET
    custom_name = EXCLUDED.custom_name,
    custom_description = EXCLUDED.custom_description,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- ==========================================
-- 4. INSERIR DADOS DE TESTE (OPCIONAIS)
-- ==========================================

-- Inserir usuários de teste da ABPSI (apenas se não existirem)
DO $$
DECLARE
    abpsi_id UUID;
    test_user_id UUID;
BEGIN
    -- Buscar ID da ABPSI
    SELECT id INTO abpsi_id FROM public.institutions WHERE slug = 'abpsi';

    IF abpsi_id IS NOT NULL THEN
        -- Criar usuário de teste se não existir
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data
        ) VALUES (
            gen_random_uuid(),
            'teste.abpsi@exemplo.com',
            crypt('senha123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"name": "Usuário Teste ABPSI", "role": "student"}'
        ) ON CONFLICT (email) DO NOTHING
        RETURNING id INTO test_user_id;

        -- Se usuário foi criado ou já existe, buscar seu ID
        IF test_user_id IS NULL THEN
            SELECT id INTO test_user_id FROM auth.users WHERE email = 'teste.abpsi@exemplo.com';
        END IF;

        -- Adicionar usuário à instituição
        IF test_user_id IS NOT NULL THEN
            INSERT INTO public.institution_users (
                institution_id,
                user_id,
                role,
                is_active
            ) VALUES (
                abpsi_id,
                test_user_id,
                'student',
                true
            ) ON CONFLICT (institution_id, user_id) DO UPDATE SET
                is_active = true,
                updated_at = NOW();
        END IF;
    END IF;
END $$;

-- ==========================================
-- 5. VERIFICAÇÃO DOS DADOS INSERIDOS
-- ==========================================

-- Query para verificar se os dados foram inseridos corretamente
SELECT
    'VERIFICAÇÃO SEED DATA ABPSI' as status,
    'Instituição criada' as item,
    i.name,
    i.slug,
    i.is_active::text as ativo
FROM public.institutions i
WHERE i.slug = 'abpsi'

UNION ALL

SELECT
    'VERIFICAÇÃO SEED DATA ABPSI' as status,
    'Licença configurada' as item,
    s.plan_type,
    s.payment_status,
    s.valid_until::text
FROM public.institution_subscriptions s
JOIN public.institutions i ON s.institution_id = i.id
WHERE i.slug = 'abpsi'

UNION ALL

SELECT
    'VERIFICAÇÃO SEED DATA ABPSI' as status,
    'Assistentes configurados' as item,
    ia.custom_name,
    a.name as original_name,
    ia.is_active::text
FROM public.institution_assistants ia
JOIN public.assistants a ON ia.assistant_id = a.id
JOIN public.institutions i ON ia.institution_id = i.id
WHERE i.slug = 'abpsi'

UNION ALL

SELECT
    'VERIFICAÇÃO SEED DATA ABPSI' as status,
    'Usuários da instituição' as item,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as user_info,
    iu.role,
    iu.is_active::text
FROM public.institution_users iu
JOIN auth.users au ON iu.user_id = au.id
JOIN public.institutions i ON iu.institution_id = i.id
WHERE i.slug = 'abpsi'

ORDER BY status, item;

-- ==========================================
-- 6. COMENTÁRIOS FINAIS
-- ==========================================

COMMENT ON TABLE public.institutions IS 'Tabela atualizada com dados seed da ABPSI';

-- Log de execução
INSERT INTO public.institutions (slug, name, settings, is_active) VALUES ('_seed_log', 'Seed Data Log', '{"executed_at": "' || NOW() || '", "script": "seed_abpsi_data.sql"}', false) ON CONFLICT (slug) DO UPDATE SET settings = '{"executed_at": "' || NOW() || '", "script": "seed_abpsi_data.sql", "updated": true}', updated_at = NOW();