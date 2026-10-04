// Fails the build if a Client Component imports this file.
import "server-only";

import { prisma } from "@/lib/supabase/prisma";
import type {
  CreateEventWithLocationInput,
  UpdateEventWithLocationInput,
} from "@/features/events/types";

/**
 * CREATE EVENT
 *
 * Creates a new Location first, then creates the EventAdventure
 * using that location.
 */
export async function createEventWithLocation(
  payload: CreateEventWithLocationInput,
) {
  return prisma.$transaction(async (tx) => {
    const createdLocation = await tx.location.create({
      data: {
        name: payload.location.name,
        address: payload.location.address ?? null,
        city: payload.location.city,
        province: payload.location.province,
        postalCode: payload.location.postalCode ?? null,
        country: payload.location.country,
        isActive: true,
      },
    });

    const createdEvent = await tx.eventAdventure.create({
      data: {
        locationId: createdLocation.id,

        title: payload.event.title,
        slug: payload.event.slug,
        shortDescription:
          payload.event.shortDescription ?? null,
        description:
          payload.event.description ?? null,

        price: payload.event.price ?? null,

        startDatetime: new Date(
          payload.event.startDatetime,
        ),

        endDatetime: payload.event.endDatetime
          ? new Date(payload.event.endDatetime)
          : null,

        capacity: payload.event.capacity ?? null,

        availableSpots:
          payload.event.availableSpots ??
          payload.event.capacity ??
          0,

        /*
         * This service is specifically for Events.
         */
        eventType: "event",

        status: payload.event.status ?? "DRAFT",

        isActive: payload.event.isActive ?? true,
      },
    });

    return {
      success: true,
      createdLocation,
      createdEvent,
    };
  });
}

/**
 * UPDATE EVENT
 *
 * Updates the existing Location and existing EventAdventure.
 *
 * It does NOT create a new location.
 * It does NOT delete the location.
 */
export async function updateEventWithLocation(
  payload: UpdateEventWithLocationInput,
) {
  return prisma.$transaction(async (tx) => {
    const updatedLocation = await tx.location.update({
      where: {
        id: payload.location.id,
      },
      data: {
        name: payload.location.name,
        address: payload.location.address ?? null,
        city: payload.location.city,
        province: payload.location.province,
        postalCode: payload.location.postalCode ?? null,
        country: payload.location.country,
      },
    });

    const updatedEvent = await tx.eventAdventure.update({
      where: {
        id: payload.id,
      },
      data: {
        title: payload.event.title,
        slug: payload.event.slug,

        shortDescription:
          payload.event.shortDescription ?? null,

        description:
          payload.event.description ?? null,

        price: payload.event.price ?? null,

        startDatetime: new Date(
          payload.event.startDatetime,
        ),

        endDatetime: payload.event.endDatetime
          ? new Date(payload.event.endDatetime)
          : null,

        capacity: payload.event.capacity ?? null,

        availableSpots:
          payload.event.availableSpots ??
          payload.event.capacity ??
          0,

        /*
         * Keep this as an Event.
         */
        eventType: "event",

        status: payload.event.status ?? "DRAFT",

        isActive: payload.event.isActive ?? true,
      },
    });

    return {
      success: true,
      updatedLocation,
      updatedEvent,
    };
  });
}

/**
 * DELETE / DEACTIVATE EVENT
 *
 * If there are no bookings:
 *   physically delete the EventAdventure.
 *
 * If bookings exist:
 *   deactivate the event instead so booking history remains.
 *
 * IMPORTANT:
 * The Location is NEVER deleted.
 */
export async function deleteOrDeactivateEvent(
  eventId: number,
) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.eventAdventure.findUnique({
      where: {
        id: eventId,
      },
      include: {
        bookings: true,
      },
    });

    if (!event) {
      throw new Error("Event not found.");
    }

    /**
     * Event has bookings.
     * Keep it in the database and deactivate it.
     */
    if (event.bookings.length > 0) {
      const updatedEvent =
        await tx.eventAdventure.update({
          where: {
            id: eventId,
          },
          data: {
            isActive: false,
            status: "UNPUBLISHED",
          },
        });

      return {
        success: true,
        action: "deactivated" as const,
        event: updatedEvent,
      };
    }

    /**
     * No bookings.
     * Delete only the EventAdventure.
     *
     * We intentionally do NOT delete Location.
     */
    await tx.eventAdventure.delete({
      where: {
        id: eventId,
      },
    });

    return {
      success: true,
      action: "deleted" as const,
    };
  });
}

/**
 * REACTIVATE EVENT
 */
export async function reactivateEvent(
  eventId: number,
) {
  const event = await prisma.eventAdventure.update({
    where: {
      id: eventId,
    },
    data: {
      isActive: true,

      /**
       * We use DRAFT after reactivation.
       * Admin can then publish it when appropriate.
       */
      status: "DRAFT",
    },
  });

  return {
    success: true,
    event,
  };
}
