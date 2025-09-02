# 🚀 Deployment Guide - NeuroIA Lab

Este documento contém todas as informações necessárias para o deployment da plataforma NeuroIA Lab em produção.

## 🌐 URLs de Produção

- **Frontend**: https://neuroai-lab.vercel.app
- **Backend API**: https://neuro-pro-backend.vercel.app
- **Status**: ✅ Totalmente operacional com chat em tempo real

## 📋 Configuração do Vercel

### Frontend (React + Vite)

**Configuração automática via `vercel.json`:**

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://neuro-pro-backend.vercel.app https://avgoyfartmzepdgzhroc.supabase.co;"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Comandos de Build:**
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `cd frontend && npm install`

### Backend (Node.js + Express)

**Estrutura para Serverless Functions:**

Localizado em `/api/` com configuração via `api/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/assistants",
      "dest": "/assistants.js"
    },
    {
      "src": "/health", 
      "dest": "/health.js"
    },
    {
      "src": "/subscriptions",
      "dest": "/subscriptions.js"
    }
  ]
}
```

## 🔐 Variáveis de Ambiente

### Frontend (neuroai-lab.vercel.app)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Configuration  
VITE_API_BASE_URL=https://neuro-pro-backend.vercel.app

# Environment
NODE_ENV=production
```

### Backend (neuro-pro-backend.vercel.app)

```bash
# Supabase Configuration
SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_ORGANIZATION=org-...

# Server Configuration
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=https://neuroai-lab.vercel.app

# Optional: Redis (se usando cache)
REDIS_URL=redis://...
```

## 🔨 Processo de Build

### Desenvolvimento Local

```bash
# Instalar dependências
npm run install:all

# Executar em desenvolvimento
npm run dev

# Build local para teste
npm run build
```

### Deploy Automático

1. **Push para repositório** (GitHub/GitLab)
2. **Vercel detecta mudanças** automaticamente
3. **Build executado** conforme configuração
4. **Deploy automático** para produção

### Deploy Manual via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod

# Deploy backend  
cd ../api
vercel --prod
```

## 🗄️ Configuração do Banco de Dados

### Supabase Setup

**URL**: https://avgoyfartmzepdgzhroc.supabase.co

**Tabelas principais:**
- `users` - Usuários do sistema
- `assistants` - 18 assistentes de IA especializados
- `conversations` - Conversas entre usuários e assistentes
- `messages` - Mensagens das conversas
- `user_subscriptions` - Assinaturas dos usuários

**Row Level Security (RLS):**
- ✅ Habilitado em todas as tabelas
- ✅ Políticas configuradas para isolamento por usuário
- ✅ Service key usada apenas no backend

### Migrações

```bash
# Executar migrações (se necessário)
npm run db:migrate
```

## 🔒 Configurações de Segurança

### Content Security Policy (CSP)

Configurado no `vercel.json` para permitir:
- **Scripts**: `'self' 'unsafe-inline' 'unsafe-eval'`
- **Estilos**: `'self' 'unsafe-inline'`
- **Conexões**: Supabase e Backend API
- **Imagens**: `'self' data: https:`

### CORS

```javascript
// Backend CORS configuration
const corsOptions = {
  origin: 'https://neuroai-lab.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

## 📊 Monitoramento

### Health Checks

- **Frontend**: https://neuroai-lab.vercel.app/health
- **Backend**: https://neuro-pro-backend.vercel.app/health

### Logs

```bash
# Vercel CLI - Visualizar logs
vercel logs [deployment-url]

# Supabase Dashboard
# Acesso via: https://app.supabase.com/project/avgoyfartmzepdgzhroc
```

## 🛠️ Troubleshooting

### Problemas Comuns

1. **CORS Errors**:
   - Verificar `CORS_ORIGIN` no backend
   - Confirmar CSP headers no frontend

2. **Supabase Connection**:
   - Verificar `SUPABASE_URL` e chaves
   - Confirmar RLS policies

3. **OpenAI API**:
   - Verificar `OPENAI_API_KEY`
   - Confirmar limites de rate limit

4. **Build Failures**:
   - Verificar dependências no `package.json`
   - Confirmar comandos de build

### Comandos Úteis

```bash
# Verificar status do deployment
vercel ls

# Ver logs em tempo real
vercel logs --follow

# Rollback para versão anterior
vercel rollback [deployment-url]

# Visualizar configuração atual
vercel env ls
```

## 📈 Performance

### Otimizações Implementadas

- **Frontend**:
  - Bundle splitting com Vite
  - Lazy loading de componentes
  - Cache de API responses
  - Compressão de assets

- **Backend**:
  - Rate limiting
  - Request queuing
  - Database query optimization
  - Redis caching (opcional)

### Métricas de Performance

- **First Contentful Paint**: < 2s
- **Largest Contentful Paint**: < 3s
- **Time to Interactive**: < 4s
- **Cumulative Layout Shift**: < 0.1

---

## 📞 Suporte

Para questões relacionadas ao deployment:

1. Verificar logs no Vercel Dashboard
2. Consultar documentação do Supabase
3. Revisar configurações de ambiente
4. Testar endpoints individualmente

**Última atualização**: 2025-09-02
**Versão**: v2.2.0 - Sistema de chat completo e operacional