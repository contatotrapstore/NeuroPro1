# 🚀 Instruções de Deploy - Vercel

## Status Atual
✅ **Problemas corrigidos:**
- Funções serverless reduzidas de 15 para 11 (dentro do limite de 12)
- Bundle otimizado com code splitting para ficar abaixo de 2MB
- Admin.js corrigido para não usar auth.admin.listUsers()
- Integração com Asaas configurada

## Variáveis de Ambiente - Vercel

### Backend (API)
Configure no painel do Vercel para o projeto de backend:

```bash
# Application
NODE_ENV=production
PORT=3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ORGANIZATION=org-your-openai-organization-id

# Asaas Payment Gateway
ASAAS_API_KEY=$aact_prod_YWFjdF9wcm9kXzVmZDA1ODRhZWEzNTQ3NzI4ZDI3MDBhZDA2NjIyMTE1
ASAAS_WEBHOOK_SECRET=your-asaas-webhook-secret
ASAAS_BASE_URL=https://www.asaas.com/api/v3

# Security
JWT_SECRET=your-very-secure-jwt-secret-key-minimum-32-characters
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Cron Jobs
CRON_SECRET=your-secure-cron-secret-key
```

### Frontend
Configure no painel do Vercel para o projeto de frontend:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# API
VITE_API_BASE_URL=https://your-backend.vercel.app

# Environment
VITE_ENVIRONMENT=production
VITE_DEBUG=false
```

## Alterações Feitas

### 1. Consolidação de Funções
- **api/packages/user.js** → **api/packages.js** (consolidado)
- **api/cron/renewal.js** → **api/webhooks.js** (consolidado)
- Agora temos **11 funções** (dentro do limite de 12 do Hobby plan)

### 2. Otimização do Bundle Frontend
- Code splitting implementado em `vite.config.ts`
- Chunks separados para vendor, router, UI, icons, supabase
- Minificação com terser
- Remoção de console.logs em produção

### 3. Correções de Segurança
- Removido `supabase.auth.admin.listUsers()` do admin.js
- Query direta na tabela auth.users
- Validação adequada de permissões

### 4. Integração de Pagamentos
- API Key do Asaas configurada
- Webhooks prontos para notificações
- Sistema de renovação automática

## Lista de Funções Serverless (11 total)
1. admin.js
2. assistants.js
3. auth.js
4. chat.js
5. health.js
6. packages.js (consolidado)
7. payments.js
8. subscriptions.js
9. upload.js
10. upload-simple.js
11. webhooks.js (consolidado)

## Rotas Atualizadas no vercel.json
```json
{
  "src": "/packages(.*)",
  "dest": "/packages.js"
},
{
  "src": "/webhooks/renewal",
  "dest": "/webhooks.js"
}
```

## Próximos Passos

1. **Configurar variáveis no Vercel:**
   - Backend: Adicionar todas as variáveis acima
   - Frontend: Adicionar as variáveis VITE_*

2. **Deploy:**
   ```bash
   git add .
   git commit -m "fix: consolidate functions and optimize bundle for Vercel Hobby plan"
   git push
   ```

3. **Verificar após deploy:**
   - Admin funciona sem erros de Service Role Key
   - Pagamentos com Asaas funcionam
   - Bundle está abaixo de 2MB
   - Todas as 11 funções estão operacionais

## Notas Importantes
- ⚠️ **Não esqueça** de atualizar o CORS_ORIGIN com a URL real do frontend
- ⚠️ **Substitua** todas as credenciais "your-*" pelos valores reais
- ⚠️ **Teste** o admin após deploy para confirmar que users sem subscriptions aparecem
- ✅ **API Key do Asaas já está configurada** nos arquivos locais