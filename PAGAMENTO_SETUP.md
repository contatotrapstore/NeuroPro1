# Configuração do Sistema de Pagamento Asaas

## Visão Geral

O sistema de pagamento do NeuroIA Lab foi implementado usando a API do Asaas para processar pagamentos via PIX, Boleto e Cartão de Crédito com cobrança recorrente para assinaturas.

## Arquitetura do Sistema

### Componentes Implementados

1. **AsaasService** (`api/services/asaas.service.js`)
   - SDK para integração com API Asaas
   - Gerenciamento de clientes, pagamentos e assinaturas
   - Validação de webhooks

2. **Payment API** (`api/payment.js`)
   - Endpoint principal para criação de pagamentos
   - Integração com banco de dados
   - Processamento de diferentes métodos de pagamento

3. **Webhook Handler** (`api/webhooks/asaas.js`)
   - Recebe notificações do Asaas
   - Atualiza status de assinaturas automaticamente
   - Processa eventos de pagamento

4. **Frontend Pages**
   - `PaymentPix.tsx` - Interface para pagamento PIX
   - `PaymentBoleto.tsx` - Interface para boleto bancário
   - `Checkout.tsx` - Página de checkout atualizada

## Configuração do Ambiente

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis no painel do Vercel:

```bash
# Asaas Production API Key (já configurada)
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojc3MDZhMDQyLTY5YWQtNDk5OS04OTU1LWZkNjJjYzg4ZTMyZTo6JGFhY2hfNmFjMGJlMzAtNDMxOC00NTY2LWExZGUtYWRlNGI0ZDI1Nzhl

# Webhook Secret (configurar no painel Asaas)
ASAAS_WEBHOOK_SECRET=seu-webhook-secret-aqui
```

### 2. Configuração no Painel Asaas

1. **Acesse o painel Asaas**: https://www.asaas.com
2. **Configure Webhooks**:
   - URL: `https://neuro-pro-backend-phi.vercel.app/webhooks/asaas`
   - Eventos para ativar:
     - `PAYMENT_RECEIVED`
     - `PAYMENT_CONFIRMED`
     - `PAYMENT_OVERDUE`
     - `PAYMENT_DELETED`
     - `PAYMENT_REFUNDED`
     - `SUBSCRIPTION_RECEIVED`
     - `SUBSCRIPTION_OVERDUE`
     - `SUBSCRIPTION_CANCELLED`

3. **Gere o Webhook Secret** e adicione na variável `ASAAS_WEBHOOK_SECRET`

### 3. Configuração do Banco de Dados

A tabela `asaas_customers` já foi criada via migration:

```sql
-- Tabela já existe e está configurada
SELECT * FROM asaas_customers;
```

## Fluxo de Pagamento

### 1. Assinatura Individual

```
Usuário → Checkout → Payment API → Asaas → Webhook → Database
```

1. Usuário preenche dados no checkout
2. Frontend chama `/payment/create`
3. API cria cliente no Asaas (se não existir)
4. API cria assinatura recorrente no Asaas
5. Usuário é redirecionado para:
   - PIX: Página com QR Code
   - Boleto: Página com PDF
   - Cartão: Dashboard (pagamento imediato)
6. Asaas confirma pagamento via webhook
7. Sistema ativa assinatura automaticamente

### 2. Pacotes

Mesmo fluxo, mas cria:
- 1 registro em `user_packages`
- N registros em `user_subscriptions` (um para cada assistente)

## Métodos de Pagamento

### PIX
- **Processamento**: Instantâneo
- **Interface**: QR Code + código copia-cola
- **Confirmação**: Automática via webhook

### Boleto
- **Processamento**: 1-3 dias úteis
- **Interface**: PDF + código de barras
- **Vencimento**: Configurável (padrão: D+7)

### Cartão de Crédito
- **Processamento**: Imediato
- **Recorrência**: Automática
- **Dados**: Criptografados pelo Asaas

## Webhooks

O sistema processa automaticamente:

- **Pagamento confirmado**: Ativa assinatura
- **Pagamento em atraso**: Marca como `overdue`
- **Pagamento cancelado**: Cancela assinatura
- **Renovação**: Estende prazo de validade

## Preços Configurados

```javascript
// Individuais
monthly: assistant.monthly_price (base: R$ 39,90)
semester: assistant.semester_price (base: R$ 199,90)

// Pacotes
package_3: {
  monthly: R$ 99,90
  semester: R$ 499,90
}
package_6: {
  monthly: R$ 179,90
  semester: R$ 899,90
}
```

## Testes

### Teste de Pagamento
1. Acesse `/store`
2. Selecione um assistente ou pacote
3. Complete o checkout
4. Use dados de teste do Asaas se necessário

### Teste de Webhook
```bash
# Simular webhook (desenvolvimento)
curl -X POST https://neuro-pro-backend-phi.vercel.app/webhooks/asaas \
  -H "Content-Type: application/json" \
  -d '{"event": "PAYMENT_RECEIVED", "payment": {"id": "pay_test", "status": "RECEIVED"}}'
```

## Monitoramento

### Logs Importantes
- Criação de clientes Asaas
- Processamento de pagamentos
- Webhooks recebidos
- Erros de API

### Métricas
- Taxa de conversão por método
- Tempo de confirmação de pagamentos
- Chargebacks e cancelamentos

## Suporte

### Problemas Comuns

1. **Webhook não funciona**
   - Verificar URL no painel Asaas
   - Verificar `ASAAS_WEBHOOK_SECRET`
   - Verificar logs do Vercel

2. **Pagamento não confirma**
   - Verificar se webhook está ativo
   - Verificar se evento está habilitado
   - Verificar tabela `user_subscriptions`

3. **Erro na API Asaas**
   - Verificar `ASAAS_API_KEY`
   - Verificar se conta não está suspensa
   - Verificar limites de API

### Contatos
- **Suporte Asaas**: suporte@asaas.com
- **Documentação**: https://docs.asaas.com

## Próximos Passos

1. ✅ Sistema básico implementado
2. ⏳ Testes em produção
3. ⏳ Implementar cancelamento via Asaas
4. ⏳ Relatórios financeiros
5. ⏳ Integração com contabilidade

---

**Status**: ✅ Sistema implementado e pronto para produção
**Última atualização**: 2025-01-17