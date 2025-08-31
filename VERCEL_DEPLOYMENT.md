# NeuroIA Lab - Vercel Deployment Guide

Este guia te ajudará a fazer o deploy da aplicação NeuroIA Lab no Vercel.

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Conta no [Supabase](https://supabase.com) 
3. Conta no [OpenAI](https://platform.openai.com)
4. Conta no [Asaas](https://www.asaas.com) (para pagamentos)
5. Repositório Git (GitHub, GitLab, ou Bitbucket)

## 🚀 Deploy do Frontend

### 1. Preparar o Frontend para Vercel

O frontend já está configurado com:
- ✅ `vercel.json` para configuração do Vercel
- ✅ Scripts de build no `package.json`
- ✅ Variáveis de ambiente template (`.env.example`)

### 2. Deploy via Vercel Dashboard

1. **Conectar Repositório**:
   - Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
   - Clique em "Import Project"
   - Conecte seu repositório Git

2. **Configurar o Projeto**:
   - **Framework**: Vite (detectado automaticamente)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Configurar Variáveis de Ambiente**:
   ```
   VITE_API_BASE_URL=https://seu-backend.vercel.app/api
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima-supabase
   NODE_ENV=production
   ```

### 3. Deploy via CLI (Alternativo)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Na pasta do frontend
cd frontend

# Login e deploy
vercel login
vercel --prod
```

## 🔧 Deploy do Backend (API Routes)

### Opção 1: Vercel Serverless Functions

1. **Criar pasta `api`** no root do projeto
2. **Mover endpoints** para arquivos individuais em `/api/`
3. **Configurar `vercel.json`** no root:

```json
{
  "functions": {
    "api/**.ts": {
      "runtime": "@vercel/node"
    }
  }
}
```

### Opção 2: Deploy Separado do Backend

1. **Criar novo projeto** no Vercel para o backend
2. **Root Directory**: `backend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Start Command**: `node dist/index.js`

**Variáveis de Ambiente do Backend**:
```
NODE_ENV=production
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key-supabase
OPENAI_API_KEY=sk-sua-openai-api-key
OPENAI_ORGANIZATION=org-sua-organizacao-openai
ASAAS_API_KEY=sua-asaas-api-key
ASAAS_WEBHOOK_SECRET=seu-webhook-secret-asaas
CORS_ORIGIN=https://seu-frontend.vercel.app
JWT_SECRET=seu-jwt-secret-super-seguro
```

## 🔒 Configurações de Segurança

### 1. Domínios CORS
O backend já está configurado para aceitar domínios Vercel automaticamente:
- `*.vercel.app`
- `neuroai-lab*.vercel.app`
- `neuro*.vercel.app`

### 2. Headers de Segurança
O frontend inclui headers de segurança no `vercel.json`:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

## 🗄️ Banco de Dados (Supabase)

### 1. Configurações de Produção
- ✅ RLS (Row Level Security) já configurado
- ✅ Políticas de acesso implementadas
- ✅ Migrations organizadas em `/database/migrations/`

### 2. Aplicar Migrations
Execute as migrations do Supabase:
```sql
-- Execute os arquivos em ordem na interface do Supabase
-- Ou via CLI do Supabase
```

## 🚦 Verificar Deploy

### Checklist pós-deploy:

1. **Frontend**:
   - [ ] Interface carrega corretamente
   - [ ] Login funciona
   - [ ] Chat funciona
   - [ ] Icons aparecem (não texto)
   - [ ] Payment icons profissionais aparecem

2. **Backend**:
   - [ ] Endpoints respondem
   - [ ] CORS funcionando
   - [ ] Autenticação funciona
   - [ ] OpenAI API funciona
   - [ ] Webhooks Asaas funcionam

3. **Banco de Dados**:
   - [ ] Conexão estabelecida
   - [ ] Queries funcionam
   - [ ] RLS ativo

## 🐛 Troubleshooting

### Problemas Comuns:

1. **CORS Error**:
   - Verificar `CORS_ORIGIN` no backend
   - Confirmar domínio frontend nas variáveis

2. **Build Error Frontend**:
   - Verificar TypeScript errors
   - Executar `npm run type-check` localmente

3. **API não responde**:
   - Verificar variáveis de ambiente
   - Verificar logs no Vercel dashboard

4. **Banco não conecta**:
   - Verificar `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`
   - Testar conexão no painel Supabase

## 📝 URLs de Exemplo

Depois do deploy, suas URLs serão algo como:
- **Frontend**: `https://neuroai-lab.vercel.app`
- **Backend**: `https://neuroai-lab-api.vercel.app`

## 🔄 CI/CD Automático

O Vercel automaticamente:
- 🔄 Faz redeploy a cada push
- 🌿 Cria preview deployments para PRs
- 📊 Monitora performance
- 📈 Coleta analytics

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do Vercel dashboard
2. Testar localmente primeiro
3. Verificar variáveis de ambiente
4. Consultar documentação do Vercel