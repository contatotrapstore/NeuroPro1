# 🔍 DEBUG - Chave de API Asaas Inválida

## 🚨 Erro Atual
```
Error: A chave de API fornecida é inválida
API Error [/payment/create]: Status 500
```

## 🛠️ Adicionei Debug Detalhado

### Logs Adicionados:
1. **Debug no Constructor**: Mostra formato e validade da chave
2. **Validação de Formato**: Verifica se começa com `$aact_`
3. **Debug Detalhado de Erro 401**: Mensagem específica para chave inválida

## 📋 Verificações Necessárias

### 1. **Verificar no Painel Vercel**
- Acesse: https://vercel.com/dashboard
- Vá em seu projeto > Settings > Environment Variables
- Confirme se `ASAAS_API_KEY` está configurada

### 2. **Formato Correto da Chave**
```
✅ Produção: $aact_prod_XXXXXXXXXXXXXXXX...
✅ Sandbox: $aact_hmlg_XXXXXXXXXXXXXXXX...
❌ Qualquer outro formato
```

### 3. **Chave no .env.example**
```
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojc3MDZhMDQyLTY5YWQtNDk5NC04OTU1LWZkNjJjYzg4ZTMyZTo6JGFhY2hfNmFjMGJlMzAtNDMxOC00NTY2LWExZGUtYWRlNGI0ZDI1Nzhl
```

## 🎯 Como Resolver

### Opção 1: Verificar Chave Atual
1. Verifique os logs no Vercel após nova tentativa
2. Procure por: `🔑 Asaas API Key Debug:`
3. Veja se aparece `PRODUCTION`, `SANDBOX` ou `UNKNOWN`

### Opção 2: Regenerar Chave
1. Acesse painel Asaas: https://www.asaas.com
2. Vá em Integrações > API
3. Regenere uma nova chave de produção
4. Atualize no Vercel
5. Redeploy a aplicação

### Opção 3: Usar Sandbox para Testes
1. Crie conta sandbox: https://sandbox.asaas.com
2. Gere chave sandbox (começa com `$aact_hmlg_`)
3. Use temporariamente para testes

## 🔄 Próximos Passos

1. **Teste agora** uma nova assinatura
2. **Verifique logs** no console do Vercel
3. **Me informe** o que aparece no debug
4. **Corrija** com base nas informações do log

**Com o debug adicionado, agora podemos identificar exatamente qual é o problema!** 🎯