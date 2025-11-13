import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync } from "fs";
import { join } from "path";
import { getPgPool } from "@/lib/db/client";
import { getSupabaseClient } from "@/lib/db/client";

// Load environment variables from .env.local or .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

interface SeedRestaurant {
  name: string;
  logo_url: string;
}

interface SeedItem {
  restaurant: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  fiber: number;
  sugar: number;
}

interface SeedIngredient {
  name: string;
  calories_per_100g: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  fiber: number;
  sugar: number;
  allergen_flags: string[];
  image_url?: string;
}

interface SeedItemIngredient {
  item_name: string;
  restaurant: string;
  ingredient_name: string;
  quantity_g: number;
}

function parseRestaurantsCSV(content: string): SeedRestaurant[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");
  const restaurants: SeedRestaurant[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length < 1) continue;

    restaurants.push({
      name: values[0].trim(),
      logo_url: values[1]?.trim() || "",
    });
  }

  return restaurants;
}

function parseItemsCSV(content: string): SeedItem[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");
  const items: SeedItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length !== headers.length) continue;

    const item: any = {};
    headers.forEach((header, index) => {
      item[header.trim()] = values[index]?.trim() || "";
    });

    items.push({
      restaurant: item.restaurant || "",
      name: item.name || "",
      description: item.description || "",
      calories: parseFloat(item.calories) || 0,
      protein: parseFloat(item.protein) || 0,
      carbs: parseFloat(item.carbs) || 0,
      fat: parseFloat(item.fat) || 0,
      sodium: parseFloat(item.sodium) || 0,
      fiber: parseFloat(item.fiber) || 0,
      sugar: parseFloat(item.sugar) || 0,
    });
  }

  return items;
}

function parseIngredientsCSV(content: string): SeedIngredient[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  const ingredients: SeedIngredient[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle CSV parsing more carefully to account for quoted values
    const line = lines[i];
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Push last value

    if (values.length < 8) continue;

    const nameIndex = headers.indexOf("name");
    const caloriesIndex = headers.indexOf("calories_per_100g");
    const proteinIndex = headers.indexOf("protein");
    const carbsIndex = headers.indexOf("carbs");
    const fatIndex = headers.indexOf("fat");
    const sodiumIndex = headers.indexOf("sodium");
    const fiberIndex = headers.indexOf("fiber");
    const sugarIndex = headers.indexOf("sugar");
    const allergenIndex = headers.indexOf("allergen_flags");
    const imageIndex = headers.indexOf("image_url");

    const allergenStr = values[allergenIndex]?.trim() || "";
    const allergenFlags = allergenStr
      ? allergenStr.replace(/^"|"$/g, "").split(",").map((a) => a.trim()).filter(Boolean)
      : [];

    const imageUrl = imageIndex >= 0 && values[imageIndex] ? values[imageIndex].trim() : undefined;

    ingredients.push({
      name: values[nameIndex]?.trim() || "",
      calories_per_100g: parseFloat(values[caloriesIndex]) || 0,
      protein: parseFloat(values[proteinIndex]) || 0,
      carbs: parseFloat(values[carbsIndex]) || 0,
      fat: parseFloat(values[fatIndex]) || 0,
      sodium: parseFloat(values[sodiumIndex]) || 0,
      fiber: parseFloat(values[fiberIndex]) || 0,
      sugar: parseFloat(values[sugarIndex]) || 0,
      allergen_flags: allergenFlags,
      image_url: imageUrl,
    });
  }

  return ingredients;
}

function parseItemIngredientsCSV(content: string): SeedItemIngredient[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");
  const itemIngredients: SeedItemIngredient[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length !== headers.length) continue;

    itemIngredients.push({
      item_name: values[0].trim(),
      restaurant: values[1].trim(),
      ingredient_name: values[2].trim(),
      quantity_g: parseFloat(values[3]) || 0,
    });
  }

  return itemIngredients;
}

