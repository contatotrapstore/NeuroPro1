-- =====================================================
-- VALIDAÇÃO DE DADOS DA ABPSI - Sistema de Instituições
-- Execute este script para verificar se todos os dados
-- da Academia Brasileira de Psicanálise estão corretos
-- =====================================================

-- 1. VERIFICAR INSTITUIÇÃO ABPSI
-- =====================================================
SELECT
    'INSTITUIÇÃO ABPSI' as verificacao,
    CASE
        WHEN COUNT(*) = 1 THEN '✅ ENCONTRADA'
        WHEN COUNT(*) = 0 THEN '❌ NÃO ENCONTRADA'
        ELSE '⚠️ DUPLICADA'
    END as status,
    COUNT(*) as total
FROM institutions
WHERE slug = 'abpsi';

-- Detalhes da instituição ABPSI
SELECT
    'DETALHES ABPSI' as info,
    id,
    name,
    slug,
    primary_color,
    logo_url,
    is_active,
    created_at
FROM institutions
WHERE slug = 'abpsi';

-- 2. VERIFICAR ASSISTENTES DA ABPSI
-- =====================================================
SELECT
    'ASSISTENTES ABPSI' as verificacao,
    CASE
        WHEN COUNT(*) >= 4 THEN '✅ CONFIGURADOS CORRETAMENTE'
        WHEN COUNT(*) > 0 THEN '⚠️ CONFIGURAÇÃO PARCIAL'
        ELSE '❌ NÃO CONFIGURADOS'
    END as status,
    COUNT(*) as total_configurados,
    COUNT(CASE WHEN is_enabled = true THEN 1 END) as habilitados
FROM institution_assistants ia
WHERE ia.institution_id = (SELECT id FROM institutions WHERE slug = 'abpsi');

-- Lista detalhada dos assistentes ABPSI
SELECT
    'LISTA ASSISTENTES' as info,
    ia.id as config_id,
    a.name as assistant_name,
    ia.custom_name,
    ia.is_enabled,
    ia.is_default,
    ia.display_order,
    a.area
FROM institution_assistants ia
JOIN assistants a ON ia.assistant_id = a.id
JOIN institutions i ON ia.institution_id = i.id
WHERE i.slug = 'abpsi'
ORDER BY ia.display_order, a.name;

-- 3. VERIFICAR ASSISTENTES ESPECÍFICOS ESPERADOS
-- =====================================================
SELECT
    'ASSISTENTE SIMULADOR' as verificacao,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ CONFIGURADO'
        ELSE '❌ NÃO ENCONTRADO'
    END as status
FROM institution_assistants ia
JOIN assistants a ON ia.assistant_id = a.id
JOIN institutions i ON ia.institution_id = i.id
WHERE i.slug = 'abpsi'
    AND (a.name LIKE '%Simulador%' OR a.name LIKE '%Psicanálise%')
    AND ia.is_enabled = true;

-- 4. VERIFICAR USUÁRIOS DA ABPSI
-- =====================================================
SELECT
    'USUÁRIOS ABPSI' as verificacao,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ USUÁRIOS ENCONTRADOS'
        ELSE '⚠️ NENHUM USUÁRIO CADASTRADO'
    END as status,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN is_active = true THEN 1 END) as usuarios_ativos,
    COUNT(CASE WHEN role = 'subadmin' THEN 1 END) as subadmins
FROM institution_users iu
WHERE iu.institution_id = (SELECT id FROM institutions WHERE slug = 'abpsi');

-- Lista de usuários ABPSI
SELECT
    'LISTA USUÁRIOS' as info,
    iu.user_id,
    iu.role,
    iu.registration_number,
    iu.department,
    iu.is_active,
    iu.enrolled_at
FROM institution_users iu
JOIN institutions i ON iu.institution_id = i.id
WHERE i.slug = 'abpsi';

-- 5. VERIFICAR INTEGRIDADE DAS FOREIGN KEYS
-- =====================================================
SELECT
    'INTEGRIDADE FK' as verificacao,
    CASE
        WHEN broken_fks = 0 THEN '✅ TODAS AS FK CORRETAS'
        ELSE '❌ FK QUEBRADAS ENCONTRADAS'
    END as status,
    broken_fks
