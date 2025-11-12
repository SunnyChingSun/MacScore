-- Check RLS Status and Policies on restaurants table
-- Run this in Supabase SQL Editor

-- 1. Check if RLS is enabled
SELECT 
  tablename, 
  rowsecurity as "RLS Enabled",
  CASE 
    WHEN rowsecurity THEN 'RLS is ENABLED - This is blocking access!'
    ELSE 'RLS is DISABLED - This is good'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'restaurants';

-- 2. Check for any RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'restaurants';

-- 3. Count restaurants directly (bypasses any API filtering)
SELECT COUNT(*) as total_restaurants FROM restaurants;

-- 4. List all restaurants
SELECT id, name, created_at FROM restaurants ORDER BY name;

-- 5. If RLS is enabled, disable it:
-- ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;

-- 6. If there are policies, drop them:
-- DROP POLICY IF EXISTS "*" ON restaurants;
-- (Replace * with actual policy names from step 2)

