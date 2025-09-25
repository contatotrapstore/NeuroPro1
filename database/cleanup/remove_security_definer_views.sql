-- Script to remove SECURITY DEFINER views that are causing auth.users exposure
-- Run this in Supabase SQL Editor to fix security issues

-- First, check what views exist (for logging)
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('profiles', 'user_subscription_details', 'institution_users_detailed');

-- Remove problematic views with CASCADE to handle dependencies
DROP VIEW IF EXISTS public.profiles CASCADE;
DROP VIEW IF EXISTS public.user_subscription_details CASCADE;
DROP VIEW IF EXISTS public.institution_users_detailed CASCADE;

-- Also remove other potentially problematic views found in security scan
DROP VIEW IF EXISTS public.institution_assistants_detailed CASCADE;
DROP VIEW IF EXISTS public.abpsi_dashboard CASCADE;
DROP VIEW IF EXISTS public.institution_dashboard_metrics CASCADE;
DROP VIEW IF EXISTS public.institution_assistant_usage CASCADE;

-- Log completion
SELECT 'Views cleaned up successfully' as status;