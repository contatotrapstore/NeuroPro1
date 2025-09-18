-- Migration: Add new areas (Neuromodulação and Terapia Ocupacional)
-- Description: Expand area categorization for new assistant types

-- Update area column to accept longer strings for new area names
ALTER TABLE public.assistants
ALTER COLUMN area TYPE VARCHAR(30);

-- Update any existing NULL values to default 'Psicologia'
UPDATE public.assistants
SET area = 'Psicologia'
WHERE area IS NULL;

-- Add comment to document the available areas
COMMENT ON COLUMN public.assistants.area IS 'Assistant specialization area: Psicologia, Psicopedagogia, Fonoaudiologia, Neuromodulação, Terapia Ocupacional';

-- Update the area constraint to include new areas
ALTER TABLE public.assistants DROP CONSTRAINT IF EXISTS chk_assistants_area;
ALTER TABLE public.assistants ADD CONSTRAINT chk_assistants_area
CHECK (area IN ('Psicologia', 'Psicopedagogia', 'Fonoaudiologia', 'Neuromodulação', 'Terapia Ocupacional'));

-- Create additional index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_assistants_area_performance ON public.assistants(area, is_active);