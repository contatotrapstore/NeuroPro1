# Migration History - NeuroIA Lab

## Migrations Aplicadas

### Migration 014 - Assistant IDs para Pacotes ✅ APLICADA
**Data**: 2025-09-22
**Status**: Concluída com sucesso
**Arquivo**: `database/migrations/014_add_assistant_ids_to_packages.sql`

#### Descrição
Adicionou o campo `assistant_ids TEXT[]` na tabela `user_packages` para armazenar quais assistentes foram selecionados em cada pacote.

#### Funcionalidades Implementadas
- ✅ Campo `assistant_ids` como array de texto
- ✅ Constraint para validar quantidade (3 ou 6 assistentes)
- ✅ Trigger para impedir duplicatas
- ✅ Índices GIN otimizados para arrays
- ✅ RLS policies atualizadas

#### Validações Implementadas
```sql
-- Validação de contagem
CHECK (
  (package_type = 'package_3' AND array_length(assistant_ids, 1) = 3) OR
  (package_type = 'package_6' AND array_length(assistant_ids, 1) = 6)
)

-- Trigger para validar duplicatas
CREATE TRIGGER trigger_validate_package_assistants
  BEFORE INSERT OR UPDATE ON public.user_packages
  FOR EACH ROW EXECUTE FUNCTION validate_package_assistants();
```

#### Testes Realizados
- ✅ Package_3 com 3 assistentes: **PASSOU**
- ✅ Package_6 com 6 assistentes: **PASSOU**
- ❌ Package_3 com 2 assistentes: **FALHOU CORRETAMENTE**
- ❌ Assistentes duplicados: **FALHOU CORRETAMENTE**

---

## Próximas Migrations
*Nenhuma pendente no momento*

---

## Processo para Aplicar Migrations
1. Criar arquivo `.sql` em `database/migrations/`
2. Testar em ambiente local/desenvolvimento
3. Aplicar via Supabase SQL Editor
4. Documentar neste arquivo como concluída
5. Fazer commit das mudanças