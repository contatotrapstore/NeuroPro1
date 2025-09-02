# Variáveis de Ambiente Necessárias no Vercel

Este documento lista todas as variáveis de ambiente que devem ser configuradas no painel do Vercel para o funcionamento correto da aplicação NeuroIA Lab em produção.

## 🔑 Variáveis OBRIGATÓRIAS

### Supabase Configuration
```bash
SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### OpenAI Configuration  
```bash
OPENAI_API_KEY=sk-proj-...
```

### Asaas Payment Gateway
```bash
ASAAS_API_KEY=$aact_prod_...
ASAAS_WEBHOOK_SECRET=your-webhook-secret
```

## ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **SUPABASE_SERVICE_ROLE_KEY Incorreta**
- **Problema**: A SERVICE_ROLE_KEY atual está configurada com a ANON_KEY
- **Solução**: Obter a verdadeira SERVICE_ROLE_KEY do painel do Supabase
- **Localização**: Settings > API > service_role key (secret)

### 2. **Validação JWT Falha**
- **Causa**: Cliente Supabase criado com chave incorreta
- **Sintoma**: Erro 401 "Token inválido" mesmo com usuário logado
- **Correção**: Aplicada nos endpoints para usar ANON_KEY na validação

## 🔧 Como Configurar no Vercel

1. Acesse o painel do Vercel
2. Vá em Settings > Environment Variables
3. Adicione TODAS as variáveis listadas acima
4. **IMPORTANTE**: Use a SERVICE_ROLE_KEY real do Supabase, não a ANON_KEY

## ✅ Verificação

Após configurar as variáveis, teste:
1. Login de usuário
2. Acesso a `/chat/conversations`  
3. Acesso a assinaturas
4. Funcionalidade de admin (se aplicável)

## 📝 Observações

- **NUNCA** commitar chaves reais no código
- Todas as chaves hardcoded foram removidas
- Os endpoints agora requerem as variáveis de ambiente corretas
- Falha na configuração resultará em erro 500 "Configuração do servidor incompleta"