-- Popular dados iniciais da Academia Brasileira de Psicanálise (ABPSI)
-- Data: 2025-01-24
-- Descrição: Configuração inicial da ABPSI como primeira instituição do sistema

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
    updated_at = NOW();

-- ==========================================
-- 2. CONFIGURAR ASSISTENTE SIMULADOR DE PSICANÁLISE
-- ==========================================

-- Configurar ClinReplay como simulador principal da ABPSI
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
    'Simulador interativo para prática de sessões psicanalíticas. Atue como analisando em diferentes cenários clínicos e desenvolva suas habilidades terapêuticas em um ambiente seguro e controlado.',
    'Você é um simulador de psicanálise especializado para a Academia Brasileira de Psicanálise. Seu papel é atuar como um analisando (paciente) em sessões de treinamento para psicanalistas em formação.

INSTRUÇÕES ESPECÍFICAS:
1. Assuma diferentes perfis de pacientes baseados no contexto da sessão
2. Apresente resistências, transferências e material inconsciente típicos
3. Responda de forma realista às interpretações do terapeuta
4. Mantenha consistência com o perfil assumido durante toda a sessão
5. Use linguagem apropriada para o contexto psicanalítico brasileiro
6. Inclua aspectos culturais e sociais relevantes para o Brasil

CENÁRIOS DISPONÍVEIS:
- Neurose obsessiva
- Histeria
- Estrutura borderline
- Melancolia
- Fobia
- Perversão
- Psicose

Após cada sessão, ofereça feedback construtivo sobre a técnica utilizada pelo terapeuta em formação.',
    true, -- É simulador
    true, -- É principal
    1,    -- Primeira posição
    true,
    '{
        "simulation_modes": [
            "obsessive_neurosis",
            "hysteria",
            "borderline",
            "melancholy",
            "phobia",
            "perversion",
            "psychosis"
        ],
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
    is_simulator = EXCLUDED.is_simulator,
    is_primary = EXCLUDED.is_primary,
    settings = EXCLUDED.settings,
    updated_at = NOW();

-- Adicionar outros assistentes relevantes para psicanálise
INSERT INTO public.institution_assistants (
    institution_id,
    assistant_id,
    custom_name,
    custom_description,
    display_order,
    is_active
) VALUES
    -- NeuroCase para casos clínicos
    (
        (SELECT id FROM public.institutions WHERE slug = 'abpsi'),
        'asst_Ohn9w46OmgwLJhxw08jSbM2f',
        'Supervisor de Casos Clínicos',
        'Auxiliar na revisão e análise de casos clínicos sob perspectiva psicanalítica, oferecendo insights teóricos e técnicos.',
        2,
        true
    ),
    -- Guia Ético para questões profissionais
    (
        (SELECT id FROM public.institutions WHERE slug = 'abpsi'),
        'asst_hH374jNSOTSqrsbC9Aq5MKo3',
        'Consultor Ético Psicanalítico',
        'Orientação sobre questões éticas na prática psicanalítica, baseado nos códigos de ética profissional.',
        3,
        true
    ),
    -- TheraTrack para acompanhamento de evolução
    (
        (SELECT id FROM public.institutions WHERE slug = 'abpsi'),
        'asst_9RGTNpAvpwBtNps5krM051km',
        'Acompanhamento de Análise',
        'Auxiliar no acompanhamento da evolução do processo analítico e identificação de padrões transferenciais.',
        4,
        true
    )
ON CONFLICT (institution_id, assistant_id) DO UPDATE SET
    custom_name = EXCLUDED.custom_name,
    custom_description = EXCLUDED.custom_description,
    display_order = EXCLUDED.display_order,
    updated_at = NOW();

-- ==========================================
-- 3. CONFIGURAR LICENÇA ILIMITADA PARA ABPSI
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
    'ABPSI_INITIAL_LICENSE',
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
        "notes": "Licença de configuração inicial - ajustar conforme acordo comercial"
    }'
) ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. CRIAR USUÁRIO ADMIN INICIAL PARA ABPSI
-- ==========================================

-- Nota: O usuário admin inicial será criado via aplicação
-- Aqui preparamos a estrutura para quando isso acontecer

-- Função para facilitar a criação do primeiro admin da ABPSI
CREATE OR REPLACE FUNCTION create_abpsi_initial_admin(admin_email TEXT)
RETURNS UUID AS $$
DECLARE
    user_uuid UUID;
    institution_uuid UUID;
