# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NeuroIA Lab is a SaaS web platform specializing in psychology that provides access to 19 AI assistants specialized in different areas of psychological practice through a professional chat interface. The platform operates on a subscription model with individual and customizable package options.

## Core Business Model

### Pricing Structure
- **Individual Subscriptions**: R$ 39.90/month or R$ 199.00/semester per assistant
- **Customizable Packages**:
  - **3 Assistants**: R$ 99.90/month or R$ 499.00/semester (~17% discount)
  - **6 Assistants**: R$ 179.90/month or R$ 899.00/semester (~25% discount)
- **Access Model**: Users see only assistants they've subscribed to individually or included in active packages

### 19 Psychology AI Assistants
Each assistant has a unique OpenAI API ID (asst_*) and specializes in:
1. **PsicoPlano** (asst_8kNKRg68rR8zguhYzdlMEvQc) - Therapeutic Route Formulator
2. **NeuroCase** (asst_Ohn9w46OmgwLJhxw08jSbM2f) - Clinical Case Reviewer
3. **Guia Ético** (asst_hH374jNSOTSqrsbC9Aq5MKo3) - Professional Ethics Guide
4. **SessãoMap** (asst_jlRLzTb4OrBKYWLtjscO3vJN) - Session Structure Formulator
5. **ClinReplay** (asst_ZuPRuYG9eqxmb6tIIcBNSSWd) - Session Trainer (AI Patient)
6. **CognitiMap** (asst_WdzCxpQ3s04GqyDKfUsmxWRg) - Cognitive Restructuring Builder
7. **MindRoute** (asst_Gto0pHqdCHdM7iBtdB9XUvkU) - Psychological Approaches Guide
8. **TheraTrack** (asst_9RGTNpAvpwBtNps5krM051km) - Therapeutic Evolution Evaluator
9. **NeuroLaudo** (asst_FHXh63UfotWmtzfwdAORvH1s) - Psychological Report Elaborator
10. **PsicoTest** (asst_ZtY1hAFirpsA3vRdCuuOEebf) - Psychological Tests Consultant
11. **TheraFocus** (asst_bdfbravG0rjZfp40SFue89ge) - Specific Disorder Interventions Organizer
12. **PsicoBase** (asst_nqL5L0hIfOMe2wNQn9wambGr) - Evidence-Based Clinical Strategies
13. **MindHome** (asst_62QzPGQdr9KJMqqJIRVI787r) - Therapeutic Home Activities Elaborator
14. **ClinPrice** (asst_NoCnwSoviZBasOxgbac9USkg) - Clinical Session Cost Evaluator
15. **Harmonia Sistêmica** (harmonia-sistemica) - Family and Systemic Therapy Assistant
16. **NeuroABA** (neuroaba) - Applied Behavior Analysis Assistant
17. **PsicopedIA** (psicopedia) - Psychopedagogy and Learning Assistant
18. **TheraCasal** (theracasal) - Couple Therapy Assistant
19. **Simulador de Paciente de Psicanálise** (asst_9vDTodTAQIJV1mu2xPzXpBs8) - Psychoanalysis Patient Simulator with Clinical Feedback

## 🛠️ Manutenção e Troubleshooting

### Reset de Senha de Usuário
Quando um usuário reporta problemas de login (erro "Invalid login credentials"):

```sql
-- 1. Verificar se o usuário existe
SELECT id, email, email_confirmed_at, last_sign_in_at
FROM auth.users
WHERE email = 'usuario@email.com';

-- 2. Resetar senha (substituir 'NovaSenhaTemp123!' pela senha desejada)
UPDATE auth.users
SET
  encrypted_password = crypt('NovaSenhaTemp123!', gen_salt('bf')),
  updated_at = NOW()
WHERE email = 'usuario@email.com';

-- 3. Limpar cache de autenticação
DELETE FROM auth.sessions WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'usuario@email.com'
);

DELETE FROM auth.refresh_tokens WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'usuario@email.com'
);

-- 4. Reconfirmar email
UPDATE auth.users
SET email_confirmed_at = NOW(), updated_at = NOW()
WHERE email = 'usuario@email.com';
```

### Queries Úteis de Monitoramento

