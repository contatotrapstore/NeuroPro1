# Database Migrations

## Aplicar Migration: User Profiles View

Para resolver o problema dos dados mock nos endpoints admin, é necessário aplicar esta migration:

### 1. Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/avgoyfartmzepdgzhroc/sql
2. Copie todo o conteúdo de `create_user_profiles_view.sql`
3. Cole no SQL Editor
4. Execute com "Run"

### 2. Via CLI Supabase

```bash
# Se tiver o CLI instalado
supabase db push

# Ou aplicar manualmente
psql -f create_user_profiles_view.sql
```

### 3. Verificar se a Migration funcionou

Execute no SQL Editor:

```sql
-- Verificar se a view foi criada
SELECT * FROM user_profiles LIMIT 5;

-- Verificar se as policies foram aplicadas
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

## O que esta Migration faz:

- **Cria a view `user_profiles`**: Permite acesso aos dados de usuários sem Service Role Key
- **Adiciona RLS policies**: Permite leitura pública para funcionamento admin
- **Resolve dados mock**: Os endpoints admin agora buscarão dados REAIS dos usuários

## Após aplicar a migration:

Os endpoints `/admin/stats` e `/admin/users` passarão a retornar dados reais do banco ao invés de dados mock/falsos.