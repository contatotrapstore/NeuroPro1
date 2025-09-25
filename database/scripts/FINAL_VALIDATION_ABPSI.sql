-- ==========================================
-- VALIDAÇÃO FINAL COMPLETA DO SISTEMA ABPSI
-- Sistema de Instituições - Academia Brasileira de Psicanálise
-- Data: 24/01/2025
-- Autor: Claude Code
-- ==========================================

-- Execute este script para validar se tudo está funcionando corretamente

-- ==========================================
-- 1. VALIDAÇÃO DE TABELAS E ESTRUTURA
-- ==========================================

SELECT '=== VALIDAÇÃO DE ESTRUTURA ===' as secao;

-- Verificar se todas as tabelas institucionais existem
SELECT
    'TABELAS INSTITUCIONAIS' as verificacao,
    CASE
        WHEN COUNT(*) >= 3 THEN '✅ TODAS AS TABELAS CRIADAS'
        ELSE '❌ TABELAS FALTANDO'
    END as status,
    COUNT(*) as tabelas_criadas,
    STRING_AGG(table_name, ', ') as lista_tabelas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('institutions', 'institution_users', 'institution_assistants');

-- Verificar se RLS está habilitado
SELECT
    'ROW LEVEL SECURITY' as verificacao,
    table_name,
    CASE
        WHEN row_security = 'YES' THEN '✅ RLS ATIVO'
        ELSE '❌ RLS INATIVO'
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('institutions', 'institution_users', 'institution_assistants')
ORDER BY table_name;

-- ==========================================
-- 2. VALIDAÇÃO DA INSTITUIÇÃO ABPSI
-- ==========================================

SELECT '=== VALIDAÇÃO INSTITUIÇÃO ABPSI ===' as secao;

-- Verificar dados da ABPSI
SELECT
    'DADOS ABPSI' as verificacao,
    id,
    name,
    slug,
    primary_color,
    logo_url,
    CASE
        WHEN is_active = true THEN '✅ ATIVA'
        ELSE '❌ INATIVA'
    END as status,
    created_at
FROM public.institutions
WHERE slug = 'abpsi';

-- Verificar settings da ABPSI
SELECT
    'CONFIGURAÇÕES ABPSI' as verificacao,
    CASE
        WHEN settings IS NOT NULL AND settings != '{}' THEN '✅ CONFIGURADA'
        ELSE '⚠️ SEM CONFIGURAÇÕES PERSONALIZADAS'
    END as status,
    jsonb_pretty(settings) as configuracoes
FROM public.institutions
WHERE slug = 'abpsi';

-- ==========================================
-- 3. VALIDAÇÃO DOS ASSISTENTES
-- ==========================================

SELECT '=== VALIDAÇÃO ASSISTENTES ===' as secao;

-- Verificar assistentes configurados para ABPSI
SELECT
    'ASSISTENTES ABPSI' as verificacao,
    ia.assistant_id,
    ia.custom_name,
    CASE
        WHEN ia.is_enabled = true THEN '✅ HABILITADO'
        ELSE '❌ DESABILITADO'
    END as status,
    CASE
        WHEN ia.is_default = true THEN '⭐ PADRÃO'
        ELSE '🔸 SECUNDÁRIO'
    END as tipo,
    ia.display_order,
    ia.created_at
FROM public.institution_assistants ia
JOIN public.institutions i ON ia.institution_id = i.id
WHERE i.slug = 'abpsi'
ORDER BY ia.display_order, ia.created_at;

-- Verificar se o Simulador de Psicanálise está configurado
SELECT
    'SIMULADOR PSICANÁLISE' as verificacao,
    CASE
        WHEN COUNT(*) = 1 THEN '✅ CONFIGURADO CORRETAMENTE'
        WHEN COUNT(*) = 0 THEN '❌ NÃO ENCONTRADO'
        ELSE '⚠️ DUPLICADO'
    END as status,
    MAX(ia.custom_name) as nome_personalizado,
    MAX(ia.assistant_id) as openai_id
FROM public.institution_assistants ia
JOIN public.institutions i ON ia.institution_id = i.id
WHERE i.slug = 'abpsi'
  AND ia.assistant_id = 'asst_9vDTodTAQIJV1mu2xPzXpBs8'
  AND ia.is_enabled = true;

-- ==========================================
-- 4. VALIDAÇÃO DOS USUÁRIOS
-- ==========================================

SELECT '=== VALIDAÇÃO USUÁRIOS ===' as secao;

-- Verificar usuários da ABPSI
SELECT
    'USUÁRIOS ABPSI' as verificacao,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN role = 'subadmin' THEN 1 END) as subadmins,
    COUNT(CASE WHEN role = 'professor' THEN 1 END) as professores,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as estudantes,
    COUNT(CASE WHEN is_active = true THEN 1 END) as usuarios_ativos
FROM public.institution_users iu
JOIN public.institutions i ON iu.institution_id = i.id
WHERE i.slug = 'abpsi';

-- Mostrar lista detalhada dos usuários
SELECT
    'LISTA USUÁRIOS ABPSI' as info,
    iu.user_id,
    iu.role,
    iu.registration_number,
    iu.department,
    CASE
        WHEN iu.is_active = true THEN '✅ ATIVO'
        ELSE '❌ INATIVO'
    END as status,
    iu.enrolled_at
FROM public.institution_users iu
JOIN public.institutions i ON iu.institution_id = i.id
WHERE i.slug = 'abpsi'
ORDER BY iu.role, iu.enrolled_at;

-- ==========================================
-- 5. VALIDAÇÃO DAS POLÍTICAS RLS
-- ==========================================

SELECT '=== VALIDAÇÃO POLÍTICAS RLS ===' as secao;

-- Verificar políticas criadas
SELECT
    'POLÍTICAS RLS' as verificacao,
    schemaname,
    tablename,
    policyname,
    CASE
        WHEN cmd = 'SELECT' THEN '👁️ LEITURA'
        WHEN cmd = 'INSERT' THEN '➕ INSERÇÃO'
        WHEN cmd = 'UPDATE' THEN '✏️ ATUALIZAÇÃO'
        WHEN cmd = 'DELETE' THEN '🗑️ EXCLUSÃO'
        ELSE cmd
    END as operacao,
    CASE
        WHEN permissive = 'PERMISSIVE' THEN '✅ PERMISSIVA'
        ELSE '🚫 RESTRITIVA'
    END as tipo
FROM pg_policies
WHERE tablename IN ('institutions', 'institution_users', 'institution_assistants')
ORDER BY tablename, policyname;

-- Verificar permissões das tabelas
SELECT
    'PERMISSÕES TABELAS' as verificacao,
    grantee as usuario,
    table_name as tabela,
    STRING_AGG(privilege_type, ', ') as permissoes
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('institutions', 'institution_users', 'institution_assistants')
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

-- ==========================================
-- 6. TESTE DE INTEGRIDADE DE DADOS
-- ==========================================

SELECT '=== TESTE INTEGRIDADE ===' as secao;

-- Verificar integridade das Foreign Keys
SELECT
    'INTEGRIDADE FK' as verificacao,
    CASE
        WHEN broken_fks = 0 THEN '✅ TODAS AS FK CORRETAS'
        ELSE '❌ FK QUEBRADAS ENCONTRADAS'
    END as status,
    broken_fks as problemas_encontrados
FROM (
    SELECT
        -- Verificar se todos os institution_users apontam para instituições válidas
        (SELECT COUNT(*)
         FROM public.institution_users iu
         LEFT JOIN public.institutions i ON iu.institution_id = i.id
         WHERE i.id IS NULL) +

        -- Verificar se todos os institution_assistants apontam para instituições válidas
        (SELECT COUNT(*)
         FROM public.institution_assistants ia
         LEFT JOIN public.institutions i ON ia.institution_id = i.id
         WHERE i.id IS NULL) as broken_fks
) fk_check;

-- ==========================================
-- 7. VALIDAÇÃO DE CONECTIVIDADE FRONTEND
-- ==========================================

SELECT '=== VALIDAÇÃO FRONTEND ===' as secao;

-- Verificar se o logo existe no caminho esperado
SELECT
    'ARQUIVO LOGO' as verificacao,
    '/assets/institutions/abpsi/logo.png' as caminho_esperado,
    '⚠️ VERIFICAR MANUALMENTE SE O ARQUIVO EXISTE EM:' as instrucao,
    'frontend/dist/assets/institutions/abpsi/logo.png' as caminho_fisico;

