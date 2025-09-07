-- Migration: Enhance assistants table for full admin management
-- Description: Add fields for complete assistant management including icons, metadata, and audit trail

-- Add new fields for complete assistant management
ALTER TABLE public.assistants 
ADD COLUMN icon_url TEXT,
ADD COLUMN icon_type VARCHAR(10) DEFAULT 'svg' CHECK (icon_type IN ('svg', 'image', 'emoji')),
ADD COLUMN full_description TEXT,
ADD COLUMN features JSONB DEFAULT '[]',
ADD COLUMN order_index INTEGER DEFAULT 0,
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN openai_assistant_id VARCHAR(100),
ADD COLUMN specialization VARCHAR(100),
ADD COLUMN subscription_count INTEGER DEFAULT 0,
ADD COLUMN total_conversations INTEGER DEFAULT 0,
ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;

-- Update existing columns to have better defaults
ALTER TABLE public.assistants 
ALTER COLUMN monthly_price SET DEFAULT 39.90,
ALTER COLUMN semester_price SET DEFAULT 199.00;

-- Create indexes for better performance
CREATE INDEX idx_assistants_order ON public.assistants(order_index);
CREATE INDEX idx_assistants_created_by ON public.assistants(created_by);
CREATE INDEX idx_assistants_updated_at ON public.assistants(updated_at);
CREATE INDEX idx_assistants_area_active ON public.assistants(area, is_active);
CREATE INDEX idx_assistants_openai_id ON public.assistants(openai_assistant_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assistants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_assistants_updated_at
  BEFORE UPDATE ON public.assistants
  FOR EACH ROW
  EXECUTE FUNCTION update_assistants_updated_at();

-- Update existing assistants with proper openai_assistant_id mapping
UPDATE public.assistants SET openai_assistant_id = id WHERE openai_assistant_id IS NULL;

-- Set order_index for existing assistants based on creation order
WITH ordered_assistants AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.assistants
)
UPDATE public.assistants 
SET order_index = oa.rn
FROM ordered_assistants oa
WHERE public.assistants.id = oa.id;

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'activate', 'deactivate')),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('assistant', 'user', 'subscription')),
    entity_id VARCHAR(100) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit log
CREATE INDEX idx_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_entity ON public.admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON public.admin_audit_log(created_at);

-- Grant permissions
GRANT SELECT, UPDATE ON public.assistants TO authenticated;
GRANT ALL PRIVILEGES ON public.assistants TO service_role;
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL PRIVILEGES ON public.admin_audit_log TO service_role;

-- RLS policies for audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all audit logs
CREATE POLICY "admin_audit_log_select_policy" ON public.admin_audit_log
  FOR SELECT
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

-- Policy: Only system can insert audit logs
CREATE POLICY "admin_audit_log_insert_policy" ON public.admin_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON COLUMN public.assistants.icon_url IS 'URL of uploaded custom icon image';
COMMENT ON COLUMN public.assistants.icon_type IS 'Type of icon: svg, image, or emoji';
COMMENT ON COLUMN public.assistants.full_description IS 'Detailed description for admin panel';
COMMENT ON COLUMN public.assistants.features IS 'JSON array of assistant features';
COMMENT ON COLUMN public.assistants.order_index IS 'Display order in lists';
COMMENT ON COLUMN public.assistants.created_by IS 'Admin who created this assistant';
COMMENT ON COLUMN public.assistants.updated_by IS 'Admin who last updated this assistant';
COMMENT ON COLUMN public.assistants.openai_assistant_id IS 'OpenAI Assistant API ID';
COMMENT ON COLUMN public.assistants.specialization IS 'Specialization area description';
COMMENT ON COLUMN public.assistants.subscription_count IS 'Number of active subscriptions';
COMMENT ON COLUMN public.assistants.total_conversations IS 'Total number of conversations';
COMMENT ON COLUMN public.assistants.last_used_at IS 'Timestamp of last usage';