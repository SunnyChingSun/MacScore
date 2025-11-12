import { NextRequest, NextResponse } from "next/server";
import {
  getItemById,
  getItemIngredients,
  getIngredientsByIds,
} from "@/lib/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const item = await getItemById(params.id);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Get ingredients (if any)
    const itemIngredients = await getItemIngredients(params.id);
    const ingredientIds = itemIngredients.map((ii) => ii.ingredient_id);
    const ingredients = ingredientIds.length > 0 
      ? await getIngredientsByIds(ingredientIds)
      : [];

    return NextResponse.json({
      item,
      ingredients: ingredients.map((ing, idx) => ({
        ...ing,
        quantity_g: itemIngredients[idx]?.quantity_g || 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}
