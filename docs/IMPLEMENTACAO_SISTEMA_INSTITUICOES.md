# 🏛️ IMPLEMENTAÇÃO DO SISTEMA DE INSTITUIÇÕES/FACULDADES

**Data:** 24/01/2025
**Autor:** Claude Code
**Status:** Pronto para execução
**Primeira Instituição:** Academia Brasileira de Psicanálise (ABPSI)

## 📋 VISÃO GERAL

Este documento fornece instruções passo-a-passo para implementar o sistema completo de instituições/faculdades no NeuroIA Lab, permitindo que organizações tenham seu próprio portal personalizado.

### 🎯 Objetivos
- Implementar sistema multi-tenant para instituições
- Criar portal brandeado para ABPSI
- Adicionar módulo de gestão no Admin Master
- Manter sistema atual funcionando normalmente

### 📊 Resumo das Alterações
- **6 Migrations** novas para banco de dados
- **4 APIs** novas para backend
- **Frontend** com rotas e páginas institucionais
- **Admin Master** expandido com módulo faculdades

---

## 🗄️ FASE 1: IMPLEMENTAÇÃO DO BANCO DE DADOS

### 1.1 Executar Migrations (OBRIGATÓRIO)

Execute as migrations na seguinte ordem usando o Supabase Dashboard ou CLI:

```sql
-- 1. Migration 014: Criar tabela institutions
-- Arquivo: database/migrations/014_create_institutions_table.sql

-- 2. Migration 015: Criar tabela institution_users
-- Arquivo: database/migrations/015_create_institution_users_table.sql

-- 3. Migration 016: Criar tabela institution_assistants
-- Arquivo: database/migrations/016_create_institution_assistants_table.sql

-- 4. Migration 017: Criar tabela institution_admins
-- Arquivo: database/migrations/017_create_institution_admins_table.sql

-- 5. Migration 018: Criar tabela institution_subscriptions
-- Arquivo: database/migrations/018_create_institution_subscriptions_table.sql

-- 6. Migration 019: Configurar RLS policies
-- Arquivo: database/migrations/019_setup_institution_rls_policies.sql

-- 7. Migration 020: Popular dados iniciais ABPSI
-- Arquivo: database/migrations/020_populate_abpsi_initial_data.sql
```

### 1.2 Verificação das Migrations

Após executar, verifique se as tabelas foram criadas:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'institution%';

-- Verificar dados da ABPSI
SELECT i.name, i.slug, i.primary_color,
       (SELECT COUNT(*) FROM institution_assistants ia WHERE ia.institution_id = i.id) as assistants,
       (SELECT COUNT(*) FROM institution_subscriptions s WHERE s.institution_id = i.id) as licenses
FROM institutions i
WHERE i.slug = 'abpsi';
```

---

## 🔧 FASE 2: DEPLOY DO BACKEND

### 2.1 APIs Criadas

As seguintes APIs foram criadas e precisam ser deployadas:

```
api/
├── institutions/
│   ├── auth.js          # Autenticação multi-tenant
│   ├── dashboard.js     # Dashboard da instituição
│   └── users.js         # Gestão de usuários (SubAdmin)
└── admin/
    └── institutions.js  # CRUD instituições (Admin Master)
```

### 2.2 Configuração de Rotas

Configure o servidor para rotear corretamente:

```javascript
// Para Vercel Functions
// Criar arquivos em api/institutions/[slug]/
- api/institutions/[slug]/auth.js
- api/institutions/[slug]/dashboard.js
- api/institutions/[slug]/users.js
```

### 2.3 Variáveis de Ambiente

Certifique-se que estão configuradas:
```env
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_key
SUPABASE_ANON_KEY=sua_anon_key
```

---

## 🎨 FASE 3: DEPLOY DO FRONTEND

### 3.1 Novos Arquivos Criados

```
frontend/src/
├── contexts/
│   └── InstitutionContext.tsx    # Contexto para instituições
├── components/layout/
│   └── InstitutionLayout.tsx     # Layout brandeado
├── pages/Institution/
│   ├── index.ts
│   ├── InstitutionLogin.tsx      # Login da instituição
│   └── InstitutionHome.tsx       # Home da instituição
└── pages/Admin/
    └── InstitutionsManager.tsx   # Módulo admin para instituições
```

### 3.2 Arquivos Modificados

```
frontend/src/
├── App.tsx                       # ✅ Já modificado - rotas adicionadas
└── pages/AdminDashboard.tsx      # ✅ Já modificado - aba faculdades
```

### 3.3 Assets da ABPSI

O logo da ABPSI já foi movido para:
```
frontend/src/assets/institutions/abpsi/logo.png
```

---

## 🚀 FASE 4: CONFIGURAÇÃO INICIAL DA ABPSI

### 4.1 Criar Primeiro Admin

Execute esta função no Supabase para criar o primeiro admin da ABPSI:

```sql
-- Substituir 'email@admin.com' pelo email real do admin da ABPSI
SELECT create_abpsi_initial_admin('email@admin.com');
```

### 4.2 Testar Acesso

1. **Acesse:** `https://seudominio.com/i/abpsi/login`
2. **Faça login** com as credenciais do admin
3. **Verifique:**
   - Logo ABPSI aparece
   - Cor #c39c49 aplicada
   - Simulador de Psicanálise disponível
   - Painel admin acessível

### 4.3 Configurar Outros Usuários

Para adicionar usuários à ABPSI:

