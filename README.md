# NeuroIA Lab

Uma plataforma SaaS especializada em saúde mental que oferece acesso a 19 assistentes de inteligência artificial especializados em diferentes áreas da prática psicológica, incluindo as novas áreas de **Neuromodulação** e **Terapia Ocupacional**.

**🚀 Versão Atual**: v3.2.0 - Sistema de Pacotes Completo e Funcional

## ✅ Status do Sistema
- 🟢 **Frontend**: 100% funcional
- 🟢 **Backend**: 100% funcional
- 🟢 **Autenticação**: 100% funcional
- 🟢 **Chat/Assistentes**: 100% funcional
- 🟢 **Sistema de Pacotes**: 100% funcional ✨ NOVO
- 🟢 **Pagamentos PIX**: 100% funcional
- 🟡 **Pagamentos Cartão**: Temporariamente desabilitado (em correção)
- 🟢 **Webhooks Asaas**: 100% funcional
- 🟢 **Deploy Vercel**: 100% funcional

> **⚠️ Nota**: Cartão de crédito temporariamente indisponível devido a problema de autorização. PIX funcionando perfeitamente. Ver `PAYMENT_STATUS_2025.md` para detalhes.

## 🧠 Sobre o Projeto

A NeuroIA Lab democratiza o acesso a assistentes de IA especializados em psicologia para apoiar profissionais da área em suas práticas clínicas e administrativas.

### Público-alvo
- **Psicólogos** e **Psicopedagogos**
- **Fonoaudiólogos** especializados
- **Profissionais de Neuromodulação**
- **Terapeutas Ocupacionais**
- **Estudantes** das áreas de saúde mental
- **Clínicas** e centros de reabilitação

### Modelo de Negócio
- **Assinatura Individual**: R$ 39,90/mês ou R$ 199,00/semestre por assistente
- **Pacotes Personalizáveis** ✨ **NOVO**:
  - **3 Assistentes**: R$ 99,90/mês ou R$ 499,00/semestre (economia de 17%)
  - **6 Assistentes**: R$ 179,90/mês ou R$ 899,00/semestre (economia de 25%)
  - **Sistema Inteligente**: Validação automática de seleção e duplicatas
  - **Flexibilidade Total**: Escolha qualquer combinação de assistentes

## 🎯 Áreas Especializadas

A NeuroIA Lab atende **5 áreas distintas** da saúde mental e reabilitação:

### 🧠 **Psicologia** (Área Principal)
- Assistentes para todas as abordagens terapêuticas
- Elaboração de laudos e avaliações
- Treinamento e simulação clínica

### 📚 **Psicopedagogia**
- Assistentes especializados em dificuldades de aprendizagem
- Avaliação e intervenção psicopedagógica
- Estratégias educacionais personalizadas

### 🗣️ **Fonoaudiologia**
- Assistentes para distúrbios da comunicação
- Avaliação e terapia da linguagem
- Reabilitação audiológica

### ⚡ **Neuromodulação** (NOVO!)
- Assistentes especializados em estimulação cerebral
- Protocolos de neurofeedback
- Terapias de neuroestimulação

### 🖐️ **Terapia Ocupacional** (NOVO!)
- Assistentes para reabilitação funcional
- Adaptações e tecnologia assistiva
- Integração sensorial e atividades de vida diária

## 🤖 19 Assistentes Especializados

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
15. **Harmonia Sistêmica** - Assistente de Terapia Familiar e Sistêmica
16. **NeuroABA** - Assistente de Análise do Comportamento Aplicada
17. **PsicopedIA** - Assistente de Psicopedagogia e Aprendizagem
18. **TheraCasal** - Assistente de Terapia de Casal
19. **Simulador de Paciente de Psicanálise** - Simulador com Feedback Clínico

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

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn
- Conta no Supabase (banco de dados)
- Chave OpenAI API (para IAs)
- Conta Asaas (pagamentos - opcional)

### Instalação Rápida
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/neuroai-lab.git
cd neuroai-lab

# Instalar todas as dependências
npm run install:all

# Configurar variáveis de ambiente (já pré-configuradas!)
cp backend/.env.example backend/.env  # (opcional, já está configurado)
cp frontend/.env.example frontend/.env  # (opcional, já está configurado)

# Executar em modo desenvolvimento
npm run dev
```

### Scripts Disponíveis
- `npm run dev` - Executa frontend (5173) e backend (3000)
- `npm run build` - Build completo para produção
- `npm run dev:frontend` - Apenas frontend React
- `npm run dev:backend` - Apenas backend API

## ✅ Status da Plataforma

### 🌐 Produção
- **URL**: https://www.neuroialab.com.br
- **Status**: ✅ Online e funcionando
- **Autenticação**: ✅ Login, registro e reset de senha funcionando
- **Chat com IAs**: ✅ Todos os 19 assistentes operacionais
- **Pagamentos**: ✅ Integração Asaas ativa
- **Admin Panel**: ✅ Painel administrativo completo

### 🔐 Sistema de Reset de Senha
- **Status**: ✅ Completamente reformulado (v2.3.2)
- **Fluxo**: Uso correto de eventos PASSWORD_RECOVERY do Supabase
- **UX**: Interface intuitiva e feedback claro
- **URLs**: Domínio principal www.neuroialab.com.br

### ⚡ Start Rápido
Depois de clonar:
```bash
npm run install:all && npm run dev
```
Acesse: `http://localhost:5173`

## 🚀 Deploy no Vercel

### Configuração Automática
O projeto está pré-configurado para deploy no Vercel:

1. **Fork/Clone** este repositório
2. **Conecte** ao Vercel Dashboard
3. **Configure variáveis** de ambiente no Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` 
   - `SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - `JWT_SECRET`
   - `ASAAS_API_KEY`
4. **Deploy automático** ✨

### Arquivos de Configuração
- ✅ `vercel.json` - Configuração principal
- ✅ `VERCEL_DEPLOY.md` - Guia detalhado
- ✅ Variáveis de ambiente pré-configuradas

**Resultado**: Aplicação completa rodando em produção!

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

### 🎯 **Acesso Rápido**
- **[📚 Índice Mestre](docs/INDEX.md)** - Central de toda a documentação
- **[👨‍⚕️ Manual do Usuário](docs/user/README.md)** - Guia para profissionais de saúde
- **[🚀 Primeiros Passos](docs/user/getting-started.md)** - Setup em 5 minutos
- **[💻 API Documentation](docs/api/README.md)** - Referência completa da API

### 🏗️ **Documentação Técnica**
- **[🏛️ System Architecture](docs/architecture/README.md)** - Arquitetura do sistema
- **[🗄️ Database Schema](docs/architecture/database-schema.md)** - Modelo de dados
- **[⚙️ Admin Guide](docs/admin/ADMIN_GUIDE.md)** - Painel administrativo
- **[🔧 Deploy Instructions](DEPLOY_INSTRUCTIONS.md)** - Deploy no Vercel
- **[📋 CHANGELOG](CHANGELOG.md)** - Histórico de versões

### 📚 **Por Área de Especialização**
- **🧠 Psicologia**: 14 assistentes especializados
- **📚 Psicopedagogia**: Dificuldades de aprendizagem
- **🗣️ Fonoaudiologia**: Distúrbios da comunicação
- **⚡ Neuromodulação**: Estimulação cerebral (NOVO!)
- **🖐️ Terapia Ocupacional**: Reabilitação funcional (NOVO!)

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
- **🆕 Acesso público sem login obrigatório** - Navegação livre na loja e dashboard
- **Chat profissional** com 14 assistentes especializados via OpenAI
- **Assinaturas individuais** e **pacotes personalizáveis** (3 ou 6 assistentes)
- **🆕 Painel administrativo completo** com dados em tempo real e sincronização de preços
- **Sistema de pagamentos** integrado com Asaas (PIX, boleto, cartão)
- **Dashboard responsivo** e intuitivo com design profissional
- **🆕 Ícones SVG profissionais** para todos os assistentes
- **🆕 Interface admin** para gerenciamento de usuários e assinaturas
- **🆕 Sistema de validação robusto** - Proteção completa contra erros de caracteres

### 🔧 Admin Panel (Novo!)
- **Dashboard estatístico** com métricas em tempo real
- **Gerenciamento de usuários** - visualização e controle de contas
- **Controle de assinaturas** - status, tipos, valores e datas
- **Análise financeira** - receita mensal e total de conversões
- **Autenticação segura** com role-based access control

**Acesso Admin:**
- URL: `/admin`
- Emails autorizados: Consulte `docs/admin/ADMIN_GUIDE.md`
- Configuração: Veja documentação completa em `docs/admin/`

### 🌐 Sistema de Acesso Público (Janeiro 2025)
- **Navegação Livre**: Usuários podem explorar loja e dashboard sem login obrigatório
- **Modal de Autenticação**: Sistema elegante que aparece apenas quando necessário
- **Preservação de Intenção**: Após login, executa automaticamente a ação pretendida
- **Experiência Suave**: Transição sem interrupções entre acesso público e autenticado
- **Rotas Inteligentes**: Sistema diferencia automaticamente conteúdo público vs protegido

### 💰 Sincronização de Preços (Janeiro 2025)
- **Preços Dinâmicos**: Sistema agora usa preços diretamente do banco de dados
- **Sincronização Admin-Store**: Alterações no painel admin refletem instantaneamente na loja
- **Cache Invalidation**: Atualização automática de preços em tempo real
- **Fim dos Hardcoded**: Removidos todos os valores fixos do código

### 🛡️ Sistema de Validação Robusto (Janeiro 2025)
- **Proteção 3 Camadas**: Validação no frontend, backend e banco de dados
- **Contadores Visuais**: Indicadores de caracteres em tempo real nos formulários
- **Limites Aumentados**: Campos do banco expandidos para suportar nomes longos
- **Mensagens Específicas**: Erros claros e informativos para o usuário
- **Zero Erros de Caracteres**: Nunca mais "value too long for type character varying"

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
- **Site Principal**: https://neuroialab.com.br
- **Backend API**: https://neuro-pro-backend-phi.vercel.app
- **Status**: ✅ Totalmente operacional com chat em tempo real

## 🏗️ Status do Desenvolvimento

**✅ PROJETO COMPLETO E FUNCIONAL - Janeiro 2025**

Todas as 6 fases foram implementadas com sucesso:

1. ✅ **Fase 1**: Configuração e Infraestrutura - *Completa*
2. ✅ **Fase 2**: Autenticação e Base do Sistema - *Completa*
3. ✅ **Fase 3**: Sistema de Assistentes e Chat - *Completa*
4. ✅ **Fase 4**: Sistema de Pagamentos - *Completa*
5. ✅ **Fase 5**: Painel Administrativo e Finalização - *Completa*
6. ✅ **Fase 6**: Acesso Público e Otimizações - *Completa*

**Status Atual**: 🎉 **PROJETO COMPLETO E OTIMIZADO** - Todas as funcionalidades implementadas e operacionais com melhorias avançadas

---

**NeuroIA Lab** - Democratizando o acesso a assistentes de IA especializados em psicologia.