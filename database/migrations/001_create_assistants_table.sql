-- Criar tabela de assistentes de psicologia
CREATE TABLE public.assistants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    color_theme VARCHAR(20),
    monthly_price DECIMAL(10,2) DEFAULT 39.90,
    semester_price DECIMAL(10,2) DEFAULT 199.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_assistants_name ON public.assistants(name);
CREATE INDEX idx_assistants_is_active ON public.assistants(is_active);

-- Inserir os 14 assistentes de psicologia da NeuroIA Lab
INSERT INTO public.assistants (id, name, description, icon, color_theme, monthly_price, semester_price) VALUES
('asst_8kNKRg68rR8zguhYzdlMEvQc', 'PsicoPlano', 'Formulador de Roteiro Terapêutico Exclusivo', '📋', '#0E1E03', 39.90, 199.00),
('asst_Ohn9w46OmgwLJhxw08jSbM2f', 'NeuroCase', 'Revisor de Quadro Clínico', '🔍', '#1A3A0F', 39.90, 199.00),
('asst_hH374jNSOTSqrsbC9Aq5MKo3', 'Guia Ético', 'Avaliação Profissional e Autorreflexão', '⚖️', '#7C3AED', 39.90, 199.00),
('asst_jlRLzTb4OrBKYWLtjscO3vJN', 'SessãoMap', 'Formulador de Estrutura de Sessão', '🗺️', '#DC2626', 39.90, 199.00),
('asst_ZuPRuYG9eqxmb6tIIcBNSSWd', 'ClinReplay', 'Treinador de Sessão (IA paciente)', '🎭', '#EA580C', 39.90, 199.00),
('asst_WdzCxpQ3s04GqyDKfUsmxWRg', 'CognitiMap', 'Construtor de Caminhos de Reestruturação Cognitiva', '🧠', '#0891B2', 39.90, 199.00),
('asst_Gto0pHqdCHdM7iBtdB9XUvkU', 'MindRoute', 'Orientador de Abordagens Psicológicas', '🧭', '#2D5A1F', 39.90, 199.00),
('asst_9RGTNpAvpwBtNps5krM051km', 'TheraTrack', 'Avaliador de Evolução Terapêutica', '📈', '#0E1E03', 39.90, 199.00),
('asst_FHXh63UfotWmtzfwdAORvH1s', 'NeuroLaudo', 'Elaborador de Laudo Psicológico', '📄', '#6366F1', 39.90, 199.00),
('asst_ZtY1hAFirpsA3vRdCuuOEebf', 'PsicoTest', 'Consultor de Testes Psicológicos', '🧪', '#EC4899', 39.90, 199.00),
('asst_bdfbravG0rjZfp40SFue89ge', 'TheraFocus', 'Organizador de Intervenções para Transtornos Específicos', '🎯', '#F59E0B', 39.90, 199.00),
('asst_nqL5L0hIfOMe2wNQn9wambGr', 'PsicoBase', 'Formulador de Estratégias Clínicas Baseadas em Evidências', '📚', '#8B5CF6', 39.90, 199.00),
('asst_62QzPGQdr9KJMqqJIRVI787r', 'MindHome', 'Elaborador de Atividades Domiciliares Terapêuticas', '🏠', '#1A3A0F', 39.90, 199.00),
('asst_NoCnwSoviZBasOxgbac9USkg', 'ClinPrice', 'Avaliador de Custos de Sessões Clínicas', '💰', '#EF4444', 39.90, 199.00);

-- Permissões
GRANT SELECT ON public.assistants TO anon;
GRANT SELECT ON public.assistants TO authenticated;
GRANT ALL PRIVILEGES ON public.assistants TO service_role;