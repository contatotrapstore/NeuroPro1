# 🚀 Deploy Separado no Vercel - Frontend e Backend

## 📍 CONFIGURAÇÃO PARA DOIS PROJETOS SEPARADOS

### 🎯 URLs dos Projetos:
- **Frontend**: https://neuroai-lab.vercel.app (repositório: pasta frontend)
- **Backend**: https://neuro-pro-backend.vercel.app (repositório: pasta backend)

## 📁 Estrutura de Deploys

### 🖥️ PROJETO FRONTEND (neuroai-lab)
**Pasta**: `frontend/`
**Vercel.json**: `frontend/vercel.json`

```bash
# Variáveis para configurar no dashboard do Frontend:
VITE_API_BASE_URL=https://neuro-pro-backend.vercel.app/api
VITE_SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo
VITE_ENVIRONMENT=production
VITE_DEBUG=false
```

### ⚙️ PROJETO BACKEND (neuro-pro-backend)
**Pasta**: `backend/`
**Vercel.json**: `backend/vercel.json`

```bash
# Variáveis para configurar no dashboard do Backend:
NODE_ENV=production
SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
SUPABASE_SERVICE_KEY=SEU_SERVICE_KEY_REAL_AQUI
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo
OPENAI_API_KEY=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
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojc3MDZhMDQyLTY5YWQtNDk5NC04OTU1LWZkNjJjYzg4ZTMyZTo6JGFhY2hfNmFjMGJlMzAtNDMxOC00NTY2LWExZGUtYWRlNGI0ZDI1Nzhl
ASAAS_WEBHOOK_SECRET=your-asaas-webhook-secret
CORS_ORIGIN=https://neuroai-lab.vercel.app
JWT_SECRET=e86dcb3f8deb1bc191b7afc4909efd3ced007d752b736d4a0918e9560ff0737f
DEBUG=false
```

## 🔄 PASSOS PARA DEPLOY

### 1️⃣ Deploy do Backend (neuro-pro-backend)
1. No Vercel Dashboard, crie um novo projeto
2. Conecte ao repositório, mas selecione apenas a pasta `backend`
3. Configure as variáveis de ambiente do backend (acima)
4. Deploy será automático

### 2️⃣ Deploy do Frontend (neuroai-lab)
1. No Vercel Dashboard, crie outro projeto 
2. Conecte ao mesmo repositório, mas selecione apenas a pasta `frontend`
3. Configure as variáveis de ambiente do frontend (acima)
4. Deploy será automático

### 3️⃣ Configuração Alternativa (Monorepo Root)
Se preferir deploy do repositório raiz:
- Use `vercel.json` na raiz (já configurado)
- Este método deployará apenas o frontend
- Backend deve ser deployado separadamente

## ✅ ARQUIVOS CONFIGURADOS

### ✅ Frontend
- `frontend/vercel.json` ✅ Configurado para Vite
- `frontend/.env.production` ✅ Variáveis de produção
- Security headers implementados

### ✅ Backend  
- `backend/vercel.json` ✅ Configurado para Node.js
- `backend/.env.production` ✅ Variáveis de produção
- API routes configuradas

### ✅ Root
- `vercel.json` ✅ Configurado para frontend (alternativo)
- `.gitignore` ✅ Protegendo arquivos .env

## 🚨 IMPORTANTE

⚠️ **SUBSTITUA O SUPABASE_SERVICE_KEY** pelo valor real do painel Supabase

✅ **URLs já estão configuradas corretamente**:
- Frontend aponta para: `neuroai-lab.vercel.app`
- Backend responde em: `neuro-pro-backend.vercel.app`
- CORS configurado entre os domínios

## 🧪 TESTES APÓS DEPLOY

1. ✅ Teste o frontend: https://neuroai-lab.vercel.app
2. ✅ Teste a API: https://neuro-pro-backend.vercel.app/api/
3. 🔐 Teste login/registro
4. 💬 Teste chat com assistentes
5. 💳 Teste sistema de pagamentos

**Deploys configurados e prontos! 🎉**