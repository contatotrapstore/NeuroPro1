# 🎯 Guia Completo de Configuração do Admin - NeuroIA Lab

## 🚨 Problema Principal
O painel administrativo não funciona porque a **Service Role Key** do Supabase não está configurada.

## ✅ Correções Aplicadas
- ✅ Melhorado sistema de validação e logs
- ✅ Corrigido CRUD completo de assistentes
- ✅ Adicionado tratamento de erros específicos  
- ✅ Melhorado upload de ícones
- ✅ ID de assistente agora é gerado automaticamente
- ✅ Validações de campos obrigatórios

## 🔧 Passo a Passo para Configurar

### **Passo 1: Obter a Service Role Key**

1. **Acesse o Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/avgoyfartmzepdgzhroc
   - Faça login na sua conta

2. **Navegue para Settings > API:**
   - Menu lateral: Settings
   - Submenu: API

3. **Copie a Service Role Key:**
   - Na seção "Project API Keys"
   - Procure por **"service_role (secret)"**
   - ⚠️ **NÃO use a "anon (public)" key!**
   - Clique em "Copy" ou "Reveal"

### **Passo 2: Configurar no Desenvolvimento**

1. **Abra o arquivo `api/.env`**
2. **Substitua a linha 15:**
   ```env
   # ANTES:
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
   
   # DEPOIS:  
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sua_chave_completa_aqui
   ```

3. **Salve o arquivo**

### **Passo 3: Configurar no Vercel (Produção)**

1. **Acesse o Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Selecione o projeto NeuroIA Lab

2. **Vá para Settings > Environment Variables:**
   - Tab "Settings" 
   - Seção "Environment Variables"

3. **Adicione a variável:**
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** `sua_service_role_key_completa_aqui`
   - **Environment:** Production (ou All)

4. **Clique em "Save"**

5. **Redeploy o projeto:**
   - Vá para a aba "Deployments"
   - Clique nos 3 pontinhos da última deploy
   - Selecione "Redeploy"

### **Passo 4: Configurar Usuário Admin (Se Necessário)**

Você pode usar qualquer um desses emails como admin:
- `admin@neuroialab.com` 
- `admin@neuroia.lab`
- `gouveiarx@gmail.com`
- `psitales@gmail.com`

Se precisar criar o usuário `admin@neuroia.lab`:

1. **Crie a conta:**
   - Acesse: https://neuroai-lab.vercel.app/signup
   - Use o email: `admin@neuroia.lab`
   - Confirme o email

2. **Configure role admin (Opcional):**
   - Supabase Dashboard > Authentication > Users
   - Encontre o usuário > Clique para editar
   - User Metadata > Adicione:
     ```json
     {"role": "admin"}
     ```

### **Passo 5: Testar o Funcionamento**

1. **Acesse o admin:**
   - https://neuroai-lab.vercel.app/login
   - Faça login com `gouveiarx@gmail.com`
   - Navegue para `/admin`

2. **Se não funcionar, teste o endpoint de debug:**
   - Acesse: https://neuroai-lab.vercel.app/api/admin/debug
   - Isso mostrará informações detalhadas sobre sua conta
   - Verifique se `isAdmin: true` aparece na resposta

3. **Verifique se sua conta existe:**
   - Se receber erro 401, a conta precisa ser criada primeiro
   - Vá para https://neuroai-lab.vercel.app/signup
   - Crie conta com `gouveiarx@gmail.com`
   - Confirme o email se necessário

4. **Teste as funcionalidades:**
   - ✅ Dashboard com estatísticas
   - ✅ Lista de usuários
   - ✅ Lista de assistentes
   - ✅ Criar novo assistente
   - ✅ Editar assistente existente
   - ✅ Upload de ícone personalizado
   - ✅ Ativar/Desativar assistente
   - ✅ Excluir assistente (soft delete)

## 🎮 Funcionalidades Disponíveis

### **Dashboard Admin**
- Estatísticas em tempo real
- Contadores de usuários, assinaturas, conversas
- Receita mensal calculada automaticamente

### **Gerenciamento de Assistentes**
- **Criar:** Novos assistentes com ID auto-gerado
- **Editar:** Todos os campos incluindo preços e configurações
- **Upload:** Ícones personalizados (PNG, JPG, SVG)
- **Organizar:** Ordem de exibição configurável
- **Status:** Ativar/desativar assistentes
- **Excluir:** Soft delete com validação de assinaturas ativas

### **Gerenciamento de Usuários**
- Lista de usuários com dados de assinatura
- Informações de atividade e última utilização
- Estatísticas de uso por usuário

### **Logs de Auditoria**
- Todas as ações admin são registradas
- Histórico de alterações com before/after
- IP e user agent para segurança

## 🐛 Solução de Problemas

### **"Service Role Key não configurada"**
- Verifique se copiou a chave correta (service_role, não anon)
- Confirme se não há espaços extras na chave
- No Vercel, verifique se a variável foi salva corretamente

### **"Acesso negado" ou "Nada muda ao logar"**
- **Primeira verificação:** Service Role Key configurada?
- **Segunda verificação:** Conta `gouveiarx@gmail.com` existe no sistema?
  - Se não existe, crie em: https://neuroai-lab.vercel.app/signup
  - Confirme o email se solicitado
- **Terceira verificação:** Teste o debug endpoint
  - https://neuroai-lab.vercel.app/api/admin/debug
  - Deve mostrar `"isAdmin": true` se tudo estiver correto
- **Quarta verificação:** Limpe cache e cookies do navegador
- **Quinta verificação:** Tente em aba anônima/privada

### **Dashboard mostra "0 usuários, 0 assistentes"**
- Service Role Key não está funcionando
- Verifique logs no Vercel Functions para detalhes
- Execute o endpoint de seed se necessário: `/api/admin/seed`

### **Upload de ícone não funciona**
- Verifique se o storage bucket "assistant-icons" existe no Supabase
- Confirme permissões do bucket (deve permitir public read)
- Tamanho máximo: 5MB

### **Assistentes não aparecem no frontend**
- Verifique se a tabela `assistants` tem dados
- Confirme se RLS policies permitem SELECT public
- Execute as migrações SQL se necessário

## 🔍 Logs e Debug

### **Para ver logs em produção:**
1. Vercel Dashboard > Functions
2. Clique em `/api/admin`
3. "View Function Logs"
4. Procure por mensagens começando com 🔑, ✅, ❌

### **Para debug local:**
- Os logs aparecem no terminal onde roda `npm run dev`
- Ative `DEBUG=true` no .env para logs mais verbosos

## 📞 Suporte

Se ainda não funcionar após seguir todos os passos:

1. **Verifique logs detalhados**
2. **Confirme todas as variáveis de ambiente**
3. **Teste endpoints diretamente via Postman/curl**
4. **Execute migrações SQL pendentes**

---

## 🚀 Com essas configurações, o painel administrativo ficará 100% funcional!

### **Funcionalidades que voltarão a funcionar:**
- 📊 Dashboard com dados reais
- 👥 Lista de usuários carregando
- 🎮 CRUD completo de assistentes
- 🎨 Upload de ícones operacional
- 📝 Logs de auditoria
- 🔄 Sincronização em tempo real