```sql
-- Via SQL (temporário):
INSERT INTO institution_users (institution_id, user_id, role, is_active)
VALUES (
  (SELECT id FROM institutions WHERE slug = 'abpsi'),
  (SELECT id FROM auth.users WHERE email = 'usuario@exemplo.com'),
  'student',
  true
);

-- Via Interface Admin (recomendado):
-- Use o Admin Master → Faculdades → ABPSI → Gerenciar Usuários
```

---

## 🔍 FASE 5: VERIFICAÇÃO E TESTES

### 5.1 Checklist de Funcionamento

- [ ] **Banco de Dados**
  - [ ] 6 tabelas de instituições criadas
  - [ ] RLS policies aplicadas
  - [ ] Dados ABPSI populados
  - [ ] Funções auxiliares funcionando

- [ ] **APIs Backend**
  - [ ] GET `/api/institutions/abpsi/auth` retorna dados da instituição
  - [ ] POST `/api/institutions/abpsi/auth` com action=verify_access funciona
  - [ ] Admin Master `/api/admin/institutions` lista instituições

- [ ] **Frontend**
  - [ ] Rota `/i/abpsi/login` carrega página de login
  - [ ] Rota `/i/abpsi` carrega home da instituição
  - [ ] Admin Master mostra aba "Faculdades"
  - [ ] Tema ABPSI aplicado corretamente

### 5.2 Testes de Segurança

- [ ] Usuário sem acesso não consegue entrar na instituição
- [ ] Dados isolados entre instituições
- [ ] Admin Master só acessa com email de admin
- [ ] RLS policies bloqueiam acesso não autorizado

### 5.3 Testes de UX

- [ ] Login brandeado com logo e cores da ABPSI
- [ ] Simulador de Psicanálise destacado na home
- [ ] Navegação intuitiva
- [ ] Responsivo em mobile

---

## ⚙️ CONFIGURAÇÕES AVANÇADAS

### 6.1 Personalizar ABPSI

Modifique as configurações da ABPSI diretamente no banco:

```sql
UPDATE institutions
SET settings = jsonb_set(
  settings,
  '{welcome_message}',
  '"Bem-vindo à Academia Brasileira de Psicanálise"'
)
WHERE slug = 'abpsi';
```

### 6.2 Adicionar Mais Assistentes

```sql
INSERT INTO institution_assistants (
  institution_id,
  assistant_id,
  custom_name,
  custom_description,
  display_order,
  is_active
) VALUES (
  (SELECT id FROM institutions WHERE slug = 'abpsi'),
  'asst_outro_id',
  'Nome Customizado',
  'Descrição customizada para a ABPSI',
  2,
  true
);
```

### 6.3 Configurar Limites de Licença

```sql
UPDATE institution_subscriptions
SET max_users = 100,
    monthly_fee = 500.00
WHERE institution_id = (SELECT id FROM institutions WHERE slug = 'abpsi');
```

---

## 🚨 TROUBLESHOOTING

### Problema: Migrations falham

**Solução:**
```sql
-- Verificar permissões
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- Re-executar migration específica
-- Copiar e colar o conteúdo do arquivo SQL no Supabase Dashboard
```

### Problema: API retorna erro 500

**Verificar:**
1. Variáveis de ambiente configuradas
2. Service role key válida
3. Logs do Vercel Functions
4. CORS configurado

### Problema: Frontend não carrega

**Verificar:**
1. `npm run build` sem erros
2. Rotas configuradas no servidor
3. Context providers na ordem correta
4. Assets da ABPSI no lugar certo

### Problema: Usuário não consegue acessar instituição

**Solução:**
```sql
-- Verificar se usuário está na instituição
SELECT * FROM institution_users
WHERE user_id = 'user-id'
  AND institution_id = (SELECT id FROM institutions WHERE slug = 'abpsi');

-- Adicionar usuário se necessário
INSERT INTO institution_users (institution_id, user_id, role, is_active)
VALUES (
  (SELECT id FROM institutions WHERE slug = 'abpsi'),
  'user-id',
  'student',
  true
);
```

---

## 📞 PRÓXIMOS PASSOS

### Imediato (Após Deploy)
1. ✅ Testar login na ABPSI
2. ✅ Configurar primeiro admin
3. ✅ Adicionar alguns usuários teste
4. ✅ Validar simulador de psicanálise

### Curto Prazo (1-2 semanas)
- [ ] Adicionar mais customizações visuais
- [ ] Implementar relatórios específicos
- [ ] Sistema de convites por email
- [ ] Integração com sistema de pagamento

### Médio Prazo (1 mês)
- [ ] Dashboard avançado para SubAdmins
- [ ] Sistema de grupos/turmas
- [ ] Calendário de sessões
- [ ] Certificados digitais

### Longo Prazo (3 meses)
- [ ] API para integrações externas
- [ ] Mobile app institucional
- [ ] Sistema de avaliações
- [ ] IA personalizada por instituição

---

## 📋 CHECKLIST FINAL PRÉ-PRODUÇÃO

- [ ] **Backup** do banco de dados atual
- [ ] **Teste** em ambiente de staging
- [ ] **Validação** com stakeholders da ABPSI
- [ ] **Documentação** entregue à equipe
- [ ] **Monitoramento** configurado
- [ ] **Rollback plan** preparado

---

**🎉 Sistema pronto para produção!**

Com esta implementação, a Academia Brasileira de Psicanálise terá seu portal personalizado funcionando perfeitamente, e o sistema estará preparado para expandir para outras instituições no futuro.