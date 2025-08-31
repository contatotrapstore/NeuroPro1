-- Criar tabela para armazenar referências de clientes do Asaas
CREATE TABLE public.asaas_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    asaas_customer_id VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_asaas_customers_user_id ON public.asaas_customers(user_id);
CREATE INDEX idx_asaas_customers_asaas_id ON public.asaas_customers(asaas_customer_id);

-- RLS Policies
ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asaas customer data" ON public.asaas_customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own asaas customer data" ON public.asaas_customers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permissões
GRANT SELECT, INSERT, UPDATE ON public.asaas_customers TO authenticated;
GRANT ALL PRIVILEGES ON public.asaas_customers TO service_role;