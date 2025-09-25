-- ==========================================
-- SCRIPT PARA CRIAR USUÁRIO DE TESTE ABPSI
-- Sistema de Instituições - Academia Brasileira de Psicanálise
-- Data: 24/01/2025
-- Autor: Claude Code
-- ==========================================

-- IMPORTANTE: Execute este script APÓS executar o EXECUTE_ABPSI_SETUP_CORRECTED.sql
-- Este script cria um usuário de teste com role 'subadmin' para validar o sistema

-- ==========================================
-- VERIFICAR SE A ABPSI EXISTE
-- ==========================================

SELECT 'Verificando se ABPSI existe no sistema...' as status;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.institutions WHERE slug = 'abpsi') THEN
        RAISE EXCEPTION 'ERRO: Instituição ABPSI não encontrada! Execute primeiro o script EXECUTE_ABPSI_SETUP_CORRECTED.sql';
    END IF;
    RAISE NOTICE '✅ Instituição ABPSI encontrada com sucesso!';
END $$;

-- ==========================================
-- CRIAR USUÁRIO DE TESTE NO SUPABASE AUTH
-- ==========================================

-- IMPORTANTE: Esta seção deve ser executada usando o service_role key
-- ou através do Supabase Dashboard > Authentication > Users > "Add User"

-- Dados do usuário de teste:
-- Email: admin.abpsi@teste.com
-- Senha: AbpsiTest2025!
-- Papel: SubAdmin da ABPSI

-- Como você não pode criar usuários diretamente via SQL no auth.users,
-- você precisa:
-- 1. Ir no Supabase Dashboard
-- 2. Authentication > Users
-- 3. "Add User" manualmente com os dados acima
-- 4. Anotar o UUID do usuário criado
-- 5. Substituir 'USER_UUID_AQUI' abaixo pelo UUID real

-- ==========================================
-- ALTERNATIVA: USAR FUNÇÃO DE ADMIN
-- ==========================================

-- Se você tem acesso ao service role, pode usar esta função:
-- (Substitua 'sua_senha_admin' pela senha desejada)

/*
SELECT
    auth.uid() as current_user,
    'Criando usuário admin ABPSI...' as status;

-- Esta função requer privilégios de service_role
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_sent_at,
    recovery_token,
    email_change_sent_at,
    email_change,
    email_change_token_current,
    email_change_token_new,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin.abpsi@teste.com',
    crypt('AbpsiTest2025!', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    '',
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "subadmin", "institution": "abpsi"}',
    false,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    0,
    NULL,
    '',
    NULL
);
*/

-- ==========================================
-- MÉTODO MANUAL RECOMENDADO
-- ==========================================

-- 1. No Supabase Dashboard, vá em Authentication > Users
-- 2. Clique em "Add User"
-- 3. Preencha:
--    - Email: admin.abpsi@teste.com
--    - Password: AbpsiTest2025!
--    - User Metadata: {"role": "subadmin", "institution": "abpsi"}
-- 4. Anote o UUID gerado
-- 5. Execute o código abaixo substituindo o UUID

-- ==========================================
-- VINCULAR USUÁRIO À INSTITUIÇÃO ABPSI
-- ==========================================

-- SUBSTITUA 'USER_UUID_AQUI' pelo UUID do usuário criado manualmente
-- Exemplo: '123e4567-e89b-12d3-a456-426614174000'

-- ⚠️ IMPORTANTE: Substitua o UUID abaixo!
DO $$
DECLARE
    user_uuid UUID := 'USER_UUID_AQUI'; -- SUBSTITUA AQUI!
    institution_uuid UUID;