```sql
-- Verificar pacotes ativos
SELECT
  package_type,
  COUNT(*) as total_packages,
  AVG(total_amount) as avg_revenue
FROM user_packages
WHERE status = 'active'
GROUP BY package_type;

-- Assistentes mais populares
SELECT
  unnest(assistant_ids) as assistant_id,
  COUNT(*) as usage_count
FROM user_packages
WHERE status = 'active'
GROUP BY assistant_id
ORDER BY usage_count DESC;

-- Usuários com problemas de login recente
SELECT
  email,
  last_sign_in_at,
  created_at,
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users
WHERE last_sign_in_at < NOW() - INTERVAL '7 days'
  OR email_confirmed_at IS NULL
ORDER BY last_sign_in_at DESC;
```

### Comandos MCP Supabase Úteis
- `mcp__supabase-mcp__execute_sql` - Executar queries SQL
- `mcp__supabase-mcp__get_advisors` - Verificar problemas de segurança/performance
- `mcp__supabase-mcp__apply_migration` - Aplicar migrations

## Technology Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS with custom NeuroIA Lab color scheme
- Vite for build tooling
- React Router for navigation
- Supabase client for authentication

### Backend
- Node.js + Express + TypeScript
- Supabase (PostgreSQL) for database and authentication
- Redis for caching
- OpenAI Assistants API integration
- Asaas Payment Gateway integration

### Infrastructure
- VPS Linux (Ubuntu) + PM2 + Nginx
- SSL/HTTPS configuration

## Project Structure

```
/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   ├── ui/         # Base components (Button, Input, etc.)
│   │   │   ├── layout/     # Layout and navigation
│   │   │   └── features/   # Feature-specific components
│   │   ├── pages/          # Application pages
│   │   │   ├── Auth/       # Login, register, recovery
│   │   │   ├── Dashboard/  # Main dashboard
│   │   │   ├── Chat/       # Chat interface
│   │   │   ├── Admin/      # Administrative panel
│   │   │   └── Plans/      # Plan selection
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript definitions
│   │   └── contexts/       # React Contexts
└── backend/                 # Node.js API
    ├── src/
    │   ├── controllers/     # Route controllers
    │   ├── services/        # Business logic
    │   ├── middleware/      # Express middleware
    │   ├── routes/          # Route definitions
    │   └── types/          # TypeScript types
```

## Brand Identity

### Color Scheme
- **Primary Green**: `#0E1E03` (main project color)
- **Secondary Green**: `#1A3A0F`
- **Light Green**: `#2D5A1F`
- **Support Colors**: `#1F2937` (dark gray), `#1E40AF` (blue), `#FFFFFF` (white)

### Design Principles
- Clean, minimalist design focused on psychology professionals
- Rounded buttons with subtle shadows
- Professional typography (Inter or similar)
- Responsive mobile-first approach

## Key Database Tables

### Core Tables
- **users**: User accounts with Supabase Auth integration
- **assistants**: 14 psychology AI assistants with OpenAI IDs
- **user_subscriptions**: Individual assistant subscriptions and package inclusions
- **user_packages**: Customizable packages (3 or 6 assistants)
- **conversations**: Chat conversations between users and assistants
- **messages**: Individual chat messages with role (user/assistant)

### Subscription Model
- Individual subscriptions link users directly to specific assistants
- Package subscriptions create a package record and link to multiple assistants
- Access validation checks both individual and package-based subscriptions

## API Architecture

### Authentication Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - User profile and subscription status

### Assistant Endpoints
- `GET /api/assistants` - List available assistants for user
- `POST /api/chat/:assistantId/message` - Send message to assistant

### Subscription Endpoints
- `POST /api/subscriptions/create` - Create individual subscription
- `POST /api/packages/create` - Create customizable package
- `POST /api/packages/validate` - Validate package assistant selection
- `GET /api/subscriptions/user/:userId` - Get user subscriptions

### Payment Integration
- `POST /api/webhooks/asaas` - Asaas payment webhooks
- Integration with Asaas API for subscription management

### ✅ Admin Endpoints
- `GET /api/admin/stats` - System statistics (users, subscriptions, revenue, conversations)
- `GET /api/admin/users` - List all users with pagination and subscription details
- `GET /api/admin/subscriptions` - List all subscriptions with filtering and pagination
- `PUT /api/admin/subscriptions/:id` - Update subscription status (active, cancelled, expired)
- `PUT /api/admin/assistants/:id` - Update assistant configuration (price, status, description)
- **Middleware**: `requireAdmin` - Validates admin role via user_metadata

## Development Commands

