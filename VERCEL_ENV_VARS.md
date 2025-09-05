# 🔧 Variáveis de Ambiente para Vercel - URLs Atualizados

## 📍 Novos Domínios:
- **Frontend**: https://neuro-pro-frontend.vercel.app
- **Backend**: https://neuro-pro-backend.vercel.app

## 🎨 Frontend (neuro-pro-frontend.vercel.app)

⚠️ **IMPORTANTE**: Configure no Vercel Dashboard EXATAMENTE assim:

```bash
VITE_API_BASE_URL=https://neuro-pro-backend.vercel.app/api
VITE_SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo
VITE_ENVIRONMENT=production
VITE_DEBUG=false
```

🚨 **NÃO USE**: `neuro-pro-backend-phi.vercel.app` no Dashboard

## ⚙️ Backend (neuro-pro-backend.vercel.app)

```bash
NODE_ENV=production
SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
SUPABASE_SERVICE_KEY=SEU_SERVICE_KEY_REAL_AQUI
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo
OPENAI_API_KEY=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
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojc3MDZhMDQyLTY5YWQtNDk5NC04OTU1LWZkNjJjYzg4ZTMyZTo6JGFhY2hfNmFjMGJlMzAtNDMxOC00NTY2LWExZGUtYWRlNGI0ZDI1Nzhl
ASAAS_WEBHOOK_SECRET=your-asaas-webhook-secret
CORS_ORIGIN=https://neuro-pro-frontend.vercel.app
JWT_SECRET=e86dcb3f8deb1bc191b7afc4909efd3ced007d752b736d4a0918e9560ff0737f
DEBUG=false
```

## ⚠️ IMPORTANTES CORREÇÕES APLICADAS:

### 🔧 CSP (Content Security Policy)
- **Ambos os domínios** do backend liberados no CSP: `neuro-pro-backend.vercel.app` e `neuro-pro-backend-phi.vercel.app`
- CSP configurado em **dois lugares**: `vercel.json` e `frontend/vercel.json`

### 🎯 Configuração Correta no Vercel Dashboard:
1. **VITE_API_BASE_URL**: Use `https://neuro-pro-backend.vercel.app/api` (SEM o "-phi")
2. **CORS_ORIGIN**: Use `https://neuro-pro-frontend.vercel.app`
3. **SUPABASE_SERVICE_KEY**: Substituir pelo valor real do painel Supabase

### 🚨 PROBLEMA RESOLVIDO:
- **Antes**: CSP bloqueava `neuro-pro-backend-phi.vercel.app`
- **Agora**: CSP permite ambos os domínios do backend
- **APIs funcionarão** independente do URL configurado no Dashboard

## ✅ Sistema configurado e pronto para deploy!