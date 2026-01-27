-- Criar tabela de assinaturas individuais para usuários de instituições
-- Data: 2025-01-26
-- Descrição: Controla assinaturas pagas individuais de usuários dentro de instituições

CREATE TABLE public.institution_user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    subscription_type VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (subscription_type IN ('monthly', 'semester', 'annual')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
    payment_provider VARCHAR(50) DEFAULT 'asaas', -- 'asaas', 'stripe', 'pix', 'manual'
    payment_id VARCHAR(100), -- referência do pagamento no provider
    payment_date TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT institution_user_subscriptions_unique_user_institution
        UNIQUE(user_id, institution_id),
    CONSTRAINT institution_user_subscriptions_payment_date_check
        CHECK (status != 'active' OR payment_date IS NOT NULL),
    CONSTRAINT institution_user_subscriptions_expires_check
        CHECK (expires_at > created_at)
);

-- Criar índices para performance
CREATE INDEX idx_institution_user_subscriptions_user_id ON public.institution_user_subscriptions(user_id);
CREATE INDEX idx_institution_user_subscriptions_institution_id ON public.institution_user_subscriptions(institution_id);
CREATE INDEX idx_institution_user_subscriptions_status ON public.institution_user_subscriptions(status);
CREATE INDEX idx_institution_user_subscriptions_expires_at ON public.institution_user_subscriptions(expires_at);
CREATE INDEX idx_institution_user_subscriptions_created_at ON public.institution_user_subscriptions(created_at DESC);

-- Índices compostos para queries frequentes
CREATE INDEX idx_institution_user_subscriptions_active ON public.institution_user_subscriptions(user_id, institution_id, status, expires_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_institution_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_institution_user_subscriptions_updated_at
    BEFORE UPDATE ON public.institution_user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_institution_user_subscriptions_updated_at();

-- Função para verificar se usuário tem assinatura ativa na instituição
CREATE OR REPLACE FUNCTION check_institution_user_subscription(p_user_id UUID, p_institution_slug TEXT)
RETURNS TABLE (
    has_subscription BOOLEAN,
    subscription_status VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN s.id IS NOT NULL AND s.status = 'active' AND s.expires_at > NOW() THEN true
            ELSE false
        END as has_subscription,
        s.status as subscription_status,
        s.expires_at,
        CASE
            WHEN s.expires_at IS NOT NULL THEN EXTRACT(DAY FROM s.expires_at - NOW())::INTEGER
            ELSE NULL
        END as days_remaining
    FROM public.institutions i
    LEFT JOIN public.institution_user_subscriptions s ON s.institution_id = i.id AND s.user_id = p_user_id
    WHERE i.slug = p_institution_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar/atualizar assinatura de usuário institucional
CREATE OR REPLACE FUNCTION create_institution_user_subscription(
    p_user_id UUID,
    p_institution_slug TEXT,
    p_subscription_type VARCHAR DEFAULT 'monthly',
    p_amount DECIMAL DEFAULT 47.00,
    p_payment_provider VARCHAR DEFAULT 'asaas',
    p_payment_id VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_institution_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
    v_subscription_id UUID;
BEGIN
    -- Buscar institution_id pelo slug
    SELECT id INTO v_institution_id
    FROM public.institutions
    WHERE slug = p_institution_slug;

    IF v_institution_id IS NULL THEN
        RAISE EXCEPTION 'Institution not found with slug: %', p_institution_slug;
    END IF;

    -- Calcular data de expiração
    CASE p_subscription_type
        WHEN 'monthly' THEN
            v_expires_at := NOW() + INTERVAL '1 month';
        WHEN 'semester' THEN
            v_expires_at := NOW() + INTERVAL '6 months';
        WHEN 'annual' THEN
            v_expires_at := NOW() + INTERVAL '1 year';
        ELSE
            RAISE EXCEPTION 'Invalid subscription type: %', p_subscription_type;
    END CASE;

    -- Inserir ou atualizar assinatura
    INSERT INTO public.institution_user_subscriptions (
        user_id,
        institution_id,
        subscription_type,
        amount,
        status,
        payment_provider,
        payment_id,
        payment_date,
        expires_at
    ) VALUES (
        p_user_id,
        v_institution_id,
        p_subscription_type,
        p_amount,
        CASE WHEN p_payment_id IS NOT NULL THEN 'active' ELSE 'pending' END,
        p_payment_provider,
        p_payment_id,
        CASE WHEN p_payment_id IS NOT NULL THEN NOW() ELSE NULL END,
        v_expires_at
    )
    ON CONFLICT (user_id, institution_id)
    DO UPDATE SET
        subscription_type = EXCLUDED.subscription_type,
        amount = EXCLUDED.amount,
        status = EXCLUDED.status,
        payment_provider = EXCLUDED.payment_provider,
        payment_id = EXCLUDED.payment_id,
        payment_date = EXCLUDED.payment_date,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW()
    RETURNING id INTO v_subscription_id;

    RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS (Row Level Security)
ALTER TABLE public.institution_user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias assinaturas
CREATE POLICY "Users can view own institution subscriptions" ON public.institution_user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Admins de instituição podem ver assinaturas dos usuários da instituição
CREATE POLICY "Institution admins can view user subscriptions" ON public.institution_user_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.institution_users iu
            WHERE iu.user_id = auth.uid()
            AND iu.institution_id = institution_user_subscriptions.institution_id
            AND iu.role = 'subadmin'
            AND iu.is_active = true
        )
    );

-- Permissões
GRANT SELECT ON public.institution_user_subscriptions TO authenticated;
GRANT INSERT, UPDATE ON public.institution_user_subscriptions TO service_role;

-- Grant execute nas funções para authenticated users
GRANT EXECUTE ON FUNCTION check_institution_user_subscription(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_institution_user_subscription(UUID, TEXT, VARCHAR, DECIMAL, VARCHAR, VARCHAR) TO service_role;

-- Comentários para documentação
COMMENT ON TABLE public.institution_user_subscriptions IS 'Assinaturas individuais pagas de usuários para acessar recursos de instituições';
COMMENT ON FUNCTION check_institution_user_subscription(UUID, TEXT) IS 'Verifica se usuário tem assinatura ativa em uma instituição';
COMMENT ON FUNCTION create_institution_user_subscription(UUID, TEXT, VARCHAR, DECIMAL, VARCHAR, VARCHAR) IS 'Cria ou atualiza assinatura de usuário em instituição';