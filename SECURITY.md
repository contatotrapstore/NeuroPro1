# 🔐 Guia de Segurança - NeuroIA Lab

## Visão Geral

Este documento estabelece as práticas de segurança, políticas de acesso e procedimentos para manter a plataforma NeuroIA Lab segura e protegida.

---

## 🛡️ Práticas de Segurança Implementadas

### Autenticação e Autorização

#### Supabase Auth
- **JWT Tokens**: Autenticação baseada em tokens seguros
- **Row Level Security (RLS)**: Controle de acesso no nível de linha
- **Session Management**: Gerenciamento seguro de sessões
- **Email Verification**: Verificação obrigatória de email

#### Role-Based Access Control
```typescript
// Verificação de admin
const isAdmin = user?.email === 'admin@neuroialab.com' ||
                user?.email === 'gouveiarx@gmail.com' ||
                user?.email === 'psitales@gmail.com' ||
                user?.user_metadata?.role === 'admin';
```

### Proteção de Dados

#### Variáveis de Ambiente
**✅ Configuração Segura:**
```env
# Nunca commit estas chaves!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
OPENAI_API_KEY=sk-proj-...
ASAAS_API_KEY=$aact_prod_...
JWT_SECRET=sua-chave-secreta-aleatoria
```

**❌ NUNCA faça:**
- Commit de arquivos `.env` para repositório
- Exposição de chaves em código frontend
- Hardcode de credenciais em arquivos

#### Rate Limiting
- Proteção contra ataques de força bruta
- Limite de tentativas de login
- Throttling de API calls

### Validação de Entrada

#### Frontend
- Validação de formulários com limites de caracteres
- Sanitização de inputs antes do envio
- Validação de tipos de arquivo para upload

#### Backend
```javascript
const validateFieldLengths = (data, fieldLimits) => {
  const errors = {};
  Object.keys(fieldLimits).forEach(field => {
    if (data[field] && typeof data[field] === 'string') {
      const value = data[field];
      const limit = fieldLimits[field];
      if (value.length > limit) {
        errors[field] = `Campo '${field}' excede limite`;
      }
    }
  });
  return { errors, isValid: Object.keys(errors).length === 0 };
};
```

---

## 🔑 Gerenciamento de Acesso

### Contas Administrativas

#### Emails Autorizados
- `admin@neuroialab.com` - Conta principal do sistema
- `gouveiarx@gmail.com` - Desenvolvedor principal
- `psitales@gmail.com` - Administrador da plataforma

#### Criação de Novas Contas Admin
1. **Criar usuário** via signup normal
2. **Verificar email** através do link recebido
3. **Configurar role** no Supabase Dashboard:
   ```json
   // User Metadata
   {"role": "admin"}
   ```
4. **Testar acesso** via endpoint de debug

### Permissões por Função

#### Admin
- ✅ Acesso ao painel administrativo
- ✅ CRUD completo de assistentes
- ✅ Upload de arquivos/ícones
- ✅ Visualização de logs de auditoria
- ✅ Gerenciamento de usuários
- ✅ Acesso a estatísticas financeiras

#### Usuário Regular
- ✅ Acesso aos assistentes assinados
- ✅ Chat com IAs
- ✅ Gerenciamento de perfil próprio
- ✅ Visualização de histórico próprio
- ❌ Acesso admin
- ❌ Dados de outros usuários

---

## 🏗️ Row Level Security (RLS)

### Políticas Implementadas

#### Tabela `assistants`
```sql
-- Leitura pública de assistentes ativos
CREATE POLICY "Assistants are viewable by everyone"
ON public.assistants FOR SELECT
USING (is_active = true);

-- Admins podem atualizar
CREATE POLICY "Admins can update assistants"
ON public.assistants FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.email IN ('admin@neuroialab.com', 'gouveiarx@gmail.com', 'psitales@gmail.com')
      OR auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
);
```

#### Tabela `user_subscriptions`
```sql
-- Usuários só veem suas próprias assinaturas
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions FOR SELECT
USING (auth.uid()::text = user_id);
```

#### Tabela `conversations`
```sql
-- Usuários só acessam suas próprias conversas
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (auth.uid()::text = user_id);
```

#### Tabela `admin_audit_log`
```sql
-- Apenas admins visualizam logs
CREATE POLICY "admin_audit_log_select_policy"
ON public.admin_audit_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.email IN ('admin@neuroialab.com', 'gouveiarx@gmail.com', 'psitales@gmail.com')
      OR auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
);
```

---

## 📁 Segurança de Upload

### Supabase Storage

