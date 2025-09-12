# Plano de Multitenancy para Faculdades (Subadmin dentro do Sistema Principal)

## 1) Contexto e Objetivo
Seu sistema já está em produção (Vercel) e agora precisará suportar múltiplas faculdades usando a mesma base/infra, com isolamento de dados, um painel de subadmin para cada faculdade e uma única IA por faculdade. O objetivo é desenhar um modelo multi-tenant (multi-instituições) sem criar sistemas independentes, mantendo governança central pelo admin master.

## 2) Escopo
- Criar o conceito de Instituição (Faculdade) no domínio.
- Subpainel de Administração por Instituição (subadmin), sem acesso ao admin master.
- Isolamento de dados por Instituição (RLS / autorização por tenant).
- Configuração de IAs liberadas por Instituição (possibilidade de compartilhar a mesma IA entre múltiplas Instituições) e definição de uma IA padrão por Instituição; não haverá limite de uso.
- Gestão de usuários da Instituição (alunos, professores, staff) e papéis.
- Branding por Instituição: logo, cores/tema e textos de boas-vindas aplicados ao login e app do aluno.
- Auditoria, relatórios por Instituição (uso, usuários ativos, conversas). 

## 3) Visão de Alto Nível (Multi-tenant)
- Um único deployment (frontend + APIs) servindo múltiplas Instituições.
- Cada recurso (conversas, mensagens, uploads, configurações) referenciado por institution_id.
- RLS e checagens de autorização garantem que usuários só acessem dados da(s) Instituição(ões) a que pertencem.

## 4) Requisitos Funcionais
- Gestão de Faculdades (admin master): criar/editar/arquivar Instituições, logo, tema, slug/domínio, e liberação/remoção de IAs para cada Instituição.
- Subadmin: gerenciar usuários da Instituição (criar/excluir), permissões, IA padrão e IAs liberadas, base de conhecimento local, e visão de relatórios (usuários ativos, conversas, uso) — sem limites de uso.
- Papéis por Instituição: subadmin, professor, aluno, suporte (RBAC por tenant).
- IA por Instituição: permitir compartilhar uma mesma IA entre Instituições; definir uma IA padrão dentre as IAs liberadas; parametrização local (prompt/contexto) e knowledge base por Instituição.
- Usuários da Instituição: convite, importação (CSV), redefinição de acesso.
- App do aluno: tela de login com identidade visual da Instituição; home com apresentação da IA e informações básicas; chats; seção de assinatura/licença com status informativo; informações relevantes ao aluno.
- Conversas/Mensagens: sempre associadas a institution_id; histórico e relatórios por Instituição.
- Uploads/Conteúdo: storage particionado por institution_id; RLS no storage/metadados.
- Relatórios: uso de IA, usuários ativos, conversas por período (sem rate limit). 
- Auditoria: trilhas de ações administrativas por Instituição e global (admin master).
- SSO e domínios personalizados (opcional fase 3+).

## 5) Requisitos Não Funcionais
- Segurança e LGPD: RLS rigoroso, segregação por institution_id, minimização de dados pessoais.
- Escalabilidade: índices por institution_id, paginação, jobs assíncronos para relatórios.
- Observabilidade: logs por tenant, correlação de requisições com institution_id.
- Desempenho: cache leve de metadata de Instituição (slug → id), N+1 evitado nas consultas.

## 6) Modelagem de Dados (proposta)
Novas tabelas:
- institutions(id, name, slug, logo_url, settings_json, status, created_at)
  - settings_json: { theme: { primary_color, secondary_color }, welcome_text, links úteis }
- institution_members(id, institution_id, user_id, role, created_at)
- institution_assistants(id, institution_id, assistant_id, is_default)
- audit_logs(id, institution_id NULLABLE, actor_user_id, action, entity, entity_id, metadata_json, created_at)

