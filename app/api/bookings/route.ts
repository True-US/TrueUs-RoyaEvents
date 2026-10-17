import { NextResponse } from "next/server";

import {
  getCurrentProfile,
  isAdminRole,
} from "@/features/auth/current-profile";
import {
  getAdminBookingEvents,
  getAdminEventBookingsPage,
} from "@/features/dashboard/queries";

export async function GET(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (
      !profile ||
      !profile.isActive ||
      !profile.role.isActive ||
      !isAdminRole(profile.role.name)
    ) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const rawEventId = searchParams.get("eventId");
    if (rawEventId === null) {
      return NextResponse.json({ events: await getAdminBookingEvents() });
    }

    const eventId = Number(rawEventId);
    const rawPage = searchParams.get("page") ?? "1";
    const page = Number(rawPage);
    if (
      !Number.isSafeInteger(eventId) ||
      eventId < 1 ||
      !Number.isSafeInteger(page) ||
      page < 1
    ) {
      return NextResponse.json(
        { message: "Invalid event or page selection." },
        { status: 400 },
      );
    }

    const result = await getAdminEventBookingsPage(eventId, page);
    if (!result) {
      return NextResponse.json(
        { message: "This event is no longer available." },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get admin bookings error:", error);
    return NextResponse.json(
      { message: "Failed to load bookings." },
      { status: 500 },
    );
  }
}
