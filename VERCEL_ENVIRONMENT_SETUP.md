# Configuração de Variáveis de Ambiente no Vercel

## 🚨 Problema Atual
As APIs estão retornando erro 500 "Configuração do servidor incompleta" porque as variáveis de ambiente necessárias não estão configuradas no Vercel.

## 📋 Variáveis Obrigatórias

### 1. **Supabase Configuration (CRÍTICAS)**
- **SUPABASE_URL**: `https://avgoyfartmzepdgzhroc.supabase.co`
- **SUPABASE_SERVICE_ROLE_KEY**: Chave de serviço do Supabase (secret key)
  - *Alternativa: SUPABASE_SERVICE_KEY (mesmo valor)*

### 2. **OpenAI Configuration (Para IAs)**
- **OPENAI_API_KEY**: Sua chave da API OpenAI
- **OPENAI_ORGANIZATION**: ID da organização OpenAI (opcional)

### 3. **Payment Gateway - Asaas (Para pagamentos)**
- **ASAAS_API_KEY**: Chave da API Asaas
- **ASAAS_WEBHOOK_SECRET**: Secret para webhooks Asaas

## 🔧 Como Configurar no Vercel

### Passo 1: Acessar Dashboard
1. Vá para https://vercel.com/dashboard
2. Selecione o projeto **NeuroIA Lab**
3. Clique em **Settings** no menu lateral

### Passo 2: Configurar Variáveis
1. Clique em **Environment Variables**
2. Para cada variável necessária:
   - **Name**: Nome exato da variável (ex: `SUPABASE_URL`)
   - **Value**: Valor da variável
   - **Environments**: Selecione **Production**, **Preview** e **Development**
3. Clique em **Save**

### Passo 3: Redeploy
1. Após adicionar todas as variáveis, vá para **Deployments**
2. Clique nos três pontos (...) no deployment mais recente
3. Selecione **Redeploy**

## 🔍 Verificação

### Teste as APIs:
1. **Check Environment**: `GET /api/admin-check-env`
   - Verifica se as variáveis estão configuradas
   - Não expõe valores sensíveis

2. **Test Institution API**: `GET /api/admin-institutions-simple?page=1&limit=20`
   - Se configurado corretamente, deve retornar dados das instituições
   - Se não configurado, retorna erro detalhado

## 🎯 Valores Necessários

### Para Supabase (CRÍTICO):
```
SUPABASE_URL=https://avgoyfartmzepdgzhroc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SUA_CHAVE_DE_SERVICO_SUPABASE]
```

**Como obter a chave de serviço:**
1. Acesse https://supabase.com/dashboard
2. Selecione projeto **NeuroIA Lab**
3. Vá em **Settings** → **API**
4. Copie a **service_role key** (não a anon key)

### Para OpenAI (Para IAs funcionarem):
```
OPENAI_API_KEY=[SUA_CHAVE_OPENAI]
OPENAI_ORGANIZATION=[SEU_ORG_ID_OPENAI]
```

### Para Asaas (Para pagamentos):
```
ASAAS_API_KEY=[SUA_CHAVE_ASAAS]
ASAAS_WEBHOOK_SECRET=[SEU_WEBHOOK_SECRET]
```

## ⚠️ Importante

1. **Nunca commite** essas variáveis no código
2. **Use Production values** para o ambiente de produção
3. **Service Role Key** tem permissões administrativas - mantenha segura
4. **Redeploy é obrigatório** após adicionar variáveis
5. **Teste sempre** após configurar

## 🐛 Debug

Se ainda houver problemas após configurar:

1. **Verifique logs**: Vá em **Functions** → **View Function Logs**
2. **Teste debug API**: `GET /api/admin-check-env`
3. **Verifique se redeployou** após adicionar variáveis
4. **Confirme valores** estão corretos (sem espaços extras)

## ✅ Resultado Esperado

Após configurar corretamente:
- ✅ `/api/admin-check-env` retorna `is_configured: true`
- ✅ `/api/admin-institutions-simple` retorna dados das instituições
- ✅ Dashboard admin funciona sem erros 500
- ✅ Sistema ABPSI acessível em `/i/abpsi`