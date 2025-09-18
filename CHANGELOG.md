# Changelog - NeuroIA Lab

## [v3.1.0] - 2025-01-18

### 🎯 Expansão para Novas Áreas de Saúde Mental

#### ⚡ Novas Áreas Especializadas
- **Neuromodulação**: Assistentes especializados em estimulação cerebral e neurofeedback
- **Terapia Ocupacional**: Assistentes para reabilitação funcional e adaptações
- **Público-alvo expandido**: De psicólogos para 5 áreas da saúde mental

#### 🛠️ Implementação Técnica
- **Frontend**: Tipos TypeScript atualizados com as 5 áreas especializadas
- **Database**: Migração aplicada com nova constraint CHECK para áreas
- **UI Components**: Todos os componentes atualizados (AssistantEditor, Store, Dashboard)
- **Filtros**: Sistema de filtros por área implementado em toda a plataforma

#### 📚 Documentação Completa Reorganizada
- **API Documentation**: OpenAPI 3.0 spec completa com todos os endpoints
- **User Manual**: Guia completo para profissionais de saúde mental
- **Architecture**: Documentação técnica detalhada do sistema
- **Database Schema**: Mapeamento completo do banco com diagramas ER
- **Getting Started**: Guia de primeiros passos por área profissional

#### 🏗️ Melhorias de Arquitetura
- **Constraint Validation**: Sistema robusto de validação de áreas
- **Performance Index**: Índice otimizado para busca por área
- **Migration System**: Aplicação automática de migrações via Supabase
- **Type Safety**: TypeScript types sincronizados frontend/backend

#### 📊 Impacto
- **Áreas disponíveis**: 5 (antes: 3)
- **Mercado potencial**: Expandido para Neuromodulação e TO
- **Documentação**: 13 arquivos organizados em estrutura profissional
- **Manutenibilidade**: Código organizado e bem documentado

---

## [v3.0.1] - 2025-01-17

### ⚠️ Sistema de Pagamentos - Cartão Temporariamente Desabilitado

#### Problema Identificado
- **Cartão de Crédito**: Transações criadas mas não processadas
- **Status**: Ficam "aguardando pagamento" no Asaas
- **Impacto**: Valor não é debitado do cartão, assinatura não é ativada

#### Correções Implementadas
- **🔧 Formatação de Dados**: Mês com 2 dígitos, ano com 4 dígitos
- **🔧 remoteIp**: Adicionado IP do cliente (obrigatório para cartão)
- **🔧 nextDueDate**: Configurado para cobrança imediata
- **🔧 Debug Logs**: Implementados logs detalhados para investigação
- **🔧 Error Handling**: Mensagens específicas por ambiente

#### Solução Temporária
- **Frontend**: Opção cartão oculta no checkout
- **PIX Padrão**: Único método de pagamento disponível
- **Backend Preservado**: Código mantido para reativação futura

#### Status Atual
- **PIX**: ✅ 100% funcional
- **Cartão**: ⚠️ Temporariamente indisponível
- **Documentação**: Ver `PAYMENT_STATUS_2025.md` para detalhes completos

### 🧹 Limpeza e Organização
- **Arquivos removidos**: 20+ arquivos .md de debug temporários
- **Scripts removidos**: Pasta `/scripts` com utilitários já executados
- **Estrutura**: Database reorganizado com pasta `/scripts`
- **Deploy**: Corrigido erro do vercel.json (webhook-asaas-test.js)

---

## [v2.3.2] - 2025-09-16

### 🔐 Sistema de Reset de Senha Totalmente Reformulado

#### Correção Fundamental do Fluxo
- **Problema resolvido**: Reset de senha fazia login automático e redirecionava para dashboard
- **Solução implementada**: Uso correto do evento `PASSWORD_RECOVERY` do Supabase
- **AuthContext.tsx**: Adicionado handler para capturar evento PASSWORD_RECOVERY
- **ResetPassword.tsx**: Reformulado para usar sessionStorage ao invés de ler tokens do URL
- **ProtectedRoute.tsx**: Ajustado para permitir acesso em modo recovery

#### Melhorias de UX
- **Botão "Voltar para login"**: Removido ícone desalinhado, deixando apenas texto
- **Loading spinner**: Substituído por SVG simples e centralizado no lugar do logo girando
- **Button.tsx**: Simplificado sistema de loading com spinner SVG inline

#### Correções de URLs
- **Produção**: Todas as URLs atualizadas para `https://www.neuroialab.com.br`
- **AuthContext.tsx**: Correção definitiva das URLs de redirecionamento
- **Documentação**: URLs atualizadas em toda documentação

### 🎯 Fluxo Correto Implementado

