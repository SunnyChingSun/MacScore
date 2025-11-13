import { NextRequest, NextResponse } from "next/server";
import { getItemById, getItemIngredients, getIngredientsByIds } from "@/lib/db/queries";
import { calculateNutrition } from "@/lib/services/nutrition";
import { calculateHealthScore } from "@/lib/services/scoring";
import { Customization } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = params.id;

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const customizations: Customization[] = body.customizations || [];

    // Fetch item
    const item = await getItemById(itemId);

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Fetch item ingredients
    const itemIngredients = await getItemIngredients(itemId);

    // Fetch ingredient details
    const ingredientIds = itemIngredients.map((ii) => ii.ingredient_id);
    // Also include any ingredients from customizations (for "add" action)
    customizations.forEach((custom) => {
      if (custom.action === "add" && custom.ingredient_id && !ingredientIds.includes(custom.ingredient_id)) {
        ingredientIds.push(custom.ingredient_id);
      }
    });

    const ingredients = ingredientIds.length > 0
      ? await getIngredientsByIds(ingredientIds)
      : [];

    // Calculate nutrition with customizations
    const nutrition = calculateNutrition(
      item,
      ingredients,
      itemIngredients,
      customizations
    );

    // Calculate health score
    const score = calculateHealthScore(nutrition);

    return NextResponse.json({
      nutrition,
      score,
    });
  } catch (error) {
    console.error("Error customizing item:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to customize item",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

