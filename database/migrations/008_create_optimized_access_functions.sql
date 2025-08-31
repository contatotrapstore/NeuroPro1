-- Migration: Create optimized access check functions
-- Purpose: Eliminate N+1 queries by using database functions for access validation

-- Function to check user access to specific assistant (individual + package)
CREATE OR REPLACE FUNCTION check_user_assistant_access(
    p_user_id UUID,
    p_assistant_id UUID,
    p_current_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
    individual_access RECORD;
    package_access RECORD;
    result JSON;
BEGIN
    -- Check individual subscription first (higher priority)
    SELECT INTO individual_access
        id, subscription_type, expires_at
    FROM user_subscriptions
    WHERE user_id = p_user_id
        AND assistant_id = p_assistant_id
        AND status = 'active'
        AND expires_at >= p_current_time
    ORDER BY expires_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        result := json_build_object(
            'hasAccess', true,
            'accessType', 'individual',
            'subscription', row_to_json(individual_access)
        );
        RETURN result;
    END IF;
    
    -- Check package access
    SELECT INTO package_access
        id, package_type, expires_at, assistant_ids
    FROM user_packages
    WHERE user_id = p_user_id
        AND p_assistant_id = ANY(assistant_ids)
        AND status = 'active'
        AND expires_at >= p_current_time
    ORDER BY expires_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        result := json_build_object(
            'hasAccess', true,
            'accessType', 'package',
            'package', row_to_json(package_access)
        );
        RETURN result;
    END IF;
    
    -- No access found
    result := json_build_object(
        'hasAccess', false,
        'accessType', null
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all accessible assistants for a user (optimized)
CREATE OR REPLACE FUNCTION get_user_accessible_assistants(
    p_user_id UUID,
    p_current_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    assistant_id UUID,
    assistant_name TEXT,
    assistant_description TEXT,
    assistant_icon TEXT,
    assistant_color_theme TEXT,
    openai_assistant_id TEXT,
    access_type TEXT,
    subscription_id UUID,
    package_id UUID,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Return individual subscriptions
    RETURN QUERY
    SELECT 
        a.id as assistant_id,
        a.name as assistant_name,
        a.description as assistant_description,
        a.icon as assistant_icon,
        a.color_theme as assistant_color_theme,
        a.openai_assistant_id,
        'individual'::TEXT as access_type,
        us.id as subscription_id,
        NULL::UUID as package_id,
        us.expires_at
    FROM assistants a
    INNER JOIN user_subscriptions us ON us.assistant_id = a.id
    WHERE us.user_id = p_user_id
        AND us.status = 'active'
        AND us.expires_at >= p_current_time
        AND a.is_active = true
    
    UNION
    
    -- Return package assistants (only those not already covered by individual subscriptions)
    SELECT DISTINCT
        a.id as assistant_id,
        a.name as assistant_name,
        a.description as assistant_description,
        a.icon as assistant_icon,
        a.color_theme as assistant_color_theme,
        a.openai_assistant_id,
        'package'::TEXT as access_type,
        NULL::UUID as subscription_id,
        up.id as package_id,
        up.expires_at
    FROM assistants a
    INNER JOIN user_packages up ON a.id = ANY(up.assistant_ids)
    WHERE up.user_id = p_user_id
        AND up.status = 'active'
        AND up.expires_at >= p_current_time
        AND a.is_active = true
        AND a.id NOT IN (
            -- Exclude assistants already covered by individual subscriptions
            SELECT us.assistant_id
            FROM user_subscriptions us
            WHERE us.user_id = p_user_id
                AND us.status = 'active'
                AND us.expires_at >= p_current_time
        )
    ORDER BY expires_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user access summary (optimized)
CREATE OR REPLACE FUNCTION get_user_access_summary(
    p_user_id UUID,
    p_current_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
    subscriptions_count INTEGER;
    packages_count INTEGER;
    result JSON;
BEGIN
    -- Count active subscriptions
    SELECT COUNT(*) INTO subscriptions_count
    FROM user_subscriptions
    WHERE user_id = p_user_id
        AND status = 'active'
        AND expires_at >= p_current_time;
    
    -- Count active packages
    SELECT COUNT(*) INTO packages_count
    FROM user_packages
    WHERE user_id = p_user_id
        AND status = 'active'
        AND expires_at >= p_current_time;
    
    result := json_build_object(
        'total_active_subscriptions', subscriptions_count,
        'total_active_packages', packages_count,
        'has_active_access', (subscriptions_count > 0 OR packages_count > 0)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active_lookup 
ON user_subscriptions(user_id, assistant_id, status, expires_at) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_user_packages_active_lookup 
ON user_packages(user_id, status, expires_at) 
WHERE status = 'active';

-- Index on assistant_ids array for package lookups
CREATE INDEX IF NOT EXISTS idx_user_packages_assistant_ids 
ON user_packages USING GIN(assistant_ids);

COMMENT ON FUNCTION check_user_assistant_access IS 
'Optimized function to check if user has access to specific assistant via individual subscription or package';

COMMENT ON FUNCTION get_user_accessible_assistants IS 
'Returns all assistants accessible to user with access type and expiration info';

COMMENT ON FUNCTION get_user_access_summary IS 
'Returns summary of user access including counts of active subscriptions and packages';