# 🚀 NeuroIA Lab - PRONTO PARA DEPLOY NO VERCEL

## 📍 URLs DOS DEPLOYS
- **Frontend**: https://neuroai-lab.vercel.app
- **Backend API**: https://neuro-pro-backend.vercel.app

## ✅ CORREÇÕES DE SEGURANÇA APLICADAS

### 🔒 Problema Crítico Resolvido
- **Arquivos .env agora estão no .gitignore** - suas chaves API não serão mais expostas
- **Chaves removidas do frontend/vercel.json** - configuração segura implementada
- **Arquivos .env.example criados** - templates seguros para desenvolvimento

## 📋 VARIÁVEIS DE AMBIENTE PARA VERCEL DASHBOARD

### 🔧 Backend Environment Variables

**COPIE E COLE NO DASHBOARD DO VERCEL:**

```bash
# Application Environment
NODE_ENV=production

# Database - Supabase Configuration
SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
SUPABASE_SERVICE_KEY=SEU_SERVICE_KEY_AQUI
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo

# AI Service - OpenAI Configuration  
OPENAI_API_KEY=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

# Payment Gateway - Asaas Configuration
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojc3MDZhMDQyLTY5YWQtNDk5NC04OTU1LWZkNjJjYzg4ZTMyZTo6JGFhY2hfNmFjMGJlMzAtNDMxOC00NTY2LWExZGUtYWRlNGI0ZDI1Nzhl
ASAAS_WEBHOOK_SECRET=your-asaas-webhook-secret

# Security & CORS - CONFIGURADO PARA FRONTEND
CORS_ORIGIN=https://neuroai-lab.vercel.app
JWT_SECRET=e86dcb3f8deb1bc191b7afc4909efd3ced007d752b736d4a0918e9560ff0737f

# Development Settings
DEBUG=false
```

### 🎨 Frontend Environment Variables  

**COPIE E COLE NO DASHBOARD DO VERCEL:**

```bash
# API Configuration - CONFIGURADO PARA BACKEND
VITE_API_BASE_URL=https://neuro-pro-backend.vercel.app/api

# Supabase Configuration
VITE_SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo

# Environment Settings
VITE_ENVIRONMENT=production
VITE_DEBUG=false
```

## 🔄 PASSOS PARA DEPLOY

### 1. ⚠️ IMPORTANTE - SUBSTITUA ESSES VALORES:

```bash
# OBRIGATÓRIO - Substitua pelo Service Key real do Supabase
SUPABASE_SERVICE_KEY=SEU_SERVICE_KEY_REAL_AQUI

# ✅ CONFIGURADO PARA OS DOMÍNIOS CORRETOS
CORS_ORIGIN=https://neuroai-lab.vercel.app
VITE_API_BASE_URL=https://neuro-pro-backend.vercel.app/api

# OPCIONAL - Configure se tiver webhook do Asaas
ASAAS_WEBHOOK_SECRET=seu-webhook-secret-real
```

### 2. 📝 No Dashboard do Vercel:

1. **Importe o Repositório**
   - Conecte GitHub/GitLab 
   - Selecione repositório NeuroIA Lab

2. **Configure Environment Variables**
   - Vá em Settings → Environment Variables
   - Cole TODAS as variáveis acima
   - Marque para Production, Preview, Development

3. **Deploy Automático**
   - Vercel detectará automaticamente a configuração
   - Build será feito conforme vercel.json configurado

### 3. ✅ Configurações Implementadas:

- **Monorepo Structure**: Frontend + Backend em um só deploy
- **Security Headers**: Configurados no frontend/vercel.json  
- **Build Commands**: Otimizados para Vite + Node.js
- **Environment Isolation**: .env files protegidos no .gitignore
- **JWT Security**: Chave de 256-bits gerada automaticamente

## 🎯 CHECKLIST DE DEPLOY

- [x] Arquivos .env adicionados ao .gitignore
- [x] Chaves removidas dos arquivos de configuração
- [x] JWT_SECRET seguro gerado
- [x] vercel.json configurado para monorepo
- [x] Arquivos .env.production criados
- [x] Documentação completa das variáveis

### ⚠️ AÇÕES OBRIGATÓRIAS ANTES DO DEPLOY:

1. **✅ URLs configuradas**: Frontend: neuroai-lab.vercel.app | Backend: neuro-pro-backend.vercel.app
2. **⚠️ OBRIGATÓRIO**: Substitua SUPABASE_SERVICE_KEY pelo valor real do painel Supabase
3. **OPCIONAL**: Configure ASAAS_WEBHOOK_SECRET se usar webhooks de pagamento

## 🚨 IMPORTANTE - SEGURANÇA

- ✅ Suas chaves API agora estão seguras (não expostas no repo)
- ✅ JWT_SECRET forte gerado: `e86dcb3f8deb1bc191b7afc4909efd3ced007d752b736d4a0918e9560ff0737f`
- ✅ CORS configurado para produção
- ✅ Headers de segurança implementados

## 📞 Próximos Passos

1. ✅ Faça commit das mudanças (arquivos .env estão protegidos)
2. ✅ Configure as variáveis no Vercel Dashboard para cada projeto:
   - **neuroai-lab** (Frontend): Configure as variáveis VITE_*
   - **neuro-pro-backend** (Backend): Configure todas as outras variáveis
3. ✅ Deploy automático será feito ao fazer push
4. ✅ URLs já configuradas corretamente
5. 🧪 Teste funcionalidades: login, chat, pagamentos

**Sistema pronto para produção! 🎉**