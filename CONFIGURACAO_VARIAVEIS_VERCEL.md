# 🔧 Configuração Completa de Variáveis de Ambiente - Vercel

## 🚨 PROBLEMA ATUAL
**TODAS** as APIs estão retornando erro 500 "Configuração do servidor incompleta" porque as variáveis de ambiente não estão configuradas no Vercel.

## 📍 ONDE CONFIGURAR: VERCEL DASHBOARD (BACKEND)

⚠️ **IMPORTANTE**: As variáveis devem ser configuradas no **painel web do Vercel**, não no código!

### 🔗 **Acesso Direto**
1. **Dashboard**: https://vercel.com/dashboard
2. **Selecione**: projeto NeuroIA Lab
3. **Navegue**: Settings → Environment Variables

---

## 🔑 VARIÁVEIS OBRIGATÓRIAS PARA ADICIONAR

### 1. **SUPABASE (CRÍTICAS - SEM ELAS NADA FUNCIONA)**

```bash
# Nome da Variável: SUPABASE_URL
# Valor: https://avgoyfartmzepdgzhroc.supabase.co
SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co

# Nome da Variável: SUPABASE_SERVICE_ROLE_KEY
# Valor: [obter no dashboard Supabase - chave secreta]
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Nome da Variável: SUPABASE_ANON_KEY
# Valor: [obter no dashboard Supabase - chave pública]
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

#### **🔗 Como Obter as Chaves Supabase:**
1. **Acesse**: https://supabase.com/dashboard/project/avgoyfartmzepdgzhroc/settings/api
2. **Login** com sua conta Supabase
3. **Copie**:
   - **anon key** (public): Chave pública - pode ser exposta
   - **service_role key** (secret): Chave privada - NUNCA exponha

### 2. **OPENAI (PARA IAs FUNCIONAREM)**

```bash
# Nome da Variável: OPENAI_API_KEY
# Valor: sua chave da OpenAI (começa com sk-)
OPENAI_API_KEY=sk-proj-abcd1234efgh5678...

# Nome da Variável: OPENAI_ORGANIZATION (OPCIONAL)
# Valor: seu organization ID da OpenAI
OPENAI_ORGANIZATION=org-abcd1234efgh5678
```

#### **🔗 Como Obter Chave OpenAI:**
1. **Acesse**: https://platform.openai.com/api-keys
2. **Crie** nova chave se necessário
3. **Copie** a chave (começa com `sk-`)

### 3. **ASAAS (PARA PAGAMENTOS)**

```bash
# Nome da Variável: ASAAS_API_KEY
# Valor: sua chave da API Asaas
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojc3MDZhMDQyLTY5YWQtNDk5NC04OTU1LWZkNjJjYzg4ZTMyZTo6JGFhY2hfNmFjMGJlMzAtNDMxOC00NTY2LWExZGUtYWRlNGI0ZDI1Nzhl

# Nome da Variável: ASAAS_WEBHOOK_SECRET
# Valor: seu webhook secret do Asaas
ASAAS_WEBHOOK_SECRET=skjdaiosdajsdjaspjdiasjiadasijd
```

### 4. **SEGURANÇA E CONFIGURAÇÃO**

```bash
# Nome da Variável: JWT_SECRET
# Valor: string aleatória de 32+ caracteres
JWT_SECRET=sua-string-super-secreta-de-32-caracteres-ou-mais

# Nome da Variável: NODE_ENV
# Valor: production
NODE_ENV=production
```

#### **🔐 Como Gerar JWT_SECRET:**
Execute no terminal:
```bash
openssl rand -base64 32
```
Ou use qualquer gerador de string aleatória com 32+ caracteres.

---

## 📝 PASSO A PASSO DETALHADO

### **Passo 1: Acessar Vercel**
1. Vá para https://vercel.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto **NeuroIA Lab**

### **Passo 2: Navegar para Variáveis**
1. Clique em **Settings** (menu lateral esquerdo)
2. Clique em **Environment Variables**

### **Passo 3: Adicionar Cada Variável**
Para cada variável acima:

1. **Name**: Digite exatamente o nome (ex: `SUPABASE_URL`)
2. **Value**: Cole o valor correspondente
3. **Environments**: ✅ Marque **TODAS** as 3 opções:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**
4. **Clique em Save**

### **Passo 4: Redeploy Obrigatório**
⚠️ **CRÍTICO**: Após adicionar as variáveis:

1. Vá para **Deployments**
2. No deployment mais recente, clique nos **3 pontos (...)**
3. Selecione **Redeploy**
4. Aguarde o processo finalizar

---

## ✅ VERIFICAÇÃO E TESTE

### **1. Teste a API de Debug**
Após redeploy, acesse:
```
GET https://www.neuroialab.com.br/api/admin-check-env
```

**Resultado esperado:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "is_configured": true,
      "missing_critical": []
    }
  }
}
```

### **2. Teste as APIs Principais**
```
GET https://www.neuroialab.com.br/api/admin-institutions-simple?page=1&limit=20
```

**Deve retornar:** Dados das instituições sem erro 500.

### **3. Teste o Dashboard**
- Dashboard admin deve carregar sem erros
- Sistema ABPSI deve estar acessível em `/i/abpsi`

---

## 🚫 VARIÁVEIS QUE **NÃO** VAI NO VERCEL

Estas já estão configuradas no frontend e **NÃO** devem ser adicionadas no Vercel:

❌ `VITE_SUPABASE_URL` - (já no código frontend)
❌ `VITE_SUPABASE_ANON_KEY` - (já no código frontend)
❌ `VITE_API_BASE_URL` - (já no código frontend)

---

## 🆘 TROUBLESHOOTING

### **Se ainda der erro 500:**
1. ✅ Confirmou que **TODAS** as variáveis foram adicionadas?
2. ✅ Marcou **Production**, **Preview** E **Development**?
3. ✅ Fez **redeploy** após adicionar as variáveis?
4. ✅ Aguardou o deploy finalizar completamente?
5. ✅ Testou `/api/admin-check-env` para confirmar?

### **Se `/api/admin-check-env` ainda mostrar `is_configured: false`:**
- Verifique se os nomes das variáveis estão **exatamente** como listado
- Verifique se não há espaços extras nos valores
- Tente remover e readicionar a variável
- Faça novo redeploy

### **Logs de Debug:**
- Vercel Dashboard → Functions → View Function Logs
- Procure por mensagens de "Missing environment variables"

---

## 🎯 RESULTADO FINAL

Após configurar corretamente:

✅ **Todas as APIs** funcionam sem erro 500
✅ **Dashboard admin** carrega normalmente
✅ **Sistema ABPSI** acessível em `/i/abpsi`
✅ **IAs e pagamentos** funcionais
✅ **Todas funcionalidades** operacionais

---

## 📞 SUPORTE EXTRA

Se precisar de ajuda para obter alguma chave específica:

- **Supabase**: Entre no projeto e vá em Settings → API
- **OpenAI**: Vá em https://platform.openai.com/api-keys
- **Asaas**: Entre no painel e procure seção API
- **JWT**: Use `openssl rand -base64 32`

**Lembre-se**: Configuração no **Vercel Dashboard**, não no código!