import { NutritionData, Item, Ingredient, Customization } from "@/types";

/**
 * Calculate nutrition from item and customizations
 */
export function calculateNutrition(
  item: Item,
  ingredients: Ingredient[],
  itemIngredients: Array<{ ingredient_id: string; quantity_g: number }>,
  customizations: Customization[] = []
): NutritionData {
  // Start with base nutrition
  let nutrition: NutritionData = {
    calories: item.base_calories,
    protein: item.base_protein,
    carbs: item.base_carbs,
    fat: item.base_fat,
    sodium: item.base_sodium,
    fiber: item.base_fiber,
    sugar: item.base_sugar,
  };

  // Create a map of ingredient modifications
  const modificationMap = new Map<
    string,
    { action: string; quantity_g?: number; multiplier?: number }
  >();

  customizations.forEach((custom) => {
    modificationMap.set(custom.ingredient_id, {
      action: custom.action,
      quantity_g: custom.quantity_g,
      multiplier: custom.multiplier,
    });
  });

  // Apply customizations to each ingredient
  itemIngredients.forEach((itemIngredient) => {
    const modification = modificationMap.get(itemIngredient.ingredient_id);
    const ingredient = ingredients.find(
      (ing) => ing.id === itemIngredient.ingredient_id
    );

    if (!ingredient) return;

    let quantity = itemIngredient.quantity_g;

    // Apply modification
    if (modification) {
      if (modification.action === "remove") {
        // Subtract this ingredient's nutrition
        const ratio = quantity / 100;
        nutrition.calories -= ingredient.calories_per_100g * ratio;
        nutrition.protein -= ingredient.protein * ratio;
        nutrition.carbs -= ingredient.carbs * ratio;
        nutrition.fat -= ingredient.fat * ratio;
        nutrition.sodium -= ingredient.sodium * ratio;
        nutrition.fiber -= ingredient.fiber * ratio;
        nutrition.sugar -= ingredient.sugar * ratio;
        return;
      } else if (modification.action === "modify" && modification.multiplier) {
        quantity = quantity * modification.multiplier;
      }
    }

    // Calculate nutrition from ingredient (if not removed)
    if (modification?.action !== "remove") {
      const ratio = quantity / 100;
      const baseRatio = itemIngredient.quantity_g / 100;

      // Subtract base, add modified
      nutrition.calories -=
        ingredient.calories_per_100g * baseRatio -
        ingredient.calories_per_100g * ratio;
      nutrition.protein -=
        ingredient.protein * baseRatio - ingredient.protein * ratio;
      nutrition.carbs -= ingredient.carbs * baseRatio - ingredient.carbs * ratio;
      nutrition.fat -= ingredient.fat * baseRatio - ingredient.fat * ratio;
      nutrition.sodium -=
        ingredient.sodium * baseRatio - ingredient.sodium * ratio;
      nutrition.fiber -=
        ingredient.fiber * baseRatio - ingredient.fiber * ratio;
      nutrition.sugar -=
        ingredient.sugar * baseRatio - ingredient.sugar * ratio;
    }
  });

  // Add any new ingredients
  customizations.forEach((custom) => {
    if (custom.action === "add" && custom.quantity_g) {
      const ingredient = ingredients.find(
        (ing) => ing.id === custom.ingredient_id
      );
      if (ingredient) {
        const ratio = custom.quantity_g / 100;
        nutrition.calories += ingredient.calories_per_100g * ratio;
        nutrition.protein += ingredient.protein * ratio;
        nutrition.carbs += ingredient.carbs * ratio;
        nutrition.fat += ingredient.fat * ratio;
        nutrition.sodium += ingredient.sodium * ratio;
        nutrition.fiber += ingredient.fiber * ratio;
        nutrition.sugar += ingredient.sugar * ratio;
      }
    }
  });

  // Ensure non-negative values
  nutrition.calories = Math.max(0, nutrition.calories);
  nutrition.protein = Math.max(0, nutrition.protein);
  nutrition.carbs = Math.max(0, nutrition.carbs);
  nutrition.fat = Math.max(0, nutrition.fat);
  nutrition.sodium = Math.max(0, nutrition.sodium);
  nutrition.fiber = Math.max(0, nutrition.fiber);
  nutrition.sugar = Math.max(0, nutrition.sugar);

  return nutrition;
}

/**
 * Sum nutrition data
 */
export function sumNutrition(
  nutritionArray: NutritionData[]
): NutritionData {
  return nutritionArray.reduce(
    (acc, nutrition) => ({
      calories: acc.calories + nutrition.calories,
      protein: acc.protein + nutrition.protein,
      carbs: acc.carbs + nutrition.carbs,
      fat: acc.fat + nutrition.fat,
      sodium: acc.sodium + nutrition.sodium,
      fiber: acc.fiber + nutrition.fiber,
      sugar: acc.sugar + nutrition.sugar,
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sodium: 0,
      fiber: 0,
      sugar: 0,
    }
  );
}
