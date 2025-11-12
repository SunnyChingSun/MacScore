-- Enable pg_trgm extension for faster text search (trigram indexing)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop existing basic index on items.name if it exists
DROP INDEX IF EXISTS idx_items_name;

-- Create trigram index for fast ILIKE searches on item names
-- This enables O(log n) search instead of O(n) sequential scan
CREATE INDEX IF NOT EXISTS idx_items_name_trgm ON items USING gin (name gin_trgm_ops);

-- Create composite index for restaurant + name searches
-- This optimizes queries that filter by restaurant and search by name
CREATE INDEX IF NOT EXISTS idx_items_restaurant_name ON items(restaurant_id, name);

-- Note: GIN indexes on multiple columns aren't directly supported
-- The composite B-tree index (idx_items_restaurant_name) combined with 
-- the trigram index will be used efficiently by the query planner

-- Optimize ingredient name search
DROP INDEX IF EXISTS idx_ingredients_name;
CREATE INDEX IF NOT EXISTS idx_ingredients_name_trgm ON ingredients USING gin (name gin_trgm_ops);

-- Add index on description for future full-text search capabilities
CREATE INDEX IF NOT EXISTS idx_items_description_trgm ON items USING gin (description gin_trgm_ops);

-- Add index on items created_at for sorting
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);

-- Optimize restaurant name search
CREATE INDEX IF NOT EXISTS idx_restaurants_name_trgm ON restaurants USING gin (name gin_trgm_ops);

-- Add covering index for common queries (includes frequently accessed columns)
-- Note: INCLUDE clause requires Postgres 11+. For older versions, this will fail gracefully.
-- You can remove this index if you're using an older Postgres version.
DO $$
BEGIN
  IF (SELECT current_setting('server_version_num')::int >= 110000) THEN
    CREATE INDEX IF NOT EXISTS idx_items_restaurant_covering ON items(restaurant_id, name) 
    INCLUDE (id, base_calories, base_protein, base_carbs, base_fat, base_sodium, base_fiber, base_sugar);
  END IF;
END $$;

-- Analyze tables to update statistics for query planner
ANALYZE restaurants;
ANALYZE items;
ANALYZE ingredients;
ANALYZE item_ingredients;
