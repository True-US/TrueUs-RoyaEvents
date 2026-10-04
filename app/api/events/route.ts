import { NextResponse } from "next/server";

import {
  getCurrentProfile,
  isAdminRole,
} from "@/features/auth/current-profile";


import type {
  CreateEventInput,
  CreateEventWithLocationInput,
  UpdateEventWithLocationInput,
} from "@/features/events/types";
import { createEventWithLocation, deleteOrDeactivateEvent, reactivateEvent, updateEventWithLocation } from "@/features/events/server/service";
import { getAdminEvents } from "@/features/events/server/queries";
import { validateEventRules } from "@/features/events/schemas";

/**
 * Checks that a date string ends with a zone: "Z" or an offset like "-06:00".
 * @param value The date string from the payload.
 * @returns True when the moment it describes is unambiguous.
 */
function hasTimeZone(value: string): boolean {
  return /(Z|[+-]\d{2}:\d{2})$/.test(value);
}

/**
 * Applies the event business rules (price, spots, dates) to a payload's event.
 * The form checks the same rules, but the server must not trust the browser.
 * @param event The event part of a create/update payload.
 * @returns The event with its price normalized (0 -> null), or an error message.
 */
function checkEventRules(
  event: CreateEventInput | undefined,
): { event: CreateEventInput; error?: never } | { event?: never; error: string } {
  if (!event) {
    return { error: "Event details are missing." };
  }

  // Times must name their zone ("...Z" or "...-06:00"). A bare "2026-10-10T19:00"
  // would be read in the server's zone, which is UTC on Vercel.
  if (!hasTimeZone(event.startDatetime) || (event.endDatetime && !hasTimeZone(event.endDatetime))) {
    return { error: "Dates must include a time zone (ISO 8601, e.g. 2026-10-11T01:00:00.000Z)." };
  }

  const result: ReturnType<typeof validateEventRules> = validateEventRules(event);
  if (result.error !== undefined) {
    return { error: result.error };
  }

  return { event: { ...event, price: result.data.price } };
}

async function requireAdmin() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return null;
  }

  if (!profile.role) {
    return null;
  }

  if (!isAdminRole(profile.role.name)) {
    return null;
  }

  return profile;
}

/** 
 * GET
 *
 * Used by Admin Manage Events.
 */
export async function GET() {
  try {
    const profile = await requireAdmin();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const events = await getAdminEvents();

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Get admin events error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load events.",
      },
      { status: 500 },
    );
  }
}


/**
 * POST
 *
 * Creates an event.
 */
export async function POST(request: Request) {
  try {
    const profile = await requireAdmin();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const payload: CreateEventWithLocationInput =
      await request.json();

    const checked: ReturnType<typeof checkEventRules> = checkEventRules(payload?.event);
    if (checked.error !== undefined) {
      return NextResponse.json(
        { success: false, message: checked.error },
        { status: 400 },
      );
    }

    const result = await createEventWithLocation({
      ...payload,
      event: checked.event,
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    console.error("Create event error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create event.",
      },
      { status: 500 },
    );
  }
}


/**
 * PATCH
 *
 * Used for:
 * 1. Updating an event
 * 2. Reactivating an event
 */
export async function PATCH(request: Request) {
  try {
    const profile = await requireAdmin();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const body = await request.json();

    /*
     * Reactivate
     */
    if (body.action === "reactivate") {
      const eventId = Number(body.id);

      if (!Number.isInteger(eventId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid event ID.",
          },
          { status: 400 },
        );
      }

      const result = await reactivateEvent(eventId);

      return NextResponse.json(result);
    }

    /**
     * Normal update
     */
    const payload: UpdateEventWithLocationInput =
      body;

    if (!Number.isInteger(payload.id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID.",
        },
        { status: 400 },
      );
    }

    const checked: ReturnType<typeof checkEventRules> = checkEventRules(payload.event);
    if (checked.error !== undefined) {
      return NextResponse.json(
        { success: false, message: checked.error },
        { status: 400 },
      );
    }

    const result = await updateEventWithLocation({
      ...payload,
      event: checked.event,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update event error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update event.",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE
 */
export async function DELETE(request: Request) {
  try {
    const profile = await requireAdmin();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(
      request.url,
    );

    const eventId = Number(
      searchParams.get("id"),
    );

    if (!Number.isInteger(eventId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID.",
        },
        { status: 400 },
      );
    }

    const result =
      await deleteOrDeactivateEvent(eventId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Delete event error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to delete event.",
      },
      { status: 500 },
    );
  }
}