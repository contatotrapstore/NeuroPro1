# Guia de Diagnóstico - Erro "Assistente Temporariamente Indisponível"

## 🔍 Problema
Clientes recebendo a mensagem: "Desculpe, não consegui processar sua mensagem no momento. O assistente está temporariamente indisponível."

## ✅ Soluções Implementadas

### 1. Endpoint de Diagnóstico
**URL**: `GET /api/debug/openai-test`

**Funcionalidade**:
- Verifica se OPENAI_API_KEY está configurada
- Testa validade da API key
- Valida que todos os assistants do banco existem na OpenAI
- Testa criação de threads
- Retorna relatório completo de saúde do sistema

**Como usar**:
```bash
# Fazer request autenticado como admin
curl -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  https://seu-dominio.vercel.app/api/debug/openai-test
```

**Resposta esperada**:
```json
{
  "success": true,
  "diagnostics": {
    "timestamp": "2025-10-22T...",
    "environment": {
      "hasOpenAIKey": true,
      "openAIKeyLength": 51,
      "openAIKeyPrefix": "sk-proj-..."
    },
    "tests": [
      {
        "name": "OpenAI API Key Check",
        "status": "PASSED"
      },
      {
        "name": "Database Assistants Check",
        "status": "PASSED",
        "assistantsCount": 15
      },
      {
        "name": "OpenAI Assistants Validation",
        "status": "PASSED",
        "summary": {
          "total": 15,
          "found": 15,
          "notFound": 0
        }
      }
    ],
    "summary": {
      "overallStatus": "HEALTHY",
      "totalTests": 4,
      "passed": 4,
      "failed": 0
    }
  }
}
```

### 2. Logs Melhorados
O chat.js agora categoriza erros e fornece mensagens específicas:

**Categorias de erro**:
- ✅ **Authentication Error** - API key inválida ou expirada
- ✅ **Rate Limit** - Muitas requisições simultâneas
- ✅ **Timeout** - OpenAI demorou muito para responder
- ✅ **Assistant Error** - Assistant ID inválido

**Logs no console**:
```
🤖 OpenAI Error Details: {
  message: "Invalid assistant_id",
  code: "invalid_request_error",
  category: "invalid_request_error",
  isAuthError: false,
  isAssistantError: true,
  assistantId: "asst_EkR2knX0dBIvCXdDNzcQZwZI",
  assistantName: "Mia - Assistente de Neurofeedback",
  apiKeyPrefix: "sk-proj-...",
  ...
}
```

### 3. Tabela error_logs
Todos os erros OpenAI agora são salvos no banco para análise:

**Consultar erros recentes**:
```sql
SELECT
  service,
  error_type,
  error_message,
  assistant_id,
  created_at,
  metadata
FROM error_logs
WHERE service = 'openai'
ORDER BY created_at DESC
LIMIT 20;
```

**Ver erros por tipo**:
```sql
SELECT
  error_type,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM error_logs
WHERE service = 'openai'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY count DESC;
```

## 🚀 Passos para Diagnosticar

### Passo 1: Rodar o endpoint de diagnóstico
```bash
# No seu terminal ou Postman
GET https://neuroai-lab.vercel.app/api/debug/openai-test
Authorization: Bearer YOUR_ADMIN_TOKEN
```

### Passo 2: Analisar resultado

#### Se `overallStatus: "CRITICAL"`:
**Verificar**:
1. ❌ **OPENAI_API_KEY não configurada ou inválida**
   - Acessar: Vercel Dashboard → Settings → Environment Variables
   - Confirmar que `OPENAI_API_KEY` existe e começa com `sk-proj-`
   - Se não existir ou estiver errada, adicionar/corrigir e fazer redeploy

2. ❌ **Assistants não encontrados na OpenAI**
   - Acessar: https://platform.openai.com/assistants
   - Verificar se os IDs do banco existem lá
   - Se não existirem, atualizar IDs no banco ou recriar assistants

#### Se `overallStatus: "DEGRADED"`:
**Verificar**:
- Quota/Billing da OpenAI
- Rate limits atingidos
- Timeout issues (rede ou OpenAI lenta)

### Passo 3: Verificar logs de erro
```sql
-- Ver últimos erros
SELECT * FROM error_logs
WHERE service = 'openai'
ORDER BY created_at DESC
LIMIT 10;
```

## 🔧 Soluções por Tipo de Erro

### Erro 1: API Key Inválida
**Sintoma**: `isAuthError: true`

**Solução**:
1. Obter nova API key: https://platform.openai.com/api-keys
2. Configurar no Vercel:
   ```bash
   vercel env add OPENAI_API_KEY production
   # Cole a key: sk-proj-...
   ```
3. Redeploy:
   ```bash
   vercel --prod
   ```

### Erro 2: Assistant ID Inválido
**Sintoma**: `isAssistantError: true`

**Solução**:
1. Listar assistants na OpenAI:
   ```bash
   curl https://api.openai.com/v1/assistants \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```
2. Atualizar ID no banco:
   ```sql
   UPDATE assistants
   SET openai_assistant_id = 'NOVO_ID'
   WHERE id = 'assistente-de-neurofeedback-19317788';
   ```

### Erro 3: Rate Limit
**Sintoma**: `isRateLimitError: true`

**Solução**:
- Aguardar alguns segundos
- Considerar upgrade do plano OpenAI
- Implementar queue system para requisições

### Erro 4: Timeout
**Sintoma**: `isTimeoutError: true`

**Solução**:
- Verificar status da OpenAI: https://status.openai.com
- Aumentar timeout no código (atualmente 60s)
- Tentar novamente mais tarde

## 📊 Monitoramento Contínuo

### Dashboard de Erros (SQL)
```sql
-- Erros nas últimas 24h
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  error_type,
  COUNT(*) as count
FROM error_logs
WHERE service = 'openai'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour, error_type
ORDER BY hour DESC, count DESC;
```

### Alertas Automáticos
Considerar implementar:
- Email quando `overallStatus: "CRITICAL"`
- Slack notification para erros repetidos
- Métricas no Grafana/Datadog

## 🆘 Checklist Rápido

Quando clientes reportarem o erro, verificar nesta ordem:

- [ ] Rodar `/api/debug/openai-test`
- [ ] Verificar `OPENAI_API_KEY` no Vercel
- [ ] Checar status OpenAI: https://status.openai.com
- [ ] Consultar `error_logs` no banco
- [ ] Verificar billing OpenAI: https://platform.openai.com/account/billing
- [ ] Confirmar assistants existem: https://platform.openai.com/assistants
- [ ] Testar manualmente com curl/Postman

## 📞 Contato de Suporte

Se problema persistir após seguir este guia:
1. Exportar logs: `SELECT * FROM error_logs WHERE created_at > NOW() - INTERVAL '1 hour'`
2. Capturar screenshot do resultado do `/api/debug/openai-test`
3. Verificar console do Vercel para logs detalhados
4. Contatar suporte OpenAI se necessário

---

**Última atualização**: 2025-10-22
**Versão**: 1.0