FROM (
    SELECT
        -- Verificar se todos os assistants em institution_assistants existem
        (SELECT COUNT(*)
         FROM institution_assistants ia
         LEFT JOIN assistants a ON ia.assistant_id = a.id
         WHERE a.id IS NULL AND ia.institution_id = (SELECT id FROM institutions WHERE slug = 'abpsi')) +

        -- Verificar se todos os institutions em institution_assistants existem
        (SELECT COUNT(*)
         FROM institution_assistants ia
         LEFT JOIN institutions i ON ia.institution_id = i.id
         WHERE i.id IS NULL) as broken_fks
) fk_check;

-- 6. VERIFICAR CONFIGURAÇÕES DE RLS (Row Level Security)
-- =====================================================
SELECT
    'RLS POLICIES' as verificacao,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('institutions', 'institution_users', 'institution_assistants')
ORDER BY tablename, policyname;

-- 7. VERIFICAR DADOS ESSENCIAIS DA ABPSI
-- =====================================================
SELECT
    'VALIDAÇÃO FINAL' as verificacao,
    CASE
        WHEN instituicao_ok AND assistentes_ok AND dados_ok THEN '✅ SISTEMA PRONTO'
        ELSE '❌ PROBLEMAS ENCONTRADOS'
    END as status_final,
    instituicao_ok,
    assistentes_ok,
    dados_ok
FROM (
    SELECT
        -- Instituição existe e está ativa
        (SELECT COUNT(*) FROM institutions WHERE slug = 'abpsi' AND is_active = true) = 1 as instituicao_ok,

        -- Pelo menos 3 assistentes configurados e habilitados
        (SELECT COUNT(*)
         FROM institution_assistants ia
         JOIN institutions i ON ia.institution_id = i.id
         WHERE i.slug = 'abpsi' AND ia.is_enabled = true) >= 3 as assistentes_ok,

        -- Dados básicos preenchidos corretamente
        (SELECT COUNT(*)
         FROM institutions
         WHERE slug = 'abpsi'
             AND name = 'Academia Brasileira de Psicanálise'
             AND primary_color = '#c39c49'
             AND logo_url IS NOT NULL) = 1 as dados_ok
) validation_check;

-- 8. ESTATÍSTICAS GERAIS DO SISTEMA
-- =====================================================
SELECT
    'ESTATÍSTICAS GERAIS' as info,
    (SELECT COUNT(*) FROM institutions) as total_institutions,
    (SELECT COUNT(*) FROM institutions WHERE is_active = true) as active_institutions,
    (SELECT COUNT(*) FROM assistants) as total_assistants,
    (SELECT COUNT(*) FROM assistants WHERE is_active = true) as active_assistants,
    (SELECT COUNT(*) FROM institution_assistants) as total_configurations,
    (SELECT COUNT(*) FROM institution_users) as total_institutional_users;

-- 9. VERIFICAR LOGS DE MIGRAÇÃO (se existir tabela)
-- =====================================================
-- Uncomment if you have a migration log table
/*
SELECT
    'MIGRATIONS' as info,
    filename,
    executed_at,
    success
FROM migration_log
WHERE filename LIKE '%020_%' OR filename LIKE '%abpsi%'
ORDER BY executed_at DESC
LIMIT 5;
*/

-- 10. RELATÓRIO RESUMO
-- =====================================================
SELECT
    '=== RELATÓRIO FINAL ===' as relatorio,
    CASE
        WHEN (
            (SELECT COUNT(*) FROM institutions WHERE slug = 'abpsi' AND is_active = true) = 1 AND
            (SELECT COUNT(*) FROM institution_assistants ia
             JOIN institutions i ON ia.institution_id = i.id
             WHERE i.slug = 'abpsi' AND ia.is_enabled = true) >= 3
        ) THEN '🎉 SISTEMA ABPSI PRONTO PARA PRODUÇÃO!'
        ELSE '⚠️ SISTEMA ABPSI REQUER ATENÇÃO'
    END as status_sistema;

-- Comando para verificar se as tabelas existem
SELECT
    'TABELAS SISTEMA' as verificacao,
    table_name,
    CASE
        WHEN table_name IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('institutions', 'institution_users', 'institution_assistants', 'assistants')
ORDER BY table_name;

-- =====================================================
-- FIM DA VALIDAÇÃO
--
-- INSTRUÇÕES:
-- 1. Execute este script no seu ambiente
-- 2. Verifique se todos os status mostram ✅
-- 3. Se algum item mostrar ❌ ou ⚠️, investigue o problema
-- 4. Para problemas de dados, execute as migrations novamente
-- 5. Para problemas de FK, verifique a ordem das migrations
-- =====================================================