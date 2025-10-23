# Passos para Configurar OPENAI_API_KEY no Vercel

## 🔴 Problema Atual

Clientes estão recebendo a mensagem:
> "Desculpe, não consegui processar sua mensagem no momento. O assistente está temporariamente indisponível."

## 🔍 Causa Raiz

A variável de ambiente `OPENAI_API_KEY` pode não estar configurada corretamente no Vercel, ou a chave pode estar inválida/expirada.

## ✅ Solução Passo a Passo

### Passo 1: Obter uma Nova API Key da OpenAI

1. Acesse: https://platform.openai.com/api-keys
2. Faça login na sua conta OpenAI
3. Clique em **"Create new secret key"**
4. Dê um nome descritivo (ex: "NeuroIA-Lab-Production")
5. **IMPORTANTE**: Copie a chave IMEDIATAMENTE (ela só aparece uma vez)
   - A chave começa com `sk-proj-` ou `sk-`
   - Exemplo: `sk-proj-abc123def456...`

### Passo 2: Verificar Billing da OpenAI

Antes de configurar a chave, certifique-se de que:

1. Acesse: https://platform.openai.com/account/billing
2. Verifique que você tem:
   - ✅ Método de pagamento cadastrado
   - ✅ Créditos disponíveis ou limite de gastos configurado
   - ✅ Conta em bom estado (não suspensa)

### Passo 3: Configurar a Chave no Vercel

#### Opção A: Via Dashboard Vercel (Recomendado)

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto **neuroai-lab**
3. Vá em **Settings** → **Environment Variables**
4. Procure por `OPENAI_API_KEY`
   - Se existir: Clique em **Edit** e atualize com a nova chave
   - Se não existir: Clique em **Add New**
5. Preencha:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Cole a chave copiada (ex: `sk-proj-abc123...`)
   - **Environment**: Selecione **Production**, **Preview**, e **Development**
6. Clique em **Save**

#### Opção B: Via Vercel CLI

```bash
# 1. Instalar Vercel CLI (se ainda não tiver)
npm install -g vercel

# 2. Fazer login
vercel login

# 3. Linkar o projeto
cd /caminho/para/Neuro
vercel link

# 4. Adicionar a variável de ambiente
vercel env add OPENAI_API_KEY production
# Cole a chave quando solicitado

# 5. Adicionar também para preview e development
vercel env add OPENAI_API_KEY preview
vercel env add OPENAI_API_KEY development
```

### Passo 4: Fazer Redeploy

Após configurar a variável de ambiente, é necessário fazer redeploy:

#### Via Dashboard:
1. Vá em **Deployments**
2. Clique nos três pontos do último deployment
3. Selecione **Redeploy**

#### Via CLI:
```bash
cd /caminho/para/Neuro
vercel --prod
```

### Passo 5: Verificar Configuração

Após o redeploy, teste se a configuração está funcionando:

#### Teste 1: Endpoint de Diagnóstico (Requer Admin)

```bash
# Substitua YOUR_ADMIN_TOKEN pelo token de autenticação de um admin
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://neuroai-lab.vercel.app/api/debug/openai-test
```

**Resposta esperada**:
```json
{
  "success": true,
  "diagnostics": {
    "summary": {
      "overallStatus": "HEALTHY"
    }
  }
}
```

#### Teste 2: Teste Local (Antes de Deploy)

```bash
# 1. Criar arquivo .env na raiz do projeto
echo "OPENAI_API_KEY=sk-proj-sua-chave-aqui" > .env

# 2. Rodar o script de teste
node scripts/test-openai-config.js
```

**Output esperado**:
```
✅ All basic tests passed!
```

## 🚨 Problemas Comuns

### Erro: "API key is invalid"
**Causa**: Chave incorreta ou expirada
**Solução**: Gerar nova chave no Passo 1

### Erro: "insufficient_quota"
**Causa**: Sem créditos ou limite de gastos
**Solução**: Adicionar método de pagamento em https://platform.openai.com/account/billing

### Erro: "rate_limit_exceeded"
**Causa**: Muitas requisições simultâneas
**Solução**:
- Aguardar alguns minutos
- Considerar upgrade do plano OpenAI

### Variável não está aparecendo após adicionar
**Causa**: Não fez redeploy
**Solução**: Sempre fazer redeploy após alterar variáveis de ambiente

## 📊 Monitoramento

### Verificar Logs em Tempo Real

```bash
# Via Vercel CLI
vercel logs https://neuroai-lab.vercel.app

# Via Dashboard
# Deployments → Último deployment → Runtime Logs
```

### Consultar Error Logs no Banco

```sql
-- Ver últimos erros OpenAI
SELECT
    error_type,
    error_message,
    assistant_id,
    metadata,
    created_at
FROM error_logs
WHERE service = 'openai'
ORDER BY created_at DESC
LIMIT 20;
```

## ✅ Checklist de Verificação

Antes de considerar o problema resolvido, verificar:

- [ ] Nova API key gerada na OpenAI
- [ ] Billing da OpenAI está ativo e com créditos
- [ ] `OPENAI_API_KEY` configurada no Vercel (Production, Preview, Development)
- [ ] Redeploy realizado após adicionar a variável
- [ ] Endpoint `/api/debug/openai-test` retorna `"HEALTHY"`
- [ ] Chat está funcionando para clientes de teste
- [ ] Sem erros nos logs do Vercel
- [ ] Sem erros na tabela `error_logs`

## 🔗 Links Úteis

- **OpenAI API Keys**: https://platform.openai.com/api-keys
- **OpenAI Billing**: https://platform.openai.com/account/billing
- **OpenAI Status**: https://status.openai.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs - Environment Variables**: https://vercel.com/docs/projects/environment-variables

---

**Atualizado**: 2025-10-23
**Autor**: Claude Code
**Status**: Aguardando configuração da OPENAI_API_KEY no Vercel
