-- Criar tabela de licenças e assinaturas das instituições
-- Data: 2025-01-24
-- Descrição: Controla licenças, limites de usuários e status de pagamento das instituições

CREATE TABLE public.institution_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL, -- 'unlimited', 'per_user', 'fixed', 'trial'
    max_users INTEGER, -- limite de usuários (NULL = ilimitado)
    max_assistants INTEGER, -- limite de assistentes (NULL = ilimitado)
    monthly_fee DECIMAL(10,2), -- taxa mensal
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE, -- data de expiração (NULL = sem expiração)
    payment_status VARCHAR(50) DEFAULT 'active', -- 'active', 'pending', 'overdue', 'cancelled'
    payment_provider VARCHAR(50), -- 'asaas', 'stripe', 'manual'
    payment_reference VARCHAR(255), -- referência do pagamento no provider
    auto_renew BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}', -- configurações específicas do plano
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT institution_subscriptions_plan_type_check
        CHECK (plan_type IN ('unlimited', 'per_user', 'fixed', 'trial')),
    CONSTRAINT institution_subscriptions_payment_status_check
        CHECK (payment_status IN ('active', 'pending', 'overdue', 'cancelled', 'expired')),
    CONSTRAINT institution_subscriptions_dates_check
        CHECK (valid_until IS NULL OR valid_until >= valid_from),
    CONSTRAINT institution_subscriptions_max_users_check
        CHECK (max_users IS NULL OR max_users > 0),
    CONSTRAINT institution_subscriptions_fee_check
        CHECK (monthly_fee IS NULL OR monthly_fee >= 0)
);

-- Criar índices para performance
CREATE INDEX idx_institution_subscriptions_institution_id ON public.institution_subscriptions(institution_id);
CREATE INDEX idx_institution_subscriptions_plan_type ON public.institution_subscriptions(plan_type);
CREATE INDEX idx_institution_subscriptions_payment_status ON public.institution_subscriptions(payment_status);
CREATE INDEX idx_institution_subscriptions_valid_until ON public.institution_subscriptions(valid_until);
CREATE INDEX idx_institution_subscriptions_created_at ON public.institution_subscriptions(created_at DESC);

-- Índices compostos para queries frequentes
CREATE INDEX idx_institution_subscriptions_active ON public.institution_subscriptions(institution_id, payment_status, valid_until);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_institution_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_institution_subscriptions_updated_at
    BEFORE UPDATE ON public.institution_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_institution_subscriptions_updated_at();

