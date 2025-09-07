# 🛠️ Guia de Correção do Painel Admin - NeuroIA Lab

## 🚨 Problema Identificado
O painel admin não está funcionando devido a:
1. **Service Role Key incorreta** no arquivo `api/.env`
2. **Email admin inconsistente** entre frontend e backend

## ✅ Correções Já Aplicadas
- ✅ Adicionado `admin@neuroia.lab` na lista de admins da API
- ✅ Corrigido nome da variável para `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Corrigido email `psitales@gmail.com` na lista de admins

## 🔑 Ação Necessária: Obter Service Role Key

### Passo 1: Acessar Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Entre no projeto: **NeuroIA Lab** (`avgoyfartmzepdgzhroc`)

### Passo 2: Obter Service Role Key
1. Vá em **Settings** → **API**
2. Na seção **Project API Keys**, copie a chave **`service_role (secret)`**
3. ⚠️ **NÃO use a `anon (public)` key!**

### Passo 3: Atualizar Arquivos
1. **No arquivo `api/.env`**, linha 11:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=cole_sua_service_role_key_aqui
   ```

2. **No Vercel Dashboard** (para produção):
   - Vá em **Settings** → **Environment Variables**
   - Adicione: `SUPABASE_SERVICE_ROLE_KEY` = sua service role key
   - **Deploy** novamente

### Passo 4: Criar Usuário Admin (Opcional)
Se quiser usar `admin@neuroia.lab`:
1. Acesse: https://neuroai-lab.vercel.app/signup
2. Crie conta com: `admin@neuroia.lab`
3. Confirme o email
4. No Supabase → **Authentication** → **Users**
5. Edite o usuário → **User Metadata** → Adicione:
   ```json
   {"role": "admin"}
   ```

## 🧪 Testar Funcionamento

### Opção A: Usar admin@neuroialab.com
1. Acesse: https://neuroai-lab.vercel.app/login
2. Entre com: `admin@neuroialab.com` (já tem role admin)
3. Vá para: `/admin` → **Gerenciar IAs**

### Opção B: Usar admin@neuroia.lab
1. Crie o usuário (Passo 4 acima)
2. Acesse: https://neuroai-lab.vercel.app/login
3. Entre com: `admin@neuroia.lab`
4. Vá para: `/admin` → **Gerenciar IAs**

## ✅ Funcionalidades que Voltarão a Funcionar

Após aplicar a service role key correta:
- 📊 **Dashboard com estatísticas reais**
- 👥 **Lista de usuários carregando**
- 🎮 **Edição de assistentes funcionando**
- 🎨 **Upload de ícones operacional**
- 📝 **Logs de auditoria gravando**
- 🔄 **Sincronização em tempo real**

## 🚨 Problemas Conhecidos Resolvidos

### ❌ Antes:
```
Dashboard: 0 usuários, 0 assistentes
Lista de usuários: vazia
Editar assistentes: erro 403/500
```

### ✅ Depois:
```
Dashboard: dados reais carregando
Lista de usuários: funcionando
Editar assistentes: CRUD completo
```

## 📞 Suporte

Se ainda não funcionar após seguir os passos:

1. **Verificar logs no Vercel**:
   - Functions → `/api/admin` → View Function Logs
   - Procurar por `Admin Access Check` nos logs

2. **Verificar no navegador**:
   - F12 → Network → Calls para `/api/admin/*`
   - Verificar se retorna 403 (acesso negado) ou 401 (não autorizado)

3. **Confirmar service role key**:
   - No Supabase Dashboard → Settings → API
   - Copiar novamente a **service_role (secret)** key

---

**🎯 Com essas correções, o painel administrativo ficará 100% funcional!**