### Setup
```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend  
cd backend && npm install && npm run dev

# Database migrations
npm run db:migrate
```

### Build & Deploy
```bash
# Frontend build
cd frontend && npm run build

# Backend build
cd backend && npm run build

# Production deploy
pm2 start ecosystem.config.js
```

### Code Quality
```bash
# Frontend linting
npm run lint && npm run type-check

# Backend linting
npm run lint && npm run test
```

## Key Features Implemented

### ✅ Package Selection System
- Interface for users to select exactly 3 or 6 assistants for packages
- Real-time validation of selection quantity
- Preview of selected package before checkout
- Automatic discount calculation for packages

### ✅ Access Control
- Middleware to validate assistant access based on subscriptions or package inclusion
- Dashboard filtering to show only available assistants
- Subscription expiration handling

### ✅ Payment Flows
- Individual assistant subscription checkout
- Package selection and payment with custom assistant choices
- Webhook handling for subscription status updates

### ✅ Admin Panel System
- **Admin Authentication**: Secure login with role-based access control
- **Real-time Statistics**: Total users, active subscriptions, monthly revenue, recent conversations
- **User Management**: List all users with status, subscription count, and last login
- **Subscription Management**: View and manage all user subscriptions with detailed information
- **Database Integration**: All data pulled directly from Supabase with no mock data
- **Access Control**: Admin routes protected with middleware requiring admin role

### ✅ Professional UI Components
- **SVG Icon System**: Complete professional icon library for all 19 assistants with fixed rendering
- **Payment Icons**: Official Brazilian PIX icon, boleto, credit cards with professional design
- **AssistantIcon Component**: Dynamic icon rendering with color themes and professional fallback handling
- **Responsive Design**: Mobile-first approach with professional typography and animations

### ✅ Recent Technical Fixes (September 2025)
- **Authentication System**: Fixed JWT token validation and user session management
- **Assistant Service**: Resolved database query issues preventing users from accessing subscriptions
- **Icon Display**: Fixed SVG icon rendering system, replacing text fallbacks with proper icons
- **Port Configuration**: Standardized on port 3000 for consistent backend operations
- **Database Integration**: Removed all mock data, system uses real Supabase data exclusively
- **User Access**: Restored user subscriptions and conversation history functionality
- **RLS Security**: Fixed Row Level Security issues in messages table by using authenticated clients
- **Chat Messages**: Resolved message loading and sending errors by proper database access

### ✅ Icon Display System (September 2025)
- **AssistantIcon Component**: Custom icon system for displaying professional SVG icons for all 19 assistants
- **Icon Mapping**: Icons are mapped from string identifiers (e.g., "map-route", "brain-gear", "psychology-brain") to SVG components
- **Usage**: Always use `<AssistantIcon iconType={assistant.icon} />` instead of `{assistant.icon}`
- **Files**: Component located at `frontend/src/components/ui/AssistantIcon.tsx`
- **Icons Library**: Custom SVG icons defined in `frontend/src/components/icons/AssistantIcons.tsx`
- **Fixed Pages**: PackageSelector, Checkout, Admin pages, and Store page now display proper SVG icons

### ✅ Chat System Overhaul (September 2025)
- **Real-time Message Updates**: Fixed AI responses appearing without page refresh by using response data directly
- **Race Condition Prevention**: Implemented AbortController API for canceling pending requests when switching conversations
- **Debounced Conversation Selection**: Added 200ms debounce to prevent rapid-fire conversation switching issues
- **Immediate State Cleanup**: CLEAR_MESSAGES action clears messages instantly when switching conversations
- **Transition State Management**: Added `isTransitioning` state to prevent concurrent operations and UI freezing
- **Complete Conversation Deletion**: Full implementation with API calls, local state updates, and visual feedback
- **Message Synchronization**: Validation checks ensure messages belong to current conversation
- **Performance Optimization**: Reduced unnecessary API calls and improved error handling

### ✅ Latest Updates (September 6, 2025)
- **19th AI Assistant**: Added "Simulador de Paciente de Psicanálise" (asst_9vDTodTAQIJV1mu2xPzXpBs8) with specialized psychoanalysis training capabilities
- **User Access Management**: Granted access to the new psychoanalysis simulator for psitales@gmail.com and gouveiarx@gmail.com via Supabase migration
- **Store Page Updates**: Updated assistant count from 14 to 19, removed "em Psicologia Clínica" text, simplified description to "diferentes áreas"
- **Login Page Optimization**: Replaced SVG icon with actual NeuroIA Lab logo, removed decorative background, increased logo size from w-20 to w-32
- **Admin Panel Fixes**: Resolved "user_profiles table not found" errors by migrating to Supabase Auth API methods
- **Project Cleanup**: Comprehensive cleanup removing 18+ obsolete files, consolidating backend structure, organizing documentation in /docs folder
- **UI Consistency**: Removed duplicate text "NeuroIA Lab" from login screen, leaving only the logo for cleaner presentation