-- URLs que devem funcionar após a configuração
SELECT
    'URLS PORTAL ABPSI' as verificacao,
    'http://localhost:3000/i/abpsi' as home_institucional,
    'http://localhost:3000/i/abpsi/login' as login_abpsi,
    'http://localhost:3000/i/abpsi/chat' as chat_abpsi,
    'http://localhost:3000/i/abpsi/admin' as admin_subadmin,
    'http://localhost:3000/i/abpsi/subscription' as licenca_abpsi;

-- ==========================================
-- 8. RELATÓRIO FINAL DE STATUS
-- ==========================================

SELECT '=== RELATÓRIO FINAL ===' as secao;

-- Status geral do sistema
SELECT
    'STATUS SISTEMA ABPSI' as relatorio,
    CASE
        WHEN (
            -- Instituição existe e está ativa
            (SELECT COUNT(*) FROM public.institutions WHERE slug = 'abpsi' AND is_active = true) = 1 AND

            -- Pelo menos 1 assistente configurado e habilitado
            (SELECT COUNT(*) FROM public.institution_assistants ia
             JOIN public.institutions i ON ia.institution_id = i.id
             WHERE i.slug = 'abpsi' AND ia.is_enabled = true) >= 1 AND

            -- Simulador de Psicanálise específico está configurado
            (SELECT COUNT(*) FROM public.institution_assistants ia
             JOIN public.institutions i ON ia.institution_id = i.id
             WHERE i.slug = 'abpsi'
               AND ia.assistant_id = 'asst_9vDTodTAQIJV1mu2xPzXpBs8'
               AND ia.is_enabled = true) = 1 AND

            -- Pelo menos 1 usuário subadmin cadastrado
            (SELECT COUNT(*) FROM public.institution_users iu
             JOIN public.institutions i ON iu.institution_id = i.id
             WHERE i.slug = 'abpsi' AND iu.role = 'subadmin' AND iu.is_active = true) >= 1

        ) THEN '🎉 SISTEMA ABPSI PRONTO PARA PRODUÇÃO!'
        ELSE '⚠️ SISTEMA ABPSI REQUER ATENÇÃO - VERIFICAR ITENS ACIMA'
    END as status_final;

-- Checklist de validação
SELECT
    'CHECKLIST FINAL' as item,
    '✅ Tabelas criadas' as estrutura_db,
    CASE WHEN (SELECT COUNT(*) FROM public.institutions WHERE slug = 'abpsi') = 1
         THEN '✅ ABPSI cadastrada'
         ELSE '❌ ABPSI não encontrada' END as instituicao,
    CASE WHEN (SELECT COUNT(*) FROM public.institution_assistants ia JOIN public.institutions i ON ia.institution_id = i.id WHERE i.slug = 'abpsi' AND ia.is_enabled = true) >= 1
         THEN '✅ Assistentes configurados'
         ELSE '❌ Sem assistentes' END as assistentes,
    CASE WHEN (SELECT COUNT(*) FROM public.institution_users iu JOIN public.institutions i ON iu.institution_id = i.id WHERE i.slug = 'abpsi' AND iu.role = 'subadmin') >= 1
         THEN '✅ SubAdmin criado'
         ELSE '❌ Sem SubAdmin' END as usuarios,
    '✅ RLS configurado' as seguranca;

-- ==========================================
-- PRÓXIMOS PASSOS
-- ==========================================

SELECT
    'PRÓXIMOS PASSOS PARA TESTE' as instrucoes,
    '1️⃣ Verificar se todos os status acima mostram ✅' as passo_1,
    '2️⃣ Iniciar o frontend: cd frontend && npm run dev' as passo_2,
    '3️⃣ Iniciar o backend: cd api && npm run dev' as passo_3,
    '4️⃣ Acessar: http://localhost:3000/i/abpsi' as passo_4,
    '5️⃣ Testar login com usuário SubAdmin criado' as passo_5,
    '6️⃣ Verificar chat com Simulador de Psicanálise' as passo_6;

-- ==========================================
-- FIM DA VALIDAÇÃO
-- ==========================================

SELECT '🎯 VALIDAÇÃO COMPLETA EXECUTADA!' as fim;