BEGIN
    -- Verificar se o UUID foi alterado
    IF user_uuid::text = 'USER_UUID_AQUI' THEN
        RAISE EXCEPTION 'ERRO: Você precisa substituir USER_UUID_AQUI pelo UUID real do usuário criado no Dashboard!';
    END IF;

    -- Buscar ID da instituição ABPSI
    SELECT id INTO institution_uuid
    FROM public.institutions
    WHERE slug = 'abpsi';

    IF institution_uuid IS NULL THEN
        RAISE EXCEPTION 'ERRO: Instituição ABPSI não encontrada!';
    END IF;

    -- Inserir usuário na instituição com role subadmin
    INSERT INTO public.institution_users (
        institution_id,
        user_id,
        role,
        registration_number,
        department,
        is_active,
        enrolled_at
    ) VALUES (
        institution_uuid,
        user_uuid,
        'subadmin',
        'ABPSI2025001',
        'Administração',
        true,
        NOW()
    ) ON CONFLICT (institution_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        registration_number = EXCLUDED.registration_number,
        department = EXCLUDED.department,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();

    RAISE NOTICE '✅ Usuário SubAdmin vinculado à ABPSI com sucesso!';
END $$;

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================

SELECT 'Verificando configuração final...' as status;

-- Verificar usuário ABPSI
SELECT
    'USUÁRIO SUBADMIN ABPSI' as verificacao,
    CASE
        WHEN COUNT(*) = 1 THEN '✅ CRIADO COM SUCESSO'
        WHEN COUNT(*) = 0 THEN '❌ NÃO ENCONTRADO'
        ELSE '⚠️ DUPLICADO'
    END as status,
    COUNT(*) as total
FROM public.institution_users iu
JOIN public.institutions i ON iu.institution_id = i.id
WHERE i.slug = 'abpsi'
  AND iu.role = 'subadmin'
  AND iu.is_active = true;

-- Mostrar dados do usuário criado
SELECT
    'DADOS DO USUÁRIO CRIADO' as info,
    iu.user_id,
    iu.role,
    iu.registration_number,
    iu.department,
    iu.is_active,
    iu.enrolled_at,
    i.name as institution_name
FROM public.institution_users iu
JOIN public.institutions i ON iu.institution_id = i.id
WHERE i.slug = 'abpsi'
  AND iu.role = 'subadmin';

-- ==========================================
-- VALIDAÇÃO COMPLETA DO SISTEMA
-- ==========================================

SELECT
    '🎉 SISTEMA ABPSI COMPLETO!' as resultado,
    CASE
        WHEN (
            (SELECT COUNT(*) FROM public.institutions WHERE slug = 'abpsi' AND is_active = true) = 1 AND
            (SELECT COUNT(*) FROM public.institution_assistants ia
             JOIN public.institutions i ON ia.institution_id = i.id
             WHERE i.slug = 'abpsi' AND ia.is_enabled = true) >= 1 AND
            (SELECT COUNT(*) FROM public.institution_users iu
             JOIN public.institutions i ON iu.institution_id = i.id
             WHERE i.slug = 'abpsi' AND iu.role = 'subadmin') >= 1
        ) THEN '✅ TUDO CONFIGURADO CORRETAMENTE'
        ELSE '⚠️ VERIFICAR CONFIGURAÇÕES'
    END as status_geral;

-- ==========================================
-- INSTRUÇÕES FINAIS
-- ==========================================

SELECT
    'PRÓXIMOS PASSOS' as instrucoes,
    '1. Teste o login em: http://localhost:3000/i/abpsi/login' as passo_1,
    '2. Use: admin.abpsi@teste.com / AbpsiTest2025!' as passo_2,
    '3. Verificar acesso ao painel SubAdmin' as passo_3,
    '4. Testar chat com Simulador de Psicanálise' as passo_4;

-- ==========================================
-- FIM DO SCRIPT
--
-- RESUMO DO QUE FOI CONFIGURADO:
-- ✅ Instituição ABPSI com logo e cores
-- ✅ Simulador de Psicanálise ativo
-- ✅ Usuário SubAdmin para testes
-- ✅ RLS policies para isolamento de dados
-- ✅ Portal disponível em /i/abpsi
-- ==========================================