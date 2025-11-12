import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Note: In a real app, this would save to database with user authentication
// For now, we'll return a success response and rely on localStorage on the client
const presetSchema = z.object({
  name: z.string(),
  item_id: z.string(),
  customizations: z.record(z.any()),
  user_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, item_id, customizations, user_id } = presetSchema.parse(body);

    // In production, save to database
    // For now, we'll just validate and return success
    // The client will handle localStorage persistence

    return NextResponse.json({
      success: true,
      message: "Preset saved (client-side storage)",
      preset: {
        id: `preset-${Date.now()}`,
        name,
        item_id,
        customizations,
        user_id: user_id || null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error saving preset:", error);
    return NextResponse.json(
      { error: "Failed to save preset" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const user_id = searchParams.get("user_id");

    // In production, fetch from database
    // For now, return empty array (client handles localStorage)
    return NextResponse.json({
      presets: [],
      message: "Presets are stored client-side in localStorage",
    });
  } catch (error) {
    console.error("Error fetching presets:", error);
    return NextResponse.json(
      { error: "Failed to fetch presets" },
      { status: 500 }
    );
  }
}
