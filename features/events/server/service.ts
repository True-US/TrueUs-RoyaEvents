// Fails the build if a Client Component imports this file.
import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { EVENT_STATUS, EVENT_TYPE } from "@/features/events/constants";
import { deleteEventCoverFolder } from "@/features/events/server/cover-storage";
import { prisma } from "@/lib/supabase/prisma";
import type {
  CreateEventWithLocationInput,
  UpdateEventWithLocationInput,
} from "@/features/events/types";

export class EventScheduleConflictError extends Error {
  constructor() {
    super(
      "This time overlaps with another active event or adventure. Choose a different time.",
    );
    this.name = "EventScheduleConflictError";
  }
}

/**
 * Thrown when the new capacity is below what is already booked.
 * The message is written for the admin, so it can be shown as is.
 */
export class EventCapacityError extends Error {
  constructor(booked: number) {
    super(`Capacity can't be lower than the ${booked} spots already booked.`);
    this.name = "EventCapacityError";
  }
}

function resolveEventType(eventType: string | undefined): string {
  // "custom_event" is what the public request form sends.
  if (eventType === EVENT_TYPE.CUSTOM_EVENT || eventType === "custom_event") {
    return EVENT_TYPE.CUSTOM_EVENT;
  }

  return eventType === EVENT_TYPE.ADVENTURE || eventType === "private_adventure"
    ? EVENT_TYPE.ADVENTURE
    : EVENT_TYPE.EVENT;
}

async function ensureScheduleIsAvailable(
  tx: Prisma.TransactionClient,
  startDatetime: Date,
  endDatetime: Date | null,
  excludedEventId?: number,
): Promise<void> {
  // Serialize schedule writes so simultaneous requests cannot both pass the
  // overlap check before either one commits.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(728194031)::text`;

  const scheduledItems = await tx.eventAdventure.findMany({
    where: {
      isActive: true,
      status: { not: EVENT_STATUS.CANCELLED },
      ...(excludedEventId === undefined
        ? {}
        : { id: { not: excludedEventId } }),
    },
    select: {
      id: true,
      title: true,
      startDatetime: true,
      endDatetime: true,
    },
  });

  const overlaps = scheduledItems.some((item) => {
    const itemStart = item.startDatetime.getTime();
    const itemEnd = item.endDatetime?.getTime() ?? itemStart;
    const requestedStart = startDatetime.getTime();
    const requestedEnd = endDatetime?.getTime() ?? requestedStart;

    if (item.endDatetime && endDatetime) {
      return requestedStart < itemEnd && itemStart < requestedEnd;
    }
    if (!item.endDatetime && !endDatetime) {
      return itemStart === requestedStart;
    }
    if (!item.endDatetime) {
      return itemStart >= requestedStart && itemStart < requestedEnd;
    }
    return requestedStart >= itemStart && requestedStart < itemEnd;
  });

  if (overlaps) {
    throw new EventScheduleConflictError();
  }
}

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
    const startDatetime = new Date(payload.event.startDatetime);
    const endDatetime = payload.event.endDatetime
      ? new Date(payload.event.endDatetime)
      : null;
    if (
      payload.event.isActive !== false &&
      payload.event.status !== EVENT_STATUS.CANCELLED
    ) {
      await ensureScheduleIsAvailable(tx, startDatetime, endDatetime);
    }

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
        shortDescription: payload.event.shortDescription ?? null,
        description: payload.event.description ?? null,

        price: payload.event.price ?? null,

        startDatetime,

        endDatetime,

        capacity: payload.event.capacity ?? null,

        // Not asked for in the form: every spot is open on a new event.
        // null (no capacity) means unlimited.
        availableSpots:
          payload.event.availableSpots ?? payload.event.capacity ?? null,

        // "EVENT" unless the admin created it from the Adventure tab.
        eventType: resolveEventType(payload.event.eventType),

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
    const startDatetime = new Date(payload.event.startDatetime);
    const endDatetime = payload.event.endDatetime
      ? new Date(payload.event.endDatetime)
      : null;
    if (
      payload.event.isActive !== false &&
      payload.event.status !== EVENT_STATUS.CANCELLED
    ) {
      await ensureScheduleIsAvailable(
        tx,
        startDatetime,
        endDatetime,
        payload.id,
      );
    }

    // Available spots are not edited by hand: they follow the capacity.
    // Bookings already made stay counted (booked = old capacity - old spots).
    const current = await tx.eventAdventure.findUnique({
      where: { id: payload.id },
      select: { capacity: true, availableSpots: true },
    });
    const newCapacity: number | null = payload.event.capacity ?? null;
    let availableSpots: number | null = payload.event.availableSpots ?? newCapacity;
    if (
      payload.event.availableSpots === undefined &&
      newCapacity !== null &&
      current?.capacity != null &&
      current.availableSpots !== null
    ) {
      const booked: number = current.capacity - current.availableSpots;
      if (newCapacity < booked) {
        throw new EventCapacityError(booked);
      }
      availableSpots = newCapacity - booked;
    }

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

        shortDescription: payload.event.shortDescription ?? null,

        description: payload.event.description ?? null,

        price: payload.event.price ?? null,

        startDatetime,

        endDatetime,

        capacity: payload.event.capacity ?? null,

        availableSpots,

        eventType: resolveEventType(payload.event.eventType),

        status: payload.event.status ?? "DRAFT",

        isActive: payload.event.isActive ?? true,

        // Only when a new cover was uploaded; otherwise keep the current one.
        ...(payload.event.coverImagePath !== undefined
          ? { coverImagePath: payload.event.coverImagePath }
          : {}),
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
export async function deleteOrDeactivateEvent(eventId: number) {
  const result = await prisma.$transaction(async (tx) => {
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
      const updatedEvent = await tx.eventAdventure.update({
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

  // The row is gone, so its cover files are unused. Done after the
  // transaction commits: Storage isn't part of the database transaction.
  if (result.action === "deleted") {
    await deleteEventCoverFolder(eventId);
  }

  return result;
}

/**
 * REACTIVATE EVENT
 */
export async function reactivateEvent(eventId: number) {
  const event = await prisma.$transaction(async (tx) => {
    const existing = await tx.eventAdventure.findUnique({
      where: { id: eventId },
      select: { startDatetime: true, endDatetime: true },
    });
    if (!existing) {
      throw new Error("Event not found.");
    }

    await ensureScheduleIsAvailable(
      tx,
      existing.startDatetime,
      existing.endDatetime,
      eventId,
    );

    return tx.eventAdventure.update({
      where: { id: eventId },
      data: {
        isActive: true,
        status: "DRAFT",
      },
    });
  });

  return {
    success: true,
    event,
  };
}
