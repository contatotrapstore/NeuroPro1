# INSTITUTIONS GUIDE - NeuroIA Lab

**Sistema Multi-Institucional para Clientes Corporativos**

## 📋 Visão Geral

O sistema institucional permite que organizações (universidades, hospitais, clínicas) tenham acesso personalizado ao NeuroIA Lab com:
- Login personalizado com logo e cores da instituição
- Acesso restrito a assistentes específicos
- Administradores próprios para gestão de usuários
- Interface customizada por instituição
- **🆕 Sistema de Assinatura Individual**: Cada usuário deve pagar assinatura própria além da aprovação admin

## 🏗️ Arquitetura do Sistema

### Tabelas Database

**`institutions`**
```sql
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#0E1E03',
  secondary_color TEXT DEFAULT '#1A3A0F',
  custom_message TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**`institution_users`**
```sql
CREATE TABLE institution_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'subadmin', 'user')) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_access TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, institution_id)
);
```

**`institution_assistants`**
```sql
CREATE TABLE institution_assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  assistant_id TEXT NOT NULL,
  custom_name TEXT,
  custom_description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(institution_id, assistant_id)
);
```

**`institution_user_subscriptions`** 🆕
```sql
CREATE TABLE institution_user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  subscription_type VARCHAR(20) NOT NULL DEFAULT 'monthly',
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  status VARCHAR(20) DEFAULT 'pending',
  payment_provider VARCHAR(50) DEFAULT 'asaas',
  payment_id VARCHAR(100),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, institution_id)
);
```

### APIs Disponíveis

**Autenticação Institucional**
```
GET  /api/institution-auth?slug=SLUG_INSTITUICAO
POST /api/institution-auth (action: verify_access, token: JWT)
```

**Administração**
```
GET /api/admin-institutions-simple
GET /api/admin-institution-assistants-simple
```

**Assinaturas Individuais** 🆕
```
POST /api/check-institution-subscription (Verificar status de assinatura)
POST /api/create-institution-subscription (Criar nova assinatura)
```

## 🚀 Adicionando Nova Instituição

### 1. Preparação de Assets

**Logo da Instituição**
```bash
# Criar diretório específico
mkdir -p frontend/src/assets/institutions/SLUG_INSTITUICAO/

# Adicionar logo (formato PNG/SVG, máx 200KB)
cp logo-instituicao.png frontend/src/assets/institutions/SLUG_INSTITUICAO/logo.png
```

**Definir Cores da Marca**
- **Primary Color**: Cor principal da instituição (ex: `#c39c49` para ABPSI)
- **Secondary Color**: Cor mais escura/complementar (ex: `#8b6914` para ABPSI)

### 2. Database Setup

**Adicionar Instituição**
```sql
INSERT INTO institutions (
  name,
  slug,
  logo_url,
  primary_color,
  secondary_color,
  custom_message,
  is_active
) VALUES (
  'Nome da Instituição',
  'slug-instituicao',  -- URL: /i/slug-instituicao
  '/src/assets/institutions/slug-instituicao/logo.png',
  '#cor-primaria',
  '#cor-secundaria',
  'Mensagem personalizada de boas-vindas',
  true
);
```

**Vincular Assistentes**
```sql
-- Obter ID da instituição
SET @institution_id = (SELECT id FROM institutions WHERE slug = 'slug-instituicao');

-- Habilitar assistentes específicos
INSERT INTO institution_assistants (
  institution_id,
  assistant_id,
  custom_name,
  is_enabled,
  is_default,
  display_order
) VALUES
  (@institution_id, 'asst_9vDTodTAQIJV1mu2xPzXpBs8', 'Simulador Personalizado', true, true, 1),
  (@institution_id, 'asst_8kNKRg68rR8zguhYzdlMEvQc', 'PsicoPlano Institucional', true, false, 2);
```

**Adicionar Usuário Administrador**
```sql
-- Criar usuário admin (já deve existir em auth.users)
INSERT INTO institution_users (
  user_id,
  institution_id,
  role,
  is_active
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@instituicao.com'),
  @institution_id,
  'subadmin',
  true
);
```

### 3. Configuração RLS (Row Level Security)

**Aplicar Políticas de Segurança**
```sql
-- Permitir leitura pública de instituições ativas
CREATE POLICY "Public read access to active institutions"
ON institutions FOR SELECT
USING (is_active = true);

-- Usuários veem seus próprios vínculos
CREATE POLICY "Users can view their own institution relationships"
ON institution_users FOR SELECT
USING (auth.uid() = user_id OR is_active = true);

-- Leitura pública de assistentes habilitados
CREATE POLICY "Public read access to enabled institution_assistants"
ON institution_assistants FOR SELECT
USING (is_enabled = true);

-- Permitir triggers atualizarem institution_users
CREATE POLICY "Enable update for auth trigger"
ON institution_users FOR UPDATE
USING (true);
```

## 🎨 Customização da Interface

### Logo e Branding

O sistema automaticamente aplica as cores e logo da instituição em:
- **Login Page**: Background gradient, botões, links
- **Logo Display**: Logo da instituição substituiu o nome quando disponível
- **Formulários**: Campos com cores personalizadas
- **Links**: Hover effects com primary color