1. **Email de reset** → Usuário clica no link
2. **Supabase detecta** → Dispara evento `PASSWORD_RECOVERY`
3. **AuthContext captura** → Salva estado no `sessionStorage`
4. **ResetPassword carrega** → Verifica modo recovery via sessionStorage
5. **Usuário define senha** → Usa sessão existente para `updatePassword`
6. **Sucesso** → Limpa dados e permite login normal

### 🔧 Melhorias Técnicas

#### Sistema de Loading
- **Spinner centralizado**: SVG simple ao invés de logo rotativo
- **Performance**: Removida dependência do LoadingSpinner com imagem

#### Gerenciamento de Estado
- **sessionStorage**: Uso correto para dados temporários de recovery
- **Eventos nativos**: Integração correta com sistema de auth do Supabase
- **Limpeza automática**: Dados removidos após uso bem-sucedido

---

## [v2.3.1] - 2025-09-16

### ✅ Correções Críticas de Sistema

#### Upload de Ícones de Assistentes
- **Problema resolvido**: Erro "permission denied for table users" ao fazer upload de imagens JPEG
- **Migração aplicada**: Políticas RLS para admins atualizarem assistentes e registrarem auditoria
- **Impacto**: Upload de ícones personalizados funcionando 100% para usuários admin

#### Sistema de Redefinição de Senha
- **Problema resolvido**: Link de "esqueci minha senha" redirecionava para página com erro
- **AuthContext.tsx atualizado**: URLs de produção corretas e logs detalhados para debug
- **ResetPassword.tsx melhorado**: Tratamento de erros específicos e validação de tokens
- **Documentação criada**: `docs/supabase-password-reset-config.md` com instruções completas

### 🔧 Melhorias Técnicas

#### Sistema de Permissões
- **Políticas RLS criadas**: "Admins can update assistants" e "Admins can insert audit log"
- **Autenticação via MCP**: Aplicação automática de migrações SQL via Supabase MCP
- **Validação corrigida**: Uso correto de `raw_user_meta_data` ao invés de `user_metadata`

#### Fluxo de Redefinição de Senha
- **URLs inteligentes**: Detecção automática de ambiente (produção vs desenvolvimento)
- **Logs aprimorados**: Sistema de debug com emojis para facilitar troubleshooting
- **Tratamento de erros**: Captura e exibição de erros específicos do Supabase

### 📚 Organização de Documentação

#### Consolidação e Limpeza
- **Estrutura reorganizada**: Documentação movida para `docs/admin/`, `docs/migrations/`, etc.
- **ADMIN_GUIDE.md consolidado**: Unificação de `ADMIN_SETUP.md`, `install_admin_panel.md` e `SETUP_ADMIN_COMPLETO.md`
- **Credenciais removidas**: README.md não expõe mais senhas admin
- **Links atualizados**: URLs de produção corrigidas para `neuroialab.com.br`

#### Segurança
- **Credenciais protegidas**: Remoção de senhas expostas em arquivos públicos
- **Guias específicos**: Documentação detalhada de configuração sem exposição de dados sensíveis

### 🐛 Bug Fixes
- **Upload de ícones**: Erro 500 "permission denied" → Funcionamento completo
- **Reset de senha**: Página com erro → Fluxo funcional end-to-end
- **URLs desatualizadas**: Links quebrados → URLs de produção corretas
- **Documentação duplicada**: Múltiplos arquivos → Guia consolidado

---

## [v2.3.0] - 2025-01-15

### ✅ Sistema de Acesso Público

#### Navegação Sem Login Obrigatório
- **Acesso Livre à Loja**: Usuários podem explorar todos os assistentes sem precisar criar conta
- **Dashboard Público**: Visualização do dashboard principal sem autenticação
- **Modal de Autenticação Sob Demanda**: Sistema elegante que aparece apenas quando necessário
- **Preservação de Intenção**: Após login, executa automaticamente a ação que o usuário pretendia realizar

#### Componentes e Arquitetura
- **PublicRoute Component**: Novo componente para rotas que permitem acesso público
- **AuthModal Component**: Modal completo de login/registro com design profissional
- **useAuthModal Hook**: Hook customizado para gerenciar estado e ações do modal
- **requireAuth Function**: Função inteligente que verifica autenticação antes de executar ações

### ✅ Correção de Sincronização de Preços

#### Sistema Dinâmico de Preços
- **Preços do Banco de Dados**: Eliminados todos os valores hardcoded do frontend
- **Sincronização Admin-Store**: Alterações no painel admin refletem instantaneamente na loja
- **Cache Invalidation**: Sistema automático de atualização de preços
- **Dynamic Pricing Config**: Nova estrutura `getAssistantPricingInfo()` que aceita dados do assistente

