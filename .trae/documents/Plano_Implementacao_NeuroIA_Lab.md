# Plano de Implementação - NeuroIA Lab

## 1. Visão Geral do Projeto

### 1.1 Estrutura de Fases
O desenvolvimento da plataforma NeuroIA Lab será dividido em 5 fases principais, cada uma com entregáveis específicos e marcos de validação para a implementação dos 14 assistentes especializados em psicologia.

### 1.2 Estimativa de Tempo
- **Fase 1**: Configuração e Infraestrutura (1-2 semanas)
- **Fase 2**: Autenticação e Base do Sistema (2-3 semanas)
- **Fase 3**: Sistema de Assistentes e Chat (3-4 semanas)
- **Fase 4**: Sistema de Pagamentos (2-3 semanas)
- **Fase 5**: Painel Administrativo e Finalização (2-3 semanas)

**Total estimado**: 10-15 semanas

## 2. Fase 1: Configuração e Infraestrutura

### 2.1 Objetivos
- Configurar ambiente de desenvolvimento
- Preparar infraestrutura base
- Configurar banco de dados Supabase
- Estruturar projetos frontend e backend

### 2.2 Micro Tarefas

#### 2.2.1 Configuração do Ambiente
- [ ] **T1.1**: Configurar repositório Git com estrutura de monorepo
- [ ] **T1.2**: Configurar ambiente Node.js e dependências base
- [ ] **T1.3**: Configurar ESLint, Prettier e TypeScript
- [ ] **T1.4**: Configurar scripts de build e desenvolvimento

#### 2.2.2 Estrutura do Projeto
- [ ] **T1.5**: Criar estrutura de pastas do frontend React
- [ ] **T1.6**: Criar estrutura de pastas do backend Node.js
- [ ] **T1.7**: Configurar Vite para o frontend
- [ ] **T1.8**: Configurar Express e middleware básico no backend

#### 2.2.3 Configuração do Supabase
- [ ] **T1.9**: Configurar projeto no Supabase
- [ ] **T1.10**: Executar scripts DDL para criação das tabelas
- [ ] **T1.11**: Configurar Row Level Security (RLS)
- [ ] **T1.12**: Testar conexão frontend e backend com Supabase

#### 2.2.4 Configuração da Infraestrutura
- [ ] **T1.13**: Configurar VPS (Ubuntu, Nginx, PM2)
- [ ] **T1.14**: Configurar Redis para cache
- [ ] **T1.15**: Configurar SSL/HTTPS
- [ ] **T1.16**: Configurar CI/CD básico

### 2.3 Entregáveis
- Ambiente de desenvolvimento funcional
- Banco de dados Supabase configurado
- Infraestrutura VPS preparada
- Projetos frontend e backend estruturados

### 2.4 Critérios de Aceitação
- [ ] Frontend e backend executam sem erros
- [ ] Conexão com Supabase estabelecida
- [ ] Deploy básico funcionando no VPS
- [ ] Todas as tabelas criadas e testadas

## 3. Fase 2: Autenticação e Base do Sistema

### 3.1 Objetivos
- Implementar sistema de autenticação com Supabase Auth
- Criar componentes base da UI
- Implementar roteamento e navegação
- Configurar middleware de autenticação no backend

### 3.2 Micro Tarefas

#### 3.2.1 Sistema de Autenticação Frontend
- [ ] **T2.1**: Configurar Supabase client no React
- [ ] **T2.2**: Criar componente de Login
- [ ] **T2.3**: Criar componente de Cadastro
- [ ] **T2.4**: Criar componente de Recuperação de Senha
- [ ] **T2.5**: Implementar Context API para autenticação
- [ ] **T2.6**: Criar hook useAuth personalizado

#### 3.2.2 Roteamento e Navegação
- [ ] **T2.7**: Configurar React Router
- [ ] **T2.8**: Criar componente ProtectedRoute
- [ ] **T2.9**: Implementar redirecionamentos baseados em autenticação
- [ ] **T2.10**: Criar componente de Layout principal
- [ ] **T2.11**: Implementar navegação responsiva

