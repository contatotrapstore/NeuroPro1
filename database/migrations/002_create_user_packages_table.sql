-- Criar tabela de pacotes de usuários
CREATE TABLE public.user_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_type VARCHAR(20) NOT NULL CHECK (package_type IN ('package_3', 'package_6')),
    subscription_type VARCHAR(20) NOT NULL CHECK (subscription_type IN ('monthly', 'semester')),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
    asaas_subscription_id VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_packages_user_id ON public.user_packages(user_id);
CREATE INDEX idx_user_packages_status ON public.user_packages(status);
CREATE INDEX idx_user_packages_expires_at ON public.user_packages(expires_at);

-- RLS (Row Level Security)
ALTER TABLE public.user_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own packages" ON public.user_packages
    FOR SELECT USING (auth.uid() = user_id);

-- Permissões
GRANT SELECT ON public.user_packages TO authenticated;
GRANT INSERT, UPDATE ON public.user_packages TO service_role;