### Mensagens Personalizadas

**Configurações Disponíveis**:
```sql
UPDATE institutions SET
  custom_message = 'Bem-vindo ao Portal da Instituição',
  settings = jsonb_build_object(
    'welcome_message', 'Entre com suas credenciais',
    'subtitle', 'Formação, Supervisão e Prática',
    'contact', jsonb_build_object(
      'email', 'contato@instituicao.com',
      'phone', '(11) 99999-9999'
    )
  )
WHERE slug = 'slug-instituicao';
```

## 🔐 Gestão de Acesso

### Roles Disponíveis

**admin**: Acesso total ao sistema NeuroIA Lab + gestão institucional
**subadmin**: Gestão de usuários da instituição + relatórios
**user**: Acesso apenas aos assistentes habilitados para a instituição

### Permissões por Role

```javascript
const permissions = {
  admin: {
    manage_users: true,
    view_reports: true,
    manage_assistants: true,
    manage_settings: true,
    view_conversations: true,
    export_data: true
  },
  subadmin: {
    manage_users: true,
    view_reports: true,
    manage_assistants: false,
    manage_settings: false,
    view_conversations: true,
    export_data: true
  },
  user: {
    // Acesso padrão apenas aos assistentes habilitados
  }
};
```

## 🔧 Scripts Úteis

### Verificação de Status
```sql
-- Status geral da instituição
SELECT
  i.name,
  i.slug,
  COUNT(iu.id) as total_users,
  COUNT(CASE WHEN iu.role = 'subadmin' THEN 1 END) as admins,
  COUNT(ia.id) as enabled_assistants
FROM institutions i
LEFT JOIN institution_users iu ON i.id = iu.institution_id AND iu.is_active = true
LEFT JOIN institution_assistants ia ON i.id = ia.institution_id AND ia.is_enabled = true
WHERE i.slug = 'SLUG_INSTITUICAO'
GROUP BY i.id, i.name, i.slug;
```

### Seed Database Completo
```bash
# Executar seeding automático
curl -X POST "https://www.neuroialab.com.br/api/seed-database?execute=true"

# Verificar resultado
curl -X GET "https://www.neuroialab.com.br/api/institution-auth?slug=SLUG_INSTITUICAO"
```

## 📊 Monitoramento

### Queries de Acompanhamento

**Usuários Ativos por Instituição**
```sql
SELECT
  i.name as institution_name,
  COUNT(CASE WHEN iu.last_access > NOW() - INTERVAL '7 days' THEN 1 END) as active_week,
  COUNT(CASE WHEN iu.last_access > NOW() - INTERVAL '30 days' THEN 1 END) as active_month,
  COUNT(iu.id) as total_users
FROM institutions i
LEFT JOIN institution_users iu ON i.id = iu.institution_id
WHERE i.is_active = true
GROUP BY i.id, i.name
ORDER BY active_month DESC;
```

**Assistentes Mais Utilizados por Instituição**
```sql
SELECT
  i.name as institution_name,
  ia.assistant_id,
  ia.custom_name,
  COUNT(c.id) as conversation_count
FROM institutions i
JOIN institution_assistants ia ON i.id = ia.institution_id
LEFT JOIN conversations c ON c.assistant_id = ia.assistant_id
WHERE ia.is_enabled = true
GROUP BY i.id, i.name, ia.assistant_id, ia.custom_name
ORDER BY conversation_count DESC;
```

## 🚨 Troubleshooting

### Problemas Comuns

**1. Logo não aparece**
- Verificar caminho do arquivo em `logo_url`
- Confirmar que arquivo existe em `frontend/src/assets/`
- Verificar permissões de acesso ao arquivo

**2. Cores não aplicadas**
- Validar formato hexadecimal (`#RRGGBB`)
- Verificar se `primary_color` e `secondary_color` estão preenchidos
- Limpar cache do navegador

**3. Login retorna 403 (sem acesso)**
- Verificar se usuário existe em `institution_users`
- Confirmar que `is_active = true`
- Validar que `institution_id` corresponde à instituição

**4. Assistentes não aparecem**
- Verificar registros em `institution_assistants`
- Confirmar `is_enabled = true`
- Validar que `assistant_id` corresponde a assistente existente

### Debug Mode

**Ativar logs detalhados**
```javascript
// No console do navegador
localStorage.setItem('debug_institution', 'true');

// Limpar logs
localStorage.removeItem('debug_institution');
```

## 📈 Métricas e Relatórios

### KPIs por Instituição

- **Taxa de Adoção**: Usuários ativos / Total cadastrado
- **Engagement**: Conversas por usuário/mês
- **Retenção**: Usuários que acessaram nos últimos 30 dias
- **Assistente Preferido**: Mais utilizado por instituição

### Exportação de Dados

```bash
# Relatório mensal por instituição
curl -X GET "/api/admin/institution-report?slug=SLUG_INSTITUICAO&period=monthly" \
  -H "Authorization: Bearer JWT_TOKEN"

# Exportar conversas (CSV)
curl -X GET "/api/admin/export-conversations?institution_id=UUID" \
  -H "Authorization: Bearer JWT_TOKEN"
```

