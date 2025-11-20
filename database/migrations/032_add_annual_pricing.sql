-- Migration: Add annual pricing for assistants
-- Purpose: Support Black Friday promotion - Annual subscriptions at R$ 199.00
-- Created: 2025-11-20
-- Promotion: NOW until 01/11/2025

-- ========================================
-- 1. Add annual_price column to assistants table
-- ========================================

ALTER TABLE assistants
ADD COLUMN IF NOT EXISTS annual_price DECIMAL(10,2) DEFAULT 239.90;

COMMENT ON COLUMN assistants.annual_price IS 'Annual subscription price (12 months). Default: R$ 239.90 (saves ~17% vs monthly)';

-- ========================================
-- 2. Set promotional pricing for active assistants
-- ========================================

-- Black Friday: All active assistants at R$ 199.00/year
UPDATE assistants
SET annual_price = 199.00
WHERE is_active = true;

-- ========================================
-- 3. Verification
-- ========================================

SELECT
  id,
  name,
  monthly_price,
  semester_price,
  annual_price,
  is_active
FROM assistants
ORDER BY is_active DESC, name;

-- ========================================
-- Expected Result:
-- All active assistants should have:
-- - monthly_price: 39.90
-- - semester_price: 199.00
-- - annual_price: 199.00 (promotional)
-- ========================================
