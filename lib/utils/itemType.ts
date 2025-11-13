import { Item, Ingredient, Restaurant } from "@/types";

export type ItemType = "pizza" | "bowl" | "sandwich" | "generic";

export interface ItemTypeConfig {
  type: ItemType;
  hasProteinSelection?: boolean;
  hasCrustSelection?: boolean;
  hasBreadSelection?: boolean;
  hasBaseSelection?: boolean;
  hasSizeSelection?: boolean;
}

/**
 * Detect item type based on restaurant and item name
 */
export function detectItemType(
  item: Item,
  restaurant: Restaurant | null
): ItemTypeConfig {
  const restaurantName = restaurant?.name || "";
  const itemName = item.name.toLowerCase();

  // Pizza detection
  if (
    restaurantName === "Domino's" ||
    restaurantName === "Pizza Hut" ||
    itemName.includes("pizza")
  ) {
    return {
      type: "pizza",
      hasCrustSelection: true,
      hasSizeSelection: true,
    };
  }

  // Bowl detection (Chipotle, Cava)
  if (
    restaurantName === "Chipotle" ||
    restaurantName === "Cava" ||
    itemName.includes("bowl") ||
    itemName.includes("burrito")
  ) {
    return {
      type: "bowl",
      hasProteinSelection: true,
      hasBaseSelection: true,
    };
  }

  // Sandwich detection (Subway)
  if (
    restaurantName === "Subway" ||
    (itemName.includes("sandwich") && restaurantName !== "")
  ) {
    return {
      type: "sandwich",
      hasBreadSelection: true,
      hasProteinSelection: true,
    };
  }

  // Generic
  return {
    type: "generic",
  };
}

/**
 * Group ingredients by category
 */
export function groupIngredientsByCategory(
  ingredients: Ingredient[],
  itemType: ItemTypeConfig
): {
  proteins: Ingredient[];
  crusts: Ingredient[];
  breads: Ingredient[];
  bases: Ingredient[];
  toppings: Ingredient[];
  sauces: Ingredient[];
  others: Ingredient[];
} {
  const groups = {
    proteins: [] as Ingredient[],
    crusts: [] as Ingredient[],
    breads: [] as Ingredient[],
    bases: [] as Ingredient[],
    toppings: [] as Ingredient[],
    sauces: [] as Ingredient[],
    others: [] as Ingredient[],
  };

  ingredients.forEach((ingredient) => {
    const name = ingredient.name.toLowerCase();

    // Protein detection
    if (
      name.includes("chicken") ||
      name.includes("steak") ||
      name.includes("beef") ||
      name.includes("pork") ||
      name.includes("turkey") ||
      name.includes("lamb") ||
      name.includes("barbacoa") ||
      name.includes("carnitas") ||
      name.includes("sofritas") ||
      name.includes("falafel") ||
      name.includes("patty") ||
      name.includes("pepperoni") ||
      name.includes("sausage") ||
      name.includes("ham")
    ) {
      groups.proteins.push(ingredient);
    }
    // Crust detection
    else if (name.includes("crust") || name.includes("pizza dough")) {
      groups.crusts.push(ingredient);
    }
    // Bread detection
    else if (name.includes("bun") || name.includes("bread") || name.includes("tortilla")) {
      groups.breads.push(ingredient);
    }
    // Base detection (rice, beans, greens, etc.)
    else if (
      name.includes("rice") ||
      name.includes("beans") ||
      name.includes("lentils") ||
      name.includes("greens") ||
      name.includes("rightrice")
    ) {
      groups.bases.push(ingredient);
    }
    // Sauce detection
    else if (
      name.includes("sauce") ||
      name.includes("salsa") ||
      name.includes("mayonnaise") ||
      name.includes("ketchup") ||
      name.includes("mustard") ||
      name.includes("hummus") ||
      name.includes("tzatziki") ||
      name.includes("dressing") ||
      name.includes("tahini")
    ) {
      groups.sauces.push(ingredient);
    }
    // Toppings detection
    else if (
      name.includes("cheese") ||
      name.includes("lettuce") ||
      name.includes("tomato") ||
      name.includes("onion") ||
      name.includes("pepper") ||
      name.includes("olives") ||
      name.includes("mushrooms") ||
      name.includes("pineapple") ||
      name.includes("jalapeños") ||
      name.includes("pickles") ||
      name.includes("cucumber") ||
      name.includes("feta") ||
      name.includes("guacamole") ||
      name.includes("sour cream")
    ) {
      groups.toppings.push(ingredient);
    }
    // Others
    else {
      groups.others.push(ingredient);
    }
  });

  return groups;
}

/**
 * Get available options for a category (e.g., all crust types, all proteins)
 */
export async function getAvailableOptions(
  category: "crusts" | "proteins" | "breads" | "bases",
  restaurantName?: string | null
): Promise<Ingredient[]> {
  // This would fetch from database, but for now we'll use the ingredients we have
  // In a real implementation, you'd query the database for ingredients matching the category
  return [];
}

