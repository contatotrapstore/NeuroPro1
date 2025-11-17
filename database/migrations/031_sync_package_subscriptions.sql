-- Migration: Sync package subscriptions with package status and expiration
-- Purpose: Fix inconsistencies where packages are active but subscriptions are expired/pending
-- Created: 2025-11-15

-- ========================================
-- 1. Immediate fix: Sync all existing inconsistencies
-- ========================================

-- Sync subscriptions expires_at and status with their packages
UPDATE user_subscriptions us
SET
  status = up.status,
  expires_at = up.expires_at,
  updated_at = NOW()
FROM user_packages up
WHERE us.package_id = up.id
  AND (
    us.status != up.status
    OR us.expires_at != up.expires_at
  );

-- ========================================
-- 2. Create function to sync package subscriptions
-- ========================================

CREATE OR REPLACE FUNCTION sync_package_subscriptions()
RETURNS TABLE(
  synced_count INTEGER,
  package_ids UUID[]
) AS $$
DECLARE
  affected_count INTEGER;
  affected_ids UUID[];
BEGIN
  -- Update subscriptions to match their package status and expiration
  WITH updated AS (
    UPDATE user_subscriptions us
    SET
      status = up.status,
      expires_at = up.expires_at,
      updated_at = NOW()
    FROM user_packages up
    WHERE us.package_id = up.id
      AND (
        us.status != up.status
        OR us.expires_at != up.expires_at
      )
    RETURNING us.package_id
  )
  SELECT COUNT(DISTINCT package_id)::INTEGER, ARRAY_AGG(DISTINCT package_id)
  INTO affected_count, affected_ids
  FROM updated;

  -- Log to admin_audit_log
  IF affected_count > 0 THEN
    INSERT INTO admin_audit_log (
      admin_id,
      action,
      entity_type,
      entity_id,
      changes,
      created_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000'::UUID,
      'update',
      'subscription',
      'bulk_sync',
      jsonb_build_object(
        'action', 'sync_package_subscriptions',
        'packages_synced', affected_count,
        'package_ids', affected_ids,
        'timestamp', NOW()
      ),
      NOW()
    );
  END IF;

  RETURN QUERY SELECT affected_count, affected_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sync_package_subscriptions() IS
  'Synchronizes user_subscriptions status and expires_at with their parent user_packages';

-- ========================================
-- 3. Create monitoring view for package-subscription consistency
-- ========================================

CREATE OR REPLACE VIEW package_subscription_health AS
SELECT
  COUNT(DISTINCT up.id) FILTER (
    WHERE up.status = 'active'
    AND up.expires_at > NOW()
    AND EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.package_id = up.id
        AND us.status = 'active'
        AND us.expires_at = up.expires_at
    )
  ) as healthy_packages,

  COUNT(DISTINCT up.id) FILTER (
    WHERE up.status = 'active'
    AND up.expires_at > NOW()
    AND EXISTS (
      SELECT 1 FROM user_subscriptions us
      WHERE us.package_id = up.id
        AND (us.status != up.status OR us.expires_at != up.expires_at)
    )
  ) as inconsistent_packages,

  COUNT(DISTINCT up.id) FILTER (
    WHERE up.status = 'active'
    AND up.expires_at > NOW()
  ) as total_active_packages,

  NOW() as checked_at
FROM user_packages up;

COMMENT ON VIEW package_subscription_health IS
  'Monitors consistency between packages and their subscriptions';

-- ========================================
-- 4. Grant permissions
-- ========================================

-- Allow service role to execute function
GRANT EXECUTE ON FUNCTION sync_package_subscriptions() TO service_role;
GRANT EXECUTE ON FUNCTION sync_package_subscriptions() TO authenticated;

-- Allow viewing health status
GRANT SELECT ON package_subscription_health TO service_role;
GRANT SELECT ON package_subscription_health TO authenticated;

-- ========================================
-- 5. Verification
-- ========================================

-- Check results
SELECT * FROM package_subscription_health;

-- Manual execution if needed: SELECT * FROM sync_package_subscriptions();