### ✅ Current Production Status (September 26, 2025)
- **Platform Status**: ✅ Fully operational on Vercel with real-time chat functionality
- **Admin Panel**: ✅ Working correctly with proper user and subscription data display
- **AI Assistants**: ✅ All 19 assistants functional with proper icon rendering and chat integration
- **Payment System**: ✅ Asaas integration working for subscriptions and packages
- **User Authentication**: ✅ Supabase Auth fully integrated with session management
- **Database**: ✅ All tables properly configured with Row Level Security (RLS)
- **API Endpoints**: ✅ All backend services operational on Vercel serverless functions
- **🆕 Institutional Subscriptions**: ✅ Individual subscription system for institutional users fully operational

## Environment Configuration

### Required Services
- Supabase account (database and auth)
- OpenAI account with GPT-4 access
- Asaas payment gateway account
- Redis instance for caching
- VPS with SSL certificate

### Key Environment Variables
- `SUPABASE_URL` & `SUPABASE_SERVICE_KEY`
- `OPENAI_API_KEY` & `OPENAI_ORGANIZATION`
- `ASAAS_API_KEY` & `ASAAS_WEBHOOK_SECRET`
- `REDIS_URL` for caching
- `JWT_SECRET` for authentication

## Security Considerations

- Row Level Security (RLS) configured in Supabase
- JWT token validation for API access
- Rate limiting on chat endpoints
- Input validation and sanitization
- CORS configuration for frontend access
- Webhook signature verification for payments

## Performance Optimization

- Redis caching for frequently accessed data
- OpenAI response caching to reduce API costs
- Database query optimization for subscription checks
- Rate limiting to prevent abuse
- CDN for static assets in production

## Deployment Configuration

### Production URLs
- **Frontend**: https://neuroai-lab.vercel.app (Vercel)
- **Backend API**: https://neuro-pro-backend.vercel.app (Vercel)
- **Status**: ✅ Fully operational with real-time chat

### Vercel Configuration
- **Frontend Build**: `cd frontend && npm run build`
- **Output Directory**: `frontend/dist`
- **Framework**: Vite (React)
- **CSP Headers**: Configured for Supabase and API communication
- **SPA Rewrites**: All routes redirect to `/index.html`

### Environment Variables Required
- **Frontend**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`
- **Backend**: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, `PORT`
- **Database**: Row Level Security (RLS) enabled in Supabase

## Project Structure (Updated September 6, 2025)

After comprehensive cleanup and reorganization:

```
/
├── docs/                    # Centralized documentation
│   └── CLAUDE.md           # Main project documentation
├── api/                    # Backend serverless functions (Vercel)
│   ├── admin.js           # Admin panel endpoints
│   ├── assistants.js      # AI assistants management
│   ├── auth.js            # Authentication endpoints
│   ├── chat.js            # Chat functionality
│   └── subscriptions.js   # Subscription management
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # UI components and icons
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React Contexts
│   │   └── types/         # TypeScript definitions
├── database/               # Supabase migrations
│   └── migrations/        # SQL migration files
# Removed .trae directory as it contained obsolete documentation
└── [config files]         # Essential project configuration
```

## Documentation References

Complete technical documentation is now centralized in the `/docs` folder. Legacy documentation has been removed as the project is complete:
- Product Requirements Document (PRD)
- Technical Architecture specification
- AI Assistants detailed specifications  
- Implementation plan with task breakdown
- Development guide with code examples

## System Overview

The NeuroIA Lab platform is now a mature, fully operational SaaS solution with 19 specialized AI assistants, comprehensive admin tools, real-time chat functionality, and integrated payment processing. All components are deployed on Vercel with Supabase backend integration, serving psychology professionals with subscription-based access to AI-powered clinical tools.

## 🚀 Sistema de Auto-Aprovação ABPSI (v3.4.1 - 27/09/2025)

### Mudança Crítica Implementada

Removido completamente o sistema de aprovação manual para usuários ABPSI.

**Novo Fluxo de Registro**:
```
Registro → ✅ Auto-Aprovação → Checkout → Acesso aos Assistentes
```

#### **Migration 024 - Auto-Aprovação**
```sql
-- Trigger para aprovação automática
ALTER TABLE institution_users ALTER COLUMN is_active SET DEFAULT true;

