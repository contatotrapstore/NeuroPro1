# 🚀 Guia de Instalação Completa - Painel Administrativo NeuroIA Lab

## ✅ Status: TUDO PRONTO PARA INSTALAÇÃO

Este guia contém todos os passos para ativar o painel administrativo completo.

---

## 🔧 Passo 1: Executar Script SQL no Supabase

### 1.1 Acesso ao Supabase
1. Acesse: https://supabase.com/dashboard
2. Entre no projeto: `avgoyfartmzepdgzhroc`
3. Vá em **SQL Editor**

### 1.2 Executar Script
1. Abra o arquivo `setup_admin_complete.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor
4. Clique em **RUN** ▶️
5. Aguarde mensagens de sucesso:
   ```
   ✅ Todas as colunas da tabela assistants foram criadas com sucesso!
   ✅ Tabela admin_audit_log criada com sucesso!  
   ✅ Bucket assistant-icons configurado com sucesso!
   🎉 Setup do painel administrativo concluído com sucesso!
   ```

---

## 🔧 Passo 2: Instalar Dependências

### 2.1 Frontend
```bash
cd frontend
npm install react-colorful@^5.6.1
```

### 2.2 API
```bash
cd api  
npm install formidable@^3.5.2
```

---

## 🔧 Passo 3: Verificar Variáveis de Ambiente

### 3.1 Frontend (.env)
✅ **JÁ CONFIGURADO** - Verificar se contém:
```env
# Supabase Storage Configuration
VITE_SUPABASE_STORAGE_URL=https://avgoyfartmzepdgzhroc.supabase.co/storage/v1
VITE_STORAGE_BUCKET_ICONS=assistant-icons

# Admin Configuration  
VITE_ADMIN_EMAIL=admin@neuroia.lab
VITE_ADMIN_ROLE=admin

# Upload Configuration
VITE_MAX_FILE_SIZE=5242880
VITE_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/svg+xml,image/webp
```

### 3.2 API (.env)
✅ **JÁ CONFIGURADO** - Verificar se contém:
```env
# Admin Panel Configuration
ADMIN_EMAIL=admin@neuroia.lab
ADMIN_ROLE=admin

# Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/svg+xml,image/webp
SUPABASE_STORAGE_URL=https://avgoyfartmzepdgzhroc.supabase.co/storage/v1
STORAGE_BUCKET_ICONS=assistant-icons
```

---

## 🔧 Passo 4: Testar o Painel Admin

### 4.1 Fazer Deploy/Restart
1. **Frontend**: Deploy no Vercel ou restart local
2. **API**: Deploy no Vercel ou restart local

### 4.2 Acessar como Admin
1. Acesse: https://neuroai-lab.vercel.app/login
2. Entre com: `admin@neuroia.lab` (senha do admin)
3. Após login, acesse: `/admin`
4. Clique na aba **"Gerenciar IAs"** ⚙️

### 4.3 Testar Funcionalidades
- ✅ **Visualizar lista** de assistentes com filtros
- ✅ **Criar novo assistente** com botão "Nova IA"
- ✅ **Editar assistente** existente (ícone ✏️)
- ✅ **Upload de ícone** personalizado
- ✅ **Alterar cores** com color picker
- ✅ **Ativar/Desativar** assistentes
- ✅ **Ver estatísticas** (clique no ícone de gráfico)
- ✅ **Duplicar assistente** para criar variações
- ✅ **Filtrar por área** (Psicologia, Psicopedagogia, Fonoaudiologia)

---

## 🎯 Funcionalidades Disponíveis

### 📊 **Dashboard de Estatísticas**
- Contadores em tempo real
- Assistentes por área  
- Status de ativação
- Métricas individuais

### 🎨 **Editor Visual Completo**
- Upload de ícones (PNG, JPG, SVG, WEBP)
- Seletor de cores interativo
- Campos de texto completos
- Validação em tempo real

### 🔍 **Sistema de Filtros**
- Busca por nome/descrição
- Filtro por área profissional
- Filtro por status (ativo/inativo)
- Ordenação customizável

### 📝 **Auditoria Completa**
- Log de todas as ações
- Rastreamento de usuário admin
- Timestamps automáticos
- Histórico de alterações

### 🔄 **Sincronização Automática**
- Cache inteligente (TTL 60s)
- Eventos em tempo real
- Atualização automática da loja
- Sincronização com painéis de usuário

---

## 🎉 Verificações Finais

### ✅ Checklist de Funcionamento

#### Frontend
- [ ] Painel admin acessível em `/admin`
- [ ] Aba "Gerenciar IAs" visível
- [ ] Lista de assistentes carregando
- [ ] Filtros funcionando
- [ ] Modal de edição abrindo

#### Upload de Ícones
- [ ] Botão de upload presente
- [ ] Seleção de arquivo funcionando
- [ ] Preview da imagem aparecendo
- [ ] URL salva no banco de dados

#### Sincronização
- [ ] Criar assistente → aparece na loja imediatamente
- [ ] Editar nome → atualiza em toda a plataforma  
- [ ] Alterar cor → reflete nos cards
- [ ] Desativar → remove da loja

#### Segurança
- [ ] Apenas admin@neuroia.lab consegue acessar
- [ ] Upload protegido por autenticação
- [ ] Logs de auditoria sendo gravados

---

## 🚨 Solução de Problemas

### ❌ "Erro ao carregar assistentes"
**Solução**: Verificar se as migrações foram executadas no Supabase

### ❌ "Upload falhou"
**Solução**: Verificar se bucket `assistant-icons` foi criado no Storage

### ❌ "Acesso negado"  
**Solução**: Confirmar login com `admin@neuroia.lab`

### ❌ "Não sincronizando"
**Solução**: Verificar console do navegador por erros de cache

---

## 📞 Suporte

Se algum passo não funcionar:

1. ✅ **Verificar logs** no console do navegador
2. ✅ **Verificar SQL Editor** do Supabase por erros
3. ✅ **Confirmar variáveis** de ambiente
4. ✅ **Testar conexão** do Storage
5. ✅ **Limpar cache** do navegador

---

## 🎯 Resultado Esperado

Após seguir todos os passos, você terá:

- 🎮 **Painel admin completamente funcional**
- 🎨 **Controle total sobre todos os assistentes**
- 📊 **Estatísticas em tempo real**
- 🔄 **Sincronização automática com toda a plataforma**
- 📝 **Auditoria completa de todas as ações**
- 🔒 **Sistema seguro com controle de acesso**

**🚀 O painel administrativo está 100% pronto para uso em produção!**