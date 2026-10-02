import { NextResponse } from "next/server";
// import { createEventWithLocation } from "@/features/events/service";
// import type { CreateEventWithLocationInput } from "@/features/events/types";

import {
  getCurrentProfile,
  isAdminRole,
} from "@/features/auth/current-profile";

import { getAdminEvents } from "@/features/events/queries";

import {
  createEventWithLocation,
  deleteOrDeactivateEvent,
  reactivateEvent,
  updateEventWithLocation,
} from "@/features/events/service";

import type {
  CreateEventWithLocationInput,
  UpdateEventWithLocationInput,
} from "@/features/events/types";

// export async function POST(request: Request) {
//   try {
//     const payload: CreateEventWithLocationInput = await request.json();
//     const result = await createEventWithLocation(payload);
//     return NextResponse.json(result, {
//       status: 201,
//     });
//   } catch (error) {
//     console.error("Create event error:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         message:
//           error instanceof Error ? error.message : "Failed to create event",
//       },
//       {
//         status: 500,
//       },
//     );
//   }
// }


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


/*
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


/*
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

    const result = await createEventWithLocation(
      payload,
    );

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


/*
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

    /*
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

    const result =
      await updateEventWithLocation(payload);

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

/*
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