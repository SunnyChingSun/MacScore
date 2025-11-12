// Database Types
export interface Restaurant {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: Date;
}

export interface Item {
  id: string;
  restaurant_id: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  base_calories: number;
  base_protein: number;
  base_carbs: number;
  base_fat: number;
  base_sodium: number;
  base_fiber: number;
  base_sugar: number;
  created_at: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  calories_per_100g: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  fiber: number;
  sugar: number;
  allergen_flags: string[];
  created_at: Date;
}

export interface ItemIngredient {
  item_id: string;
  ingredient_id: string;
  quantity_g: number;
}

export interface Allergen {
  id: string;
  name: string;
  code: string;
}

export interface ItemAllergen {
  item_id: string;
  allergen_id: string;
}

export interface ScoreProfile {
  id: string;
  name: string;
  calories_weight: number;
  protein_weight: number;
  carbs_weight: number;
  fat_weight: number;
  sodium_weight: number;
  fiber_weight: number;
  sugar_weight: number;
  is_default: boolean;
  created_at: Date;
}

export interface ItemScore {
  item_id: string;
  score_profile_id: string;
  score: number;
  calculated_at: Date;
}

export interface UserPreset {
  id: string;
  user_id: string | null;
  name: string;
  item_id: string;
  customizations_json: Record<string, any>;
  created_at: Date;
}

// Application Types
export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  fiber: number;
  sugar: number;
}

export interface Customization {
  ingredient_id: string;
  action: 'add' | 'remove' | 'modify';
  quantity_g?: number;
  multiplier?: number;
}

export interface MealItem {
  id: string;
  item_id: string;
  item: Item;
  customizations: Customization[];
  nutrition: NutritionData;
  score: number;
}

export interface MealTray {
  items: MealItem[];
  totalNutrition: NutritionData;
  totalScore: number;
}

export interface SwapSuggestion {
  ingredient_id: string;
  ingredient: Ingredient;
  reason: string;
  improvement: number;
}
