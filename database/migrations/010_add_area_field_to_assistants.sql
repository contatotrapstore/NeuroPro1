-- Migration: Add 'area' field to assistants table
-- Description: Add area categorization (Psicologia, Psicopedagogia, Fonoaudiologia) for better organization

-- Add area field to assistants table
ALTER TABLE public.assistants 
ADD COLUMN area VARCHAR(20) DEFAULT 'Psicologia';

-- Create index for better performance on area filtering
CREATE INDEX idx_assistants_area ON public.assistants(area);

-- Update PsicopedIA to Psicopedagogia area
UPDATE public.assistants 
SET area = 'Psicopedagogia' 
WHERE id = 'psicopedia' OR name = 'PsicopedIA';

-- Update all other assistants to Psicologia (default is already set, but being explicit)
UPDATE public.assistants 
SET area = 'Psicologia' 
WHERE area IS NULL OR (id != 'psicopedia' AND name != 'PsicopedIA');

-- Add constraint to ensure only valid areas
ALTER TABLE public.assistants 
ADD CONSTRAINT chk_assistants_area 
CHECK (area IN ('Psicologia', 'Psicopedagogia', 'Fonoaudiologia'));

-- Make area NOT NULL after setting defaults
ALTER TABLE public.assistants 
ALTER COLUMN area SET NOT NULL;

-- Update RLS policies if needed (assistants table should already have proper RLS)
-- The existing policies should work fine with the new area field

-- Add comment to document the field
COMMENT ON COLUMN public.assistants.area IS 'Área de especialização do assistente (Psicologia, Psicopedagogia, Fonoaudiologia)';