## 💰 Sistema de Assinatura Individual (v3.4.0)

### Verificação Dupla Implementada

A partir da versão 3.4.0, o sistema institucional implementa **verificação dupla** para acesso aos assistentes:

1. **✅ Aprovação Administrativa**: Admin da instituição aprova o usuário (já existia)
2. **🆕 Assinatura Individual**: Usuário deve pagar assinatura própria (novo requisito)

### Como Funciona

**Fluxo Completo do Usuário**:
```
1. Usuário se registra na instituição
   ↓
2. Aguarda aprovação do administrador
   ↓
3. Admin aprova usuário (is_active = true)
   ↓
4. Dashboard mostra "Assinatura Pendente" 🟠
   ↓
5. Usuário clica "Assinar Agora" → Checkout
   ↓
6. Pagamento processado via Asaas
   ↓
7. Status muda para "Ativa" 🟢
   ↓
8. Acesso completo aos assistentes liberado
```

### Configuração de Assinaturas

**RPC Function de Verificação**:
```sql
CREATE OR REPLACE FUNCTION check_institution_user_subscription(
  p_user_id UUID,
  p_institution_slug TEXT
) RETURNS JSON;
```

**RPC Function de Criação**:
```sql
CREATE OR REPLACE FUNCTION create_institution_user_subscription(
  p_user_id UUID,
  p_institution_slug TEXT,
  p_subscription_type TEXT,
  p_amount DECIMAL,
  p_payment_provider TEXT,
  p_payment_id TEXT
) RETURNS UUID;
```

### Preços Padrão das Assinaturas

- **Mensal**: R$ 39,90
- **Semestral**: R$ 199,00 (economia de 17%)
- **Anual**: R$ 349,00 (economia de 26%)

### Interface do Usuário

**Dashboard com Status Visual**:
- 🟢 **Verde "Ativa"**: Usuário com assinatura válida
- 🟠 **Laranja "Pendente"**: Usuário precisa pagar
- Banner de alerta com call-to-action quando sem assinatura

**Chat Bloqueado**:
- Verificação automática antes de enviar mensagens
- Modal informativo quando usuário tenta usar sem pagamento
- Redirecionamento direto para checkout

**Página de Checkout**:
- Interface dedicada para assinaturas institucionais
- Integração com gateway Asaas
- Suporte a PIX e cartão (quando disponível)

### Implementação para Nova Instituição

**1. Aplicar Migration**:
```sql
-- Já aplicada automaticamente na v3.4.0
-- Tabela institution_user_subscriptions criada
-- RPC functions implementadas
```

**2. Configurar Preços (Opcional)**:
```sql
-- Personalizar preços para instituição específica
UPDATE institutions SET
  settings = jsonb_set(
    COALESCE(settings, '{}'),
    '{subscription_prices}',
    '{"monthly": 39.90, "semester": 199.00, "annual": 349.00}'
  )
WHERE slug = 'slug-da-instituicao';
```

**3. Testar Fluxo Completo**:
- [ ] Usuário registra na instituição
- [ ] Admin aprova usuário
- [ ] Dashboard mostra status "Pendente"
- [ ] Checkout funciona corretamente
- [ ] Status muda para "Ativa" após pagamento
- [ ] Chat é liberado após pagamento

## 🎯 Próximas Funcionalidades

### Em Desenvolvimento
- [ ] **Dashboard Institucional**: Painel específico para subadmins
- [ ] **Relatórios de Assinatura**: Métricas de conversão por instituição
- [ ] **API de Integração**: Webhook para sistemas externos
- [ ] **Customização Avançada**: Temas CSS personalizados
- [ ] **Multi-idioma**: Suporte a inglês e espanhol
- [ ] **Desconto Institucional**: Preços diferenciados por volume

### Roadmap 2025
- **Q4 2024**: Dashboard institucional + relatórios
- **Q1 2025**: API de integração + webhooks
- **Q2 2025**: Customização avançada + multi-idioma

## 📞 Suporte Técnico

Para implementação de novas instituições ou problemas técnicos:
- **Email**: suporte@neuroialab.com.br
- **WhatsApp**: +55 (11) 99999-9999
- **Horário**: Segunda à sexta, 9h às 18h

---

## ✅ Checklist de Implementação

### Para cada nova instituição:

- [ ] **Assets preparados**: Logo otimizada + cores definidas
- [ ] **Database**: Instituição criada + assistentes vinculados + admin configurado
- [ ] **RLS**: Políticas de segurança aplicadas
- [ ] **Testes**: Login + acesso a assistentes + funcionalidades
- [ ] **Documentação**: SLUG_INSTITUICAO.md específico criado
- [ ] **Monitoramento**: Métricas configuradas
- [ ] **Treinamento**: Usuários administrativos treinados

### Arquivos importantes para cada instituição:
- `frontend/src/assets/institutions/SLUG/logo.png`
- `docs/SLUG_INSTITUICAO.md` (documentação específica)
- Registros em `institutions`, `institution_users`, `institution_assistants`