# Database Migrations

Este diretório contém as migrações SQL para configurar o banco de dados da NeuroIA Lab no Supabase.

## Ordem de Execução

Execute as migrações na seguinte ordem:

1. `001_create_assistants_table.sql` - Cria tabela de assistentes e insere os 14 assistentes
2. `002_create_user_packages_table.sql` - Cria tabela de pacotes de usuários
3. `003_create_user_subscriptions_table.sql` - Cria tabela de assinaturas
4. `004_create_conversations_table.sql` - Cria tabela de conversas
5. `005_create_messages_table.sql` - Cria tabela de mensagens

## Como Executar

### No Supabase Dashboard

1. Acesse o Supabase Dashboard
2. Vá para `SQL Editor`
3. Execute cada migration em ordem
4. Verifique se as tabelas foram criadas corretamente

### Via CLI do Supabase

```bash
# Executar todas as migrações
supabase db push

# Ou executar individualmente
supabase db reset
```

## Estrutura do Banco

### Tabelas Principais

- **assistants**: 14 assistentes de psicologia com IDs da OpenAI
- **user_packages**: Pacotes personalizáveis (3 ou 6 assistentes)
- **user_subscriptions**: Assinaturas individuais e por pacotes
- **conversations**: Conversas entre usuários e assistentes
- **messages**: Mensagens individuais das conversas

### Recursos de Segurança

- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Políticas de acesso** garantem que usuários vejam apenas seus dados
- **Foreign Keys** mantêm integridade referencial
- **Check constraints** validam dados de entrada

### Assistentes Incluídos

1. PsicoPlano - Formulador de Roteiro Terapêutico
2. NeuroCase - Revisor de Quadro Clínico
3. Guia Ético - Avaliação Profissional
4. SessãoMap - Formulador de Estrutura de Sessão
5. ClinReplay - Treinador de Sessão
6. CognitiMap - Reestruturação Cognitiva
7. MindRoute - Orientador de Abordagens
8. TheraTrack - Avaliador de Evolução
9. NeuroLaudo - Elaborador de Laudos
10. PsicoTest - Consultor de Testes
11. TheraFocus - Intervenções Específicas
12. PsicoBase - Estratégias Baseadas em Evidências
13. MindHome - Atividades Domiciliares
14. ClinPrice - Avaliador de Custos

## Modelo de Preços

- **Individual**: R$ 39,90/mês ou R$ 199,00/semestre
- **Pacote 3**: R$ 99,90/mês ou R$ 499,00/semestre
- **Pacote 6**: R$ 179,90/mês ou R$ 899,00/semestre