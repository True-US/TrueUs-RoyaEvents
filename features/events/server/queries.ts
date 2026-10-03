// Fails the build if a Client Component imports this file.
import "server-only";

import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import { getCoverUrl } from "@/features/events/utils/cover";
import {
  eventListOrderBy,
  eventListWhere,
  publicEventDetailWhere,
  visibleEventsWhere,
} from "@/features/events/server/query-builders";
import type { EventListParams } from "@/features/events/utils/search-params";
import type { EventDetail, EventListItem } from "@/features/events/types";
import { prisma } from "@/lib/supabase/prisma";

// Only the columns a card needs. `satisfies` checks the field names against
// the schema while keeping the exact shape, so the row type below knows
// precisely which fields come back.
const eventCardSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  coverImagePath: true,
  price: true,
  startDatetime: true,
  endDatetime: true,
  capacity: true,
  availableSpots: true,
  location: { select: { name: true, city: true } },
} satisfies Prisma.EventAdventureSelect;

// The row shape Prisma returns for eventCardSelect.
type EventCardRow = Prisma.EventAdventureGetPayload<{
  select: typeof eventCardSelect;
}>;

/**
 * Gets the events the public may see, for the /events page. Always applies
 * the visibility rules (published, active, not over); admin lists use their
 * own query instead of a flag on this one.
 * @param params The validated tab, region and sort.
 * @returns The events as card data, in the requested order.
 */
export async function getPublicEventList(params: EventListParams): Promise<EventListItem[]> {
  const rows: EventCardRow[] = await prisma.eventAdventure.findMany({
    where: eventListWhere(params),
    select: eventCardSelect,
    orderBy: eventListOrderBy(params.sort),
  });

  return rows.map(toEventListItem);
}

/**
 * Gets the regions (cities) that have at least one visible event, for the
 * region dropdown. Cities with only past or draft events are left out.
 * @returns City names in alphabetical order.
 */
export async function getEventRegions(): Promise<string[]> {
  const locations: { city: string }[] = await prisma.location.findMany({
    // Relation filter: locations with `some` event matching the visibility rules.
    where: { eventAdventures: { some: visibleEventsWhere(new Date()) } },
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });

  return locations.map((location: { city: string }) => location.city);
}

/**
 * Converts a database row into card data.
 * @param row The row returned for eventCardSelect.
 * @returns The card data, with price as a number, the cover as a URL and the venue as text.
 */
function toEventListItem({
  coverImagePath,
  price,
  location,
  ...row
}: EventCardRow): EventListItem {
  return {
    ...row,
    // Prisma returns DECIMAL columns as Decimal objects, which React can't
    // pass to Client Components. Event prices fit safely in a JS number.
    price: price === null ? null : price.toNumber(),
    coverUrl: getCoverUrl(coverImagePath),
    venue: location ? `${location.name}, ${location.city}` : null,
  };
}

//---------- Detail page -------------

// Columns for the detail page, including the full venue address.
const eventDetailSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  description: true,
  coverImagePath: true,
  price: true,
  startDatetime: true,
  endDatetime: true,
  capacity: true,
  availableSpots: true,
  status: true,
  location: {
    select: { name: true, address: true, city: true, province: true, postalCode: true },
  },
} satisfies Prisma.EventAdventureSelect;

// The row shape Prisma returns for eventDetailSelect.
type EventDetailRow = Prisma.EventAdventureGetPayload<{
  select: typeof eventDetailSelect;
}>;

/**
 * Gets one event for its public detail page.
 * Wrapped in React's cache(): generateMetadata and the page both call it in
 * the same request, and cache() makes that a single database query.
 * @param slug The slug from the URL.
 * @returns The event, or null if it doesn't exist or isn't public.
 */
export const getPublicEventBySlug: (slug: string) => Promise<EventDetail | null> = cache(
  async (slug: string): Promise<EventDetail | null> => {
    if (!slug) {
      return null;
    }

    // findFirst, not findUnique: findUnique only accepts unique fields, and
    // the visibility rules (status, type, isActive) are not unique.
    const row: EventDetailRow | null = await prisma.eventAdventure.findFirst({
      where: publicEventDetailWhere(slug),
      select: eventDetailSelect,
    });
    if (!row) {
      return null;
    }

    return toEventDetail(row);
  },
);

/**
 * Converts a database row into detail page data.
 * @param row The row returned for eventDetailSelect.
 * @returns The detail data, with price as a number and the cover as a URL.
 */
function toEventDetail({ coverImagePath, price, ...row }: EventDetailRow): EventDetail {
  return {
    ...row,
    price: price === null ? null : price.toNumber(),
    coverUrl: getCoverUrl(coverImagePath),
  };
}
