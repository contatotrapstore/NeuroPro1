-- =====================================================
-- CRIAR SISTEMA DE ASSINATURAS INSTITUCIONAIS
-- =====================================================
-- Este arquivo cria a estrutura completa para gerenciar
-- assinaturas pagas de usuários em instituições.
-- =====================================================

-- PASSO 1: Criar tabela para assinaturas institucionais
CREATE TABLE public.institution_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,

    -- Detalhes do plano
    plan_type TEXT NOT NULL DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'semester', 'annual')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),

    -- Detalhes de pagamento
    payment_method TEXT CHECK (payment_method IN ('pix', 'credit_card', 'debit_card')),
    amount_paid DECIMAL(10,2),
    payment_id TEXT, -- ID do pagamento no gateway
    payment_data JSONB, -- Dados extras do pagamento (QR code PIX, etc)

    -- Datas
    started_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 2: Criar índices para performance
CREATE INDEX idx_institution_subscriptions_user_institution ON public.institution_subscriptions(user_id, institution_id);
CREATE INDEX idx_institution_subscriptions_status ON public.institution_subscriptions(status);
CREATE INDEX idx_institution_subscriptions_expires_at ON public.institution_subscriptions(expires_at);
CREATE INDEX idx_institution_subscriptions_payment_id ON public.institution_subscriptions(payment_id);

-- PASSO 3: Configurar RLS (Row Level Security)
ALTER TABLE public.institution_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas suas próprias assinaturas
CREATE POLICY "Users can view own subscriptions" ON public.institution_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários podem criar suas próprias assinaturas
CREATE POLICY "Users can create own subscriptions" ON public.institution_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem atualizar suas próprias assinaturas
CREATE POLICY "Users can update own subscriptions" ON public.institution_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: admins da instituição podem ver todas as assinaturas
CREATE POLICY "Institution admins can view all subscriptions" ON public.institution_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.institution_users iu
            WHERE iu.user_id = auth.uid()
            AND iu.institution_id = institution_subscriptions.institution_id
            AND iu.is_admin = true
            AND iu.is_active = true
        )
    );

-- PASSO 4: Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_institution_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_institution_subscriptions_updated_at
    BEFORE UPDATE ON public.institution_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_institution_subscriptions_updated_at();

-- PASSO 5: Função para verificar assinatura ativa de um usuário
CREATE OR REPLACE FUNCTION check_user_institution_subscription(
    p_user_id UUID,
    p_institution_slug TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_institution_id UUID;
    v_subscription RECORD;
    v_result JSON;
BEGIN
    -- Buscar instituição
    SELECT id INTO v_institution_id
    FROM public.institutions
    WHERE slug = p_institution_slug
    AND is_active = true;

    IF v_institution_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Instituição não encontrada'
        );
    END IF;

    -- Buscar assinatura ativa
    SELECT * INTO v_subscription
    FROM public.institution_subscriptions
    WHERE user_id = p_user_id
    AND institution_id = v_institution_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_subscription.id IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'has_subscription', true,
            'data', json_build_object(
                'plan_type', v_subscription.plan_type,
                'status', v_subscription.status,
                'started_at', v_subscription.started_at,
                'expires_at', v_subscription.expires_at,
                'amount_paid', v_subscription.amount_paid
            )
        );
    ELSE
        RETURN json_build_object(
            'success', true,
            'has_subscription', false,
            'error_type', 'NO_SUBSCRIPTION',
            'error_message', 'Você precisa de uma assinatura para acessar os recursos desta instituição'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao verificar assinatura: ' || SQLERRM
        );
END;
$$;

-- PASSO 6: Função para criar nova assinatura
CREATE OR REPLACE FUNCTION create_institution_subscription(
    p_user_id UUID,
    p_institution_slug TEXT,
    p_plan_type TEXT DEFAULT 'monthly',
    p_payment_method TEXT DEFAULT 'pix',
    p_amount DECIMAL DEFAULT 47.00
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_institution_id UUID;
    v_subscription_id UUID;
    v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Buscar instituição
    SELECT id INTO v_institution_id
    FROM public.institutions
    WHERE slug = p_institution_slug
    AND is_active = true;

    IF v_institution_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Instituição não encontrada'
        );
    END IF;

    -- Calcular data de expiração baseada no plano
    CASE p_plan_type
        WHEN 'monthly' THEN
            v_expires_at = NOW() + INTERVAL '1 month';
        WHEN 'semester' THEN
            v_expires_at = NOW() + INTERVAL '6 months';
        WHEN 'annual' THEN
            v_expires_at = NOW() + INTERVAL '1 year';
        ELSE
            v_expires_at = NOW() + INTERVAL '1 month';
    END CASE;

    -- Cancelar assinatura ativa anterior (se existir)
    UPDATE public.institution_subscriptions
    SET status = 'cancelled', cancelled_at = NOW()
    WHERE user_id = p_user_id
    AND institution_id = v_institution_id
    AND status = 'active';

    -- Criar nova assinatura
    INSERT INTO public.institution_subscriptions (
        user_id,
        institution_id,
        plan_type,
        status,
        payment_method,
        amount_paid,
        expires_at
    ) VALUES (
        p_user_id,
        v_institution_id,
        p_plan_type,
        'pending', -- Começa como pendente até confirmação do pagamento
        p_payment_method,
        p_amount,
        v_expires_at
    )
    RETURNING id INTO v_subscription_id;

    RETURN json_build_object(
        'success', true,
        'subscription_id', v_subscription_id,
        'expires_at', v_expires_at,
        'amount', p_amount
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao criar assinatura: ' || SQLERRM
        );
END;
$$;

-- PASSO 7: Função para ativar assinatura após pagamento
CREATE OR REPLACE FUNCTION activate_institution_subscription(
    p_subscription_id UUID,
    p_payment_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Ativar assinatura
    UPDATE public.institution_subscriptions
    SET
        status = 'active',
        started_at = NOW(),
        payment_id = p_payment_id
    WHERE id = p_subscription_id
    AND status = 'pending';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Assinatura não encontrada ou já ativa'
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'message', 'Assinatura ativada com sucesso'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao ativar assinatura: ' || SQLERRM
        );
END;
$$;

-- PASSO 8: Conceder permissões
GRANT EXECUTE ON FUNCTION check_user_institution_subscription(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_institution_subscription(UUID, TEXT, TEXT, TEXT, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_institution_subscription(UUID, TEXT) TO authenticated;

-- PASSO 9: Atualizar função de verificação de assinatura existente
DROP FUNCTION IF EXISTS get_institution_subscription_status(TEXT);
CREATE OR REPLACE FUNCTION get_institution_subscription_status(p_institution_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN check_user_institution_subscription(auth.uid(), p_institution_slug);
END;
$$;

GRANT EXECUTE ON FUNCTION get_institution_subscription_status(TEXT) TO authenticated;

-- =====================================================
-- RESULTADO ESPERADO:
-- - Tabela institution_subscriptions criada
-- - RPC functions funcionando
-- - Usuários podem criar e verificar assinaturas
-- - Sistema pronto para integração com pagamentos
-- =====================================================