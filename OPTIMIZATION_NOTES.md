# Search Optimization Notes

## Overview
The search functionality has been optimized to use O(log n) complexity instead of O(n) sequential scans through the use of database indexes.

## Database Indexes

### 1. Trigram Indexes (GIN)
- **idx_items_name_trgm**: Enables fast ILIKE searches on item names
- **idx_ingredients_name_trgm**: Fast ingredient name searches
- **idx_items_description_trgm**: Future full-text search capabilities
- **idx_restaurants_name_trgm**: Restaurant name searches

### 2. Composite Indexes
- **idx_items_restaurant_name**: Optimizes restaurant + name filtered searches
- **idx_items_restaurant_covering**: Covering index for common query patterns (Postgres 11+)

### 3. B-tree Indexes
- **idx_items_restaurant_id**: Fast restaurant filtering
- **idx_items_created_at**: Sorting by creation date
- **idx_item_ingredients_item_id**: Fast ingredient lookups
- **idx_item_ingredients_ingredient_id**: Reverse ingredient lookups

## Performance Improvements

### Before Optimization
- **Text Search**: O(n) - Sequential scan of all items
- **Restaurant Filter**: O(n) - Sequential scan with filter
- **Search + Filter**: O(n) - Sequential scan with multiple filters

### After Optimization
- **Text Search**: O(log n) - Uses trigram GIN index
- **Restaurant Filter**: O(log n) - Uses B-tree index
- **Search + Filter**: O(log n) - Uses composite index + trigram index

## Query Examples

### Optimized Search Query
```sql
-- Uses idx_items_name_trgm for fast text search
SELECT * FROM items 
WHERE name ILIKE '%burger%'
ORDER BY name 
LIMIT 50;
```

### Optimized Restaurant + Search Query
```sql
-- Uses idx_items_restaurant_name and idx_items_name_trgm
SELECT * FROM items 
WHERE restaurant_id = $1 
AND name ILIKE $2
ORDER BY name 
LIMIT $3;
```

## Extension Required

The `pg_trgm` extension is required for trigram indexes:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

This extension is automatically created in the migration file `002_optimize_search_indexes.sql`.

## Sample Data

The project now includes comprehensive sample data:
- **9 Restaurants**: McDonald's, Burger King, KFC, Subway, Taco Bell, Pizza Hut, Domino's, Wendy's, Generic
- **70+ Items**: Various menu items from each restaurant
- **75+ Ingredients**: Complete ingredient database with nutritional information
- **200+ Item-Ingredient Relationships**: Detailed ingredient breakdowns for items

## Testing

To test the optimized search:
1. Run the migration: `psql $DATABASE_URL -f supabase/migrations/002_optimize_search_indexes.sql`
2. Seed the database: `npm run seed`
3. Test search performance in the application

## Notes

- Supabase automatically uses indexes created via migrations
- Postgres query planner will automatically use the best available index
- Trigram indexes are slightly larger than B-tree indexes but provide better text search performance
- The covering index (INCLUDE clause) requires Postgres 11+ and will be skipped on older versions

