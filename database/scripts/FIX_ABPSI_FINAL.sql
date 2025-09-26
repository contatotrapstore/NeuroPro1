-- ==========================================
-- FIX FINAL - ABPSI CHAT PROBLEM
-- ==========================================
-- Este script corrige todos os problemas identificados no chat ABPSI
-- Execute APÓS rodar o diagnóstico DIAGNOSTIC_ABPSI_COMPLETE.sql
-- Data: 2025-01-24
-- Autor: Claude Code

-- ==========================================
-- 1. CORRIGIR COLUNA institution_assistants SE NECESSÁRIO
-- ==========================================

-- Se a tabela tem is_enabled mas não tem is_active, renomear
DO $$
BEGIN
    -- Verificar se tem is_enabled mas não tem is_active
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'institution_assistants'
        AND column_name = 'is_enabled'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'institution_assistants'
        AND column_name = 'is_active'
    ) THEN
        RAISE NOTICE 'Renomeando coluna is_enabled para is_active...';
        ALTER TABLE public.institution_assistants RENAME COLUMN is_enabled TO is_active;
        RAISE NOTICE '✅ Coluna renomeada com sucesso!';
    ELSE
        RAISE NOTICE 'Estrutura da tabela já está correta (usa is_active)';
    END IF;
END $$;

-- ==========================================
-- 2. GARANTIR QUE A INSTITUIÇÃO ABPSI EXISTE
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
    '#8b6914',
    '{
        "welcome_message": "Bem-vindo à Academia Brasileira de Psicanálise",
        "subtitle": "Formação, Supervisão e Prática Psicanalítica",
        "features": [
            "psychoanalysis_simulator",
            "unlimited_sessions",
            "specialized_content"
        ]
    }',
    NULL,
    true
) ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = true,
    updated_at = NOW();

-- ==========================================
-- 3. GARANTIR QUE OS ASSISTANTS EXISTEM
-- ==========================================

-- Verificar se todos os 4 assistants principais existem
INSERT INTO public.assistants (id, name, description, icon, color_theme, is_active) VALUES
('asst_ZuPRuYG9eqxmb6tIIcBNSSWd', 'ClinReplay', 'Treinador de Sessão (IA paciente)', '🎭', '#EA580C', true),
('asst_Ohn9w46OmgwLJhxw08jSbM2f', 'NeuroCase', 'Revisor de Quadro Clínico', '🔍', '#1A3A0F', true),
('asst_hH374jNSOTSqrsbC9Aq5MKo3', 'Guia Ético', 'Avaliação Profissional e Autorreflexão', '⚖️', '#7C3AED', true),
('asst_9RGTNpAvpwBtNps5krM051km', 'TheraTrack', 'Avaliador de Evolução Terapêutica', '📈', '#0E1E03', true)
ON CONFLICT (id) DO UPDATE SET
    is_active = true,
    updated_at = NOW();

-- Atualizar openai_assistant_id se necessário
UPDATE public.assistants
SET openai_assistant_id = id
WHERE openai_assistant_id IS NULL
AND id IN (
    'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
    'asst_Ohn9w46OmgwLJhxw08jSbM2f',
    'asst_hH374jNSOTSqrsbC9Aq5MKo3',
    'asst_9RGTNpAvpwBtNps5krM051km'
);

-- ==========================================
-- 4. FORÇAR RECRIAÇÃO DOS INSTITUTION_ASSISTANTS
-- ==========================================

-- Deletar existing links da ABPSI para recriar corretamente
DELETE FROM public.institution_assistants
WHERE institution_id = (SELECT id FROM public.institutions WHERE slug = 'abpsi');

-- Recriar com dados corretos
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
    'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
    'Simulador de Psicanálise ABPSI',
    'Simulador interativo para prática de sessões psicanalíticas. Atue como analisando em diferentes cenários clínicos e desenvolva suas habilidades terapêuticas.',
    'Você é um simulador de psicanálise especializado para a Academia Brasileira de Psicanálise. Atue como analisando (paciente) em sessões de treinamento para psicanalistas em formação.',
    true,  -- is_simulator
    true,  -- is_primary
    1,     -- display_order
    true,  -- is_active
    '{
        "simulation_modes": ["obsessive_neurosis", "hysteria", "borderline", "melancholy"],
        "session_duration": 50,
        "feedback_enabled": true,
        "difficulty_levels": ["beginner", "intermediate", "advanced"],
        "cultural_context": "brazilian",
        "theoretical_approach": "lacanian"
    }'
);

