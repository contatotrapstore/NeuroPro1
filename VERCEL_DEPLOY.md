# 🚀 Deploy NeuroIA Lab no Vercel

## Guia Completo de Deploy

### 📋 Variáveis de Ambiente para Vercel

Copie e cole essas variáveis no painel do Vercel, substituindo pelos seus valores reais:

---

## 🔧 Backend Environment Variables

```bash
# Application Environment
NODE_ENV=production
PORT=3000

# Database - Supabase Configuration
SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo

# AI Service - OpenAI Configuration
OPENAI_API_KEY=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

# Payment Gateway - Asaas Configuration
ASAAS_API_KEY=your-asaas-api-key
ASAAS_WEBHOOK_SECRET=your-asaas-webhook-secret

# Security & CORS
CORS_ORIGIN=https://your-vercel-domain.vercel.app
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars

# Development Settings
DEBUG=false
```

---

## 🎨 Frontend Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=https://your-vercel-domain.vercel.app/api

# Supabase Configuration
VITE_SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo

# Environment
VITE_ENVIRONMENT=production
VITE_DEBUG=false
```

---

## 🔄 Passos para Deploy

### 1. Preparar Variáveis Importantes

⚠️ **SUBSTITUA ESTES VALORES:**

```bash
# JWT Secret - Gere uma chave segura
JWT_SECRET=SuaChaveSecretaMuitoSeguraComPeloMenos32Caracteres

# CORS Origin - Substitua pelo domínio do Vercel
CORS_ORIGIN=https://neuroai-lab.vercel.app

# API Base URL - Substitua pelo domínio do Vercel
VITE_API_BASE_URL=https://neuroai-lab.vercel.app/api

# Asaas API (quando configurar pagamentos)
ASAAS_API_KEY=sua-chave-real-do-asaas
ASAAS_WEBHOOK_SECRET=seu-webhook-secret-do-asaas
```

### 2. No Painel do Vercel

1. **Importe o Repositório**
   - Conecte seu GitHub/GitLab
   - Selecione o repositório NeuroIA Lab

2. **Configure as Environment Variables**
   - Vá em Settings → Environment Variables
   - Adicione TODAS as variáveis listadas acima
   - Marque para Production, Preview e Development

3. **Build Settings** (já configurado no vercel.json)
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm run install:all`

### 3. Deploy Automático
- O Vercel fará deploy automático após configurar as variáveis
- O build pegará frontend e backend automaticamente

---

## 📁 Estrutura de Deploy

```
neuroai-lab/
├── vercel.json              # Configuração principal do Vercel
├── frontend/
│   ├── vercel.json         # Config específica do frontend
│   ├── package.json        # Build do React
│   └── dist/              # Output do build
└── backend/
    ├── src/index.ts       # API serverless
    └── package.json       # Dependências do backend
```

---

## ⚡ Funcionalidades Configuradas

### ✅ Backend API (Serverless Functions)
- Todas as rotas em `/api/*`
- Autenticação JWT + Supabase
- Integração OpenAI (14 assistentes)
- Webhook Asaas (pagamentos)

### ✅ Frontend (React SPA)
- Build otimizado com Vite
- Roteamento com React Router
- Supabase Auth integrado
- Tailwind CSS + componentes UI

### ✅ Segurança
- Headers de segurança configurados
- CORS configurado
- Rate limiting
- JWT validation

---

## 🔍 Verificação Pós-Deploy

### 1. Teste das APIs
```bash
# Health check
curl https://your-domain.vercel.app/api/

# Autenticação
curl https://your-domain.vercel.app/api/auth/me

# Assistentes
curl https://your-domain.vercel.app/api/assistants
```

### 2. Teste do Frontend
- Acesse `https://your-domain.vercel.app`
- Teste login/registro
- Verifique carregamento dos assistentes
- Teste funcionalidade de chat

### 3. Logs de Debug
- Vercel Dashboard → Functions
- Verifique logs de erro
- Monitor performance

---

## 🚨 Troubleshooting

### Erro de CORS
```bash
# Adicione/atualize no Vercel
CORS_ORIGIN=https://your-exact-domain.vercel.app
```

### Erro de Supabase
- Verifique se as chaves estão corretas
- Confirme RLS policies no Supabase
- Teste conexão local primeiro

### Erro de OpenAI
```bash
# Verifique se a chave é válida
OPENAI_API_KEY=sk-proj-...
# NÃO inclua OPENAI_ORGANIZATION se der erro 401
```

### Build Failures
- Verifique se `npm run build` funciona localmente
- Confirme todas as dependências no package.json
- Limpe cache do Vercel se necessário

---

## 🎯 Checklist Final

- [ ] Todas as variáveis de ambiente configuradas
- [ ] CORS_ORIGIN aponta para domínio correto
- [ ] JWT_SECRET é seguro (32+ chars)
- [ ] Supabase RLS policies ativas
- [ ] OpenAI API key válida
- [ ] Build local funciona
- [ ] Deploy sem erros
- [ ] Frontend carrega corretamente
- [ ] APIs respondem
- [ ] Autenticação funciona
- [ ] Chat com IAs funciona

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs no Vercel Dashboard
2. Teste localmente primeiro com `npm run dev`
3. Confirme todas as variáveis estão setadas
4. Verifique se domínio CORS está correto

**Deploy realizado com sucesso! 🎉**