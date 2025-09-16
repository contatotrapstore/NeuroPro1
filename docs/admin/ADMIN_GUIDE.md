# 🚀 Guia Completo do Painel Administrativo - NeuroIA Lab

## 📋 Visão Geral

Este guia consolida todas as informações necessárias para configurar, usar e manter o painel administrativo da plataforma NeuroIA Lab. O painel permite controle total sobre assistentes de IA, usuários, assinaturas e estatísticas da plataforma.

---

## 🎯 Funcionalidades Implementadas

- ✅ **Dashboard com estatísticas em tempo real**
- ✅ **Gerenciamento completo de assistentes (CRUD)**
- ✅ **Upload de ícones/imagens personalizados**
- ✅ **Organizador por áreas profissionais**
- ✅ **Gerenciamento de usuários e assinaturas**
- ✅ **Sistema de auditoria e logs**
- ✅ **Sincronização automática com frontend**
- ✅ **Autenticação segura com controle de roles**

---

## 🔧 Configuração Inicial

### 1. Obter Service Role Key do Supabase

**⚠️ PASSO CRÍTICO: Sem a Service Role Key correta, o painel não funcionará!**

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

### 2. Configurar Ambiente de Desenvolvimento

**No arquivo `api/.env`, linha 15:**
```env
# ANTES:
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# DEPOIS:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sua_chave_completa_aqui
```

### 3. Configurar Ambiente de Produção (Vercel)

1. **Acesse o Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Selecione o projeto NeuroIA Lab

2. **Configure Environment Variable:**
   - Settings > Environment Variables
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** `sua_service_role_key_completa_aqui`
   - **Environment:** Production (ou All)

3. **Redeploy:**
   - Deployments > Redeploy última versão

### 4. Executar Migrações do Banco

Execute no Supabase SQL Editor:

```sql
-- Verificar se tabela admin_audit_log existe
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'activate', 'deactivate')),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('assistant', 'user', 'subscription')),
    entity_id VARCHAR(100) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar bucket para upload de ícones
INSERT INTO storage.buckets (id, name, public)
VALUES ('assistant-icons', 'assistant-icons', true)
ON CONFLICT (id) DO NOTHING;

-- Política de upload para admins
CREATE POLICY IF NOT EXISTS "Admin can upload assistant icons" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'assistant-icons'
  AND auth.uid() IN (
    SELECT id FROM auth.users
    WHERE email IN ('admin@neuroialab.com', 'gouveiarx@gmail.com', 'psitales@gmail.com')
    OR raw_user_meta_data->>'role' = 'admin'
  )
);

-- Política de leitura pública
CREATE POLICY IF NOT EXISTS "Public can view assistant icons" ON storage.objects
FOR SELECT USING (bucket_id = 'assistant-icons');
```

### 5. Instalar Dependências

```bash
# Frontend
cd frontend
npm install react-colorful@^5.6.1

# Backend
cd api
npm install formidable@^3.5.2
```

---

## 👤 Usuários Admin Configurados

O sistema reconhece automaticamente estes emails como administradores:

- `admin@neuroialab.com`
- `gouveiarx@gmail.com`
- `psitales@gmail.com`

### Criar Novo Usuário Admin

1. **Criar conta:**
   - Acesse: https://neuroialab.com.br/signup
   - Use um dos emails admin listados acima
   - Confirme o email se necessário

2. **Configurar role (opcional):**
   - Supabase Dashboard > Authentication > Users
   - Encontre o usuário > Editar
   - User Metadata > Adicione:
     ```json
     {"role": "admin"}
     ```

---

## 🎮 Como Usar o Painel Admin

### Acesso

1. Faça login em: https://neuroialab.com.br/login
2. Use um email admin configurado
3. Navegue para `/admin`
4. Clique na aba "Gerenciar IAs"

### Dashboard Administrativo

**Estatísticas disponíveis:**
- Total de usuários registrados
- Assinaturas ativas
- Receita mensal calculada
- Conversas recentes
- Assistentes mais utilizados

### Gerenciamento de Assistentes

#### Criar Novo Assistente

1. **Clique em "Novo Assistente"**
2. **Informações básicas:**
   - **Nome**: Nome do assistente (max 100 caracteres)
   - **Descrição**: Descrição curta (max 1000 caracteres)
   - **Descrição Completa**: Detalhada (max 5000 caracteres)
   - **Área**: Psicologia, Psicopedagogia ou Fonoaudiologia
   - **Especialização**: Campo específico (max 100 caracteres)

3. **Configuração visual:**
   - **Ícone**: Upload de imagem ou ícone SVG
   - **Cor do Tema**: Seletor de cores hex (max 30 caracteres)

4. **Preços:**
   - **Mensal**: Valor em R$
   - **Semestral**: Valor em R$ (com desconto)

5. **Recursos (opcional):**
   - Lista de funcionalidades em JSON

#### Editar Assistente

1. Localize na lista de assistentes
2. Clique no ícone de edição ✏️
3. Modifique campos desejados
4. Salve as alterações

#### Upload de Ícones

**Formatos suportados:**
- PNG, JPG, JPEG, SVG, WEBP
- Tamanho máximo: 5MB
- Resolução recomendada: 256x256px

**Processo:**
1. No editor, clique em "Upload de Ícone"
2. Selecione arquivo
3. Sistema redimensiona automaticamente
4. URL salva em `icon_url`

### Gerenciamento de Usuários

- **Visualização**: Lista completa de usuários
- **Informações**: Email, status, assinaturas, última atividade
- **Estatísticas**: Uso por usuário e assistente preferido

### Sistema de Auditoria

