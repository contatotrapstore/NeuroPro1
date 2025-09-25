# Teste do Sistema de Instituições - ABPSI

## 🎯 Objetivo
Validar o funcionamento completo do sistema de instituições usando dados reais da Academia Brasileira de Psicanálise (ABPSI).

## 🏗️ Arquitetura Implementada

### Portal da Instituição (`/i/abpsi/`)
- ✅ **Login Personalizado**: Tela de login com logo e cores da ABPSI
- ✅ **Home Institucional**: Apresentação da IA com informações da instituição
- ✅ **Chat Especializado**: Simulador de Psicanálise e outros assistentes configurados
- ✅ **Painel SubAdmin**: Dashboard para gestores da ABPSI
- ✅ **Seção de Licença**: Status da assinatura e suporte

### Admin Master (`/admin/dashboard`)
- ✅ **Dashboard de Faculdades**: Visão geral de todas as instituições
- ✅ **Gestão de IAs por Instituição**: Configuração de assistentes disponíveis
- ✅ **Sistema de Relatórios**: Relatórios detalhados e logs de auditoria
- ✅ **Gestão Centralizada**: CRUD de instituições e configurações

## 📋 Roteiro de Testes

### 1. Preparação dos Dados

#### 1.1 Verificar Migração ABPSI
```sql
-- Verificar se os dados da ABPSI foram inseridos
SELECT * FROM institutions WHERE slug = 'abpsi';

-- Verificar assistentes configurados
SELECT ia.*, a.name
FROM institution_assistants ia
JOIN assistants a ON ia.assistant_id = a.id
WHERE ia.institution_id = (SELECT id FROM institutions WHERE slug = 'abpsi');
```

#### 1.2 Criar Usuário de Teste ABPSI
```sql
-- Inserir usuário de teste na instituição
INSERT INTO institution_users (
    user_id,
    institution_id,
    role,
    registration_number,
    department,
    semester,
    is_active,
    enrolled_at
) VALUES (
    'user-test-abpsi-001',
    (SELECT id FROM institutions WHERE slug = 'abpsi'),
    'subadmin',
    'ABPSI2024001',
    'Psicanálise Clínica',
    NULL,
    true,
    NOW()
);
```

### 2. Testes do Portal da Instituição