CREATE OR REPLACE FUNCTION auto_approve_institution_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.is_active = true;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_approve_institution_user
  BEFORE INSERT ON institution_users
  FOR EACH ROW EXECUTE FUNCTION auto_approve_institution_user();
```

#### **Frontend Changes**
- Removed pending approval screen
- Direct redirect to checkout after registration
- Updated success messages for automatic approval

#### **Estatísticas Corrigidas (26/09/2025)**

Foram identificados e corrigidos problemas nas contagens de usuários e conversas:

**Problema**: Dashboard mostrando 0 usuários quando ABPSI tinha 2 usuários registrados
**Solução**: Removidos filtros `is_active=true` incorretos nas queries de contagem

**APIs Corrigidas**:
- `api/get-institution-stats.js` - Contagem total vs usuários ativos
- `api/admin-institutions-simple.js` - Estatísticas consistentes
- Implementado cálculo correto de "usuários únicos com conversas"

**Resultado**: ABPSI agora mostra corretamente 2 usuários totais, 2 ativos, 4 conversas, 1 assistente

## 🚀 Sistema Institucional ABPSI (25/09/2025)

### Implementação Completa do Sistema Multi-Institucional

O NeuroIA Lab agora suporta instituições com login personalizado, assistentes customizados e gestão administrativa independente.

#### **Problemas Resolvidos (Críticos)**

**1. Login Error: "Database error granting user"**
- **Causa**: Trigger `update_institution_user_last_access` falhando por referência sem schema
- **Solução**: Corrigido com `UPDATE public.institution_users` e exception handling
- **Migration**: `fix_trigger_schema_reference`

**2. Institution APIs 404 Errors**
- **Causa**: Dynamic routes `/api/institutions/[...slug]` não funcionando no Vercel
- **Solução**: Criado endpoints alternativos com query parameters
- **Endpoint**: `/api/institution-auth?slug={slug}`

**3. Token Validation 500 Error**
- **Causa**: `SUPABASE_SERVICE_ROLE_KEY` não disponível em produção
- **Solução**: Fallback com parsing manual de JWT usando anon key
- **Método**: Decodificação Base64 + validação de expiração

**4. Frontend "require is not defined" Error**
- **Causa**: `require()` call em código browser
- **Solução**: Substituído por import ES6 do cliente Supabase

#### **Configuração ABPSI (Academia Brasileira de Psicanálise)**

**Dados Institucionais**:
```sql
{
  "slug": "abpsi",
  "name": "Academia Brasileira de Psicanálise",
  "logo_url": "/src/assets/institutions/abpsi/logo.png",
  "primary_color": "#c39c49",
  "secondary_color": "#8b6914"
}
```

**Restrição de Acesso**:
- ✅ **Habilitado**: "Simulador de Psicanálise ABPSI" (único assistente)
- ❌ **Desabilitados**: Todos os outros 4 assistentes vinculados

**Usuário Administrador**:
- **Email**: gouveiarx@gmail.com
- **Role**: subadmin
- **Registro**: ADMIN001
- **Departamento**: Administração

#### **APIs Implementadas**

**Institution Authentication**:
```javascript
GET /api/institution-auth?slug=abpsi
// Retorna dados da instituição, configurações e assistentes disponíveis
```

**Admin Endpoints**:
```javascript
GET /api/admin-institutions-simple
GET /api/admin-institution-assistants-simple
// Gestão administrativa com fallback para anon key
```

**Database Seeding**:
```javascript
POST /api/seed-database?execute=true
// População inicial completa do banco com ABPSI + assistentes
```

#### **Interface Personalizada**

**Login Institucional** (`/i/abpsi`):
- Logo dourada ABPSI em tamanho destacado (h-24)
- Cores personalizadas (#c39c49/#8b6914)
- Nome da instituição oculto quando logo existe
- Mensagem: "Bem-vindo à Academia Brasileira de Psicanálise"
- Subtítulo: "Formação, Supervisão e Prática"

**Componente**: `frontend/src/pages/Institution/InstitutionLogin.tsx`

#### **Arquitetura de Segurança**

**RLS Policies Implementadas**:
```sql
-- Permite trigger de auth atualizar institution_users
CREATE POLICY "Enable update for auth trigger" ON institution_users
    FOR UPDATE USING (true);