#### Arquivos Modificados
- **pricing.ts**: Refatorado para usar preços dinâmicos do banco
- **AssistantCard.tsx**: Atualizado para usar preços dinâmicos
- **Store.tsx**: Integrado com sistema de preços em tempo real

### ✅ Proteção Completa contra Erros de Caracteres

#### Banco de Dados
- **Campo ID**: Aumentado de 50 para 100 caracteres
- **Campo Área**: Aumentado de 20 para 50 caracteres
- **Campo Ícone**: Aumentado de 20 para 50 caracteres
- **Campo Cor**: Aumentado de 20 para 30 caracteres
- **Migração**: `increase_assistant_field_limits` aplicada com sucesso

#### Backend (admin.js)
- **Validação Robusta**: Sistema de validação de todos os campos antes da inserção
- **Constantes de Limite**: `ASSISTANT_FIELD_LIMITS` centralizadas para manutenção
- **Mensagens Específicas**: Erros detalhados para diferentes tipos de violação
- **ID Generation**: Otimizado para gerar IDs de máximo 39 caracteres

#### Frontend (AssistantEditor.tsx)
- **Atributo maxLength**: Aplicado em todos os campos de input
- **Contadores Visuais**: `CharacterCounter` component mostra uso em tempo real
- **Validação Pré-envio**: Verificação de limites antes de submeter formulário
- **Cores de Alerta**: Indicadores visuais quando próximo do limite

### 🔧 Melhorias Técnicas

#### Validação em 3 Camadas
1. **Frontend**: Validação visual e preventiva com contadores
2. **Backend**: Validação programática com mensagens específicas
3. **Database**: Constraints atualizadas com limites maiores

#### Performance
- **Otimização de Rotas**: Sistema inteligente de roteamento público vs protegido
- **Estado Compartilhado**: Gerenciamento eficiente de estado do modal de autenticação
- **Lazy Loading**: Componentes carregados apenas quando necessário

### 🐛 Correções Críticas

#### Erro de Cadastro de Assistentes
- **Root Cause**: ID gerado excedia 50 caracteres do banco
- **Solução**: Limite de ID aumentado para 100 caracteres + geração otimizada
- **Resultado**: Assistentes com nomes longos agora são cadastrados sem erro

#### Preços Desatualizados
- **Root Cause**: Valores hardcoded no frontend não sincronizavam com admin
- **Solução**: Sistema completamente dinâmico baseado no banco de dados
- **Resultado**: Preços sempre atualizados em tempo real

### 📱 UX/UI Improvements

#### Modal de Autenticação
- **Design Profissional**: Interface elegante com gradientes e animações
- **Responsivo**: Funciona perfeitamente em desktop e mobile
- **Acessibilidade**: Suporte completo a teclado e leitores de tela
- **Internacionalização**: Todas as mensagens em português brasileiro

#### Navegação Pública
- **Experiência Suave**: Transições sem interrupção entre público e autenticado
- **Botões de CTA**: Calls-to-action estratégicos para incentivar cadastro
- **Preview Inteligente**: Usuários veem valor antes de se comprometer

---

## [v2.2.0] - 2025-09-02

### ✅ Major Chat System Improvements

#### Real-time Chat Experience
- **Instant AI Responses**: Fixed AI messages appearing immediately without page refresh
- **Response Data Integration**: AI responses now use direct API data instead of reloading messages
- **Smooth UX**: Eliminated need for manual page refreshes during conversations

#### Race Condition Prevention
- **AbortController Implementation**: Added request cancellation for pending operations
- **Debounced Selection**: 200ms debounce prevents rapid-fire conversation switching
- **State Synchronization**: Messages instantly clear when switching conversations
- **Concurrent Operation Prevention**: `isTransitioning` state blocks overlapping actions

#### Complete Conversation Management  
- **Delete Functionality**: Full conversation deletion with API integration
- **Visual Feedback**: Loading spinners and confirmation dialogs in Portuguese
- **Local State Updates**: Immediate UI updates with cache management
- **Error Handling**: Comprehensive error management for all chat operations

### 🔧 Technical Architecture Improvements

#### Frontend Enhancements
- **ChatContext Overhaul**: Complete state management redesign
- **Message Synchronization**: Validation ensures messages belong to current conversation
- **Performance Optimization**: Reduced unnecessary API calls and improved caching
- **TypeScript Improvements**: Fixed typing issues in ConversationList component

#### Backend Stability
- **API Service**: Enhanced deleteConversation endpoint integration
- **Database Operations**: Optimized conversation and message queries
- **Authentication**: Improved JWT token handling across all chat operations

