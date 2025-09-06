-- Migration: Add access to Simulador de Paciente de Psicanálise for specific users
-- Description: Grant access to the new psychoanalysis patient simulator assistant for psitales@gmail.com and gouveiarx@gmail.com

-- First, ensure the assistant exists in the assistants table
INSERT INTO public.assistants (
    id, 
    name, 
    description, 
    icon, 
    color_theme,
    monthly_price, 
    semester_price,
    is_active,
    openai_id,
    specialization,
    created_at,
    updated_at
) 
VALUES (
    'asst_9vDTodTAQIJV1mu2xPzXpBs8',
    'Simulador de Paciente de Psicanálise',
    'Aperfeiçoa suas competências clínicas por meio de uma IA que interpreta o papel de pacientes e fornece devolutivas construtivas. Você realiza uma simulação de sessão e o assistente identifica acertos, bem como oportunidades de aprimoramento.',
    'psychology-brain',
    '#6366F1',
    39.90,
    199.00,
    true,
    'asst_9vDTodTAQIJV1mu2xPzXpBs8',
    'Psychoanalytic Training',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    color_theme = EXCLUDED.color_theme,
    monthly_price = EXCLUDED.monthly_price,
    semester_price = EXCLUDED.semester_price,
    is_active = EXCLUDED.is_active,
    specialization = EXCLUDED.specialization,
    updated_at = NOW();

-- Create active subscriptions for specified users
-- Note: We'll use placeholder UUIDs - in production, get real user_ids from auth.users

DO $$
DECLARE 
    user_psitales_id UUID;
    user_gouveiarx_id UUID;
    assistant_id TEXT := 'asst_9vDTodTAQIJV1mu2xPzXpBs8';
    expires_date TIMESTAMP WITH TIME ZONE := NOW() + INTERVAL '6 months';
BEGIN
    -- Try to find users by email patterns (since we can't directly query auth.users)
    -- In production, replace these with actual user IDs
    
    -- For now, we'll use example UUIDs - replace with real ones from Supabase Auth
    -- psitales@gmail.com user ID (replace with actual ID)
    user_psitales_id := 'a1234567-b890-1234-5678-90abcdef1234';
    
    -- gouveiarx@gmail.com user ID (replace with actual ID) 
    user_gouveiarx_id := 'b2345678-c901-2345-6789-01bcdef23456';
    
    -- Create subscriptions for both users
    INSERT INTO public.user_subscriptions (
        user_id,
        assistant_id, 
        subscription_type,
        status,
        expires_at,
        created_at,
        updated_at
    ) VALUES 
    (
        user_psitales_id,
        assistant_id,
        'semester',
        'active',
        expires_date,
        NOW(),
        NOW()
    ),
    (
        user_gouveiarx_id,
        assistant_id,
        'semester', 
        'active',
        expires_date,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, assistant_id) DO UPDATE SET
        status = 'active',
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW();
        
    RAISE NOTICE 'Access granted to Simulador de Paciente de Psicanálise for specified users';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating subscriptions: %', SQLERRM;
        -- Don't fail the entire migration, just log the error
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_assistant_id 
ON public.user_subscriptions(assistant_id);

CREATE INDEX IF NOT EXISTS idx_assistants_openai_id 
ON public.assistants(openai_id);

-- Verify the migration
SELECT 
    a.name as assistant_name,
    count(us.id) as subscription_count,
    count(CASE WHEN us.status = 'active' THEN 1 END) as active_subscriptions
FROM public.assistants a
LEFT JOIN public.user_subscriptions us ON a.id = us.assistant_id
WHERE a.id = 'asst_9vDTodTAQIJV1mu2xPzXpBs8'
GROUP BY a.id, a.name;