# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NeuroIA Lab is a SaaS web platform specializing in psychology that provides access to 14 AI assistants specialized in different areas of psychological practice through a professional chat interface. The platform operates on a subscription model with individual and customizable package options.

## Core Business Model

### Pricing Structure
- **Individual Subscriptions**: R$ 39.90/month or R$ 199.00/semester per assistant
- **Customizable Packages**:
  - **3 Assistants**: R$ 99.90/month or R$ 499.00/semester (~17% discount)
  - **6 Assistants**: R$ 179.90/month or R$ 899.00/semester (~25% discount)
- **Access Model**: Users see only assistants they've subscribed to individually or included in active packages

### 14 Psychology AI Assistants
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
- **SVG Icon System**: Complete professional icon library for all 14 assistants
- **Payment Icons**: Official Brazilian PIX icon, boleto, credit cards with professional design
- **AssistantIcon Component**: Dynamic icon rendering with color themes and fallback handling
- **Responsive Design**: Mobile-first approach with professional typography and animations

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

## Documentation References

Complete technical documentation is available in `.trae/documents/`:
- Product Requirements Document (PRD)
- Technical Architecture specification
- AI Assistants detailed specifications  
- Implementation plan with task breakdown
- Development guide with code examples

The system is designed as a comprehensive SaaS platform for psychology professionals, with a focus on specialized AI assistants and flexible subscription models.