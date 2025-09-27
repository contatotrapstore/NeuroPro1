# Database - NeuroIA Lab

Este diretório contém todas as migrations, functions e scripts SQL para o banco de dados Supabase do NeuroIA Lab.

## 📁 Estrutura

```
/database
  /cleanup            - Scripts de limpeza e manutenção
  /functions          - Funções RPC do Postgres
  /migrations         - Migrations numeradas em ordem de execução
  /scripts            - Scripts de seeding e utilitários
  README.md           - Esta documentação
```

## 🚀 Migrations (Ordem de Execução)

### Core System (001-013)
1. **001_create_assistants_table.sql** - Tabela de 19 assistentes de IA
2. **002_create_user_packages_table.sql** - Pacotes personalizáveis
3. **003_create_user_subscriptions_table.sql** - Assinaturas individuais
4. **004_create_conversations_table.sql** - Conversas com assistentes
5. **005_create_messages_table.sql** - Mensagens das conversas
6. **006_setup_rls_policies.sql** - Row Level Security
7. **007_create_asaas_customers_table.sql** - Integração Asaas
8. **008_create_optimized_access_functions.sql** - Funções de acesso
9. **009_add_psychoanalysis_simulator_access.sql** - 19º assistente
10. **010_add_area_field_to_assistants.sql** - Campo de área
11. **011_enhance_assistants_table.sql** - Melhorias na tabela
12. **012_setup_admin_access.sql** - Sistema de admin
13. **013_add_new_areas.sql** - Novas áreas de especialização

### Institutional System (014-024)
14. **014_create_institutions_table.sql** - Sistema multi-institucional
15. **015_create_institution_users_table.sql** - Usuários institucionais
16. **016_create_institution_assistants_table.sql** - Assistentes por instituição
17. **017_create_institution_admins_table.sql** - Admins institucionais
18. **018_create_institution_subscriptions_table.sql** - Assinaturas institucionais
19. **019_setup_institution_rls_policies.sql** - RLS para instituições
20. **020_populate_abpsi_initial_data.sql** - Dados iniciais ABPSI
21. **021_create_institution_user_subscriptions.sql** - Assinaturas de usuários institucionais
22. **022_auto_link_institution_users.sql** - Link automático de usuários
23. **023_fix_existing_institution_users.sql** - Correções de usuários existentes
24. **024_auto_approve_institution_users.sql** - ✨ Auto-aprovação de usuários (NOVO)

## 📝 Functions RPC

### Core Functions
- `get_user_stats.sql` - Estatísticas de usuários e receita
- `get_admin_users_list.sql` - Lista de usuários para admin

### Institution Functions
- `create_institution_rpc_functions.sql` - Funções básicas institucionais
- `verify_institution_access_fix.sql` - Verificação de acesso institucional
- `get_institution_users.sql` - Lista de usuários por instituição
- `get_institution_users_with_details.sql` - Detalhes completos de usuários

## 🌱 Scripts de Seeding

- **seed_assistants_data.sql** - Popula os 19 assistentes de IA
- **seed_abpsi_data.sql** - Dados completos da instituição ABPSI

## 🔧 Como Aplicar Migrations

### Via Supabase MCP (Recomendado)
```javascript
// Aplicar migration específica
await mcp__supabase__apply_migration({
  project_id: 'avgoyfartmzepdgzhroc',
  name: 'nome_da_migration',
  query: '-- SQL aqui'
});
```

### Via Supabase Dashboard
1. Acesse https://supabase.com/dashboard
2. Selecione o projeto NeuroIA Lab
3. Vá em SQL Editor
4. Cole o conteúdo da migration
5. Execute

### Via Supabase CLI
```bash
# Aplicar todas as migrations pendentes
supabase db push

# Reset completo (cuidado em produção!)
supabase db reset
```

## 📊 Estrutura do Banco

### Tabelas Principais

**Neuro System**:
- `assistants` - 19 assistentes de IA especializados
- `user_packages` - Pacotes de 3 ou 6 assistentes
- `user_subscriptions` - Assinaturas ativas de usuários
- `conversations` - Conversas entre usuários e assistentes
- `messages` - Mensagens individuais das conversas
- `asaas_customers` - Clientes no gateway Asaas

**Institutional System**:
- `institutions` - Organizações (ABPSI, etc.)
- `institution_users` - Usuários vinculados a instituições
- `institution_assistants` - Assistentes habilitados por instituição
- `institution_admins` - Administradores institucionais
- `institution_user_subscriptions` - Assinaturas de usuários institucionais

## 🔐 Segurança

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Políticas de acesso** por usuário e instituição
- **SECURITY DEFINER** em funções administrativas
- **Foreign Keys** para integridade referencial
- **Triggers** para auditoria e automação

## 🆕 Últimas Mudanças (v3.4.1 - 27/09/2025)

### Migration 024 - Auto-aprovação ABPSI
- ✅ Removido sistema de aprovação manual
- ✅ Usuários aprovados automaticamente ao se registrar
- ✅ `is_active` default = `true`
- ✅ Triggers automáticos para novos usuários
- ✅ Fluxo simplificado: Registro → Checkout → Uso

### Estatísticas Corrigidas
- ✅ Contagens precisas de usuários (todos vs ativos)
- ✅ Cálculo correto de conversas por instituição
- ✅ Users com conversas calculado corretamente

## 📚 Documentação Relacionada

- [ABPSI.md](../docs/ABPSI.md) - Documentação completa da ABPSI
- [INSTITUTIONS_GUIDE.md](../docs/INSTITUTIONS_GUIDE.md) - Guia para novas instituições
- [CLAUDE.md](../docs/CLAUDE.md) - Documentação técnica completa
- [SQL_FUNCTIONS.md](../docs/database/SQL_FUNCTIONS.md) - Detalhes das funções RPC

## 🚨 Importante

⚠️ **Nunca aplique migrations diretamente em produção sem backup**
⚠️ **Teste todas as migrations em ambiente de desenvolvimento primeiro**
⚠️ **Migrations são irreversíveis - documente todas as mudanças**

## 📞 Suporte

- **Projeto**: NeuroIA Lab
- **Database**: Supabase PostgreSQL 17.4.1
- **Project ID**: avgoyfartmzepdgzhroc
- **Region**: sa-east-1 (São Paulo)