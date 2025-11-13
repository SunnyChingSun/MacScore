import { NextRequest, NextResponse } from "next/server";
import { getItemById } from "@/lib/db/queries";
import { calculateHealthScore } from "@/lib/services/scoring";

export async function GET(
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

    // Fetch item
    const item = await getItemById(itemId);

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Calculate health score from base nutrition
    const nutrition = {
      calories: item.base_calories,
      protein: item.base_protein,
      carbs: item.base_carbs,
      fat: item.base_fat,
      sodium: item.base_sodium,
      fiber: item.base_fiber,
      sugar: item.base_sugar,
    };

    const score = calculateHealthScore(nutrition);

    return NextResponse.json({
      score,
    });
  } catch (error) {
    console.error("Error calculating score:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to calculate score",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

