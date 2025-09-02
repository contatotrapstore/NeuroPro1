# NeuroIA Lab

Uma plataforma SaaS especializada em psicologia que oferece acesso a 14 assistentes de inteligência artificial especializados em diferentes áreas da prática psicológica.

## 🧠 Sobre o Projeto

A NeuroIA Lab democratiza o acesso a assistentes de IA especializados em psicologia para apoiar profissionais da área em suas práticas clínicas e administrativas.

### Público-alvo
- Psicólogos
- Estudantes de psicologia
- Clínicas e profissionais da saúde mental

### Modelo de Negócio
- **Assinatura Individual**: R$ 39,90/mês ou R$ 199,00/semestre por assistente
- **Pacotes Personalizáveis**:
  - 3 Assistentes: R$ 99,90/mês ou R$ 499,00/semestre
  - 6 Assistentes: R$ 179,90/mês ou R$ 899,00/semestre

## 🤖 14 Assistentes Especializados

1. **PsicoPlano** - Formulador de Roteiro Terapêutico
2. **NeuroCase** - Revisor de Quadro Clínico
3. **Guia Ético** - Avaliação Profissional e Autorreflexão
4. **SessãoMap** - Formulador de Estrutura de Sessão
5. **ClinReplay** - Treinador de Sessão (IA paciente)
6. **CognitiMap** - Construtor de Caminhos de Reestruturação Cognitiva
7. **MindRoute** - Orientador de Abordagens Psicológicas
8. **TheraTrack** - Avaliador de Evolução Terapêutica
9. **NeuroLaudo** - Elaborador de Laudo Psicológico
10. **PsicoTest** - Consultor de Testes Psicológicos
11. **TheraFocus** - Organizador de Intervenções para Transtornos Específicos
12. **PsicoBase** - Formulador de Estratégias Clínicas Baseadas em Evidências
13. **MindHome** - Elaborador de Atividades Domiciliares Terapêuticas
14. **ClinPrice** - Avaliador de Custos de Sessões Clínicas

## 🛠️ Stack Tecnológica

### Frontend
- React 18 + TypeScript
- Tailwind CSS with custom NeuroIA Lab theme
- Vite for build tooling
- React Router with protected routes
- Supabase Client for auth and database
- Professional SVG icon system
- Responsive mobile-first design

### Backend
- Node.js + Express + TypeScript
- Supabase (PostgreSQL + Auth + RLS)
- OpenAI Assistants API integration
- Asaas Payment Gateway (Brazilian payments)
- Redis caching for performance
- Comprehensive admin API endpoints

### Admin Panel
- **Secure Admin Dashboard** with real-time statistics
- **User Management** - Complete user oversight and management
- **Subscription Control** - Full subscription lifecycle management  
- **Revenue Tracking** - Real-time financial analytics
- **Role-based Access** - Admin authentication and authorization
### Infraestrutura
- VPS Linux (Ubuntu)
- PM2
- Nginx
- SSL/HTTPS

## 🚀 Como Executar

### Instalação
```bash
# Instalar todas as dependências
npm run install:all

# Configurar variáveis de ambiente
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Executar em modo desenvolvimento
npm run dev
```

### Scripts Disponíveis
- `npm run dev` - Executa frontend e backend
- `npm run build` - Build completo do projeto
- `npm run dev:frontend` - Apenas frontend
- `npm run dev:backend` - Apenas backend

## 📁 Estrutura do Projeto

```
/
├── frontend/          # Aplicação React
├── backend/           # API Node.js
├── .trae/            # Documentação técnica
├── CLAUDE.md         # Guia para Claude Code
└── package.json      # Configuração do monorepo
```

## 🎨 Identidade Visual

### Paleta de Cores
- **Verde Principal**: `#0E1E03`
- **Verde Secundário**: `#1A3A0F`
- **Verde Claro**: `#2D5A1F`
- **Cinza Escuro**: `#1F2937`
- **Azul de Apoio**: `#1E40AF`

## 📄 Documentação

A documentação técnica completa está disponível em `.trae/documents/`:
- PRD (Product Requirements Document)
- Arquitetura Técnica
- Especificação dos Assistentes
- Plano de Implementação
- Guia de Desenvolvimento

## 🔐 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS)
- Validação de JWT tokens
- Rate limiting
- Validação de input
- CORS configurado

## 📈 Funcionalidades Principais

### ✅ Implementado
- **Sistema de autenticação seguro** via Supabase
- **Chat profissional** com 14 assistentes especializados via OpenAI
- **Assinaturas individuais** e **pacotes personalizáveis** (3 ou 6 assistentes)
- **🆕 Painel administrativo completo** com dados em tempo real
- **Sistema de pagamentos** integrado com Asaas (PIX, boleto, cartão)
- **Dashboard responsivo** e intuitivo com design profissional
- **🆕 Ícones SVG profissionais** para todos os assistentes
- **🆕 Interface admin** para gerenciamento de usuários e assinaturas

### 🔧 Admin Panel (Novo!)
- **Dashboard estatístico** com métricas em tempo real
- **Gerenciamento de usuários** - visualização e controle de contas
- **Controle de assinaturas** - status, tipos, valores e datas
- **Análise financeira** - receita mensal e total de conversões
- **Autenticação segura** com role-based access control

**Credenciais Admin:**
- Email: `admin@neuroialab.com`
- Senha: `Admin123!@#`
- URL: `/admin`

## 🚀 Chat System Improvements (September 2025)
- **Real-time Updates**: Fixed AI responses appearing instantly without page refresh
- **Race Condition Prevention**: Implemented AbortController to cancel pending requests
- **Conversation Switching**: Added 200ms debounce to prevent rapid-fire switching issues
- **Message Synchronization**: Immediate message clearing when switching conversations
- **State Management**: Added `isTransitioning` state to prevent concurrent operations
- **Conversation Deletion**: Complete implementation with visual feedback and confirmation
- **Error Handling**: Improved error management for chat operations
- **Performance**: Optimized message loading and sending processes

## 🌐 URLs de Produção
- **Frontend**: https://neuroai-lab.vercel.app
- **Backend API**: https://neuro-pro-backend.vercel.app
- **Status**: ✅ Totalmente operacional com chat em tempo real

## 🏗️ Status do Desenvolvimento

O projeto está em desenvolvimento ativo seguindo um plano de implementação em 5 fases:

1. ✅ **Fase 1**: Configuração e Infraestrutura - COMPLETA
2. ✅ **Fase 2**: Autenticação e Base do Sistema - COMPLETA
3. ✅ **Fase 3**: Sistema de Assistentes e Chat - COMPLETA
4. ✅ **Fase 4**: Sistema de Pagamentos - COMPLETA
5. ✅ **Fase 5**: Painel Administrativo e Finalização - COMPLETA

**Status Atual**: 🎉 **PROJETO COMPLETO** - Todas as funcionalidades implementadas e operacionais

---

**NeuroIA Lab** - Democratizando o acesso a assistentes de IA especializados em psicologia.