-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  base_calories DECIMAL(10, 2) NOT NULL DEFAULT 0,
  base_protein DECIMAL(10, 2) NOT NULL DEFAULT 0,
  base_carbs DECIMAL(10, 2) NOT NULL DEFAULT 0,
  base_fat DECIMAL(10, 2) NOT NULL DEFAULT 0,
  base_sodium DECIMAL(10, 2) NOT NULL DEFAULT 0,
  base_fiber DECIMAL(10, 2) NOT NULL DEFAULT 0,
  base_sugar DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  image_url TEXT,
  calories_per_100g DECIMAL(10, 2) NOT NULL DEFAULT 0,
  protein DECIMAL(10, 2) NOT NULL DEFAULT 0,
  carbs DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fat DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sodium DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fiber DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sugar DECIMAL(10, 2) NOT NULL DEFAULT 0,
  allergen_flags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Item ingredients junction table
CREATE TABLE IF NOT EXISTS item_ingredients (
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_g DECIMAL(10, 2) NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id, ingredient_id)
);

-- Allergens table
CREATE TABLE IF NOT EXISTS allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(10) NOT NULL UNIQUE
);

-- Item allergens junction table
CREATE TABLE IF NOT EXISTS item_allergens (
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  allergen_id UUID REFERENCES allergens(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, allergen_id)
);

-- Score profiles table
CREATE TABLE IF NOT EXISTS score_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  calories_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.20,
  protein_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.15,
  carbs_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.15,
  fat_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.15,
  sodium_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.15,
  fiber_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.10,
  sugar_weight DECIMAL(5, 4) NOT NULL DEFAULT 0.10,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT weights_sum CHECK (
    calories_weight + protein_weight + carbs_weight + fat_weight + 
    sodium_weight + fiber_weight + sugar_weight = 1.0
  )
);

-- Item scores cache table
CREATE TABLE IF NOT EXISTS item_scores (
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  score_profile_id UUID REFERENCES score_profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (item_id, score_profile_id)
);

-- User presets table
CREATE TABLE IF NOT EXISTS user_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  customizations_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_items_restaurant_id ON items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_item_ingredients_item_id ON item_ingredients(item_id);
CREATE INDEX IF NOT EXISTS idx_item_ingredients_ingredient_id ON item_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_item_scores_item_id ON item_scores(item_id);
CREATE INDEX IF NOT EXISTS idx_item_scores_profile_id ON item_scores(score_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_presets_user_id ON user_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);

-- Insert default score profile
INSERT INTO score_profiles (id, name, calories_weight, protein_weight, carbs_weight, fat_weight, sodium_weight, fiber_weight, sugar_weight, is_default)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Profile',
  0.20,
  0.15,
  0.15,
  0.15,
  0.15,
  0.10,
  0.10,
  TRUE
) ON CONFLICT (name) DO NOTHING;
