-- ==========================================
-- DIAGNÓSTICO COMPLETO - ABPSI CHAT PROBLEM
-- ==========================================
-- Este script faz diagnóstico completo do problema do chat ABPSI
-- Execute este script para identificar exatamente onde está o problema
-- Data: 2025-01-24
-- Autor: Claude Code

-- ==========================================
-- 1. VERIFICAR ESTRUTURA DA TABELA institution_assistants
-- ==========================================

SELECT
    'DIAGNÓSTICO ESTRUTURA' as categoria,
    'Verificar colunas da tabela institution_assistants' as descricao,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'institution_assistants'
    AND table_schema = 'public'
    AND column_name IN ('is_active', 'is_enabled')
ORDER BY column_name;

-- ==========================================
-- 2. VERIFICAR DADOS DA INSTITUIÇÃO ABPSI
-- ==========================================

SELECT
    'DIAGNÓSTICO INSTITUIÇÃO' as categoria,
    'Dados da ABPSI' as descricao,
    id,
    slug,
    name,
    is_active,
    primary_color,
    created_at
FROM public.institutions
WHERE slug = 'abpsi';

-- ==========================================
-- 3. VERIFICAR ASSISTANTS DISPONÍVEIS
-- ==========================================

SELECT
    'DIAGNÓSTICO ASSISTANTS' as categoria,
    'Assistants cadastrados no sistema' as descricao,
    id as assistant_id,
    name,
    is_active,
    openai_assistant_id,
    CASE
        WHEN id = 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd' THEN '✅ ClinReplay (Simulador)'
        WHEN id = 'asst_Ohn9w46OmgwLJhxw08jSbM2f' THEN '✅ NeuroCase (Supervisor)'
        WHEN id = 'asst_hH374jNSOTSqrsbC9Aq5MKo3' THEN '✅ Guia Ético'
        WHEN id = 'asst_9RGTNpAvpwBtNps5krM051km' THEN '✅ TheraTrack'
        ELSE '⚠️ Outro'
    END as identificacao
FROM public.assistants
WHERE id IN (
    'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
    'asst_Ohn9w46OmgwLJhxw08jSbM2f',
    'asst_hH374jNSOTSqrsbC9Aq5MKo3',
    'asst_9RGTNpAvpwBtNps5krM051km'
)
ORDER BY
    CASE id
        WHEN 'asst_ZuPRuYG9eqxmb6tIIcBNSSWd' THEN 1
        WHEN 'asst_Ohn9w46OmgwLJhxw08jSbM2f' THEN 2
        WHEN 'asst_hH374jNSOTSqrsbC9Aq5MKo3' THEN 3
        WHEN 'asst_9RGTNpAvpwBtNps5krM051km' THEN 4
        ELSE 5
    END;

-- ==========================================
-- 4. VERIFICAR INSTITUTION_ASSISTANTS DA ABPSI
-- ==========================================

SELECT
    'DIAGNÓSTICO INSTITUTION_ASSISTANTS' as categoria,
    'Assistants linkados à ABPSI' as descricao,
    ia.id,
    ia.assistant_id,
    a.name as assistant_name,
    ia.custom_name,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'institution_assistants' AND column_name = 'is_active')
        THEN ia.is_active::text
        ELSE 'COLUNA_NAO_EXISTE'
    END as is_active_value,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'institution_assistants' AND column_name = 'is_enabled')
        THEN 'COLUNA_EXISTS'
        ELSE 'COLUNA_NAO_EXISTE'
    END as has_is_enabled_column,
    ia.is_simulator,
    ia.display_order,
    ia.created_at
FROM public.institution_assistants ia
JOIN public.institutions i ON ia.institution_id = i.id
LEFT JOIN public.assistants a ON ia.assistant_id = a.id
WHERE i.slug = 'abpsi'
ORDER BY ia.display_order, ia.created_at;

-- ==========================================
-- 5. TESTAR RPC verify_institution_access
-- ==========================================

SELECT
    'DIAGNÓSTICO RPC' as categoria,
    'Testando RPC verify_institution_access' as descricao,
    'Executando RPC com slug abpsi' as detalhes;

-- Simular chamada do RPC (será executado pelo service_role)
SELECT verify_institution_access('abpsi') as rpc_result;

-- ==========================================
-- 6. VERIFICAR SUBSCRIPTION DA ABPSI
-- ==========================================

SELECT
    'DIAGNÓSTICO SUBSCRIPTION' as categoria,
    'Status da subscription ABPSI' as descricao,
    s.id,
    s.plan_type,
    s.payment_status,
    s.valid_from,
    s.valid_until,
    s.auto_renew,
    s.settings
FROM public.institution_subscriptions s
JOIN public.institutions i ON s.institution_id = i.id
WHERE i.slug = 'abpsi';

-- ==========================================
-- 7. VERIFICAR USUÁRIOS DA ABPSI
-- ==========================================

