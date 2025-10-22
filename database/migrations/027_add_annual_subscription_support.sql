-- Adicionar suporte a assinatura anual (1 ano)
-- Autor: Claude Code
-- Data: 2025-10-22
-- Descrição: Adiciona 'annual' como tipo válido de assinatura e atualiza funções

-- 1. Atualizar constraint da tabela user_subscriptions para incluir 'annual'
ALTER TABLE public.user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_subscription_type_check;

ALTER TABLE public.user_subscriptions
ADD CONSTRAINT user_subscriptions_subscription_type_check
CHECK (subscription_type IN ('monthly', 'semester', 'annual'));

-- 2. Atualizar constraint da tabela user_packages para incluir 'annual'
ALTER TABLE public.user_packages
DROP CONSTRAINT IF EXISTS user_packages_subscription_type_check;

ALTER TABLE public.user_packages
ADD CONSTRAINT user_packages_subscription_type_check
CHECK (subscription_type IN ('monthly', 'semester', 'annual'));

-- 3. Adicionar comentários para documentação
COMMENT ON CONSTRAINT user_subscriptions_subscription_type_check ON public.user_subscriptions
IS 'Tipos válidos: monthly (30 dias), semester (6 meses), annual (1 ano)';

COMMENT ON CONSTRAINT user_packages_subscription_type_check ON public.user_packages
IS 'Tipos válidos: monthly (30 dias), semester (6 meses), annual (1 ano)';

-- 4. Log da migração
DO $$
BEGIN
    RAISE NOTICE 'Migration 027: Suporte a assinatura anual adicionado com sucesso';
    RAISE NOTICE '  - user_subscriptions: constraint atualizado para incluir annual';
    RAISE NOTICE '  - user_packages: constraint atualizado para incluir annual';
END $$;
