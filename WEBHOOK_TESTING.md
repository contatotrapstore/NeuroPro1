# 🔧 Instruções para Testar e Configurar Webhook Asaas

## 📋 URLs dos Endpoints

### Webhook Principal:
```
https://neuro-pro-backend-phi.vercel.app/api/webhooks/asaas
```

### Endpoint de Teste:
```
https://neuro-pro-backend-phi.vercel.app/api/webhooks/asaas-test
```

## 🧪 Como Testar o Webhook

### 1. Teste de Conectividade
```bash
curl -X GET https://neuro-pro-backend-phi.vercel.app/api/webhooks/asaas-test
```

### 2. Teste POST (simula webhook do Asaas)
```bash
curl -X POST https://neuro-pro-backend-phi.vercel.app/api/webhooks/asaas-test \
  -H "Content-Type: application/json" \
  -d '{"test": true, "message": "Teste de conectividade"}'
```

## ⚙️ Configuração no Painel Asaas

### URL do Webhook no Asaas:
```
https://neuro-pro-backend-phi.vercel.app/api/webhooks/asaas
```

### Eventos a Configurar:
- ✅ PAYMENT_RECEIVED
- ✅ PAYMENT_CONFIRMED
- ✅ PAYMENT_OVERDUE
- ✅ PAYMENT_DELETED
- ✅ PAYMENT_REFUNDED
- ✅ SUBSCRIPTION_RECEIVED
- ✅ SUBSCRIPTION_OVERDUE
- ✅ SUBSCRIPTION_CANCELLED

## 🔍 Monitoramento

### Logs do Vercel:
1. Acesse o painel do Vercel
2. Vá para Functions > Logs
3. Filtre por `asaas` para ver logs do webhook

### Logs Detalhados:
Os logs agora incluem:
- ✅ Timestamp de cada evento
- ✅ Detalhes da requisição
- ✅ Dados completos do webhook
- ✅ Status de processamento
- ✅ Validações específicas para cartão

## 🚨 Solução de Problemas

### Erro 404:
1. Verifique se a URL está exatamente: `/api/webhooks/asaas`
2. Teste o endpoint de conectividade primeiro
3. Verifique se o deploy foi feito corretamente

### Webhook Parando:
1. Verifique os logs do Vercel
2. Os erros agora não param o webhook - ele continua funcionando
3. Logs detalhados ajudam a identificar problemas específicos

### Cartão de Crédito:
1. Agora inclui validação extra de status
2. Só ativa quando status for CONFIRMED ou RECEIVED
3. Logs específicos para pagamentos de cartão

## ✅ Status das Correções Aplicadas:

- ✅ **Logs detalhados** - Webhook agora tem logs completos
- ✅ **Tratamento de erro robusto** - Webhook não para mais
- ✅ **Validação de cartão** - Extra validação para CREDIT_CARD
- ✅ **Endpoint de teste** - Para verificar conectividade
- ✅ **URL corrigida** - `/api/webhooks/asaas` configurada
- ✅ **CORS melhorado** - Headers corretos no Vercel