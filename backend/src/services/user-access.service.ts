import { supabase } from '../config/supabase';

/**
 * Optimized user access validation service
 * Eliminates N+1 queries by batching user access checks
 */
export class UserAccessService {
  
  /**
   * Check if user has access to a specific assistant
   * Optimized to avoid multiple database calls
   */
  static async validateUserAccess(userId: string, assistantId: string): Promise<{
    hasAccess: boolean;
    accessType: 'individual' | 'package' | null;
    subscription?: any;
    package?: any;
  }> {
    const currentTime = new Date().toISOString();
    
    // Single query to check both individual and package access
    const { data: accessCheck, error } = await supabase.rpc('check_user_assistant_access', {
      p_user_id: userId,
      p_assistant_id: assistantId,
      p_current_time: currentTime
    });

    if (error) {
      console.error('Error checking user access:', error);
      return { hasAccess: false, accessType: null };
    }

    return accessCheck || { hasAccess: false, accessType: null };
  }

  /**
   * Get all accessible assistants for a user
   * Optimized single query with joins
   */
  static async getUserAccessibleAssistants(userId: string) {
    const currentTime = new Date().toISOString();

    // Optimized query using a single call with joins
    const { data, error } = await supabase
      .from('assistants')
      .select(`
        id,
        name,
        description,
        icon,
        color_theme,
        openai_assistant_id,
        is_active,
        user_subscriptions!inner(
          id,
          status,
          expires_at,
          subscription_type
        )
      `)
      .eq('user_subscriptions.user_id', userId)
      .eq('user_subscriptions.status', 'active')
      .gte('user_subscriptions.expires_at', currentTime)
      .eq('is_active', true);

    if (error) {
      console.error('Error getting user accessible assistants:', error);
      throw new Error('Failed to get user accessible assistants');
    }

    // Also check package access
    const { data: packageAssistants, error: packageError } = await supabase
      .from('user_packages')
      .select(`
        assistant_ids,
        status,
        expires_at,
        package_type,
        assistants:assistant_ids(
          id,
          name,
          description,
          icon,
          color_theme,
          openai_assistant_id,
          is_active
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', currentTime);

    if (packageError) {
      console.error('Error getting package assistants:', packageError);
    }

    // Merge individual and package assistants, avoiding duplicates
    const assistantMap = new Map();
    
    // Add individual subscriptions
    data?.forEach(assistant => {
      assistantMap.set(assistant.id, {
        ...assistant,
        accessType: 'individual'
      });
    });

    // Add package assistants
    packageAssistants?.forEach(pkg => {
      if (pkg.assistants) {
        const assistantIds = Array.isArray(pkg.assistant_ids) ? pkg.assistant_ids : [pkg.assistant_ids];
        assistantIds.forEach((assistantId: string) => {
          // Only add if not already present from individual subscription
          if (!assistantMap.has(assistantId)) {
            assistantMap.set(assistantId, {
              id: assistantId,
              accessType: 'package',
              packageType: pkg.package_type
            });
          }
        });
      }
    });

    return Array.from(assistantMap.values());
  }

  /**
   * Batch validate multiple assistant access for a user
   * Optimized for multiple assistant checks at once
   */
  static async batchValidateAccess(userId: string, assistantIds: string[]): Promise<{
    [assistantId: string]: {
      hasAccess: boolean;
      accessType: 'individual' | 'package' | null;
    }
  }> {
    const currentTime = new Date().toISOString();
    
    // Get all user subscriptions in one query
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('assistant_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', currentTime)
      .in('assistant_id', assistantIds);

    // Get all user packages in one query
    const { data: packages, error: pkgError } = await supabase
      .from('user_packages')
      .select('assistant_ids')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('expires_at', currentTime);

    if (subError || pkgError) {
      console.error('Error in batch access validation:', subError || pkgError);
      throw new Error('Failed to validate batch access');
    }

    // Build result map
    const result: any = {};
    
    // Initialize all as no access
    assistantIds.forEach(id => {
      result[id] = { hasAccess: false, accessType: null };
    });

    // Mark individual subscriptions
    subscriptions?.forEach(sub => {
      result[sub.assistant_id] = {
        hasAccess: true,
        accessType: 'individual'
      };
    });

    // Mark package access
    packages?.forEach(pkg => {
      const packageAssistantIds = Array.isArray(pkg.assistant_ids) ? pkg.assistant_ids : [pkg.assistant_ids];
      packageAssistantIds.forEach((assistantId: string) => {
        if (assistantIds.includes(assistantId) && !result[assistantId].hasAccess) {
          result[assistantId] = {
            hasAccess: true,
            accessType: 'package'
          };
        }
      });
    });

    return result;
  }

  /**
   * Get user access summary (optimized single query)
   */
  static async getUserAccessSummary(userId: string) {
    const currentTime = new Date().toISOString();

    // Use a single optimized query with joins
    const [subscriptionsResult, packagesResult] = await Promise.all([
      supabase
        .from('user_subscriptions')
        .select(`
          id,
          status,
          expires_at,
          subscription_type,
          assistants(
            id,
            name,
            icon
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('expires_at', currentTime),
      
      supabase
        .from('user_packages')
        .select(`
          id,
          status,
          expires_at,
          package_type,
          assistant_ids
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('expires_at', currentTime)
    ]);

    return {
      subscriptions: subscriptionsResult.data || [],
      packages: packagesResult.data || [],
      total_active_subscriptions: subscriptionsResult.data?.length || 0,
      total_active_packages: packagesResult.data?.length || 0
    };
  }
}

// Database function for optimized access check (to be created via migration)
export const createAccessCheckFunction = `
CREATE OR REPLACE FUNCTION check_user_assistant_access(
    p_user_id UUID,
    p_assistant_id UUID,
    p_current_time TIMESTAMP WITH TIME ZONE
)
RETURNS JSON AS $$
DECLARE
    individual_access RECORD;
    package_access RECORD;
    result JSON;
BEGIN
    -- Check individual subscription
    SELECT INTO individual_access
        id, subscription_type
    FROM user_subscriptions
    WHERE user_id = p_user_id
        AND assistant_id = p_assistant_id
        AND status = 'active'
        AND expires_at >= p_current_time
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
        id, package_type
    FROM user_packages
    WHERE user_id = p_user_id
        AND p_assistant_id = ANY(assistant_ids)
        AND status = 'active'
        AND expires_at >= p_current_time
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
$$ LANGUAGE plpgsql;
`;