#### 3.2.3 Componentes Base da UI
- [ ] **T2.12**: Configurar Tailwind CSS com paleta de cores NeuroIA Lab
- [ ] **T2.13**: Criar sistema de design tokens com verde principal #0E1E03
- [ ] **T2.14**: Implementar componentes base (Button, Input, Card) com identidade visual
- [ ] **T2.15**: Criar componente de Loading com cores do projeto
- [ ] **T2.16**: Implementar sistema de notificações/toast com tema verde

#### 3.2.4 Backend de Autenticação
- [ ] **T2.17**: Configurar middleware de autenticação JWT
- [ ] **T2.18**: Implementar validação de token Supabase
- [ ] **T2.19**: Criar middleware de verificação de assinatura
- [ ] **T2.20**: Implementar endpoints de perfil do usuário
- [ ] **T2.21**: Configurar CORS e segurança

### 3.3 Entregáveis
- Sistema de login/cadastro funcional
- Navegação e roteamento implementados
- Componentes base da UI criados
- Middleware de autenticação no backend

### 3.4 Critérios de Aceitação
- [ ] Usuário pode se cadastrar e fazer login
- [ ] Redirecionamentos funcionam corretamente
- [ ] Interface responsiva em mobile e desktop
- [ ] Backend valida tokens corretamente

## 4. Fase 3: Sistema de Assistentes e Chat

### 4.1 Objetivos
- Implementar dashboard com grid dos 14 assistentes de psicologia
- Criar interface de chat profissional
- Integrar com OpenAI Assistants API
- Implementar histórico de conversas

### 4.2 Micro Tarefas

