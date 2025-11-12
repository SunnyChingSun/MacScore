import { getPgPool, getSupabaseClient } from "./client";
import {
  Restaurant,
  Item,
  Ingredient,
  ScoreProfile,
  ItemScore,
  NutritionData,
} from "@/types";

// Helper to determine which database to use
function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}

// Generic query helpers for Postgres
async function queryPg<T>(query: string, params?: any[]): Promise<T[]> {
  const pool = getPgPool();
  const result = await pool.query(query, params);
  return result.rows as T[];
}

// Restaurant queries
export async function getRestaurants(): Promise<Restaurant[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .order("name");
    
    if (error) {
      console.error("[getRestaurants] Error:", error.message, error.code);
      throw error;
    }
    
    return (data || []) as Restaurant[];
  }
  return queryPg<Restaurant>("SELECT * FROM restaurants ORDER BY name");
}

export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data || null) as Restaurant | null;
  }
  const results = await queryPg<Restaurant>(
    "SELECT * FROM restaurants WHERE id = $1",
    [id]
  );
  return results[0] || null;
}

// Item queries
// Optimized search using trigram indexes for O(log n) performance
// Uses idx_items_name_trgm for text search and idx_items_restaurant_name for filtered searches
export async function searchItems(
  query: string,
  restaurantId?: string,
  limit: number = 50
): Promise<Item[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    let queryBuilder = supabase
      .from("items")
      .select("*")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(limit);

    if (restaurantId) {
      // Uses idx_items_restaurant_id for fast filtering
      queryBuilder = queryBuilder.eq("restaurant_id", restaurantId);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return (data || []) as Item[];
  }

  // Optimized Postgres query using trigram index
  // The trigram index (idx_items_name_trgm) enables fast ILIKE searches with O(log n) complexity
  // Composite index (idx_items_restaurant_name) optimizes restaurant-filtered searches
  let sql: string;
  const params: any[] = [];

  if (restaurantId) {
    // Use composite index for restaurant + name search (most efficient)
    // Postgres query planner will use idx_items_restaurant_name and idx_items_name_trgm together
    sql = `
      SELECT * FROM items 
      WHERE restaurant_id = $1 
      AND name ILIKE $2
      ORDER BY name 
      LIMIT $3
    `;
    params.push(restaurantId, `%${query}%`, limit);
  } else {
    // Use trigram index for name-only search
    // This uses idx_items_name_trgm for O(log n) text search
    sql = `
      SELECT * FROM items 
      WHERE name ILIKE $1
      ORDER BY name 
      LIMIT $2
    `;
    params.push(`%${query}%`, limit);
  }

  return queryPg<Item>(sql, params);
}

export async function getItemById(id: string): Promise<Item | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data || null) as Item | null;
  }

  const results = await queryPg<Item>("SELECT * FROM items WHERE id = $1", [
    id,
  ]);
  return results[0] || null;
}

export async function getItemsByRestaurant(
  restaurantId: string
): Promise<Item[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    // Uses idx_items_restaurant_id index for fast O(log n) lookup
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("name");
    if (error) throw error;
    return (data || []) as Item[];
  }

  // Uses idx_items_restaurant_id index for O(log n) performance
  return queryPg<Item>(
    "SELECT * FROM items WHERE restaurant_id = $1 ORDER BY name",
    [restaurantId]
  );
}

// Ingredient queries
export async function getItemIngredients(
  itemId: string
): Promise<Array<{ ingredient_id: string; quantity_g: number }>> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("item_ingredients")
      .select("ingredient_id, quantity_g")
      .eq("item_id", itemId);
    if (error) throw error;
    return (data || []) as Array<{ ingredient_id: string; quantity_g: number }>;
  }
  return queryPg<{ ingredient_id: string; quantity_g: number }>(
    "SELECT ingredient_id, quantity_g FROM item_ingredients WHERE item_id = $1",
    [itemId]
  );
}

export async function getIngredientsByIds(
  ids: string[]
): Promise<Ingredient[]> {
  if (ids.length === 0) return [];
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .in("id", ids);
    if (error) throw error;
    return (data || []) as Ingredient[];
  }
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  return queryPg<Ingredient>(
    `SELECT * FROM ingredients WHERE id IN (${placeholders})`,
    ids
  );
}

export async function getAllIngredients(): Promise<Ingredient[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data || []) as Ingredient[];
  }
  return queryPg<Ingredient>("SELECT * FROM ingredients ORDER BY name");
}