Todas as ações administrativas são registradas automaticamente:

```sql
-- Visualizar logs recentes
SELECT
  al.*,
  u.email as admin_email,
  a.name as assistant_name
FROM admin_audit_log al
JOIN auth.users u ON al.admin_id = u.id
LEFT JOIN assistants a ON al.entity_id = a.id
ORDER BY al.created_at DESC
LIMIT 50;
```

---

## 🔍 Testes e Verificação

### 1. Teste Básico de Funcionamento

1. **Acesse:** https://neuroialab.com.br/admin
2. **Verifique se carrega:** Dashboard com dados reais
3. **Teste navegação:** Entre em "Gerenciar IAs"

### 2. Debug via Console

**Pressione F12 e procure por mensagens:**
- `📥 Carregando assistentes do admin...`
- `🔑 Admin Access Check`
- `✅` para sucessos
- `❌` para erros

### 3. Endpoint de Debug

**Acesse:** https://neuroialab.com.br/api/admin/debug

**Resposta esperada:**
```json
{
  "isAdmin": true,
  "userEmail": "gouveiarx@gmail.com",
  "hasServiceRole": true
}
```

### 4. Teste Completo de Funcionalidades

- ✅ Dashboard carrega estatísticas
- ✅ Lista de assistentes aparece
- ✅ Criar novo assistente funciona
- ✅ Editar assistente salva
- ✅ Upload de ícone processa
- ✅ Ativar/desativar alterna status
- ✅ Lista de usuários carrega

---

## 🚨 Solução de Problemas

### "Service Role Key não configurada"

**Sintomas:**
- Dashboard mostra "0 usuários, 0 assistentes"
- Lista de usuários vazia
- Erro 500 em operações admin

**Solução:**
1. Verifique se copiou a chave correta (service_role, não anon)
2. Confirme se não há espaços extras na variável
3. No Vercel, verifique se foi salva corretamente
4. Redeploy após alteração

### "Acesso negado" ou "401 Unauthorized"

**Verificações em ordem:**
1. **Service Role Key configurada?**
2. **Conta existe no sistema?**
   - Se não: https://neuroialab.com.br/signup
3. **Email está na lista de admins?**
   - Verificar: `admin@neuroialab.com`, `gouveiarx@gmail.com`, `psitales@gmail.com`
4. **Teste endpoint debug**
5. **Limpe cache/cookies**

### Upload de ícone não funciona

**Verificações:**
1. Bucket "assistant-icons" existe no Supabase?
2. Políticas de acesso configuradas?
3. Arquivo dentro do limite de 5MB?
4. Formato suportado (PNG, JPG, SVG, WEBP)?

### Assistentes não sincronizam com frontend

**Verificações:**
1. RLS policies permitem SELECT público?
2. Campo `is_active = true`?
3. Cache do navegador limpo?

---

## 🛡️ Sistema de Validação

### Proteção contra Erros de Caracteres

**Frontend:**
- Contadores visuais em tempo real
- Limites aplicados nos inputs
- Validação pré-envio

**Backend:**
- Validação de todos os campos
- Mensagens de erro específicas
- Limites centralizados

**Banco de Dados:**
- Campos com limites aumentados
- Constraints atualizadas

### Limites de Campos

```javascript
const FIELD_LIMITS = {
  id: 100,
  name: 100,
  area: 50,
  icon: 50,
  color_theme: 30,
  icon_type: 10,
  specialization: 100,
  description: 1000,
  full_description: 5000
};
```

---

## 📈 Sincronização Automática

### Cache Inteligente

- **TTL**: 60 segundos para dados dinâmicos
- **Invalidação**: Automática após modificações
- **Eventos**: Sistema de eventos para atualizações UI

### Fluxo de Sincronização

1. Admin modifica assistente
2. Cache é invalidado
3. Eventos são disparados
4. Componentes são atualizados
5. Store reflete alterações instantaneamente

---

## 📚 Referências Técnicas

### Arquivos Principais

- **Backend**: `api/admin.js` - Todas as rotas admin
- **Frontend**: `frontend/src/pages/AdminDashboard.tsx`
- **Serviços**: `frontend/src/services/adminService.ts`
- **Componentes**: `frontend/src/components/admin/`

### APIs Disponíveis

- `GET /api/admin/stats` - Estatísticas gerais
- `GET /api/admin/users` - Lista de usuários
- `GET /api/admin/assistants` - Lista de assistentes
- `POST /api/admin/assistants` - Criar assistente
- `PUT /api/admin/assistants/:id` - Atualizar assistente
- `DELETE /api/admin/assistants/:id` - Remover assistente
- `POST /api/upload-simple` - Upload de ícones
- `GET /api/admin/debug` - Debug de configuração

---

## 🔐 Segurança

### Controle de Acesso

```typescript
const isAdmin = user?.email === 'admin@neuroialab.com' ||
                user?.email === 'gouveiarx@gmail.com' ||
                user?.email === 'psitales@gmail.com' ||
                user?.user_metadata?.role === 'admin';
```

### Row Level Security (RLS)

- Leitura pública de assistentes ativos
- Modificação apenas por admins autenticados
- Auditoria protegida por policies específicas
- Upload de ícones restrito a admins

### Logs de Auditoria

Toda ação administrativa é registrada com:
- ID do admin executor
- Tipo de ação (create/update/delete)
- Dados antes e depois
- IP e User Agent
- Timestamp preciso

---

**🎉 Com este guia, o painel administrativo ficará 100% operacional!**

Para suporte adicional, verifique logs no Vercel Functions ou execute testes via endpoints de debug.