SELECT
    'DIAGNÓSTICO USUÁRIOS' as categoria,
    'Usuários com acesso à ABPSI' as descricao,
    iu.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', au.email) as user_name,
    iu.role,
    iu.is_active,
    iu.created_at
FROM public.institution_users iu
JOIN auth.users au ON iu.user_id = au.id
JOIN public.institutions i ON iu.institution_id = i.id
WHERE i.slug = 'abpsi'
ORDER BY iu.created_at DESC;

-- ==========================================
-- 8. RESUMO DO DIAGNÓSTICO
-- ==========================================

WITH diagnostic_summary AS (
    SELECT
        (SELECT COUNT(*) FROM public.institutions WHERE slug = 'abpsi' AND is_active = true) as instituicao_ativa,
        (SELECT COUNT(*) FROM public.assistants WHERE id IN (
            'asst_ZuPRuYG9eqxmb6tIIcBNSSWd',
            'asst_Ohn9w46OmgwLJhxw08jSbM2f',
            'asst_hH374jNSOTSqrsbC9Aq5MKo3',
            'asst_9RGTNpAvpwBtNps5krM051km'
        ) AND is_active = true) as assistants_ativos,
        (SELECT COUNT(*) FROM public.institution_assistants ia
         JOIN public.institutions i ON ia.institution_id = i.id
         WHERE i.slug = 'abpsi'
         AND CASE
            WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'institution_assistants' AND column_name = 'is_active')
            THEN ia.is_active = true
            ELSE true  -- Se não tem a coluna, assume true
         END) as institution_assistants_ativos,
        (SELECT COUNT(*) FROM public.institution_subscriptions s
         JOIN public.institutions i ON s.institution_id = i.id
         WHERE i.slug = 'abpsi' AND s.payment_status = 'active') as subscriptions_ativas,
        (SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'institution_assistants' AND column_name = 'is_active')) as tem_coluna_is_active,
        (SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'institution_assistants' AND column_name = 'is_enabled')) as tem_coluna_is_enabled
)
SELECT
    'RESUMO DIAGNÓSTICO' as categoria,
    'Status geral do sistema ABPSI' as descricao,
    instituicao_ativa,
    assistants_ativos,
    institution_assistants_ativos,
    subscriptions_ativas,
    tem_coluna_is_active,
    tem_coluna_is_enabled,
    CASE
        WHEN instituicao_ativa = 1
         AND assistants_ativos = 4
         AND institution_assistants_ativos >= 1
         AND subscriptions_ativas >= 1
         AND tem_coluna_is_active = true
        THEN '✅ SISTEMA OK'
        ELSE '❌ PROBLEMA IDENTIFICADO'
    END as status_geral,
    CASE
        WHEN instituicao_ativa = 0 THEN 'Instituição ABPSI não encontrada ou inativa'
        WHEN assistants_ativos < 4 THEN 'Assistants faltando ou inativos (' || assistants_ativos || '/4)'
        WHEN institution_assistants_ativos = 0 THEN 'Nenhum assistant linkado à ABPSI'
        WHEN subscriptions_ativas = 0 THEN 'Subscription não ativa'
        WHEN tem_coluna_is_active = false THEN 'Coluna is_active não existe na tabela institution_assistants'
        WHEN tem_coluna_is_enabled = true AND tem_coluna_is_active = true THEN 'PROBLEMA: Tabela tem AMBAS as colunas is_active E is_enabled'
        ELSE 'Sistema aparentemente OK - verificar logs da aplicação'
    END as problema_identificado
FROM diagnostic_summary;

-- ==========================================
-- 9. QUERY PARA CORRIGIR PROBLEMAS COMUNS
-- ==========================================

SELECT
    'CORREÇÕES SUGERIDAS' as categoria,
    'Scripts para corrigir problemas identificados' as descricao,
    CASE
        -- Se faltam assistants na tabela institution_assistants
        WHEN (SELECT COUNT(*) FROM public.institution_assistants ia
              JOIN public.institutions i ON ia.institution_id = i.id
              WHERE i.slug = 'abpsi') = 0
        THEN 'EXECUTAR: database/scripts/seed_abpsi_data.sql'

        -- Se institution_assistants tem is_enabled mas RPC espera is_active
        WHEN (SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'institution_assistants' AND column_name = 'is_enabled'))
         AND NOT (SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'institution_assistants' AND column_name = 'is_active'))
        THEN 'EXECUTAR: ALTER TABLE institution_assistants RENAME COLUMN is_enabled TO is_active;'

        -- Se RPC está correto mas ainda há problema
        ELSE 'Verificar logs da aplicação - estrutura parece OK'
    END as acao_recomendada;

-- ==========================================
-- FIM DO DIAGNÓSTICO
-- ==========================================

SELECT
    'DIAGNÓSTICO FINALIZADO' as categoria,
    'Análise completa do sistema ABPSI' as descricao,
    NOW() as executado_em,
    'Verificar resultados acima para identificar problema' as instrucoes;