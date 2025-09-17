-- Script SQL para ativar assinaturas pendentes manualmente
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Verificar assinaturas pendentes criadas nas últimas 24 horas
SELECT
  us.id,
  us.user_id,
  u.email,
  u.name,
  us.assistant_id,
  us.subscription_type,
  us.amount,
  us.status,
  us.asaas_subscription_id,
  us.created_at
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
WHERE us.status = 'pending'
  AND us.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY us.created_at DESC;

-- 2. Ativar todas as assinaturas pendentes das últimas 24 horas
UPDATE user_subscriptions
SET
  status = 'active',
  expires_at = CASE
    WHEN subscription_type = 'monthly' THEN NOW() + INTERVAL '1 month'
    WHEN subscription_type = 'semester' THEN NOW() + INTERVAL '6 months'
    ELSE NOW() + INTERVAL '1 month'
  END,
  updated_at = NOW()
WHERE status = 'pending'
  AND created_at >= NOW() - INTERVAL '24 hours';

-- 3. Verificar pacotes pendentes e ativar também
SELECT
  up.id,
  up.user_id,
  u.email,
  u.name,
  up.package_type,
  up.subscription_type,
  up.total_amount,
  up.status,
  up.asaas_subscription_id,
  up.created_at
FROM user_packages up
JOIN users u ON up.user_id = u.id
WHERE up.status = 'pending'
  AND up.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY up.created_at DESC;

-- 4. Ativar pacotes pendentes
UPDATE user_packages
SET
  status = 'active',
  expires_at = CASE
    WHEN subscription_type = 'monthly' THEN NOW() + INTERVAL '1 month'
    WHEN subscription_type = 'semester' THEN NOW() + INTERVAL '6 months'
    ELSE NOW() + INTERVAL '1 month'
  END,
  updated_at = NOW()
WHERE status = 'pending'
  AND created_at >= NOW() - INTERVAL '24 hours';

-- 5. Verificar resultado final - assinaturas ativas
SELECT
  us.id,
  u.email,
  us.assistant_id,
  us.subscription_type,
  us.status,
  us.expires_at,
  us.updated_at
FROM user_subscriptions us
JOIN users u ON us.user_id = u.id
WHERE us.updated_at >= NOW() - INTERVAL '5 minutes'
  AND us.status = 'active'
ORDER BY us.updated_at DESC;