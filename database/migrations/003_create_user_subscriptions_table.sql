-- Criar tabela de assinaturas de usuários
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assistant_id VARCHAR(50) NOT NULL REFERENCES public.assistants(id) ON DELETE CASCADE,
    subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('monthly', 'semester')),
    package_type VARCHAR(20) DEFAULT 'individual' CHECK (package_type IN ('individual', 'package_3', 'package_6')),
    package_id UUID REFERENCES public.user_packages(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
    asaas_subscription_id VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, assistant_id)
);

-- Índices
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_assistant_id ON public.user_subscriptions(assistant_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_expires_at ON public.user_subscriptions(expires_at);
CREATE INDEX idx_user_subscriptions_package_id ON public.user_subscriptions(package_id);

-- RLS (Row Level Security)
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Permissões
GRANT SELECT ON public.user_subscriptions TO authenticated;
GRANT INSERT, UPDATE ON public.user_subscriptions TO service_role;