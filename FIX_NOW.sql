-- Quick Fix: Disable RLS on restaurants table
-- Copy and paste this into Supabase SQL Editor and run it

ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;

-- Verify it worked
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'restaurants';

-- If you want to disable RLS on all public tables:
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE score_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE allergens DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_allergens DISABLE ROW LEVEL SECURITY;

