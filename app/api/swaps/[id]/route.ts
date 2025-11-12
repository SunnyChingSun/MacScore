import { NextRequest, NextResponse } from "next/server";
import {
  getItemById,
  getItemIngredients,
  getSwapSuggestions,
} from "@/lib/db/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ingredientId = searchParams.get("ingredientId");

    if (!ingredientId) {
      return NextResponse.json(
        { error: "ingredientId parameter is required" },
        { status: 400 }
      );
    }

    // Verify item exists
    const item = await getItemById(params.id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Get swap suggestions
    const suggestions = await getSwapSuggestions(params.id, ingredientId);

    return NextResponse.json({
      item_id: params.id,
      ingredient_id: ingredientId,
      suggestions: suggestions.map((s) => ({
        ingredient: s.ingredient,
        improvement: s.improvement,
        reason: `Lower calories and better macros`,
      })),
    });
  } catch (error) {
    console.error("Error fetching swap suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch swap suggestions" },
      { status: 500 }
    );
  }
}