### 🐛 Critical Bug Fixes
- **Message Loading**: Fixed messages not appearing after sending
- **Conversation Switching**: Resolved old conversation messages appearing in new chats
- **UI Freezing**: Eliminated interface freezing during rapid operations
- **Delete Operations**: Fixed conversation deletion not working
- **State Management**: Resolved race conditions in message state

### 📱 Production Deployment
- **Vercel Integration**: Full deployment configuration for frontend and backend
- **Environment Variables**: Proper configuration for production environments
- **CSP Headers**: Security headers configured for Supabase and OpenAI integration
- **Performance**: Optimized build and deployment processes

### 🚀 Performance Optimizations
- **Request Management**: Intelligent request queuing and cancellation
- **State Updates**: Optimized React state updates for better performance  
- **Memory Management**: Proper cleanup of event listeners and timeouts
- **API Efficiency**: Reduced redundant API calls through better state management

---

## [v2.1.0] - 2025-01-31

### ✅ Major Features Added

#### Admin Panel System
- **Full Admin Dashboard**: Complete administrative interface with real-time data
- **Admin Authentication**: Secure login system with role-based access control
  - Email: `admin@neuroialab.com`
  - Auto-creation of admin account on first login attempt
- **Real-time Statistics**: 
  - Total users count
  - Active subscriptions tracking
  - Monthly revenue calculation
  - Recent conversations metrics
- **User Management**: Complete user listing with status, subscription count, and last login
- **Subscription Management**: Full subscription oversight with status updates
- **Database Integration**: All data sourced directly from Supabase (no mock data)

#### Professional UI Overhaul
- **SVG Icon System**: Complete professional icon library for all 14 psychology assistants
- **Payment Icons**: Official Brazilian PIX icon, boleto, and credit card designs
- **AssistantIcon Component**: Dynamic icon rendering with color themes and intelligent fallbacks
- **NeuroLabLogo**: Professional branded logo components in multiple sizes

### 🔧 Technical Improvements

#### Backend Enhancements
- **Admin Routes**: Complete `/api/admin/*` endpoint suite
- **AdminController**: Full CRUD operations for admin functionality
- **Admin Middleware**: Secure role-based authorization
- **Database Queries**: Optimized Supabase queries for admin statistics

#### Frontend Architecture
- **AdminService**: Dedicated service layer for admin API communication
- **Type Safety**: Complete TypeScript interfaces for admin data structures
- **Error Handling**: Comprehensive error management in admin operations
- **Responsive Design**: Mobile-first admin interface

### 🐛 Bug Fixes
- **Icon Rendering**: Fixed icons appearing as text strings (e.g., "map-route")
- **Store Navigation**: Resolved `setViewMode is not defined` error
- **Dashboard Stats**: Fixed conversation counter to show real data
- **Admin Login**: Resolved authentication and email confirmation issues
- **Import Errors**: Fixed TypeScript import issues in admin components

### 🎨 UI/UX Improvements
- **Professional Icons**: Replaced all emoji icons with professional SVG components
- **Button Alignment**: Improved chat interface button positioning
- **Icon Consistency**: Standardized icon usage across all components
- **Visual Hierarchy**: Enhanced admin dashboard layout and information architecture

### 📚 Documentation Updates
- **CLAUDE.md**: Updated with complete feature implementation status
- **ADMIN_CREDENTIALS.md**: New file with admin access instructions
- **CHANGELOG.md**: Comprehensive change tracking (this file)
- **API Documentation**: Updated with admin endpoint specifications

### 🔒 Security Enhancements
- **Admin Role Validation**: Secure admin role checking via user metadata
- **Route Protection**: All admin routes protected with authentication middleware
- **Session Management**: Proper admin session handling and logout functionality

### 🚀 Performance Optimizations
- **Database Queries**: Optimized admin statistics queries
- **Caching**: Improved API response caching for admin data
- **Type Safety**: Enhanced TypeScript coverage reducing runtime errors

---

## Previous Versions

### [v2.0.0] - 2025-01-30
- Initial package selection system
- Payment integration with Asaas
- Core subscription management
- 14 specialized AI assistants
- Professional dashboard interface

### [v1.0.0] - 2025-01-15
- Initial platform launch
- Basic authentication system
- Assistant chat functionality
- Supabase integration
- Core subscription model

---

**Legend:**
- ✅ **Major Feature**: New significant functionality
- 🔧 **Technical**: Backend/infrastructure improvements  
- 🐛 **Bug Fix**: Resolved issues
- 🎨 **UI/UX**: Interface improvements
- 📚 **Documentation**: Documentation updates
- 🔒 **Security**: Security enhancements
- 🚀 **Performance**: Performance optimizations