Alterações em tabelas existentes (principais):
- assistants: manter globais e usar tabela de vínculo (institution_assistants) para liberação/compartilhamento entre Instituições; uma instituição pode ter várias IAs liberadas e uma marcada como padrão (is_default=TRUE).
- conversations: adicionar institution_id (NOT NULL); índice (institution_id, created_at).
- messages: conversa já referencia conversation_id; herdará instituição via join; opcionalmente denormalizar institution_id para índices/reporting.
- user_subscriptions / user_packages: exibir status/metadata informativa (sem limites de uso); se necessário, adicionar institution_id para escopo por Instituição.

RLS (Postgres/Supabase):
- Permitir SELECT/INSERT/UPDATE/DELETE quando existe membership (institution_members) para auth.uid() e o registro possui institution_id correspondente.
- Admin master: bypass por role claim global.

## 7) Fluxos Principais
1. Criação de Instituição (admin master): cria registro + slug + configurações iniciais (logo/tema).
2. Liberação de IAs para a Instituição (admin master): associar IAs existentes; definir IA padrão.
3. Convite de Subadmin: cria membership (role=subadmin); e-mail convite; primeiro acesso define senha/perfil.
4. Onboarding de usuários finais: convite em massa (CSV) ou link de convite com escopo institution_id.
5. Uso do Chat (aluno): rotas incluem o slug; middleware resolve institution_id; conversas sempre gravadas com institution_id.

## 8) Backend (API) – Endpoints e Middleware
Middleware de Tenant:
- Resolver institution_id a partir do slug no path/host ou do token (membership atual) e validar acesso.

Novos/ajustados endpoints (esboço):
- POST/GET/PATCH/DELETE /api/institutions
- GET /api/institutions/:slug
- PATCH /api/institutions/:slug/theme (logo, cores, textos)
- POST/GET/DELETE /api/institutions/:slug/users (convites, listagem)
- GET/POST/DELETE /api/institutions/:slug/assistants (listar, liberar IA, remover IA)
- PATCH /api/institutions/:slug/assistants/:assistantId/default (definir IA padrão)
- GET /api/institutions/:slug/reports (usuários ativos, conversas, uso)
- GET /api/institutions/:slug/audit

Autorização:
- RBAC por tenant via institution_members.role e claims JWT (metadados supabase) + RLS.

## 9) Frontend – Rotas e Telas (subadmin e aluno)
Rotas (exemplos):
- /admin (admin master)
- /i/:slug/admin (subadmin)
- /i/:slug/app (usuário final)
- /i/:slug/login (login brandeado da Instituição)

Telas-chave Subadmin:
- Dashboard da Instituição (uso, status, usuários ativos, conversas)
- Usuários (listagem, convites, papéis, criar/excluir)
- IA e Conhecimento (ver IAs liberadas, definir padrão, uploads)
- Relatórios
- Auditoria/Logs
- Configurações (logo, tema, textos)

Telas-chave App do Aluno:
- Login brandeado (logo/cores da Instituição)
- Home com apresentação da IA e informações básicas
- Chat com a IA padrão da Instituição
- Assinatura/Licença: exibição do status informativo (sem limites de uso)
- Área com informações relevantes (links, comunicados)

## 10) Roadmap por Fases
Fase 0 – Alinhamento/Decisões: perguntas em aberto e escolhas arquiteturais.
Fase 1 – Dados & RLS: migrações (institutions, members), alterar conversations, policies RLS, seed admin master.
Fase 2 – Middleware & APIs: resolução de tenant por slug, endpoints CRUD, autorização; liberação/compartilhamento de IAs.
Fase 3 – Frontend Subadmin: rotas /i/:slug/admin, telas de Usuários, IA, Dashboard mínimo.
Fase 4 – App do Aluno: login brandeado, home, chat com IA padrão, seção de assinatura/licença (informativa).
Fase 5 – Relatórios & Auditoria: consultas otimizadas, dashboards, exportações.
Fase 6 – Opcional: SSO e domínios personalizados.
Fase 7 – Pilotos e Hardening: testes, carga, observabilidade e correções.

## 11) Critérios de Sucesso
- Usuário de uma Instituição não vê dados de outra (verificado por testes e auditoria).
- Subadmin opera a Instituição sem privilégios globais.
- IA da Instituição responde com contexto e recursos próprios; pode ser compartilhada entre Instituições.
- Não há limites de uso aplicados; métricas de uso disponíveis para relatórios.
- Performance aceitável sob carga com múltiplas Instituições.

