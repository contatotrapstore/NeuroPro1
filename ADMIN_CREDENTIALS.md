# 🔐 NeuroIA Lab - Configuração de Administrador

## ⚠️ IMPORTANTE - CONFIGURAÇÃO NECESSÁRIA

**Este projeto não vem com credenciais pré-configuradas por segurança.**

Para configurar acesso administrativo, siga os passos abaixo:

---

## 1. Configuração no Supabase

### Criar Usuário Admin

1. **Acesse seu projeto no Supabase**: `https://supabase.com/dashboard`
2. **Navegue para**: Authentication → Users  
3. **Clique em**: "Add user" (adicionar usuário)
4. **Preencha os dados**:
   - Email: seu-email-admin@exemplo.com
   - Senha: SuaSenhaSegura123!
   - Email Confirmed: ☑️ (marcado)
   
5. **Configure User Metadata** (após criar o usuário):
```json
{
  "role": "admin",
  "is_admin": true,
  "permissions": [
    "admin_access",
    "user_management", 
    "subscription_management",
    "analytics_access"
  ]
}
```

---

## 2. URLs de Acesso

### Desenvolvimento Local
- **Painel Admin**: `http://localhost:5173/admin`
- **Login Admin**: `http://localhost:5173/admin/login`

### Produção (Vercel)
- **Painel Admin**: `https://seu-dominio.vercel.app/admin`
- **Login Admin**: `https://seu-dominio.vercel.app/admin/login`

---

## 3. Funcionalidades Admin Disponíveis

### ✅ Dashboard Principal
- **Estatísticas em tempo real**
  - Total de usuários registrados
  - Assinaturas ativas no sistema
  - Receita mensal calculada
  - Conversas recentes (últimas 48h)

### ✅ Gerenciamento de Usuários
- **Lista completa de usuários**
  - Filtros por status e data de registro
  - Paginação para grandes volumes
  - Detalhes de assinatura por usuário
  - Data do último acesso

### ✅ Controle de Assinaturas
- **Visualização detalhada**
  - Status de cada assinatura (ativa/cancelada/expirada)
  - Tipos (individual/pacote 3 IAs/pacote 6 IAs)
  - Valores e datas de expiração
  - Integração com gateway de pagamento

### ✅ Gerenciamento de Assistentes IA
- **Sistema completo de controle**
  - Adicionar/remover IAs para usuários específicos
  - Visualização de IAs ativas por usuário
  - Controle granular de acesso
  - Operações persistentes no banco de dados

---

## 4. Estrutura de Segurança

### Middleware de Autenticação
```typescript
// Localização: backend/src/middleware/admin.middleware.ts
export const requireAdmin = async (req, res, next) => {
  // ✅ Validação de token JWT obrigatória
  // ✅ Verificação de role admin
  // ✅ Controle de acesso via user_metadata
  // ✅ Proteção de todas as rotas admin
}
```

### Rotas Protegidas
Todas as rotas administrativas estão protegidas:
- `GET /api/admin/stats` - Dashboard e estatísticas
- `GET /api/admin/users` - Lista de usuários
- `GET /api/admin/subscriptions` - Controle de assinaturas
- `PUT /api/admin/users/:userId/assistants` - Gerenciar IAs
- `GET /api/admin/analytics` - Relatórios avançados

---

## 5. Configuração de Desenvolvimento

### Arquivo .env Backend
```bash
# Configuração necessária no backend/.env
JWT_SECRET=sua-chave-jwt-secreta-minimo-32-caracteres
SUPABASE_SERVICE_KEY=sua-chave-service-role-do-supabase
```

### Variáveis de Produção (Vercel)
Configure no dashboard do Vercel:
- `JWT_SECRET`: Chave segura para tokens
- `SUPABASE_SERVICE_KEY`: Chave service_role (não anon!)
- `CORS_ORIGIN`: Domínio do seu frontend

---

## 6. Troubleshooting Comum

### ❌ Erro: "Access denied" no admin
**Solução**: Verificar user_metadata no Supabase:
1. Usuário deve ter `role: "admin"`
2. Campo `is_admin: true` obrigatório

### ❌ Alterações de IA não salvam
**Solução**: Verificar SUPABASE_SERVICE_KEY:
1. Deve ser a chave `service_role`, não `anon`
2. Encontrada em: Supabase Dashboard > Settings > API

### ❌ Erro 401 "Unauthorized"
**Solução**: Problemas de autenticação:
1. Verificar se JWT_SECRET está configurado
2. Token pode estar expirado (fazer login novamente)
3. Usuário pode não ter permissões admin

---

## 7. Checklist de Configuração

- [ ] Criar usuário admin no Supabase Authentication
- [ ] Configurar user_metadata com role admin
- [ ] Definir JWT_SECRET seguro (32+ caracteres)
- [ ] Configurar SUPABASE_SERVICE_KEY correta
- [ ] Testar acesso ao painel admin
- [ ] Verificar operações de gerenciamento de usuários
- [ ] Confirmar persistência de alterações

---

## 8. Segurança em Produção

⚠️ **CRÍTICO para ambiente de produção**:

1. **Senhas complexas** (mínimo 12 caracteres)
2. **JWT_SECRET único** e aleatório por projeto
3. **HTTPS obrigatório** (configurado automaticamente no Vercel)
4. **CORS restritivo** (apenas seu domínio)
5. **Backup regular** dos dados do Supabase
6. **Monitoramento de acessos** admin

---

**Documentação atualizada**: Setembro 2025  
**Status**: Sistema de admin totalmente funcional  
**Nota**: Configure as credenciais antes do primeiro uso