-- Adicionar outros assistants
INSERT INTO public.institution_assistants (
    institution_id,
    assistant_id,
    custom_name,
    custom_description,
    display_order,
    is_active
) VALUES
    (
        (SELECT id FROM public.institutions WHERE slug = 'abpsi'),
        'asst_Ohn9w46OmgwLJhxw08jSbM2f',
        'Supervisor de Casos Clínicos',
        'Auxiliar na revisão e análise de casos clínicos sob perspectiva psicanalítica.',
        2,
        true
    ),
    (
        (SELECT id FROM public.institutions WHERE slug = 'abpsi'),
        'asst_hH374jNSOTSqrsbC9Aq5MKo3',
        'Consultor Ético Psicanalítico',
        'Orientação sobre questões éticas na prática psicanalítica.',
        3,
        true
    ),
    (
        (SELECT id FROM public.institutions WHERE slug = 'abpsi'),
        'asst_9RGTNpAvpwBtNps5krM051km',
        'Acompanhamento de Análise',
        'Auxiliar no acompanhamento da evolução do processo analítico.',
        4,
        true
    );

-- ==========================================
-- 5. GARANTIR SUBSCRIPTION ATIVA
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
    NULL,
    NULL,
    0.00,
    CURRENT_DATE,
    NULL,
    'active',
    'manual',
    'ABPSI_FIX_LICENSE_2025',
    false,
    '{
        "description": "Licença corrigida da Academia Brasileira de Psicanálise",
        "features": [
            "unlimited_users",
            "unlimited_assistants",
            "psychoanalysis_simulator",
            "priority_support"
        ],
        "notes": "Licença corrigida em 2025-01-24"
    }'
) ON CONFLICT (institution_id, payment_reference) DO UPDATE SET
    payment_status = 'active',
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- ==========================================
-- 6. VALIDAÇÃO FINAL
-- ==========================================

-- Testar o RPC corrigido
SELECT
    'VALIDAÇÃO FINAL' as etapa,
    'Testando RPC verify_institution_access após correções' as acao;

-- Execute o RPC e mostre o resultado
DO $$
DECLARE
    rpc_result JSON;
    assistant_count INTEGER;
BEGIN
    -- Executar o RPC
    SELECT verify_institution_access('abpsi') INTO rpc_result;

    -- Contar assistants retornados
    SELECT jsonb_array_length(rpc_result->'data'->'available_assistants') INTO assistant_count;

    RAISE NOTICE '🔍 RPC Result Success: %', rpc_result->>'success';
    RAISE NOTICE '🎯 Available Assistants Count: %', assistant_count;

    IF (rpc_result->>'success')::boolean = true AND assistant_count > 0 THEN
        RAISE NOTICE '✅ RPC funcionando corretamente! Assistants disponíveis: %', assistant_count;
    ELSE
        RAISE NOTICE '❌ RPC ainda com problemas. Resultado: %', rpc_result;
    END IF;
END $$;

-- ==========================================
-- 7. RELATÓRIO FINAL
-- ==========================================

SELECT
    'CORREÇÃO FINALIZADA' as status,
    'Sistema ABPSI corrigido' as resultado,
    NOW() as data_correcao,
    (SELECT COUNT(*) FROM public.institution_assistants ia
     JOIN public.institutions i ON ia.institution_id = i.id
     WHERE i.slug = 'abpsi' AND ia.is_active = true) as assistants_ativos,
    (SELECT payment_status FROM public.institution_subscriptions s
     JOIN public.institutions i ON s.institution_id = i.id
     WHERE i.slug = 'abpsi' LIMIT 1) as status_subscription;

RAISE NOTICE '🎉 CORREÇÃO FINALIZADA!';
RAISE NOTICE '📋 Próximos passos:';
RAISE NOTICE '1. Fazer commit das mudanças no código';
RAISE NOTICE '2. Deploy da aplicação';
RAISE NOTICE '3. Testar chat ABPSI';
RAISE NOTICE '4. Verificar logs no Vercel Functions';