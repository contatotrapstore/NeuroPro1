-- Migration: Fix Admin Update Permissions
-- Purpose: Allow admin users to update assistants table and insert audit logs
-- Date: 2024-01-02

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

-- Grant UPDATE permission on assistants to authenticated users (required for RLS policies)
GRANT UPDATE ON public.assistants TO authenticated;

-- Grant INSERT permission on admin_audit_log to authenticated users
GRANT INSERT ON public.admin_audit_log TO authenticated;

-- Add comments for documentation
COMMENT ON POLICY "Admins can update assistants" ON public.assistants
IS 'Permite que usuários admin atualizem assistentes, necessário para upload de ícones';

COMMENT ON POLICY "Admins can insert audit log" ON public.admin_audit_log
IS 'Permite que usuários admin insiram registros no log de auditoria';

-- Display migration completion message
DO $$
BEGIN
    RAISE NOTICE 'Migration 013 completed: Admin update permissions fixed';
END $$;