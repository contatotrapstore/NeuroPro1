# Database Cleanup - September 27, 2025

## 🎯 Objetivo

Limpeza de contas de teste da instituição ABPSI para manter apenas dados reais de produção.

## 📊 Situação Antes da Limpeza

**ABPSI Stats**:
- 7 usuários (5 contas de teste + 2 reais)
- 5 ativos, 2 inativos
- 4 conversas
- 1 assistente

**Contas de Teste Identificadas**:
1. `test123@gmail.com` (tesste) - student, ativo
2. `testefn@gmail.com` (testfn) - student, inativo
3. `teste123@gmail.com` (tesst123) - student, ativo
4. `teste3@gmail.com` (testttsda) - student, inativo
5. `tester@gmail.com` (Eduardo Gtest) - student, ativo

## 🧹 SQL Executado

```sql
-- Deletar usuários de teste (cascata remove de institution_users)
DELETE FROM auth.users
WHERE id IN (
  'bf7ab2ad-e0af-400d-87e8-92f27dca32e1', -- test123@gmail.com
  'ae99f2d5-6302-46b2-b2e8-2e81247fd863', -- testefn@gmail.com
  '86cdd0eb-5f29-49ea-9447-a5ae32bf1941', -- teste123@gmail.com
  'df9b5e8c-c829-4288-ab2f-09b2d7df6cb1', -- teste3@gmail.com
  '0203ae43-b58d-4fa7-af1c-fb52911a816a'  -- tester@gmail.com
);

-- Remover conversas órfãs (se houver)
DELETE FROM conversations
WHERE user_id NOT IN (SELECT id FROM auth.users);
```

## ✅ Resultado Final

**ABPSI Stats (Pós-Limpeza)**:
- **2 usuários** (apenas contas reais)
- **2 ativos** (ambos subadmins)
- **4 conversas** (mantidas)
- **1 assistente** (mantido)

**Usuários Reais Restantes**:

| Email | Nome | Role | Status | Registration | Department |
|-------|------|------|--------|-------------|------------|
| gouveiarx@gmail.com | Eduardo Gouveia | subadmin | ativo | ADMIN001 | Administração |
| academiabrasileirapsicanalise@gmail.com | Academia Brasileira de Psicanálise | subadmin | ativo | - | - |

## 🎯 Impacto nas Estatísticas

### Admin Master Panel ABPSI - Visão Geral
**Antes**: 7 usuários, 4 conversas, 1 assistente
**Depois**: 2 usuários, 4 conversas, 1 assistente

### Dashboard Subadmin - Aba Usuários
**Antes**: Lista com 7 usuários (5 de teste + 2 reais)
**Depois**: Lista limpa com 2 usuários reais

## ⚠️ Dados Preservados

- ✅ **Conversas**: 4 conversas mantidas (todas do gouveiarx@gmail.com)
- ✅ **Assistentes**: 1 assistente mantido (Simulador de Psicanálise ABPSI)
- ✅ **Configurações**: Instituição ABPSI mantida intacta
- ✅ **Usuários Reais**: Ambos os subadmins preservados

## 📋 Verificação

```sql
-- Query de verificação final
SELECT
  i.name,
  COUNT(DISTINCT iu.user_id) as total_users,
  COUNT(DISTINCT CASE WHEN iu.is_active THEN iu.user_id END) as active_users,
  COUNT(DISTINCT ia.assistant_id) as enabled_assistants,
  COUNT(DISTINCT c.id) as total_conversations
FROM institutions i
LEFT JOIN institution_users iu ON iu.institution_id = i.id
LEFT JOIN institution_assistants ia ON ia.institution_id = i.id AND ia.is_enabled = true
LEFT JOIN conversations c ON c.user_id = iu.user_id
WHERE i.slug = 'abpsi'
GROUP BY i.id, i.name;

-- Resultado: 2 users, 2 active, 1 assistant, 4 conversations
```

## 🚀 Próximos Passos

1. **Deploy no Vercel** - Push das correções de backend/frontend
2. **Teste dos Painéis** - Verificar Admin Master + Subadmin Dashboard
3. **Validação** - Confirmar que estatísticas mostram 2/4/1 ao invés de 0/0/1

---

**Status**: ✅ Limpeza concluída com sucesso
**Data**: 27 de Setembro de 2025
**Responsável**: Claude Code