// Fails the build if a Client Component imports this file.
import "server-only";

import { prisma as supabasePrisma } from "@/lib/supabase/prisma";
import type { CreateEventWithLocationInput } from "@/features/events/types";

export async function createEventWithLocation(
  payload: CreateEventWithLocationInput,
) {
  return supabasePrisma.$transaction(async (tx) => {
    // create location first
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

    // then create eventadventure
    try {
      const createdEvent = await tx.eventAdventure.create({
        data: {
          locationId: createdLocation.id,

          title: payload.event.title,
          slug: payload.event.slug,

          shortDescription: payload.event.shortDescription ?? null,

          description: payload.event.description ?? null,

          startDatetime: new Date(payload.event.startDatetime),

          endDatetime: payload.event.endDatetime
            ? new Date(payload.event.endDatetime)
            : null,

          capacity: payload.event.capacity ?? null,

          availableSpots:
            payload.event.availableSpots ?? payload.event.capacity ?? 0,

          eventType: payload.event.eventType,

          status: payload.event.status ?? "DRAFT",

          isActive: payload.event.isActive ?? true,

          createdBy: payload.event.createdBy ?? null,

          updatedBy: payload.event.updatedBy ?? null,
        },
      });

      return {
        createdLocation,
        createdEvent,
        success: true,
      };
    } catch (error) {
      console.error("EVENT INSERT FAILED:");

      throw error;
    }
  });
}
