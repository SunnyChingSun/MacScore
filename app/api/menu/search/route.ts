import { NextRequest, NextResponse } from "next/server";
import { searchItems, getItemsByRestaurant } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const restaurantId = searchParams.get("restaurantId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");

    let items: any[] = [];
    
    // If restaurant is selected, get items from that restaurant
    if (restaurantId) {
      if (query && query.trim().length > 0) {
        // Search within the restaurant
        items = await searchItems(query.trim(), restaurantId, limit);
      } else {
        // Get all items from the restaurant (no search query)
        items = await getItemsByRestaurant(restaurantId);
      }
    } else {
      // No restaurant selected - search all items
      if (query && query.trim().length > 0) {
        // Search across all restaurants
        items = await searchItems(query.trim(), undefined, limit);
      } else {
        // No query and no restaurant - return empty array (don't load all items by default)
        items = [];
      }
    }

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error("Error searching menu:", error);
    return NextResponse.json(
      { error: "Failed to search menu", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}