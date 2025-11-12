import { NextRequest, NextResponse } from "next/server";
import { getRestaurants } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  try {
    const restaurants = await getRestaurants();
    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.stack : String(error);
    console.error("Error details:", errorDetails);
    return NextResponse.json(
      { 
        error: "Failed to fetch restaurants",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}
