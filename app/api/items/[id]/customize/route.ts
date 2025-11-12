import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getItemById,
  getItemIngredients,
  getIngredientsByIds,
  getDefaultScoreProfile,
} from "@/lib/db/queries";
import { calculateNutrition } from "@/lib/services/nutrition";
import { calculateHealthScore } from "@/lib/services/scoring";
import { Customization } from "@/types";

const customizeSchema = z.object({
  customizations: z.array(
    z.object({
      ingredient_id: z.string(),
      action: z.enum(["add", "remove", "modify"]),
      quantity_g: z.number().optional(),
      multiplier: z.number().optional(),
    })
  ),
  score_profile_id: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { customizations, score_profile_id } = customizeSchema.parse(body);

    // Get item and ingredients
    const item = await getItemById(params.id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const itemIngredients = await getItemIngredients(params.id);
    const customizationIds = (customizations || []).map((c) => c.ingredient_id);
    const allIngredientIds = [
      ...itemIngredients.map((ii) => ii.ingredient_id),
      ...customizationIds,
    ];
    const uniqueIngredientIds = [...new Set(allIngredientIds)];
    const ingredients = uniqueIngredientIds.length > 0
      ? await getIngredientsByIds(uniqueIngredientIds)
      : [];

    // Calculate nutrition
    const nutrition = calculateNutrition(
      item,
      ingredients,
      itemIngredients,
      customizations as Customization[]
    );

    // Calculate score
    const profile = await getDefaultScoreProfile();
    const score = calculateHealthScore(nutrition, profile);

    return NextResponse.json({
      nutrition,
      score,
      item: {
        ...item,
        nutrition,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error customizing item:", error);
    return NextResponse.json(
      { error: "Failed to customize item" },
      { status: 500 }
    );
  }
}
