# Admin Panel - Credenciais de Acesso

## 🔐 Informações de Login

**Email:** `admin@neuroialab.com`  
**Senha:** `Admin123!@#`

## 🚀 Como Acessar

1. Acesse a aplicação no browser
2. Navegue para `/admin`
3. Utilize as credenciais acima
4. Será redirecionado automaticamente para `/admin/dashboard`

## 📋 Funcionalidades Disponíveis

### Dashboard Overview
- **Total de Usuários**: Contagem real de usuários cadastrados
- **Assinaturas Ativas**: Total de assinaturas ativas no sistema
- **Receita Mensal**: Soma dos valores das assinaturas mensais
- **Conversas Recentes**: Total de conversas do último mês

### Gerenciamento de Usuários
- Lista completa de usuários com informações detalhadas:
  - Nome e email
  - Data de cadastro
  - Status (Ativo/Inativo)
  - Número de assinaturas
  - Último login

### Gerenciamento de Assinaturas
- Lista completa de assinaturas com:
  - Usuário associado
  - Assistente contratado
  - Tipo (Mensal/Semestral)
  - Status (Ativo/Cancelado/Expirado)
  - Data de expiração
  - Valor da receita

### Configurações do Sistema
- Área para futuras configurações administrativas
- Gerenciamento de parâmetros do sistema

## 🔒 Segurança

- **Autenticação**: Login obrigatório com credenciais específicas
- **Autorização**: Verificação de role admin via user_metadata
- **Middleware**: Proteção em todas as rotas administrativas
- **Sessão**: Controle de sessão via Supabase Auth

## 🛠️ Tecnologias Utilizadas

### Frontend
- React + TypeScript
- Tailwind CSS
- React Router
- Lucide React (ícones)

### Backend
- Node.js + Express
- Middleware de autenticação
- Middleware de autorização admin
- Integração com Supabase

### Banco de Dados
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Auth integrado

## 📝 Observações Importantes

1. **Primeira Execução**: Se a conta admin não existir, ela será criada automaticamente na primeira tentativa de login
2. **Dados Reais**: Todos os dados exibidos são reais do banco de dados, sem mock
3. **Responsivo**: Interface adaptada para desktop e mobile
4. **Atualização**: Dados atualizados em tempo real a cada acesso

---

**⚠️ Mantenha estas credenciais seguras e não compartilhe publicamente!**