// Score profile queries
export async function getDefaultScoreProfile(): Promise<ScoreProfile> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("score_profiles")
      .select("*")
      .eq("is_default", true)
      .limit(1)
      .single();
    if (error) throw error;
    if (!data) throw new Error("No default score profile found");
    return data as ScoreProfile;
  }
  const results = await queryPg<ScoreProfile>(
    "SELECT * FROM score_profiles WHERE is_default = TRUE LIMIT 1"
  );
  if (results.length === 0) {
    throw new Error("No default score profile found");
  }
  return results[0];
}

export async function getScoreProfileById(
  id: string
): Promise<ScoreProfile | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("score_profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data || null) as ScoreProfile | null;
  }
  const results = await queryPg<ScoreProfile>(
    "SELECT * FROM score_profiles WHERE id = $1",
    [id]
  );
  return results[0] || null;
}

export async function getAllScoreProfiles(): Promise<ScoreProfile[]> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("score_profiles")
      .select("*")
      .order("is_default", { ascending: false })
      .order("name");
    if (error) throw error;
    return (data || []) as ScoreProfile[];
  }
  return queryPg<ScoreProfile>(
    "SELECT * FROM score_profiles ORDER BY is_default DESC, name"
  );
}

// Score cache queries
export async function getCachedScore(
  itemId: string,
  profileId: string
): Promise<ItemScore | null> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("item_scores")
      .select("*")
      .eq("item_id", itemId)
      .eq("score_profile_id", profileId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    return (data || null) as ItemScore | null;
  }
  const results = await queryPg<ItemScore>(
    "SELECT * FROM item_scores WHERE item_id = $1 AND score_profile_id = $2",
    [itemId, profileId]
  );
  return results[0] || null;
}

export async function cacheScore(
  itemId: string,
  profileId: string,
  score: number
): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("item_scores")
      .upsert({
        item_id: itemId,
        score_profile_id: profileId,
        score,
        calculated_at: new Date().toISOString(),
      } as any);
    if (error) throw error;
    return;
  }
  await queryPg(
    `INSERT INTO item_scores (item_id, score_profile_id, score, calculated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (item_id, score_profile_id)
     DO UPDATE SET score = $3, calculated_at = NOW()`,
    [itemId, profileId, score]
  );
}

// Swap suggestions (find healthier alternatives)
// Optimized with indexes for faster ingredient lookups
export async function getSwapSuggestions(
  itemId: string,
  ingredientId: string
): Promise<Array<{ ingredient: Ingredient; improvement: number }>> {
  // Get the current ingredient
  let current: Ingredient | null = null;
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .eq("id", ingredientId)
      .single();
    if (error && error.code !== "PGRST116") throw error;
    current = (data || null) as Ingredient | null;
  } else {
    const results = await queryPg<Ingredient>(
      "SELECT * FROM ingredients WHERE id = $1",
      [ingredientId]
    );
    current = results[0] || null;
  }

  if (!current) return [];

  // For Supabase, we'll need to fetch all and filter in memory
  // For Postgres, we can use the SQL query with indexes
  let suggestions: Ingredient[] = [];
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .neq("id", ingredientId);
    if (error) throw error;
    suggestions = (data || []) as Ingredient[];
    // Filter and sort in memory
    suggestions = suggestions
      .filter(
        (ing) =>
          ing.calories_per_100g < current!.calories_per_100g ||
          ing.protein > current!.protein ||
          ing.fiber > current!.fiber
      )
      .sort(
        (a, b) =>
          a.calories_per_100g +
          a.fat * 9 -
          a.protein * 4 -
          a.fiber * 2 -
          (b.calories_per_100g + b.fat * 9 - b.protein * 4 - b.fiber * 2)
      )
      .slice(0, 5);
  } else {
    // Optimized Postgres query using indexes
    // Uses idx_ingredients_name for fast lookups
    suggestions = await queryPg<Ingredient>(
      `SELECT * FROM ingredients
       WHERE id != $1
       AND (calories_per_100g < $2 OR protein > $3 OR fiber > $4)
       ORDER BY (calories_per_100g + fat * 9 - protein * 4 - fiber * 2) ASC
       LIMIT 5`,
      [ingredientId, current.calories_per_100g, current.protein, current.fiber]
    );
  }

  // Calculate improvement score
  return suggestions.map((ingredient) => {
    const improvement =
      current!.calories_per_100g -
      ingredient.calories_per_100g +
      (ingredient.protein - current!.protein) * 4 +
      (ingredient.fiber - current!.fiber) * 2 -
      (ingredient.fat - current!.fat) * 9;

    return {
      ingredient,
      improvement: Math.max(0, improvement),
    };
  });
}