BEGIN
    -- Buscar UUID do usuário pelo email
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = admin_email;

    -- Buscar UUID da instituição ABPSI
    SELECT id INTO institution_uuid
    FROM public.institutions
    WHERE slug = 'abpsi';

    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado', admin_email;
    END IF;

    IF institution_uuid IS NULL THEN
        RAISE EXCEPTION 'Instituição ABPSI não encontrada';
    END IF;

    -- Adicionar usuário à instituição
    INSERT INTO public.institution_users (
        institution_id,
        user_id,
        role,
        is_active
    ) VALUES (
        institution_uuid,
        user_uuid,
        'subadmin',
        true
    ) ON CONFLICT (institution_id, user_id) DO UPDATE SET
        role = 'subadmin',
        is_active = true,
        updated_at = NOW();

    -- Adicionar como admin com todas as permissões
    INSERT INTO public.institution_admins (
        institution_id,
        user_id,
        permissions,
        is_active
    ) VALUES (
        institution_uuid,
        user_uuid,
        '{
            "manage_users": true,
            "view_reports": true,
            "manage_assistants": true,
            "manage_settings": true,
            "view_conversations": true,
            "export_data": true
        }',
        true
    ) ON CONFLICT (institution_id, user_id) DO UPDATE SET
        permissions = EXCLUDED.permissions,
        is_active = true,
        updated_at = NOW();

    RETURN user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões para a função
GRANT EXECUTE ON FUNCTION create_abpsi_initial_admin TO service_role;

-- ==========================================
-- 5. CONFIGURAÇÕES ADICIONAIS
-- ==========================================

-- View específica para facilitar consultas da ABPSI
CREATE VIEW public.abpsi_dashboard AS
SELECT
    -- Informações da instituição
    i.name as institution_name,
    i.slug,
    i.primary_color,
    -- Contadores
    (SELECT COUNT(*) FROM public.institution_users iu WHERE iu.institution_id = i.id AND iu.is_active = true) as total_users,
    (SELECT COUNT(*) FROM public.institution_users iu WHERE iu.institution_id = i.id AND iu.is_active = true AND iu.role = 'student') as students,
    (SELECT COUNT(*) FROM public.institution_users iu WHERE iu.institution_id = i.id AND iu.is_active = true AND iu.role = 'teacher') as teachers,
    (SELECT COUNT(*) FROM public.institution_admins ia WHERE ia.institution_id = i.id AND ia.is_active = true) as admins,
    (SELECT COUNT(*) FROM public.institution_assistants ia WHERE ia.institution_id = i.id AND ia.is_active = true) as available_assistants,
    -- Status da licença
    s.plan_type,
    s.payment_status,
    s.valid_until,
    -- Data de última atividade
    (SELECT MAX(iu.updated_at) FROM public.institution_users iu WHERE iu.institution_id = i.id) as last_activity
FROM public.institutions i
LEFT JOIN public.institution_subscriptions s ON i.id = s.institution_id AND s.payment_status = 'active'
WHERE i.slug = 'abpsi';

-- Permissões para a view
GRANT SELECT ON public.abpsi_dashboard TO authenticated;
GRANT ALL PRIVILEGES ON public.abpsi_dashboard TO service_role;

-- ==========================================
-- 6. COMENTÁRIOS E DOCUMENTAÇÃO
-- ==========================================

COMMENT ON FUNCTION create_abpsi_initial_admin IS 'Cria o primeiro admin da ABPSI a partir de um email de usuário existente';
COMMENT ON VIEW public.abpsi_dashboard IS 'Dashboard com informações resumidas da Academia Brasileira de Psicanálise';

-- ==========================================
-- 7. VERIFICAÇÃO DOS DADOS INSERIDOS
-- ==========================================

-- Query para verificar se tudo foi inserido corretamente
-- (Esta query pode ser executada separadamente para verificação)

/*
SELECT
    'Institution' as type,
    i.name,
    i.slug,
    i.primary_color,
    i.is_active
FROM public.institutions i
WHERE i.slug = 'abpsi'

UNION ALL

SELECT
    'Assistant' as type,
    ia.custom_name,
    a.name as original_name,
    ia.is_simulator::text,
    ia.is_active::text
FROM public.institution_assistants ia
JOIN public.assistants a ON ia.assistant_id = a.id
JOIN public.institutions i ON ia.institution_id = i.id
WHERE i.slug = 'abpsi'

UNION ALL

SELECT
    'License' as type,
    s.plan_type,
    s.payment_status,
    s.valid_until::text,
    s.payment_status
FROM public.institution_subscriptions s
JOIN public.institutions i ON s.institution_id = i.id
WHERE i.slug = 'abpsi'
ORDER BY type, name;
*/