## 12) Perguntas em Aberto (prioritárias)
1) Usuário pode pertencer a múltiplas Instituições ou apenas a uma? (impacta membership e UI de troca de contexto)
2) Domínio: usaremos slug na rota (ex: /i/:slug/…) ou subdomínio (faculdade.suaapp.com)? Algum domínio personalizado por Instituição?
3) Papéis: além de subadmin/professor/aluno, existe moderador/suporte/gestor acadêmico?
4) IA: haverá parametrizações específicas por Instituição (ex.: prompt adicional, ferramentas habilitadas) além da definição da IA padrão?
5) Assinatura/Licença: texto e campos a exibir para o aluno (ex.: validade, responsável na Instituição) — sem limites de uso.
6) E-mails e templates de convite devem ser brandedos por Instituição?

## 13) Riscos e Mitigações
- Erros de RLS expondo dados: reforçar testes de segurança e revisão de policies.
- Gargalos em relatórios: pré-agrigações/ETL leve e índices por institution_id.
- Complexidade de UI multi-tenant: reduzir escopo inicial e iterar.

## 14) Estimativa (macro)
- Fase 1–2 (Dados/RLS + APIs/Middleware): 1–1,5 semana.
- Fase 3–4 (Subadmin + App do Aluno MVP): 1–1,5 semana.
- Fase 5–7 (Relatórios, ajustes, pilotos): 1–1,5 semana.
Prazo total estimado: 3 a 4,5 semanas (dependendo de revisões e pilotos).

## 15) Migração e Compatibilidade
- Atribuir institution_id padrão para dados existentes (ex.: "global") e migrar gradualmente usuários para Instituições reais.
- Scripts de backfill e validação de integridade.

## 16) Testes & Observabilidade
- Testes de unidade para RLS e autorização.
- Testes e2e multi-tenant (usuários de Instituições distintas).
- Logging estruturado com institution_id e correlação de requisições.

---

### 17) Escopo Liberado para a Faculdade (Entregáveis)
- Login brandeado com logo/cores da Instituição.
- Home do aluno com apresentação da IA e informações básicas da Instituição.
- Chat com a IA padrão da Instituição.
- Seção de assinatura/licença com status informativo (sem limites de uso).
- Área de links/comunicados relevantes da Instituição.
- Painel Subadmin da Instituição com:
  - Dashboard (usuarios ativos, conversas, uso)
  - Gestão de usuários (criar/excluir, convites, papéis)
  - IAs liberadas (listar, definir padrão) e base de conhecimento local
  - Relatórios e Auditoria
  - Configurações de branding (logo, cores, textos)

### 18) Escopo de Alterações no Admin Master
- Módulo “Faculdades” no admin master:
  - Dashboard de Faculdades (qtd de instituições, usuários ativos por instituição, conversas por período, top IAs usadas).
  - Gestão de Faculdades (CRUD, slug, logo, tema, textos de boas-vindas).
  - Gestão de IAs por Instituição (listar IAs globais, liberar/remover para uma Instituição, definir IA padrão).
  - Visão global de usuários por Instituição (contagens, status, atividade recente).
  - Relatórios agregados e Auditoria central por Instituição.
- Separação clara do painel existente: novas seções específicas de “Faculdades” sem alterar a lógica já existente do seu painel atual.

### 19) Apêndice A – Esboço de Migrações (SQL)
- 012_create_institutions.sql
- 013_create_institution_members.sql
- 014_alter_conversations_add_institution_id.sql
- 015_rls_policies_multi_tenant.sql
- 016_institution_branding_fields.sql (ajustes em settings_json e índices)
- 017_institution_assistants_default.sql (regras/índices para default por instituição)

### 20) Apêndice B – RBAC por Tenant (exemplo)
- Roles: subadmin, professor, aluno, suporte.
- institution_members(role) guia autorização de rotas e telas no subpainel.
