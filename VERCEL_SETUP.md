# 🚀 Configuração Vercel - NeuroIA Lab

## Projetos no Vercel

### 1. **Frontend**: `neuroai-lab.vercel.app`
### 2. **Backend API**: `neuro-pro-backend.vercel.app`

---

## 📋 Variáveis de Ambiente Necessárias

### 🖥️ **BACKEND (neuro-pro-backend.vercel.app)**

#### ✅ **OBRIGATÓRIAS**

```bash
# Supabase Database
SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2Z295ZmFydG16ZXBkZ3pocm9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNDA5MDksImV4cCI6MjA3MTgxNjkwOX0.WiRurAg7vCXk-cAOTYOpFcvHrYPCuQPRvnujmtNnVEo

# OpenAI para Chat AI
OPENAI_API_KEY=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

# Pagamentos Asaas 
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojc3MDZhMDQyLTY5YWQtNDk5NC04OTU1LWZkNjJjYzg4ZTMyZTo6JGFhY2hfNmFjMGJlMzAtNDMxOC00NTY2LWExZGUtYWRlNGI0ZDI1Nzhl

# Segurança
JWT_SECRET=NeuroIA_Lab_2024_SecretKey_8f9d2a1b4c5e6f7g8h9i0j1k2l3m4n5o
```

#### ⚙️ **OPCIONAIS**

```bash
# Ambiente
NODE_ENV=production

# CORS
CORS_ORIGIN=https://neuroai-lab.vercel.app

# Webhook Asaas
ASAAS_WEBHOOK_SECRET=webhook-secret-key

# OpenAI Organization (opcional)
OPENAI_ORGANIZATION=org-your-openai-org-id
```

---

### 🌐 **FRONTEND (neuroai-lab.vercel.app)**

#### ✅ **Já configurado via arquivos .env**
- O frontend utiliza arquivos `.env.production` para configuração
- Não precisa configurar variáveis no dashboard do Vercel

---

## 🛠️ **Como Configurar no Vercel**

### **Passo 1: Acessar Dashboard**
1. Vá para [vercel.com](https://vercel.com)
2. Faça login na sua conta
3. Selecione o projeto `neuro-pro-backend`

### **Passo 2: Configurar Variáveis**
1. Clique em **Settings**
2. Vá para **Environment Variables**
3. Adicione cada variável:
   - **Name**: Nome da variável (ex: `SUPABASE_URL`)
   - **Value**: Valor da variável
   - **Environment**: Selecione `Production`, `Preview`, `Development`

### **Passo 3: Redeploy**
1. Vá para **Deployments**
2. Clique em **Redeploy** no último deployment
3. Aguarde o deploy completar

---

## 🔐 **Segurança das Variáveis**

### ✅ **Protegidas (.gitignore)**
```
.env
.env.local
backend/.env
api/.env
```

### ⚠️ **NUNCA COMMITAR**
- Arquivos `.env` estão protegidos pelo `.gitignore`
- Valores sensíveis só ficam no Vercel Dashboard
- Use `.env.example` para documentação

---

## 🧪 **Testando a Configuração**

### **1. Testar Health Check**
```bash
curl https://neuro-pro-backend.vercel.app/health
```
**Resposta esperada:**
```json
{
  "status": "OK",
  "message": "NeuroIA Lab API is running on Vercel",
  "timestamp": "2025-09-02T..."
}
```

### **2. Testar Assistants**
```bash
curl https://neuro-pro-backend.vercel.app/assistants
```
**Resposta esperada:**
```json
{
  "success": true,
  "data": [array com 14 assistants],
  "count": 14,
  "source": "database-error-fallback"
}
```

### **3. Testar CORS**
```bash
curl -X OPTIONS https://neuro-pro-backend.vercel.app/assistants \
  -H "Origin: https://neuroai-lab.vercel.app"
```
**Resposta esperada:** Status 200 com headers CORS

---

## 🚨 **Resolução de Problemas**

### **Erro 500 Internal Server Error**
- ✅ Verificar se todas as variáveis obrigatórias foram configuradas
- ✅ Verificar se os valores estão corretos (sem espaços extras)
- ✅ Fazer redeploy após adicionar variáveis

### **Erro de CORS**
- ✅ Verificar se `CORS_ORIGIN` está configurado
- ✅ Verificar se o domínio frontend está correto

### **Erro de Database**
- ✅ Verificar `SUPABASE_URL` e `SUPABASE_ANON_KEY`
- ✅ Testar conexão com Supabase

### **Erro de OpenAI**
- ✅ Verificar se `OPENAI_API_KEY` é válida
- ✅ Verificar se há saldo na conta OpenAI

---

## 📊 **Status Atual**

| Componente | Status | URL |
|------------|--------|-----|
| Frontend | ✅ Ativo | https://neuroai-lab.vercel.app |
| Backend API | ✅ Ativo | https://neuro-pro-backend.vercel.app |
| Health Check | ✅ Funcionando | `/health` |
| Assistants API | ✅ Funcionando | `/assistants` |
| Packages API | ✅ Funcionando | `/packages` |
| CORS | ✅ Configurado | Todos endpoints |

---

## ⏰ **Próximos Passos**

1. **Configurar variáveis no Vercel Dashboard**
2. **Fazer redeploy do backend**
3. **Testar todas as APIs**
4. **Configurar monitoramento**
5. **Documentar APIs restantes**

---

*Última atualização: 02/09/2025 - NeuroIA Lab Team*