-- Função para verificar se uma instituição tem licença ativa
CREATE OR REPLACE FUNCTION institution_has_active_license(institution_slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.institution_subscriptions s
        JOIN public.institutions i ON s.institution_id = i.id
        WHERE i.slug = institution_slug
            AND s.payment_status = 'active'
            AND i.is_active = true
            AND (s.valid_until IS NULL OR s.valid_until >= CURRENT_DATE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter informações da licença ativa
CREATE OR REPLACE FUNCTION get_institution_license_info(institution_slug TEXT)
RETURNS TABLE (
    plan_type VARCHAR,
    max_users INTEGER,
    max_assistants INTEGER,
    monthly_fee DECIMAL,
    valid_until DATE,
    payment_status VARCHAR,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.plan_type,
        s.max_users,
        s.max_assistants,
        s.monthly_fee,
        s.valid_until,
        s.payment_status,
        CASE
            WHEN s.valid_until IS NULL THEN NULL
            ELSE (s.valid_until - CURRENT_DATE)::INTEGER
        END as days_until_expiry
    FROM public.institution_subscriptions s
    JOIN public.institutions i ON s.institution_id = i.id
    WHERE i.slug = institution_slug
        AND s.payment_status = 'active'
        AND i.is_active = true
        AND (s.valid_until IS NULL OR s.valid_until >= CURRENT_DATE)
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se instituição pode adicionar mais usuários
CREATE OR REPLACE FUNCTION institution_can_add_users(institution_slug TEXT, additional_users INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    current_users INTEGER;
    user_limit INTEGER;
BEGIN
    -- Buscar limite de usuários da licença ativa
    SELECT s.max_users INTO user_limit
    FROM public.institution_subscriptions s
    JOIN public.institutions i ON s.institution_id = i.id
    WHERE i.slug = institution_slug
        AND s.payment_status = 'active'
        AND i.is_active = true
        AND (s.valid_until IS NULL OR s.valid_until >= CURRENT_DATE)
    ORDER BY s.created_at DESC
    LIMIT 1;

    -- Se não há limite definido, permite adicionar
    IF user_limit IS NULL THEN
        RETURN true;
    END IF;

    -- Contar usuários ativos atuais
    SELECT COUNT(*) INTO current_users
    FROM public.institution_users iu
    JOIN public.institutions i ON iu.institution_id = i.id
    WHERE i.slug = institution_slug
        AND iu.is_active = true
        AND i.is_active = true;

    -- Verificar se pode adicionar os usuários solicitados
    RETURN (current_users + additional_users) <= user_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para facilitar consultas de licenças com dados da instituição
CREATE VIEW public.institution_subscriptions_detailed AS
SELECT
    s.*,
    i.name as institution_name,
    i.slug as institution_slug,
    i.is_active as institution_active,
    -- Contagem de usuários ativos
    (SELECT COUNT(*)
     FROM public.institution_users iu
     WHERE iu.institution_id = s.institution_id AND iu.is_active = true
    ) as current_users,
    -- Status da licença
    CASE
        WHEN s.payment_status != 'active' THEN 'inactive'
        WHEN s.valid_until IS NOT NULL AND s.valid_until < CURRENT_DATE THEN 'expired'
        WHEN s.valid_until IS NOT NULL AND s.valid_until <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
        ELSE 'active'
    END as license_status,
    -- Dias até expiração
    CASE
        WHEN s.valid_until IS NULL THEN NULL
        ELSE (s.valid_until - CURRENT_DATE)::INTEGER
    END as days_until_expiry
FROM public.institution_subscriptions s
JOIN public.institutions i ON s.institution_id = i.id;

-- Permissões
GRANT SELECT ON public.institution_subscriptions TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_subscriptions TO service_role;
GRANT SELECT ON public.institution_subscriptions_detailed TO authenticated;
GRANT ALL PRIVILEGES ON public.institution_subscriptions_detailed TO service_role;
GRANT EXECUTE ON FUNCTION institution_has_active_license TO authenticated;
GRANT EXECUTE ON FUNCTION institution_has_active_license TO service_role;
GRANT EXECUTE ON FUNCTION get_institution_license_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_institution_license_info TO service_role;
GRANT EXECUTE ON FUNCTION institution_can_add_users TO authenticated;
GRANT EXECUTE ON FUNCTION institution_can_add_users TO service_role;

-- Comentários para documentação
COMMENT ON TABLE public.institution_subscriptions IS 'Controla licenças, limites e pagamentos das instituições';
COMMENT ON COLUMN public.institution_subscriptions.plan_type IS 'Tipo de plano: unlimited, per_user, fixed, trial';
COMMENT ON COLUMN public.institution_subscriptions.max_users IS 'Limite máximo de usuários (NULL = ilimitado)';
COMMENT ON COLUMN public.institution_subscriptions.max_assistants IS 'Limite máximo de assistentes (NULL = ilimitado)';
COMMENT ON COLUMN public.institution_subscriptions.payment_status IS 'Status do pagamento: active, pending, overdue, cancelled, expired';
COMMENT ON COLUMN public.institution_subscriptions.payment_reference IS 'Referência do pagamento no provedor externo';
COMMENT ON COLUMN public.institution_subscriptions.settings IS 'Configurações específicas do plano em JSON';

COMMENT ON VIEW public.institution_subscriptions_detailed IS 'View com informações completas de licenças incluindo status e contagens';
COMMENT ON FUNCTION institution_has_active_license IS 'Verifica se uma instituição tem licença ativa';
COMMENT ON FUNCTION get_institution_license_info IS 'Retorna informações detalhadas da licença ativa';
COMMENT ON FUNCTION institution_can_add_users IS 'Verifica se instituição pode adicionar mais usuários dentro do limite';