#### 2.1 Acesso Inicial
- [ ] **URL**: `http://localhost:3000/i/abpsi`
- [ ] **Verificar**: Redirecionamento para `/i/abpsi/login`
- [ ] **Validar**: Logo da ABPSI, cores personalizadas (#c39c49), mensagem de boas-vindas

#### 2.2 Autenticação
- [ ] **Testar**: Login com credenciais de usuário ABPSI
- [ ] **Verificar**: Validação de acesso à instituição
- [ ] **Validar**: Redirecionamento para home institucional após login

#### 2.3 Home Institucional
- [ ] **URL**: `http://localhost:3000/i/abpsi`
- [ ] **Verificar**:
  - [ ] Apresentação dos assistentes disponíveis
  - [ ] Simulador de Psicanálise como assistente principal
  - [ ] Informações sobre a ABPSI
  - [ ] Navegação para chat e outras seções

#### 2.4 Chat Institucional
- [ ] **URL**: `http://localhost:3000/i/abpsi/chat`
- [ ] **Verificar**:
  - [ ] Lista de assistentes configurados para ABPSI
  - [ ] Simulador de Psicanálise disponível e funcional
  - [ ] Interface personalizada com tema da instituição

#### 2.5 Painel SubAdmin
- [ ] **URL**: `http://localhost:3000/i/abpsi/admin`
- [ ] **Pré-requisito**: Usuário com role 'subadmin'
- [ ] **Verificar**:
  - [ ] Dashboard com estatísticas da ABPSI
  - [ ] Aba de usuários (visualização read-only)
  - [ ] Relatórios específicos da instituição
  - [ ] Métricas de uso dos assistentes

#### 2.6 Seção de Licença
- [ ] **URL**: `http://localhost:3000/i/abpsi/subscription`
- [ ] **Verificar**:
  - [ ] Status da licença (Ilimitado/Gratuito inicial)
  - [ ] Recursos inclusos
  - [ ] Estatísticas de uso
  - [ ] Informações de contato da ABPSI

### 3. Testes do Admin Master

#### 3.1 Dashboard de Faculdades
- [ ] **URL**: `http://localhost:3000/admin/dashboard` (aba "Faculdades")
- [ ] **Verificar**:
  - [ ] ABPSI listada como instituição ativa
  - [ ] Estatísticas agregadas corretas
  - [ ] Gráficos e métricas funcionais

#### 3.2 Dashboard Avançado
- [ ] **Verificar**:
  - [ ] Visão geral com contadores
  - [ ] Usuários por instituição (ABPSI com 1 usuário)
  - [ ] Top assistentes (Simulador de Psicanálise)
  - [ ] Gráfico de atividade no período
  - [ ] Ranking de uso por instituição

#### 3.3 Gestão de IAs por Instituição
- [ ] **Aba**: "IAs por Instituição"
- [ ] **Selecionar**: ABPSI
- [ ] **Verificar**:
  - [ ] Lista de todos os assistentes disponíveis
  - [ ] 4 assistentes habilitados para ABPSI:
    - [ ] Simulador de Psicanálise ABPSI (padrão)
    - [ ] Supervisor de Casos Clínicos
    - [ ] Consultor Ético Psicanalítico
    - [ ] Acompanhamento de Análise
  - [ ] Possibilidade de reordenar, habilitar/desabilitar
  - [ ] Nomes e descrições personalizadas funcionais

#### 3.4 Sistema de Relatórios
- [ ] **Aba**: "Relatórios"
- [ ] **Selecionar**: ABPSI
- [ ] **Configurar**: Relatório resumo, último mês
- [ ] **Verificar**:
  - [ ] Geração de relatório com dados da ABPSI
  - [ ] Estatísticas de usuários e conversas
  - [ ] Assistente mais usado
  - [ ] Exportação em JSON, CSV e PDF

### 4. Testes de Integração

#### 4.1 Fluxo Completo do Usuário
1. [ ] **Admin Master**: Configurar assistentes para ABPSI
2. [ ] **Login ABPSI**: Acessar portal institucional
3. [ ] **Chat**: Usar Simulador de Psicanálise
4. [ ] **SubAdmin**: Visualizar estatísticas atualizadas
5. [ ] **Relatórios**: Gerar relatório com atividade recente

#### 4.2 Testes de Segurança e Isolamento
- [ ] **Verificar**: Usuário ABPSI não acessa outras instituições
- [ ] **Verificar**: Dados isolados por RLS policies
- [ ] **Verificar**: SubAdmin tem acesso limitado (não gerencia outros usuários)
- [ ] **Verificar**: Admin Master tem acesso total ao sistema

### 5. Performance e Usabilidade

#### 5.1 Performance
- [ ] **Tempo de carregamento**: Portal ABPSI < 2s
- [ ] **Responsividade**: Funcional em mobile e desktop
- [ ] **APIs**: Tempos de resposta < 500ms

#### 5.2 Usabilidade
- [ ] **Navegação**: Clara e intuitiva
- [ ] **Temas**: Cores da ABPSI aplicadas consistentemente
- [ ] **Feedback**: Mensagens de erro e sucesso apropriadas
- [ ] **Acessibilidade**: Contraste e navegação por teclado

## 🐛 Registro de Bugs e Issues

### Issues Encontrados
- [ ] **Issue #001**: [Descrição do problema]
  - **Status**: [Pendente/Resolvido]
  - **Solução**: [Descrição da correção]

### Melhorias Sugeridas
- [ ] **Melhoria #001**: [Descrição da melhoria]
  - **Prioridade**: [Alta/Média/Baixa]
  - **Status**: [Implementada/Pendente]

## ✅ Checklist Final

### Funcionalidades Core
- [ ] **Portal Institucional**: Funcional com tema personalizado
- [ ] **Autenticação**: Login específico da instituição
- [ ] **Chat**: Assistentes configurados e funcionais
- [ ] **SubAdmin**: Dashboard e relatórios institucionais
- [ ] **Admin Master**: Gestão completa de instituições

### Dados e Configurações
- [ ] **ABPSI**: Dados completos e corretos inseridos
- [ ] **Assistentes**: 4 IAs configuradas para ABPSI
- [ ] **Usuários**: Usuário de teste criado e funcional
- [ ] **Permissões**: RLS policies funcionando corretamente

### APIs e Integrações
- [ ] **APIs Institucionais**: Endpoints funcionais
- [ ] **APIs Admin**: CRUD e relatórios operacionais
- [ ] **Autenticação**: JWT e validações corretas
- [ ] **Banco de dados**: Migrations aplicadas com sucesso

## 📈 Métricas de Sucesso

### Critérios de Aprovação
1. **100%** das funcionalidades core funcionais
2. **0** bugs críticos
3. **< 2s** tempo de carregamento médio
4. **100%** dos dados da ABPSI corretos
5. **Isolamento perfeito** entre instituições

### KPIs de Validação
- [ ] **Portal ABPSI**: Acesso e navegação fluidos
- [ ] **Simulador**: IA funcionando corretamente
- [ ] **SubAdmin**: Dashboard com métricas reais
- [ ] **Relatórios**: Geração e exportação funcionais
- [ ] **Segurança**: Acesso restrito e dados isolados

---

## 🚀 Status do Teste

**Data de Execução**: [A ser preenchida]
**Executor**: [Nome do testador]
**Ambiente**: [Development/Staging/Production]

**Resultado Final**: ⏳ **PENDENTE**
- [ ] **APROVADO** - Sistema pronto para produção
- [ ] **APROVADO COM RESSALVAS** - Pequenos ajustes necessários
- [ ] **REPROVADO** - Correções críticas necessárias

---

*Este documento deve ser atualizado conforme os testes são executados e os resultados são obtidos.*