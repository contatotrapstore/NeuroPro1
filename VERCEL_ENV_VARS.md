# 🔧 VARIÁVEIS DE AMBIENTE PARA VERCEL - CONFIGURAÇÃO DEFINITIVA

## 📋 INSTRUÇÕES PARA CONFIGURAR NO VERCEL DASHBOARD

### 🎨 FRONTEND (neuro-pro-frontend.vercel.app)

**Vá em: Vercel Dashboard → Seu projeto Frontend → Settings → Environment Variables**

Adicione EXATAMENTE estas variáveis:

| Nome da Variável | Valor |
|------------------|-------|
| `VITE_API_BASE_URL` | `https://neuro-pro-backend-phi.vercel.app` |
| `VITE_SUPABASE_URL` | `https://avgoyfartmzepdgzhroc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo` |
| `VITE_ENVIRONMENT` | `production` |
| `VITE_DEBUG` | `false` |

### ⚙️ BACKEND (neuro-pro-backend-phi.vercel.app)

**Vá em: Vercel Dashboard → Seu projeto Backend → Settings → Environment Variables**

Adicione EXATAMENTE estas variáveis:

| Nome da Variável | Valor |
|------------------|-------|
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://avgoyfartmzepdgzhroc.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo` |
| `SUPABASE_SERVICE_ROLE_KEY` | `🚨 OBTER NO SUPABASE DASHBOARD - Settings → API → service_role` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo` |
| `OPENAI_API_KEY` | `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` |
| `ASAAS_API_KEY` | `$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojc3MDZhMDQyLTY5YWQtNDk5NC04OTU1LWZkNjJjYzg4ZTMyZTo6JGFhY2hfNmFjMGJlMzAtNDMxOC00NTY2LWExZGUtYWRlNGI0ZDI1Nzhl` |
| `ASAAS_WEBHOOK_SECRET` | `your-asaas-webhook-secret` |
| `CORS_ORIGIN` | `https://neuro-pro-frontend.vercel.app` |
| `JWT_SECRET` | `e86dcb3f8deb1bc191b7afc4909efd3ced007d752b736d4a0918e9560ff0737f` |
| `DEBUG` | `false` |

## 🚨 PONTOS CRÍTICOS - LEIA ANTES DE CONFIGURAR

### ⚠️ ATENÇÃO ESPECIAL:

1. **VITE_API_BASE_URL**: 
   - ✅ **CORRETO**: `https://neuro-pro-backend-phi.vercel.app`
   - ❌ **ERRADO**: `https://neuro-pro-backend-phi.vercel.app/api`
   - **SEM o `/api` no final!**

2. **CORS_ORIGIN no Backend**:
   - Deve apontar para o URL do FRONTEND: `https://neuro-pro-frontend.vercel.app`

3. **🚨 SUPABASE_SERVICE_ROLE_KEY - CRÍTICO**:
   - **NÃO USE** o mesmo valor da `SUPABASE_ANON_KEY`!
   - **OBTER DO SUPABASE DASHBOARD**:
     1. Acesse: [Supabase Dashboard](https://supabase.com/dashboard)
     2. Vá em: Seu projeto → Settings → API
     3. Copie a chave **service_role** (não a anon!)
     4. Ela começa com `eyJ...` e é DIFERENTE da anon_key
   - **Esta chave tem poderes administrativos e bypassa RLS**

### 📋 DEPOIS DE CONFIGURAR:

1. **Redeploy**: Faça redeploy do frontend após configurar as variáveis
2. **Teste**: Acesse o frontend e teste o chat
3. **Debug**: Se não funcionar, verifique no console do navegador

## ✅ COM ESSAS CONFIGURAÇÕES O CHAT FUNCIONARÁ 100%!