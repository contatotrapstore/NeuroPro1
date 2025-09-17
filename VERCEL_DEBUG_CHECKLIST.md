# ✅ Checklist Debug Vercel Backend - API Produção

## 🎯 **Teste Criado: `/api/test-asaas`**

Criei um endpoint de teste para diagnosticar o problema: `https://neuro-pro-backend-phi.vercel.app/api/test-asaas`

### 📋 **Checklist de Verificação:**

#### 1. **API Key de Produção** ✅/❌
- [ ] Formato: `$aact_prod_XXXXXXXX...`
- [ ] Sem espaços ou quebras de linha
- [ ] Ativa no painel Asaas
- [ ] Configurada no Vercel como `ASAAS_API_KEY`

#### 2. **Webhook Configuration** ✅/❌
- [ ] URL: `https://neuro-pro-backend-phi.vercel.app/webhooks/asaas`
- [ ] Secret: `skjdaiosdajsdjaspjdiasjiadasijd`
- [ ] Eventos ativos no painel Asaas
- [ ] Variável `ASAAS_WEBHOOK_SECRET` no Vercel

#### 3. **Deploy Status** ✅/❌
- [ ] Último deploy bem-sucedido
- [ ] Variáveis de ambiente recarregadas
- [ ] Sem cache antigo

## 🧪 **Como Testar:**

### Passo 1: Teste o Endpoint
```bash
# Acesse no navegador ou curl:
https://neuro-pro-backend-phi.vercel.app/api/test-asaas
```

### Passo 2: Analise o Resultado
O endpoint vai retornar:
- ✅ **Success**: API key válida e funcionando
- ❌ **Error**: Detalhes do problema encontrado

### Passo 3: Debug Detalhado
```json
{
  "debug": {
    "apiKeyFormat": "PRODUCTION|SANDBOX|INVALID",
    "apiKeyLength": 123,
    "apiKeyStart": "$aact_prod_000...",
    "customersFound": 5,
    "testCustomerCreated": "cus_123",
    "baseUrl": "https://api.asaas.com/v3"
  }
}
```

## 🔧 **Possíveis Problemas e Soluções:**

### 1. **"ASAAS_API_KEY não configurada"**
- ✅ Adicione/verifique variável no Vercel
- ✅ Redeploy após adicionar

### 2. **"apiKeyFormat": "INVALID"**
- ✅ Chave deve começar com `$aact_prod_` ou `$aact_hmlg_`
- ✅ Regenere chave no painel Asaas se necessário

### 3. **"API Key inválida ou expirada"**
- ✅ Verifique status da conta no Asaas
- ✅ Regenere nova chave no painel
- ✅ Atualize no Vercel e redeploy

### 4. **Erro de Conectividade**
- ✅ Verifique se URL está correta: `https://api.asaas.com/v3`
- ✅ Teste com chave de sandbox primeiro

## 🚀 **Próximos Passos:**

1. **Execute o teste**: Acesse `/api/test-asaas`
2. **Analise o resultado**: Verifique se retorna success ou error
3. **Me informe**: Cole aqui o JSON retornado
4. **Corrija**: Baseado no resultado do teste

**Com esse teste, vamos identificar exatamente onde está o problema!** 🎯