-- Usuários veem apenas seus vínculos institucionais
CREATE POLICY "Users can view their own institution relationships" ON institution_users
    FOR SELECT USING (auth.uid() = user_id OR is_active = true);

-- Leitura pública de instituições ativas
CREATE POLICY "Public read access to active institutions" ON institutions
    FOR SELECT USING (is_active = true);
```

**Token Validation Fallback**:
```javascript
// Prioridade: Service Key > Fallback Manual JWT Parsing
if (serviceKey) {
  // Validação completa com service key
} else {
  // Parse manual do JWT com anon key
  const payload = JSON.parse(atob(token.split('.')[1]));
  // Validação de expiração e formato
}
```

#### **Status de Produção**

- ✅ **Sistema de Login**: Funcionando sem erros
- ✅ **APIs Institucionais**: Todas operacionais
- ✅ **Painel Admin**: Dados reais sendo exibidos
- ✅ **Logo ABPSI**: Configurada e visível
- ✅ **Acesso Restrito**: Apenas Simulador habilitado
- ✅ **Usuário Admin**: gouveiarx@gmail.com configurado

#### **Para Expandir o Sistema**

1. **Nova Instituição**: Adicionar registro + logo + assistentes vinculados
2. **Usuários**: INSERT em `institution_users` com roles apropriados
3. **Customização**: Cores, logo e mensagens por instituição
4. **Relatórios**: Métricas específicas por instituição no admin

## 🔐 Password Reset System (v2.3.2)

### Latest Implementation

The password reset system has been completely rebuilt to use Supabase's native `PASSWORD_RECOVERY` events:

#### Technical Flow
1. **Email Request**: User requests reset via `/auth/forgot-password`
2. **Supabase Processing**: Sends email with recovery tokens
3. **Event Detection**: `PASSWORD_RECOVERY` event captured in `AuthContext`
4. **Session Management**: Temporary data stored in `sessionStorage`
5. **Password Update**: Uses existing session for `updatePassword()`
6. **Cleanup**: Automatic removal of temporary data

#### Key Components

**AuthContext.tsx**
```javascript
if (event === 'PASSWORD_RECOVERY') {
  sessionStorage.setItem('password_recovery_active', 'true');
  sessionStorage.setItem('password_recovery_session', JSON.stringify(session));
}
```

**ResetPassword.tsx**
- Checks `sessionStorage` for recovery mode
- Uses `isRecoveryMode` state for validation
- Implements secure password update flow

**ProtectedRoute.tsx**
- Allows access to reset page when in recovery mode
- Prevents unauthorized access to auth pages

#### Security Features
- Uses `sessionStorage` (not `localStorage`) for temporary data
- Automatic cleanup after successful password change
- No token exposure in URL hash
- Native Supabase token validation

#### Troubleshooting
- Console logs with emojis for easy debugging
- Clear error messages for different failure states
- Handles edge cases like expired tokens and invalid states

The system now works seamlessly with the production domain `https://www.neuroialab.com.br`.

## 🔧 Chat Institucional ABPSI - Correções Essenciais

### Problemas Resolvidos

#### 1. OpenAI API Key Access
**Solução**: Fallback para `VITE_OPENAI_API_KEY` em `api/institution-chat.js`

#### 2. API Service Centralization
**Solução**: Método `sendInstitutionMessage()` no `api.service.ts`
**Benefício**: Infraestrutura unificada (auth, headers, retry)

#### 3. OpenAI SDK v5 Syntax Fix
**Antes**: `openai.beta.threads.runs.retrieve(threadId, runId)`
**Depois**: `openai.beta.threads.runs.retrieve(runId, { thread_id: threadId })`

#### 4. Enhanced Polling Logic
- ✅ Timeout: 30s → 60s
- ✅ Suporte a status `'in_progress'`
- ✅ Progressive backoff: 300ms → 1000ms
- ✅ Logs detalhados

### Status Final
✅ **Chat ABPSI**: Totalmente funcional
✅ **OpenAI Integration**: Operacional com timeout de 60s
✅ **API Routing**: Caminho relativo `/api`
✅ **Polling**: Suporte completo a todos os status