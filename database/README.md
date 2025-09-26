# Database Migrations

Este diretório contém as migrações SQL para configurar o banco de dados da NeuroIA Lab no Supabase.

## Ordem de Execução

Execute as migrações na seguinte ordem:

1. `001_create_assistants_table.sql` - Cria tabela de assistentes e insere os 14 assistentes
2. `002_create_user_packages_table.sql` - Cria tabela de pacotes de usuários
3. `003_create_user_subscriptions_table.sql` - Cria tabela de assinaturas
4. `004_create_conversations_table.sql` - Cria tabela de conversas
5. `005_create_messages_table.sql` - Cria tabela de mensagens
6. `006_increase_assistant_field_limits.sql` - **NOVA**: Aumenta limites de campos para evitar erros
7. `007_update_related_assistant_id_fields.sql` - **NOVA**: Atualiza campos relacionados

## Como Executar

### No Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá para `SQL Editor`
3. Execute cada migration em ordem
4. Verifique se as tabelas foram criadas corretamente

### Via CLI do Supabase

```bash
# Executar todas as migrações
supabase db push

# Ou executar individualmente
supabase db reset
```

## Estrutura do Banco

### Tabelas Principais

- **assistants**: 14 assistentes de psicologia com IDs da OpenAI
- **user_packages**: Pacotes personalizáveis (3 ou 6 assistentes)
- **user_subscriptions**: Assinaturas individuais e por pacotes
- **conversations**: Conversas entre usuários e assistentes
- **messages**: Mensagens individuais das conversas

### Recursos de Segurança

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Políticas de acesso** garantem que usuários vejam apenas seus dados
- **Foreign Keys** mantêm integridade referencial
- **Check constraints** validam dados de entrada

### Assistentes Incluídos

1. PsicoPlano - Formulador de Roteiro Terapêutico
2. NeuroCase - Revisor de Quadro Clínico
3. Guia Ético - Avaliação Profissional
4. SessãoMap - Formulador de Estrutura de Sessão
5. ClinReplay - Treinador de Sessão
6. CognitiMap - Reestruturação Cognitiva
7. MindRoute - Orientador de Abordagens
8. TheraTrack - Avaliador de Evolução
9. NeuroLaudo - Elaborador de Laudos
10. PsicoTest - Consultor de Testes
11. TheraFocus - Intervenções Específicas
12. PsicoBase - Estratégias Baseadas em Evidências
13. MindHome - Atividades Domiciliares
14. ClinPrice - Avaliador de Custos

## ✨ Migrações Recentes (Janeiro 2025)

### Migration 006: Aumento de Limites de Campos

**Problema Resolvido**: Erro "value too long for type character varying(50)" ao cadastrar assistentes com nomes longos.

**Alterações aplicadas**:
- **assistants.id**: 50 → **100 caracteres**
- **assistants.area**: 20 → **50 caracteres**
- **assistants.icon**: 20 → **50 caracteres**
- **assistants.color_theme**: 20 → **30 caracteres**

### Migration 007: Atualização de Campos Relacionados

**Campos atualizados para compatibilidade**:
- **conversations.assistant_id**: 50 → **100 caracteres**
- **user_subscriptions.assistant_id**: 50 → **100 caracteres**

### Validação de Limites Atuais

```sql
-- Verificar limites atuais dos campos
SELECT
  column_name,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'assistants'
  AND column_name IN ('id', 'name', 'area', 'icon', 'color_theme', 'specialization')
ORDER BY column_name;
```

**Resultado esperado**:
- **area**: 50 caracteres
- **color_theme**: 30 caracteres
- **icon**: 50 caracteres
- **id**: 100 caracteres
- **name**: 100 caracteres
- **specialization**: 100 caracteres

## Modelo de Preços

- **Individual**: R$ 39,90/mês ou R$ 199,00/semestre
- **Pacote 3**: R$ 99,90/mês ou R$ 499,00/semestre
- **Pacote 6**: R$ 179,90/mês ou R$ 899,00/semestre

## 🛡️ Sistema de Validação

### Proteção em 3 Camadas

1. **Frontend**: Contadores visuais e validação em tempo real
2. **Backend**: Validação programática antes da inserção
3. **Database**: Constraints atualizadas com limites generosos

### Nunca Mais Erros de Caracteres

O sistema agora suporta nomes de assistentes longos como:
- "Planejador de Exercícios Orofaciais e Neonatais (Bebês / Freio Lingual / Sucção)"
- IDs gerados automaticamente com máximo de 39 caracteres
- Validação preventiva em todos os pontos de entrada

## 🔄 Recent Backend Changes (September 26, 2025)

### Institution Chat Backend Overhaul

Multiple critical fixes applied to `api/institution-chat.js`:

#### Environment Variable Access
- Added fallback: `OPENAI_API_KEY || VITE_OPENAI_API_KEY`
- Prevents "API key not configured" errors in production

#### OpenAI SDK v5 Compatibility
- Fixed runs.retrieve() syntax: `(runId, { thread_id })` instead of `(threadId, runId)`
- Prevents "undefined" path parameter errors

#### Polling Logic Enhancement
- Timeout increased: 30s → 60s
- Added support for `'in_progress'` status
- Progressive backoff: 300ms → 1000ms
- Detailed logging every 10 attempts

#### Debug Infrastructure
**New Endpoint**: `/api/debug-env`
```javascript
GET /api/debug-env
// Returns:
{
  has_OPENAI_API_KEY: boolean,
  total_env_vars: number,
  openai_env_keys: string[],
  all_env_keys_count: number
}
```

**Comprehensive Logging**:
```javascript
console.log('🔑 API Key Selection:', {
  has_OPENAI_API_KEY: boolean,
  has_VITE_OPENAI_API_KEY: boolean,
  selected_key_source: 'OPENAI_API_KEY' | 'VITE_OPENAI_API_KEY' | 'none'
});

console.log('🏁 Polling finished:', {
  finalStatus: 'completed',
  totalAttempts: 15,
  elapsedTime: '12s'
});
```

### Database Impact
No database schema changes were required. All fixes were backend API logic improvements.

### RPC Functions Status
All existing RPC functions remain unchanged:
- ✅ `verify_institution_access()` - Working correctly
- ✅ `get_institution_subscription_status()` - Operational
- ✅ `check_institution_user_subscription()` - Active

### API Endpoints Updated
- `POST /api/institution-chat` - Enhanced with proper polling and error handling
- `GET /api/debug-env` - **NEW** endpoint for environment variable inspection
- All institution endpoints now use consistent apiService infrastructure