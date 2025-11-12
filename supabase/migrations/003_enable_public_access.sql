-- Enable public read access to public tables
-- This allows anonymous users to read restaurants, items, ingredients, etc.
-- Since this is a public menu/nutrition app, we want public read access

-- Disable RLS on public tables (or create policies to allow public read access)
-- Option 1: Disable RLS (simpler, but less secure - fine for public read-only data)
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE score_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE allergens DISABLE ROW LEVEL SECURITY;
ALTER TABLE item_allergens DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS and create policies (more secure, but requires policies)
-- Uncomment below if you prefer to use RLS with policies instead of disabling it

-- ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access to restaurants" ON restaurants
--   FOR SELECT USING (true);

-- ALTER TABLE items ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access to items" ON items
--   FOR SELECT USING (true);

-- ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access to ingredients" ON ingredients
--   FOR SELECT USING (true);

-- ALTER TABLE item_ingredients ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access to item_ingredients" ON item_ingredients
--   FOR SELECT USING (true);

-- ALTER TABLE score_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access to score_profiles" ON score_profiles
--   FOR SELECT USING (true);

-- ALTER TABLE item_scores ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access to item_scores" ON item_scores
--   FOR SELECT USING (true);

-- ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access to allergens" ON allergens
--   FOR SELECT USING (true);

-- ALTER TABLE item_allergens ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read access to item_allergens" ON item_allergens
--   FOR SELECT USING (true);

-- Note: user_presets table should remain with RLS enabled since it contains user-specific data
-- We'll create policies for it later when we implement user authentication