async function seedDatabase() {
  try {
    console.log("📊 MacScore Database Seeder");
    console.log("===========================\n");

    // Determine which database client to use
    const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const usePostgres = !!process.env.DATABASE_URL;

    if (!useSupabase && !usePostgres) {
      console.error("\n❌ Error: No database configuration found!");
      console.error("\nPlease configure your database by:");
      console.error("1. Copy .env.local.example to .env.local:");
      console.error("   cp .env.local.example .env.local");
      console.error("\n2. Edit .env.local and add either:");
      console.error("   - Supabase: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
      console.error("   - Postgres: DATABASE_URL");
      console.error("\n3. Or run the setup script:");
      console.error("   ./setup-env.sh");
      console.error("\nSee DATABASE_SETUP.md for detailed instructions.\n");
      throw new Error("No database configuration found. Please set up .env.local with database credentials.");
    }

    if (usePostgres) {
      await seedPostgres();
    } else if (useSupabase) {
      await seedSupabase();
    }

    console.log("\n✅ Seeding completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Error seeding database:", error);
    if (error instanceof Error) {
      console.error(`   ${error.message}\n`);
    }
    process.exit(1);
  }
}

async function seedPostgres() {
  const pool = getPgPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log("🔌 Using Postgres database...\n");

    // 1. Seed Restaurants
    console.log("1. Seeding restaurants...");
    const restaurantsCSV = readFileSync(join(process.cwd(), "data", "restaurants.csv"), "utf-8");
    const restaurants = parseRestaurantsCSV(restaurantsCSV);
    const restaurantMap = new Map<string, string>();

    for (const restaurant of restaurants) {
      const existing = await client.query("SELECT id FROM restaurants WHERE name = $1", [restaurant.name]);
      if (existing.rows.length > 0) {
        restaurantMap.set(restaurant.name, existing.rows[0].id);
      } else {
        const result = await client.query(
          "INSERT INTO restaurants (name, logo_url) VALUES ($1, $2) RETURNING id",
          [restaurant.name, restaurant.logo_url || null]
        );
        restaurantMap.set(restaurant.name, result.rows[0].id);
      }
    }
    console.log(`   ✅ Processed ${restaurantMap.size} restaurants\n`);

    // 2. Seed Ingredients
    console.log("2. Seeding ingredients...");
    const ingredientsCSV = readFileSync(join(process.cwd(), "data", "ingredients.csv"), "utf-8");
    const ingredients = parseIngredientsCSV(ingredientsCSV);
    const ingredientMap = new Map<string, string>();

    for (const ingredient of ingredients) {
      const existing = await client.query("SELECT id FROM ingredients WHERE name = $1", [ingredient.name]);
      if (existing.rows.length > 0) {
        ingredientMap.set(ingredient.name, existing.rows[0].id);
      } else {
        const result = await client.query(
          `INSERT INTO ingredients (name, calories_per_100g, protein, carbs, fat, sodium, fiber, sugar, allergen_flags, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
          [
            ingredient.name,
            ingredient.calories_per_100g,
            ingredient.protein,
            ingredient.carbs,
            ingredient.fat,
            ingredient.sodium,
            ingredient.fiber,
            ingredient.sugar,
            ingredient.allergen_flags,
            ingredient.image_url || null,
          ]
        );
        ingredientMap.set(ingredient.name, result.rows[0].id);
      }
    }
    console.log(`   ✅ Processed ${ingredientMap.size} ingredients\n`);

    // 3. Seed Items
    console.log("3. Seeding items...");
    const itemsCSV = readFileSync(join(process.cwd(), "data", "items.csv"), "utf-8");
    const items = parseItemsCSV(itemsCSV);
    const itemMap = new Map<string, string>();

    for (const item of items) {
      const restaurantId = restaurantMap.get(item.restaurant) || null;
      const itemKey = `${item.restaurant}:${item.name}`;

      const existing = await client.query(
        "SELECT id FROM items WHERE name = $1 AND restaurant_id = $2",
        [item.name, restaurantId]
      );

      if (existing.rows.length > 0) {
        itemMap.set(itemKey, existing.rows[0].id);
      } else {
        const result = await client.query(
          `INSERT INTO items (
            restaurant_id, name, description,
            base_calories, base_protein, base_carbs, base_fat,
            base_sodium, base_fiber, base_sugar
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
          [
            restaurantId,
            item.name,
            item.description,
            item.calories,
            item.protein,
            item.carbs,
            item.fat,
            item.sodium,
            item.fiber,
            item.sugar,
          ]
        );
        itemMap.set(itemKey, result.rows[0].id);
      }
    }
    console.log(`   ✅ Processed ${itemMap.size} items\n`);

    // 4. Seed Item-Ingredient Relationships
    console.log("4. Seeding item-ingredient relationships...");
    const itemIngredientsCSV = readFileSync(join(process.cwd(), "data", "item_ingredients.csv"), "utf-8");
    const itemIngredients = parseItemIngredientsCSV(itemIngredientsCSV);
    let itemIngredientCount = 0;

    for (const itemIngredient of itemIngredients) {
      const itemKey = `${itemIngredient.restaurant}:${itemIngredient.item_name}`;
      const itemId = itemMap.get(itemKey);
      const ingredientId = ingredientMap.get(itemIngredient.ingredient_name);

      if (!itemId || !ingredientId) {
        console.warn(`   ⚠️  Skipping: Item "${itemIngredient.item_name}" or ingredient "${itemIngredient.ingredient_name}" not found`);
        continue;
      }

      await client.query(
        `INSERT INTO item_ingredients (item_id, ingredient_id, quantity_g)
         VALUES ($1, $2, $3)
         ON CONFLICT (item_id, ingredient_id) DO UPDATE SET quantity_g = $3`,
        [itemId, ingredientId, itemIngredient.quantity_g]
      );
      itemIngredientCount++;
    }
    console.log(`   ✅ Processed ${itemIngredientCount} item-ingredient relationships\n`);

    await client.query("COMMIT");
    console.log("✅ All data seeded successfully!");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function seedSupabase() {
  const supabase = getSupabaseClient();

  console.log("🔌 Using Supabase database...\n");
  console.log("   Validating Supabase connection...");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  console.log(`   URL: ${url?.substring(0, 30)}...\n`);

  // Test connection
  const { error: testError } = await supabase.from("restaurants").select("id").limit(1);
  if (testError) {
    if (testError.message?.includes("does not exist") || testError.code === "42P01" || testError.message?.includes("relation")) {
      throw new Error(
        "Database tables do not exist. Please run the migration first:\n" +
        "1. Go to your Supabase dashboard → SQL Editor\n" +
        "2. Copy the contents of supabase/migrations/001_initial_schema.sql\n" +
        "3. Paste and run the SQL in the Supabase SQL Editor"
      );
    }
    throw testError;
  }
  console.log("   ✅ Database connection successful\n");

  // 1. Seed Restaurants
  console.log("1. Seeding restaurants...");
  const restaurantsCSV = readFileSync(join(process.cwd(), "data", "restaurants.csv"), "utf-8");
  const restaurants = parseRestaurantsCSV(restaurantsCSV);
  const restaurantMap = new Map<string, string>();

  for (const restaurant of restaurants) {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from("restaurants")
        .select("id")
        .eq("name", restaurant.name)
        .maybeSingle();

      if (fetchError && !fetchError.message?.includes("does not exist")) {
        console.error(`   ⚠️  Error checking restaurant "${restaurant.name}":`, fetchError.message);
      }

      if (existing && (existing as any).id) {
        restaurantMap.set(restaurant.name, (existing as any).id);
        console.log(`   ✓ Found existing: ${restaurant.name}`);
      } else {
        const { data: newRestaurant, error: insertError } = await supabase
          .from("restaurants")
          .insert({ name: restaurant.name, logo_url: restaurant.logo_url || null } as any)
          .select("id")
          .single();

        if (insertError) {
          console.error(`   ❌ Error inserting restaurant "${restaurant.name}":`, insertError.message);
          if (insertError.message?.includes("duplicate") || insertError.message?.includes("unique")) {
            // Try to fetch it again in case it was inserted by another process
            const { data: retryFetch } = await supabase
              .from("restaurants")
              .select("id")
              .eq("name", restaurant.name)
              .maybeSingle();
            if (retryFetch && (retryFetch as any).id) {
              restaurantMap.set(restaurant.name, (retryFetch as any).id);
              console.log(`   ✓ Found after retry: ${restaurant.name}`);
            }
          } else {
            throw insertError;
          }
        } else if (newRestaurant && (newRestaurant as any).id) {
          restaurantMap.set(restaurant.name, (newRestaurant as any).id);
          console.log(`   ✓ Inserted: ${restaurant.name}`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Failed to process restaurant "${restaurant.name}":`, error);
      throw error;
    }
  }
  console.log(`   ✅ Processed ${restaurantMap.size} restaurants\n`);

  // 2. Seed Ingredients
  console.log("2. Seeding ingredients...");
  const ingredientsCSV = readFileSync(join(process.cwd(), "data", "ingredients.csv"), "utf-8");
  const ingredients = parseIngredientsCSV(ingredientsCSV);
  const ingredientMap = new Map<string, string>();

  const ingredientsToInsert = ingredients.map((ing) => ({
    name: ing.name,
    calories_per_100g: ing.calories_per_100g,
    protein: ing.protein,
    carbs: ing.carbs,
    fat: ing.fat,
    sodium: ing.sodium,
    fiber: ing.fiber,
    sugar: ing.sugar,
    allergen_flags: ing.allergen_flags,
    image_url: ing.image_url || null,
  }));

  // Get existing ingredients
  const { data: existingIngredients } = await supabase.from("ingredients").select("id, name");
  if (existingIngredients) {
    existingIngredients.forEach((ing: any) => {
      if (ing.name && ing.id) {
        ingredientMap.set(ing.name, ing.id);
      }
    });
  }

  // Insert new ingredients
  const newIngredients = ingredients.filter((ing) => !ingredientMap.has(ing.name));
  if (newIngredients.length > 0) {
    const { error } = await supabase.from("ingredients").insert(
      newIngredients.map((ing) => ({
        name: ing.name,
        calories_per_100g: ing.calories_per_100g,
        protein: ing.protein,
        carbs: ing.carbs,
        fat: ing.fat,
        sodium: ing.sodium,
        fiber: ing.fiber,
        sugar: ing.sugar,
        allergen_flags: ing.allergen_flags,
        image_url: ing.image_url || null,
      })) as any
    );
    if (error && !error.message?.includes("duplicate")) throw error;

    // Refresh ingredient map
    const { data: allIngredients } = await supabase.from("ingredients").select("id, name");
    if (allIngredients) {
      allIngredients.forEach((ing: any) => {
        if (ing.name && ing.id) {
          ingredientMap.set(ing.name, ing.id);
        }
      });
    }
  }
  console.log(`   ✅ Processed ${ingredientMap.size} ingredients\n`);

  // 3. Seed Items
  console.log("3. Seeding items...");
  const itemsCSV = readFileSync(join(process.cwd(), "data", "items.csv"), "utf-8");
  const items = parseItemsCSV(itemsCSV);
  const itemMap = new Map<string, string>();

  // Get existing items
  const { data: existingItems } = await supabase.from("items").select("id, name, restaurant_id");
  if (existingItems) {
    existingItems.forEach((item: any) => {
      if (item.name && item.id) {
        const restaurantName = Array.from(restaurantMap.entries()).find(([_, id]) => id === item.restaurant_id)?.[0] || "";
        itemMap.set(`${restaurantName}:${item.name}`, item.id);
      }
    });
  }

  // Insert new items in batches
  const itemsToInsert = items
    .filter((item) => {
      const key = `${item.restaurant}:${item.name}`;
      return !itemMap.has(key);
    })
    .map((item) => ({
      restaurant_id: restaurantMap.get(item.restaurant) || null,
      name: item.name,
      description: item.description,
      base_calories: item.calories,
      base_protein: item.protein,
      base_carbs: item.carbs,
      base_fat: item.fat,
      base_sodium: item.sodium,
      base_fiber: item.fiber,
      base_sugar: item.sugar,
    }));

  if (itemsToInsert.length > 0) {
    // Insert in batches of 50
    for (let i = 0; i < itemsToInsert.length; i += 50) {
      const batch = itemsToInsert.slice(i, i + 50);
      const { data: inserted, error } = await supabase
        .from("items")
        .insert(batch as any)
        .select("id, name, restaurant_id");

      if (error && !error.message?.includes("duplicate")) throw error;

      if (inserted) {
        inserted.forEach((item: any) => {
          if (item.name && item.id) {
            const restaurantName = Array.from(restaurantMap.entries()).find(([_, id]) => id === item.restaurant_id)?.[0] || "";
            itemMap.set(`${restaurantName}:${item.name}`, item.id);
          }
        });
      }
    }
  }
  console.log(`   ✅ Processed ${itemMap.size} items\n`);

  // 4. Seed Item-Ingredient Relationships
  console.log("4. Seeding item-ingredient relationships...");
  const itemIngredientsCSV = readFileSync(join(process.cwd(), "data", "item_ingredients.csv"), "utf-8");
  const itemIngredients = parseItemIngredientsCSV(itemIngredientsCSV);
  const itemIngredientsToInsert: Array<{ item_id: string; ingredient_id: string; quantity_g: number }> = [];

  for (const itemIngredient of itemIngredients) {
    const itemKey = `${itemIngredient.restaurant}:${itemIngredient.item_name}`;
    const itemId = itemMap.get(itemKey);
    const ingredientId = ingredientMap.get(itemIngredient.ingredient_name);

    if (!itemId || !ingredientId) {
      console.warn(`   ⚠️  Skipping: Item "${itemIngredient.item_name}" or ingredient "${itemIngredient.ingredient_name}" not found`);
      continue;
    }

    itemIngredientsToInsert.push({
      item_id: itemId,
      ingredient_id: ingredientId,
      quantity_g: itemIngredient.quantity_g,
    });
  }

  if (itemIngredientsToInsert.length > 0) {
    // Insert in batches
    for (let i = 0; i < itemIngredientsToInsert.length; i += 100) {
      const batch = itemIngredientsToInsert.slice(i, i + 100);
      const { error } = await supabase.from("item_ingredients").upsert(batch as any, {
        onConflict: "item_id,ingredient_id",
      });

      if (error && !error.message?.includes("duplicate")) {
        console.error("Error inserting item-ingredients:", error);
        throw error;
      }
    }
  }
  console.log(`   ✅ Processed ${itemIngredientsToInsert.length} item-ingredient relationships\n`);

  console.log("✅ All data seeded successfully!");
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };