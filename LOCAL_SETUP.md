# 🛠️ NeuroIA Lab - Guia de Instalação Local

## 📋 Pré-requisitos

### Software Necessário
- **Node.js 18+** - [Download aqui](https://nodejs.org)
- **npm** (incluído com Node.js) ou **yarn**
- **Git** - [Download aqui](https://git-scm.com/)

### Contas de Serviços
- **Supabase** (banco de dados) - [supabase.com](https://supabase.com)
- **OpenAI API** (IAs) - [platform.openai.com](https://platform.openai.com)
- **Asaas** (pagamentos - opcional) - [asaas.com](https://asaas.com)

---

## 🚀 Instalação Passo a Passo

### 1. Clone do Repositório
```bash
# Clone o projeto
git clone https://github.com/seu-usuario/neuroai-lab.git
cd neuroai-lab

# Verifique se está na pasta correta
ls -la  # Deve mostrar pastas: frontend/, backend/, etc.
```

### 2. Instalação de Dependências
```bash
# Instalar todas as dependências (frontend + backend)
npm run install:all

# OU instalar separadamente
cd frontend && npm install
cd ../backend && npm install
```

### 3. Configuração do Banco de Dados (Supabase)

#### 3.1 Criar Projeto Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Configure:
   - Nome: "neuroai-lab"
   - Região: "South America (São Paulo)"
   - Senha: Strong123!

#### 3.2 Obter Credenciais
1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL**: `https://[seu-id].supabase.co`
   - **anon key**: `eyJhbGciOi...`
   - **service_role key**: `eyJhbGciOi...` (privada!)

#### 3.3 Configurar Variáveis Backend
Edite `backend/.env`:
```bash
SUPABASE_URL=https://seu-projeto-id.supabase.co
SUPABASE_SERVICE_KEY=sua-service-role-key-aqui
SUPABASE_ANON_KEY=sua-anon-key-aqui
```

#### 3.4 Configurar Variáveis Frontend
Edite `frontend/.env`:
```bash
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 4. Configuração da OpenAI

#### 4.1 Obter Chave API
1. Acesse [platform.openai.com](https://platform.openai.com)
2. Vá em **API Keys**
3. Clique em "Create new secret key"
4. Copie a chave (começa com `sk-`)

#### 4.2 Configurar no Backend
Edite `backend/.env`:
```bash
OPENAI_API_KEY=sk-sua-chave-openai-aqui
```

### 5. Configurações de Segurança

#### 5.1 JWT Secret (Obrigatório)
Gere uma chave segura de 32+ caracteres:
```bash
# No backend/.env
JWT_SECRET=SuaChaveSecretaSuperSeguraComMaisDe32Caracteres123
```

#### 5.2 CORS Configuration
```bash
# No backend/.env
CORS_ORIGIN=http://localhost:5173
```

---

## 🎯 Executando o Projeto

### Método 1: Execução Completa
```bash
# Executa frontend E backend simultaneamente
npm run dev
```

### Método 2: Execução Separada
```bash
# Terminal 1 - Backend (porta 3000)
cd backend
npm run dev

# Terminal 2 - Frontend (porta 5173)  
cd frontend
npm run dev
```

### 🌐 URLs de Acesso
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Admin Panel**: http://localhost:5173/admin

---

## 👤 Configuração do Usuário Admin

### 1. Criar Conta no Frontend
1. Acesse http://localhost:5173
2. Clique em "Registrar"
3. Crie sua conta normalmente

### 2. Configurar Privilégios Admin
1. Vá no **Supabase Dashboard**
2. **Authentication** → **Users**
3. Encontre seu usuário
4. Clique em **editar**
5. Na seção **User Metadata**, adicione:
```json
{
  "role": "admin",
  "is_admin": true
}
```

### 3. Testar Acesso Admin
1. Faça login no frontend
2. Vá para `/admin`
3. Você deve ver o dashboard completo

---

## ⚡ Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev              # Frontend + Backend
npm run dev:frontend     # Apenas React (5173)
npm run dev:backend      # Apenas API (3000)
```

### Build e Deploy  
```bash
npm run build           # Build completo
npm run build:frontend  # Build apenas frontend
npm run build:backend   # Build apenas backend
```

### Utilitários
```bash
npm run lint            # Verificar código
npm run test            # Executar testes
npm run install:all     # Instalar todas dependências
```

---

## 🔧 Troubleshooting Comum

### ❌ "Port 3000 already in use"
**Solução**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [numero] /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### ❌ "Module not found"
**Solução**:
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# OU para todo projeto
rm -rf frontend/node_modules backend/node_modules
rm frontend/package-lock.json backend/package-lock.json
npm run install:all
```

### ❌ "Supabase connection failed"
**Solução**:
1. Verificar se SUPABASE_URL está correto
2. Verificar se as chaves estão corretas
3. Verificar se o projeto Supabase está ativo

### ❌ "OpenAI API error"
**Solução**:
1. Verificar se OPENAI_API_KEY está correto
2. Verificar se há créditos na conta OpenAI
3. Verificar se a chave tem permissões de API

### ❌ "Admin access denied"
**Solução**:
1. Verificar user_metadata no Supabase
2. Limpar localStorage e fazer login novamente
3. Verificar se JWT_SECRET está configurado

---

## 📚 Recursos Adicionais

### Documentação
- `README.md` - Visão geral do projeto
- `VERCEL_DEPLOY.md` - Guia de deploy
- `ADMIN_CREDENTIALS.md` - Configuração admin
- `TECHNICAL_DOCS.md` - Documentação técnica

### Estrutura de Arquivos
```
neuroai-lab/
├── frontend/           # React + Vite
│   ├── src/
│   ├── package.json
│   └── .env
├── backend/            # Node.js + Express
│   ├── src/
│   ├── package.json
│   └── .env
└── package.json        # Scripts principais
```

### Portas Padrão
- **Frontend**: 5173 (Vite)
- **Backend**: 3000 (Express)
- **Supabase**: HTTPS (externo)
- **OpenAI**: HTTPS (externo)

---

## ✅ Checklist de Configuração

- [ ] Node.js 18+ instalado
- [ ] Projeto clonado localmente
- [ ] Dependências instaladas (`npm run install:all`)
- [ ] Projeto Supabase criado
- [ ] Variáveis do Supabase configuradas
- [ ] Chave OpenAI obtida e configurada
- [ ] JWT_SECRET configurado (32+ chars)
- [ ] Usuário admin criado e configurado
- [ ] Ambos servidores rodando (`npm run dev`)
- [ ] Frontend acessível em localhost:5173
- [ ] Backend respondendo em localhost:3000/api
- [ ] Admin panel acessível e funcional

**🎉 Parabéns! Sua instalação local está completa!**

---

**Documentação atualizada**: Setembro 2025  
**Compatibilidade**: Node.js 18+, npm 8+  
**Suporte**: Consulte a documentação técnica para detalhes avançados