import { NextResponse } from "next/server";
import { createEventWithLocation } from "@/features/events/service";
import type { CreateEventWithLocationInput } from "@/features/events/types";

export async function POST(request: Request) {
  try {
    const payload: CreateEventWithLocationInput = await request.json();
    const result = await createEventWithLocation(payload);
    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    console.error("Create event error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create event",
      },
      {
        status: 500,
      },
    );
  }
}
