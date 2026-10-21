import { NextResponse } from "next/server";

import {
  getCurrentProfile,
  isAdminRole,
} from "@/features/auth/current-profile";

import type {
  CreateEventWithLocationInput,
  UpdateEventWithLocationInput,
} from "@/features/events/types";
import {
  createEventWithLocation,
  deleteOrDeactivateEvent,
  EventScheduleConflictError,
  reactivateEvent,
  updateEventWithLocation,
} from "@/features/events/server/service";
import { getAdminEvents as getAllEventAndAdventure } from "@/features/events/server/queries";
// Same checks as the admin server actions (features/events/server/actions.ts).
import { checkEventPayload, toPublicRequestEvent } from "@/features/events/server/event-payload";
import { getSaveErrorMessage } from "@/features/events/server/save-error";
import { msg } from "@/lib/validation/messages";

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

    const events = await getAllEventAndAdventure();

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Get admin events error:", error);

    return NextResponse.json(
      {
        success: false,
        message: msg.unableTo("load events"),
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
  let payload: CreateEventWithLocationInput;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  try {
    // Only the public "custom event" request may skip the admin check. Its
    // event is limited below, so it can never be published or priced.
    const isPublicRequest: boolean = payload?.event?.eventType === "custom_event";
    if (!isPublicRequest) {
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
    }

    const checked: ReturnType<typeof checkEventPayload> = checkEventPayload(
      payload?.event,
      payload?.location,
    );
    if (checked.error !== undefined) {
      return NextResponse.json(
        { success: false, message: checked.error },
        { status: 400 },
      );
    }

    const result = await createEventWithLocation({
      location: checked.location,
      event: isPublicRequest ? toPublicRequestEvent(checked.event) : checked.event,
    });

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    console.error("Create event error:", error);

    return NextResponse.json(
      {
        success: false,
        message: getSaveErrorMessage(error, "create the event"),
      },
      { status: error instanceof EventScheduleConflictError ? 409 : 500 },
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

    let body: { action?: string; id?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

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
    const payload: UpdateEventWithLocationInput = body as unknown as UpdateEventWithLocationInput;

    if (!Number.isInteger(payload.id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID.",
        },
        { status: 400 },
      );
    }

    const checked: ReturnType<typeof checkEventPayload> = checkEventPayload(
      payload.event,
      payload.location,
    );
    if (checked.error !== undefined) {
      return NextResponse.json(
        { success: false, message: checked.error },
        { status: 400 },
      );
    }

    const result = await updateEventWithLocation({
      id: payload.id,
      location: { ...checked.location, id: payload.location.id },
      event: checked.event,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Update event error:", error);

    return NextResponse.json(
      {
        success: false,
        message: getSaveErrorMessage(error, "update the event"),
      },
      { status: error instanceof EventScheduleConflictError ? 409 : 500 },
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

    const { searchParams } = new URL(request.url);

    const eventId = Number(searchParams.get("id"));

    if (!Number.isInteger(eventId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID.",
        },
        { status: 400 },
      );
    }

    const result = await deleteOrDeactivateEvent(eventId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Delete event error:", error);

    return NextResponse.json(
      {
        success: false,
        message: msg.unableTo("delete the event"),
      },
      { status: 500 },
    );
  }
}
