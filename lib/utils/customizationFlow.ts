import { Item, Ingredient, Restaurant } from "@/types";
import { ItemTypeConfig } from "./itemType";

export interface CustomizationCategory {
  id: string;
  label: string;
  description?: string;
  ingredients: Ingredient[];
  selectionType: "single" | "multiple" | "quantity";
  order: number;
}

export interface CustomizationFlow {
  categories: CustomizationCategory[];
  order: string[]; // Category IDs in order
}

/**
 * Create customization flow based on item type and restaurant
 */
export function createCustomizationFlow(
  item: Item,
  restaurant: Restaurant | null,
  itemType: ItemTypeConfig,
  groupedIngredients: {
    proteins: Ingredient[];
    crusts: Ingredient[];
    breads: Ingredient[];
    bases: Ingredient[];
    toppings: Ingredient[];
    sauces: Ingredient[];
    others: Ingredient[];
  },
  itemIngredients: Array<{ ingredient_id: string; quantity_g: number }>,
  allIngredients: Ingredient[]
): CustomizationFlow {
  const categories: CustomizationCategory[] = [];
  let order: number = 0;

  // Create a set of item ingredient IDs for fast lookup
  const itemIngredientIds = new Set(itemIngredients.map((ii) => ii.ingredient_id));
  
  // Get restaurant name for filtering
  const restaurantName = restaurant?.name || "";

  // Pizza flow: Crust → Sauce → Cheese → Toppings → Extras
  if (itemType.type === "pizza") {
    // Crust (single selection) - show all available crusts
    if (groupedIngredients.crusts.length > 0) {
      categories.push({
        id: "crust",
        label: "Choose Your Crust",
        description: "Select your preferred crust type",
        ingredients: groupedIngredients.crusts,
        selectionType: "single",
        order: order++,
      });
    }

    // Sauce (single selection) - only show sauces that are in the item
    const sauces = groupedIngredients.sauces.filter(
      (s) =>
        itemIngredientIds.has(s.id) &&
        s.name.toLowerCase().includes("sauce") &&
        !s.name.toLowerCase().includes("pizza")
    );
    if (sauces.length > 0) {
      categories.push({
        id: "sauce",
        label: "Pizza Sauce",
        description: "Choose your sauce",
        ingredients: sauces,
        selectionType: "single",
        order: order++,
      });
    }

    // Cheese (quantity) - only show cheeses that are in the item
    const cheeses = groupedIngredients.toppings.filter(
      (t) => itemIngredientIds.has(t.id) && t.name.toLowerCase().includes("cheese")
    );
    if (cheeses.length > 0) {
      categories.push({
        id: "cheese",
        label: "Cheese",
        description: "Customize your cheese",
        ingredients: cheeses,
        selectionType: "quantity",
        order: order++,
      });
    }

    // Meat Toppings (multiple) - show all available meat toppings
    const meatToppings = groupedIngredients.proteins.filter((p) =>
      p.name.toLowerCase().includes("pepperoni") ||
      p.name.toLowerCase().includes("sausage") ||
      p.name.toLowerCase().includes("ham") ||
      p.name.toLowerCase().includes("bacon")
    );
    if (meatToppings.length > 0) {
      categories.push({
        id: "meat-toppings",
        label: "Meat Toppings",
        description: "Add your favorite meats",
        ingredients: meatToppings,
        selectionType: "multiple",
        order: order++,
      });
    }

    // Vegetable Toppings (multiple) - show all available veg toppings
    const vegToppings = groupedIngredients.toppings.filter(
      (t) =>
        !t.name.toLowerCase().includes("cheese") &&
        (t.name.toLowerCase().includes("pepper") ||
          t.name.toLowerCase().includes("onion") ||
          t.name.toLowerCase().includes("mushrooms") ||
          t.name.toLowerCase().includes("olives") ||
          t.name.toLowerCase().includes("pineapple") ||
          t.name.toLowerCase().includes("jalapeños"))
    );
    if (vegToppings.length > 0) {
      categories.push({
        id: "vegetable-toppings",
        label: "Vegetable Toppings",
        description: "Add fresh vegetables",
        ingredients: vegToppings,
        selectionType: "multiple",
        order: order++,
      });
    }
  }

  // Bowl flow: Base → Protein → Toppings → Sauces → Extras
  else if (itemType.type === "bowl") {
    // Base (single selection) - filter by restaurant if specified
    let bowlBases = groupedIngredients.bases;
    if (restaurantName === "Chipotle") {
      // For Chipotle, show Chipotle-specific bases (rice, beans)
      bowlBases = groupedIngredients.bases.filter((b) =>
        b.name.toLowerCase().includes("rice") ||
        b.name.toLowerCase().includes("beans") ||
        b.name.toLowerCase().includes("greens")
      );
    } else if (restaurantName === "Cava") {
      // For Cava, show Cava-specific bases (rightrice, lentils, greens)
      bowlBases = groupedIngredients.bases.filter((b) =>
        b.name.toLowerCase().includes("rightrice") ||
        b.name.toLowerCase().includes("lentils") ||
        b.name.toLowerCase().includes("greens")
      );
    }
    
    if (bowlBases.length > 0) {
      categories.push({
        id: "base",
        label: "Choose Your Base",
        description: "Add rice, beans, or greens (can add multiple for half and half)",
        ingredients: bowlBases,
        selectionType: "quantity",
        order: order++,
      });
    }

    // Protein (quantity selection) - filter by restaurant if specified, allow multiple
    let bowlProteins = groupedIngredients.proteins;
    if (restaurantName === "Chipotle") {
      // For Chipotle, show Chipotle-specific proteins and general proteins
      bowlProteins = groupedIngredients.proteins.filter((p) =>
        p.name.toLowerCase().includes("chipotle") ||
        p.name.toLowerCase().includes("chicken") ||
        p.name.toLowerCase().includes("steak") ||
        p.name.toLowerCase().includes("barbacoa") ||
        p.name.toLowerCase().includes("carnitas") ||
        p.name.toLowerCase().includes("sofritas")
      );
    } else if (restaurantName === "Cava") {
      // For Cava, show Cava-specific proteins and general proteins
      bowlProteins = groupedIngredients.proteins.filter((p) =>
        p.name.toLowerCase().includes("cava") ||
        p.name.toLowerCase().includes("chicken") ||
        p.name.toLowerCase().includes("lamb") ||
        p.name.toLowerCase().includes("falafel")
      );
    } else {
      // For other restaurants or generic, show all bowl-appropriate proteins
      bowlProteins = groupedIngredients.proteins.filter((p) =>
        p.name.toLowerCase().includes("chipotle") ||
        p.name.toLowerCase().includes("cava") ||
        p.name.toLowerCase().includes("chicken") ||
        p.name.toLowerCase().includes("steak") ||
        p.name.toLowerCase().includes("barbacoa") ||
        p.name.toLowerCase().includes("carnitas") ||
        p.name.toLowerCase().includes("sofritas") ||
        p.name.toLowerCase().includes("lamb") ||
        p.name.toLowerCase().includes("falafel")
      );
    }
    if (bowlProteins.length > 0) {
      categories.push({
        id: "protein",
        label: "Choose Your Protein",
        description: "Add your protein (can add multiple for extra protein)",
        ingredients: bowlProteins,
        selectionType: "quantity",
        order: order++,
      });
    }

    // Toppings (multiple) - only show toppings that are in the item
    const bowlToppings = groupedIngredients.toppings.filter(
      (t) =>
        itemIngredientIds.has(t.id) &&
        !t.name.toLowerCase().includes("sauce") &&
        !t.name.toLowerCase().includes("salsa") &&
        (t.name.toLowerCase().includes("cheese") ||
          t.name.toLowerCase().includes("lettuce") ||
          t.name.toLowerCase().includes("tomato") ||
          t.name.toLowerCase().includes("onion") ||
          t.name.toLowerCase().includes("cucumber") ||
          t.name.toLowerCase().includes("guacamole") ||
          t.name.toLowerCase().includes("sour cream") ||
          t.name.toLowerCase().includes("feta"))
    );
    if (bowlToppings.length > 0) {
      categories.push({
        id: "toppings",
        label: "Toppings",
        description: "Add your favorite toppings",
        ingredients: bowlToppings,
        selectionType: "multiple",
        order: order++,
      });
    }

    // Sauces (multiple) - only show sauces that are in the item
    const bowlSauces = groupedIngredients.sauces.filter(
      (s) =>
        itemIngredientIds.has(s.id) &&
        (s.name.toLowerCase().includes("salsa") ||
          s.name.toLowerCase().includes("sauce") ||
          s.name.toLowerCase().includes("dressing") ||
          s.name.toLowerCase().includes("hummus") ||
          s.name.toLowerCase().includes("tzatziki") ||
          s.name.toLowerCase().includes("tahini"))
    );
    if (bowlSauces.length > 0) {
      categories.push({
        id: "sauces",
        label: "Sauces & Dressings",
        description: "Choose your sauces",
        ingredients: bowlSauces,
        selectionType: "multiple",
        order: order++,
      });
    }
  }

  // Sandwich flow: Bread → Protein → Cheese → Vegetables → Sauces
  else if (itemType.type === "sandwich") {
    // Bread (single selection) - show all available breads
    const sandwichBreads = groupedIngredients.breads.filter((b) =>
      b.name.toLowerCase().includes("bun") || b.name.toLowerCase().includes("bread")
    );
    if (sandwichBreads.length > 0) {
      categories.push({
        id: "bread",
        label: "Choose Your Bread",
        description: "Select your bread type",
        ingredients: sandwichBreads,
        selectionType: "single",
        order: order++,
      });
    }

    // Protein (single selection) - show all available proteins
    const sandwichProteins = groupedIngredients.proteins.filter(
      (p) =>
        !p.name.toLowerCase().includes("chipotle") &&
        !p.name.toLowerCase().includes("cava") &&
        (p.name.toLowerCase().includes("chicken") ||
          p.name.toLowerCase().includes("turkey") ||
          p.name.toLowerCase().includes("ham") ||
          p.name.toLowerCase().includes("beef") ||
          p.name.toLowerCase().includes("pepperoni") ||
          p.name.toLowerCase().includes("sausage"))
    );
    if (sandwichProteins.length > 0) {
      categories.push({
        id: "protein",
        label: "Choose Your Protein",
        description: "Select your protein",
        ingredients: sandwichProteins,
        selectionType: "single",
        order: order++,
      });
    }

    // Cheese (multiple) - only show cheeses that are in the item
    const sandwichCheeses = groupedIngredients.toppings.filter(
      (t) => itemIngredientIds.has(t.id) && t.name.toLowerCase().includes("cheese")
    );
    if (sandwichCheeses.length > 0) {
      categories.push({
        id: "cheese",
        label: "Cheese",
        description: "Add cheese",
        ingredients: sandwichCheeses,
        selectionType: "multiple",
        order: order++,
      });
    }

    // Vegetables (multiple) - only show vegetables that are in the item
    const sandwichVeggies = groupedIngredients.toppings.filter(
      (t) =>
        itemIngredientIds.has(t.id) &&
        !t.name.toLowerCase().includes("cheese") &&
        (t.name.toLowerCase().includes("lettuce") ||
          t.name.toLowerCase().includes("tomato") ||
          t.name.toLowerCase().includes("onion") ||
          t.name.toLowerCase().includes("pepper") ||
          t.name.toLowerCase().includes("pickles") ||
          t.name.toLowerCase().includes("cucumber"))
    );
    if (sandwichVeggies.length > 0) {
      categories.push({
        id: "vegetables",
        label: "Vegetables",
        description: "Add fresh vegetables",
        ingredients: sandwichVeggies,
        selectionType: "multiple",
        order: order++,
      });
    }

    // Sauces (multiple) - only show sauces that are in the item
    const sandwichSauces = groupedIngredients.sauces.filter(
      (s) =>
        itemIngredientIds.has(s.id) &&
        (s.name.toLowerCase().includes("mayonnaise") ||
          s.name.toLowerCase().includes("mustard") ||
          s.name.toLowerCase().includes("sauce") ||
          s.name.toLowerCase().includes("ketchup"))
    );
    if (sandwichSauces.length > 0) {
      categories.push({
        id: "sauces",
        label: "Sauces",
        description: "Choose your sauces",
        ingredients: sandwichSauces,
        selectionType: "multiple",
        order: order++,
      });
    }
  }

  // Generic flow: Organize by category
  else {
    // Proteins - only show proteins that are in the item
    const genericProteins = groupedIngredients.proteins.filter((p) =>
      itemIngredientIds.has(p.id)
    );
    if (genericProteins.length > 0) {
      categories.push({
        id: "proteins",
        label: "Proteins",
        description: "Select proteins",
        ingredients: genericProteins,
        selectionType: "quantity",
        order: order++,
      });
    }

    // Bases - only show bases that are in the item
    const genericBases = groupedIngredients.bases.filter((b) => itemIngredientIds.has(b.id));
    if (genericBases.length > 0) {
      categories.push({
        id: "bases",
        label: "Bases",
        description: "Select bases",
        ingredients: genericBases,
        selectionType: "quantity",
        order: order++,
      });
    }

    // Toppings - only show toppings that are in the item
    const genericToppings = groupedIngredients.toppings.filter((t) =>
      itemIngredientIds.has(t.id)
    );
    if (genericToppings.length > 0) {
      categories.push({
        id: "toppings",
        label: "Toppings",
        description: "Add toppings",
        ingredients: genericToppings,
        selectionType: "quantity",
        order: order++,
      });
    }

    // Sauces - only show sauces that are in the item
    const genericSauces = groupedIngredients.sauces.filter((s) => itemIngredientIds.has(s.id));
    if (genericSauces.length > 0) {
      categories.push({
        id: "sauces",
        label: "Sauces",
        description: "Add sauces",
        ingredients: genericSauces,
        selectionType: "quantity",
        order: order++,
      });
    }
  }

  // Add remaining ingredients to "Extras" category
  const categorizedIngredientIds = new Set(
    categories.flatMap((cat) => cat.ingredients.map((ing) => ing.id))
  );
  const extras = groupedIngredients.others.filter(
    (ing) =>
      !categorizedIngredientIds.has(ing.id) &&
      itemIngredients.some((ii) => ii.ingredient_id === ing.id)
  );

  // Also add any ingredients that weren't categorized
  const allItemIngredientIds = new Set(itemIngredients.map((ii) => ii.ingredient_id));
  const uncategorizedIngredients = allIngredients.filter(
    (ing) =>
      !categorizedIngredientIds.has(ing.id) &&
      allItemIngredientIds.has(ing.id) &&
      !extras.some((e) => e.id === ing.id)
  );

  if (extras.length > 0 || uncategorizedIngredients.length > 0) {
    categories.push({
      id: "extras",
      label: "Extras",
      description: "Additional ingredients",
      ingredients: [...extras, ...uncategorizedIngredients],
      selectionType: "quantity",
      order: order++,
    });
  }

  return {
    categories: categories.sort((a, b) => a.order - b.order),
    order: categories.map((cat) => cat.id),
  };
}

