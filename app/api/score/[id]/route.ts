import { NextRequest, NextResponse } from "next/server";
import {
  getItemById,
  getItemIngredients,
  getIngredientsByIds,
  getCachedScore,
  cacheScore,
  getDefaultScoreProfile,
  getScoreProfileById,
} from "@/lib/db/queries";
import { calculateNutrition } from "@/lib/services/nutrition";
import { calculateHealthScore } from "@/lib/services/scoring";
import { Customization } from "@/types";
import { z } from "zod";

const scoreSchema = z.object({
  customizations: z
    .array(
      z.object({
        ingredient_id: z.string(),
        action: z.enum(["add", "remove", "modify"]),
        quantity_g: z.number().optional(),
        multiplier: z.number().optional(),
      })
    )
    .optional(),
  score_profile_id: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get("profileId") || undefined;
    const customizationsParam = searchParams.get("customizations");

    let customizations: Customization[] = [];
    if (customizationsParam) {
      customizations = JSON.parse(customizationsParam);
    }

    // Get item
    const item = await getItemById(params.id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Get score profile
    const profile = profileId
      ? await getScoreProfileById(profileId)
      : await getDefaultScoreProfile();

    if (!profile) {
      return NextResponse.json(
        { error: "Score profile not found" },
        { status: 404 }
      );
    }

    // Check cache (only if no customizations)
    if (customizations.length === 0) {
      const cached = await getCachedScore(params.id, profile.id);
      if (cached) {
        return NextResponse.json({
          score: cached.score,
          cached: true,
          item_id: params.id,
          profile_id: profile.id,
        });
      }
    }

    // Calculate nutrition and score
    const itemIngredients = await getItemIngredients(params.id);
    const allIngredientIds = [
      ...itemIngredients.map((ii) => ii.ingredient_id),
      ...customizations.map((c) => c.ingredient_id),
    ];
    const ingredients = await getIngredientsByIds(allIngredientIds);

    const nutrition = calculateNutrition(
      item,
      ingredients,
      itemIngredients,
      customizations
    );

    const score = calculateHealthScore(nutrition, profile);

    // Cache score if no customizations
    if (customizations.length === 0) {
      await cacheScore(params.id, profile.id, score);
    }

    return NextResponse.json({
      score,
      nutrition,
      cached: false,
      item_id: params.id,
      profile_id: profile.id,
    });
  } catch (error) {
    console.error("Error calculating score:", error);
    return NextResponse.json(
      { error: "Failed to calculate score" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { customizations, score_profile_id } = scoreSchema.parse(body);

    // Get item
    const item = await getItemById(params.id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Get score profile
    const profile = score_profile_id
      ? await getScoreProfileById(score_profile_id)
      : await getDefaultScoreProfile();

    if (!profile) {
      return NextResponse.json(
        { error: "Score profile not found" },
        { status: 404 }
      );
    }

    // Calculate nutrition and score
    const itemIngredients = await getItemIngredients(params.id);
    const allIngredientIds = [
      ...itemIngredients.map((ii) => ii.ingredient_id),
      ...(customizations || []).map((c) => c.ingredient_id),
    ];
    const ingredients = await getIngredientsByIds(allIngredientIds);

    const nutrition = calculateNutrition(
      item,
      ingredients,
      itemIngredients,
      customizations as Customization[] || []
    );

    const score = calculateHealthScore(nutrition, profile);

    return NextResponse.json({
      score,
      nutrition,
      item_id: params.id,
      profile_id: profile.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error calculating score:", error);
    return NextResponse.json(
      { error: "Failed to calculate score" },
      { status: 500 }
    );
  }
}
