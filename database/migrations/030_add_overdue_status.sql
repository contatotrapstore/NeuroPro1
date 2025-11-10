-- Migration: Add 'overdue' status to subscription status constraint
-- Purpose: Allow webhook to set subscriptions as 'overdue' when PAYMENT_OVERDUE event occurs
-- Created: 2025-11-10

-- ========================================
-- 1. Drop existing constraint
-- ========================================
ALTER TABLE user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

-- ========================================
-- 2. Add new constraint with 'overdue' status
-- ========================================
ALTER TABLE user_subscriptions
ADD CONSTRAINT user_subscriptions_status_check
CHECK (status IN ('pending', 'active', 'cancelled', 'expired', 'overdue'));

COMMENT ON CONSTRAINT user_subscriptions_status_check ON user_subscriptions IS 'Valid subscription statuses: pending, active, cancelled, expired, overdue';

-- ========================================
-- 3. Verification query
-- ========================================
-- Check that constraint was updated successfully
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'user_subscriptions_status_check';
