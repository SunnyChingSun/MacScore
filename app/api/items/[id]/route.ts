import { NextRequest, NextResponse } from "next/server";
import { getItemById, getItemIngredients, getIngredientsByIds, getRestaurantById, getAllIngredients } from "@/lib/db/queries";
import { Ingredient } from "@/types";

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
    let item;
    try {
      item = await getItemById(itemId);
    } catch (dbError) {
      console.error("Database error fetching item:", dbError);
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // Fetch item ingredients
    let itemIngredients: Array<{ ingredient_id: string; quantity_g: number }>;
    try {
      itemIngredients = await getItemIngredients(itemId);
    } catch (dbError) {
      console.error("Database error fetching item ingredients:", dbError);
      // If ingredients fail, continue with empty array
      itemIngredients = [];
    }

    // Fetch ingredient details
    const ingredientIds = itemIngredients.map((ii) => ii.ingredient_id);
    let ingredients: Ingredient[] = [];
    if (ingredientIds.length > 0) {
      try {
        ingredients = await getIngredientsByIds(ingredientIds);
      } catch (dbError) {
        console.error("Database error fetching ingredients:", dbError);
        // Continue with empty ingredients array
        ingredients = [];
      }
    }

    // Fetch restaurant information
    let restaurant = null;
    if (item.restaurant_id) {
      try {
        restaurant = await getRestaurantById(item.restaurant_id);
      } catch (dbError) {
        console.error("Database error fetching restaurant:", dbError);
        // Continue without restaurant info
      }
    }

    // Fetch all available ingredients for swapping
    let allIngredients: Ingredient[] = [];
    try {
      allIngredients = await getAllIngredients();
    } catch (dbError) {
      console.error("Database error fetching all ingredients:", dbError);
      // Continue without all ingredients
    }

    return NextResponse.json({
      item,
      restaurant,
      ingredients,
      itemIngredients,
      allIngredients, // All available ingredients for swapping
    });
  } catch (error) {
    console.error("Error fetching item details:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);
    return NextResponse.json(
      {
        error: "Failed to fetch item details",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