#### 4.2.1 Dashboard de Assistentes
- [ ] **T3.1**: Criar componente AssistantCard com design específico para psicologia e cores verde
- [ ] **T3.2**: Implementar grid responsivo dos 14 assistentes com identidade visual
- [ ] **T3.3**: Criar filtro por assistentes assinados individualmente
- [ ] **T3.4**: Implementar indicador de status das assinaturas individuais com cor verde principal
- [ ] **T3.5**: Adicionar animações e hover effects com paleta de verde (#0E1E03, #1A3A0F, #2D5A1F)
- [ ] **T3.6**: Criar página de detalhes do assistente com benefícios específicos e tema verde

#### 4.2.2 Interface de Chat
- [ ] **T3.7**: Criar layout da página de chat
- [ ] **T3.8**: Implementar componente de mensagem
- [ ] **T3.9**: Criar input de mensagem com envio
- [ ] **T3.10**: Implementar scroll automático
- [ ] **T3.11**: Adicionar indicador de digitação
- [ ] **T3.12**: Criar sidebar com histórico de conversas

#### 4.2.3 Backend de Chat
- [ ] **T3.13**: Configurar integração com OpenAI Assistants API
- [ ] **T3.14**: Implementar endpoint de envio de mensagem
- [ ] **T3.15**: Criar sistema de gerenciamento de conversas
- [ ] **T3.16**: Implementar salvamento de histórico
- [ ] **T3.17**: Configurar rate limiting
- [ ] **T3.18**: Implementar cache de respostas (Redis)

#### 3.2.3 Gestão de Assistentes
- [ ] **T3.19**: Criar endpoint para listar os 14 assistentes
- [ ] **T3.20**: Implementar filtro por assinatura individual
- [ ] **T3.21**: Configurar IDs dos assistentes OpenAI (asst_*)
- [ ] **T3.22**: Implementar validação de especialização em psicologia
- [ ] **T3.23**: Adicionar validação de acesso aos assistentes por assinatura

### 4.3 Entregáveis
- Dashboard funcional com 14 assistentes de psicologia
- Interface de chat completa
- Integração OpenAI Assistants funcionando
- Sistema de histórico implementado

### 4.4 Critérios de Aceitação
- [ ] Usuário vê apenas assistentes que assinou individualmente
- [ ] Chat funciona com respostas especializadas em psicologia
- [ ] Histórico é salvo e recuperado corretamente
- [ ] Interface é profissional e responsiva

## 5. Fase 4: Sistema de Pagamentos

### 5.1 Objetivos
- Integrar com API do Asaas
- Implementar seleção de planos
- Configurar webhooks de pagamento
- Criar sistema de validação de assinatura

### 5.2 Micro Tarefas

#### 5.2.1 Frontend de Pagamentos
- [ ] **T4.1**: Criar página de seleção de planos (individual vs pacotes)
- [ ] **T4.2**: Implementar comparação de planos com preços dos pacotes
- [ ] **T4.3**: Criar interface de seleção de assistentes para pacotes
- [ ] **T4.4**: Implementar validação de quantidade de assistentes selecionados
- [ ] **T4.5**: Criar preview do pacote com assistentes escolhidos
- [ ] **T4.6**: Implementar componente de checkout individual e por pacotes
- [ ] **T4.7**: Implementar redirecionamento para Asaas
- [ ] **T4.8**: Criar página de confirmação de pagamento
- [ ] **T4.9**: Implementar indicadores de status da assinatura

#### 5.2.2 Integração com Asaas
- [ ] **T4.7**: Configurar credenciais do Asaas
- [ ] **T4.8**: Implementar criação de clientes
- [ ] **T4.9**: Criar assinaturas via API
- [ ] **T4.10**: Implementar cobrança avulsa
- [ ] **T4.11**: Configurar webhooks do Asaas
- [ ] **T4.12**: Implementar tratamento de eventos

#### 5.2.3 Backend de Pagamentos
- [ ] **T4.13**: Criar endpoints de planos individuais e pacotes
- [ ] **T4.14**: Implementar endpoint de validação de seleção de pacotes
- [ ] **T4.15**: Implementar criação de assinatura individual
- [ ] **T4.16**: Implementar criação de pacotes personalizados
- [ ] **T4.17**: Configurar webhook handler para ambos os tipos
- [ ] **T4.18**: Implementar atualização de status de assinaturas e pacotes
- [ ] **T4.19**: Criar sistema de validação de assinatura e pacotes
- [ ] **T4.20**: Implementar logs de transações
- [ ] **T4.21**: Criar lógica de cálculo de preços com desconto para pacotes

#### 5.2.4 Validação e Segurança
- [ ] **T4.19**: Implementar middleware de verificação de assinatura individual
- [ ] **T4.20**: Criar sistema de expiração de assinaturas por assistente
- [ ] **T4.21**: Implementar renovação automática individual
- [ ] **T4.22**: Configurar notificações de vencimento por assistente
- [ ] **T4.23**: Implementar cancelamento de assinaturas individuais

### 5.3 Entregáveis
- Sistema de pagamentos funcional
- Integração Asaas completa
- Webhooks configurados
- Validação de assinatura implementada

### 5.4 Critérios de Aceitação
- [ ] Usuário pode contratar assistentes individualmente
- [ ] Pagamentos são processados corretamente
- [ ] Status é atualizado via webhook
- [ ] Acesso aos assistentes é controlado por assinatura individual

## 6. Fase 5: Painel Administrativo e Finalização

### 6.1 Objetivos
- Criar painel administrativo completo
- Implementar relatórios e métricas
- Realizar testes finais
- Preparar para produção

### 6.2 Micro Tarefas

#### 6.2.1 Painel Administrativo
- [ ] **T5.1**: Criar layout do painel admin
- [ ] **T5.2**: Implementar gestão de usuários
- [ ] **T5.3**: Criar CRUD de robôs
- [ ] **T5.4**: Implementar gestão de planos
- [ ] **T5.5**: Criar sistema de logs
- [ ] **T5.6**: Implementar busca e filtros

#### 6.2.2 Relatórios e Métricas
- [ ] **T5.7**: Criar dashboard de métricas
- [ ] **T5.8**: Implementar relatório de usuários ativos
- [ ] **T5.9**: Criar relatório de receita
- [ ] **T5.10**: Implementar métricas de uso dos robôs
- [ ] **T5.11**: Criar gráficos e visualizações
- [ ] **T5.12**: Implementar exportação de dados

#### 6.2.3 Testes e Qualidade
- [ ] **T5.13**: Implementar testes unitários críticos
- [ ] **T5.14**: Realizar testes de integração
- [ ] **T5.15**: Executar testes de carga
- [ ] **T5.16**: Testar fluxos completos
- [ ] **T5.17**: Validar responsividade
- [ ] **T5.18**: Testar segurança e autenticação

#### 6.2.4 Preparação para Produção
- [ ] **T5.19**: Configurar variáveis de ambiente
- [ ] **T5.20**: Otimizar performance
- [ ] **T5.21**: Configurar monitoramento
- [ ] **T5.22**: Implementar backup automático
- [ ] **T5.23**: Criar documentação de deploy
- [ ] **T5.24**: Realizar deploy final

### 6.3 Entregáveis
- Painel administrativo completo
- Sistema de relatórios funcionando
- Aplicação testada e otimizada
- Deploy em produção realizado

### 6.4 Critérios de Aceitação
- [ ] Admin pode gerenciar todos os aspectos
- [ ] Relatórios mostram dados precisos
- [ ] Sistema está estável em produção
- [ ] Performance está otimizada

## 7. Cronograma de Desenvolvimento

### 7.1 Cronograma Detalhado

| Semana | Fase | Principais Atividades | Entregáveis |
|--------|------|----------------------|-------------|
| 1-2 | Fase 1 | Configuração ambiente, Supabase, VPS | Infraestrutura pronta |
| 3-4 | Fase 2 | Autenticação, UI base, roteamento | Login/cadastro funcional |
| 5-6 | Fase 2 | Finalização autenticação, middleware | Sistema auth completo |
| 7-8 | Fase 3 | Dashboard robôs, interface chat | Dashboard funcional |
| 9-10 | Fase 3 | Integração GPT, histórico | Chat completo |
| 11-12 | Fase 4 | Sistema pagamentos, Asaas | Pagamentos funcionando |
| 13-14 | Fase 5 | Painel admin, relatórios | Admin completo |
| 15 | Fase 5 | Testes finais, deploy produção | Sistema em produção |

### 7.2 Marcos Importantes

- **Marco 1** (Semana 2): Infraestrutura e banco configurados
- **Marco 2** (Semana 6): Sistema de autenticação completo
- **Marco 3** (Semana 10): Chat com robôs funcionando
- **Marco 4** (Semana 12): Sistema de pagamentos integrado
- **Marco 5** (Semana 15): Sistema completo em produção

## 8. Riscos e Mitigações

### 8.1 Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|----------|
| Problemas na integração GPT API | Média | Alto | Implementar fallbacks e cache |
| Dificuldades com webhooks Asaas | Média | Alto | Testar extensivamente em sandbox |
| Performance do chat em tempo real | Baixa | Médio | Implementar otimizações e cache |
| Problemas de segurança RLS | Baixa | Alto | Revisar políticas e testar acesso |

### 8.2 Riscos de Projeto

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|----------|
| Atraso no desenvolvimento | Média | Médio | Buffer de tempo nas estimativas |
| Mudanças de escopo | Baixa | Alto | Documentação clara e aprovações |
| Problemas de infraestrutura | Baixa | Médio | Backup de VPS e monitoramento |

## 9. Recursos Necessários

### 9.1 Recursos Técnicos
- Conta Supabase (plano Pro recomendado)
- Conta OpenAI com créditos para GPT-4
- Conta Asaas para pagamentos
- VPS com pelo menos 4GB RAM
- Domínio e certificado SSL
- Conta Redis (ou instalação local)

### 9.2 Recursos Humanos
- 1 Desenvolvedor Full-Stack (principal)
- 1 Designer UI/UX (consultoria)
- 1 DevOps (configuração inicial)

### 9.3 Custos Estimados (Mensais)
- Supabase Pro: $25/mês
- OpenAI API: $50-200/mês (dependendo do uso)
- VPS: $20-50/mês
- Asaas: Taxa por transação
- Domínio/SSL: $10/mês

**Total estimado**: $105-285/mês

## 10. Próximos Passos

### 10.1 Ações Imediatas
1. **Aprovação do plano**: Revisar e aprovar este documento
2. **Setup inicial**: Criar contas nos serviços necessários
3. **Configuração do ambiente**: Executar Fase 1 completa
4. **Início do desenvolvimento**: Começar Fase 2

### 10.2 Validações Necessárias
- [ ] Aprovação do escopo e cronograma
- [ ] Confirmação dos recursos disponíveis
- [ ] Validação das integrações (Asaas, OpenAI)
- [ ] Aprovação do design e identidade visual

### 10.3 Documentação Adicional
Após aprovação deste plano, criar:
- Guia de configuração do ambiente de desenvolvimento
- Documentação de API detalhada
- Manual de deploy e operação
- Guia de testes e QA