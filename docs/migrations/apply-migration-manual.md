# Como Aplicar a Migração 013 Manualmente

## Problema Identificado
O erro "permission denied for table users" ocorre porque faltam políticas RLS para permitir que admins atualizem a tabela `assistants`.

## Solução: Aplicar Migration 013

### Opção 1: Via Painel do Supabase (Recomendado)

1. **Acesse o painel do Supabase:**
   - URL: https://supabase.com/dashboard/project/avgoyfartmzepdgzhroc
   - Vá para "SQL Editor"

2. **Execute o seguinte SQL:**

```sql
-- Migration: Fix Admin Update Permissions
-- Purpose: Allow admin users to update assistants table and insert audit logs

-- Add policy for admins to update assistants
CREATE POLICY "Admins can update assistants" ON public.assistants
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.email IN ('admin@neuroialab.com', 'gouveiarx@gmail.com', 'psitales@gmail.com')
        OR auth.users.user_metadata->>'role' = 'admin'
      )
    )
  );

-- Add policy for admins to insert audit logs
CREATE POLICY "Admins can insert audit log" ON public.admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.email IN ('admin@neuroialab.com', 'gouveiarx@gmail.com', 'psitales@gmail.com')
        OR auth.users.user_metadata->>'role' = 'admin'
      )
    )
  );

-- Grant UPDATE permission on assistants to authenticated users
GRANT UPDATE ON public.assistants TO authenticated;

-- Grant INSERT permission on admin_audit_log to authenticated users
GRANT INSERT ON public.admin_audit_log TO authenticated;
```

3. **Clique em "Run" para executar**

### Opção 2: Via Supabase CLI

Se tiver o Supabase CLI instalado:

```bash
supabase db push
```

### Verificação

Após aplicar a migração, teste o upload de ícone novamente. O erro "permission denied for table users" deve ser resolvido.

## O que essa migração faz:

1. **Permite admins atualizarem assistentes:** Cria política RLS que permite usuários com emails específicos atualizarem a tabela `assistants`
2. **Permite inserir no audit log:** Admins podem registrar suas ações no log de auditoria
3. **Concede permissões necessárias:** Garante que usuários autenticados tenham as permissões básicas necessárias

## Emails de Admin Configurados:
- admin@neuroialab.com
- gouveiarx@gmail.com
- psitales@gmail.com

Usuários com esses emails ou com `user_metadata.role = 'admin'` poderão fazer upload de ícones.