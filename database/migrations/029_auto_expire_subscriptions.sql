-- Migration: Auto-expire subscriptions
-- Purpose: Automatically mark subscriptions as 'expired' when they pass expires_at date
-- Created: 2025-11-10

-- ========================================
-- 1. Create function to expire old subscriptions
-- ========================================
CREATE OR REPLACE FUNCTION expire_old_subscriptions()
RETURNS TABLE(
  expired_count INTEGER,
  subscription_ids UUID[]
) AS $$
DECLARE
  affected_count INTEGER;
  affected_ids UUID[];
BEGIN
  -- Update subscriptions that are active but past expiration date
  WITH updated AS (
    UPDATE user_subscriptions
    SET
      status = 'expired',
      updated_at = NOW()
    WHERE status = 'active'
      AND expires_at < NOW()
    RETURNING id
  )
  SELECT
    COUNT(*)::INTEGER,
    ARRAY_AGG(id)
  INTO affected_count, affected_ids
  FROM updated;

  -- Log the expiration action (using 'update' as 'expire' is not in CHECK constraint)
  IF affected_count > 0 THEN
    INSERT INTO admin_audit_log (
      admin_id,
      action,
      entity_type,
      entity_id,
      changes,
      created_at
    )
    SELECT
      '00000000-0000-0000-0000-000000000000'::UUID, -- System user
      'update',
      'subscription',
      id::TEXT,
      jsonb_build_object(
        'expired_at', NOW(),
        'reason', 'automatic_expiration',
        'previous_status', 'active',
        'new_status', 'expired'
      ),
      NOW()
    FROM unnest(affected_ids) AS id;
  END IF;

  RETURN QUERY SELECT affected_count, affected_ids;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_old_subscriptions() IS 'Automatically expires subscriptions past their expiration date and logs the action';

-- ========================================
-- 2. Create scheduled job to run daily
-- ========================================
-- Note: This requires pg_cron extension
-- Execute manually in Supabase Dashboard > Database > Extensions
-- Then in Database > Cron Jobs, add:
--
-- SELECT cron.schedule(
--   'expire-subscriptions-daily',
--   '0 0 * * *', -- Every day at midnight UTC
--   $$SELECT expire_old_subscriptions();$$
-- );

-- ========================================
-- 3. Run once immediately to fix current state
-- ========================================
SELECT * FROM expire_old_subscriptions();

-- ========================================
-- 4. Create helper view for admin dashboard
-- ========================================
CREATE OR REPLACE VIEW subscription_health AS
SELECT
  COUNT(*) FILTER (WHERE status = 'active' AND expires_at > NOW()) as active_valid,
  COUNT(*) FILTER (WHERE status = 'active' AND expires_at <= NOW()) as active_expired_mismatch,
  COUNT(*) FILTER (WHERE status = 'expired') as expired,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) as total,
  NOW() as checked_at
FROM user_subscriptions;

COMMENT ON VIEW subscription_health IS 'Quick health check of subscription statuses vs actual expiration dates';

-- Grant access to authenticated users (read-only)
GRANT SELECT ON subscription_health TO authenticated;
GRANT SELECT ON subscription_health TO service_role;