#### Bucket `assistant-icons`
- **Público**: Leitura permitida para todos
- **Upload**: Restrito a admins
- **Tipos permitidos**: PNG, JPG, JPEG, SVG, WEBP
- **Tamanho máximo**: 5MB

```sql
-- Política de upload
CREATE POLICY "Admin can upload assistant icons"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assistant-icons'
  AND auth.uid() IN (
    SELECT id FROM auth.users
    WHERE email IN ('admin@neuroialab.com', 'gouveiarx@gmail.com', 'psitales@gmail.com')
    OR raw_user_meta_data->>'role' = 'admin'
  )
);
```

### Validação de Arquivos
```javascript
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
const MAX_FILE_SIZE = 5242880; // 5MB

const validateFile = (file) => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo muito grande');
  }
};
```

---

## 🔍 Auditoria e Monitoramento

### Logs de Auditoria

Todas as ações administrativas são registradas:

```javascript
// Registro automático de ações
await supabase
  .from('admin_audit_log')
  .insert({
    admin_id: user.id,
    action: 'update',
    entity_type: 'assistant',
    entity_id: assistantId,
    old_data: oldData,
    new_data: newData,
    changes: changes,
    ip_address: req.headers['x-forwarded-for'] || 'unknown',
    user_agent: req.headers['user-agent']
  });
```

### Campos Registrados
- **admin_id**: ID do usuário que executou a ação
- **action**: Tipo de ação (create, update, delete, etc.)
- **entity_type**: Tipo de entidade modificada
- **entity_id**: ID da entidade
- **old_data/new_data**: Estado antes e depois
- **changes**: Resumo das alterações
- **ip_address**: IP de origem
- **user_agent**: Navegador/client usado
- **created_at**: Timestamp da ação

### Consulta de Logs
```sql
-- Visualizar ações recentes
SELECT
  al.*,
  u.email as admin_email,
  a.name as assistant_name
FROM admin_audit_log al
JOIN auth.users u ON al.admin_id = u.id
LEFT JOIN assistants a ON al.entity_id = a.id
WHERE al.created_at >= NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC;
```

---

## 🚨 Procedimentos de Segurança

### Em Caso de Comprometimento

#### Chaves Comprometidas
1. **Rotacionar imediatamente** todas as chaves afetadas
2. **Atualizar** variáveis de ambiente
3. **Redeploy** aplicação
4. **Verificar logs** para atividades suspeitas
5. **Notificar** usuários se necessário

#### Acesso Não Autorizado
1. **Desativar** conta comprometida
2. **Verificar logs** de auditoria
3. **Identificar** extensão do comprometimento
4. **Corrigir** vulnerabilidades
5. **Restaurar** dados se necessário

### Backup e Recuperação

#### Dados Críticos
- **Backup automático** via Supabase (Point-in-time recovery)
- **Exportação regular** de dados de configuração
- **Versionamento** de migrações SQL
- **Backup de variáveis** de ambiente

#### Procedimento de Restore
1. **Identificar** ponto de recuperação
2. **Usar** Supabase Dashboard para restore
3. **Verificar** integridade dos dados
4. **Testar** funcionalidades críticas
5. **Documentar** incidente

---

## ✅ Checklist de Segurança

### Desenvolvimento
- [ ] Nunca commit credenciais no código
- [ ] Usar `.env` para variáveis sensíveis
- [ ] Validar todos os inputs do usuário
- [ ] Implementar rate limiting apropriado
- [ ] Usar HTTPS em produção
- [ ] Implementar CSP headers
- [ ] Logs de segurança configurados

### Produção
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] RLS policies ativas em todas as tabelas
- [ ] Backup automático funcionando
- [ ] Monitoramento de logs ativo
- [ ] SSL/TLS certificados válidos
- [ ] Domínios autorizados configurados

### Usuários
- [ ] Política de senhas seguras
- [ ] Verificação de email obrigatória
- [ ] Roles de usuário configuradas
- [ ] Auditoria de ações admin
- [ ] Sessões com timeout apropriado

---

## 📞 Contato para Questões de Segurança

Para relatar vulnerabilidades ou questões de segurança:

- **Email**: gouveiarx@gmail.com
- **Tipo**: [SECURITY] Vulnerabilidade NeuroIA Lab
- **Resposta**: Dentro de 24-48 horas

### Disclosure Responsável

1. **Reporte privadamente** via email
2. **Não divulgue** publicamente até correção
3. **Forneça detalhes** técnicos suficientes
4. **Aguarde confirmação** antes de disclosure
5. **Crédito** será dado se desejado

---

**🔐 A segurança é responsabilidade de todos - mantenha sempre as melhores práticas!**