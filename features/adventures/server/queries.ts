// Fails the build if a Client Component imports this file.
import "server-only";

import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import { EVENT_STATUS, EVENT_TYPE } from "@/features/events/constants";
import { keywordConditions } from "@/features/events/server/query-builders";
import { getCoverUrl } from "@/features/events/utils/cover";
import type { AdventureDetail, AdventureListItem } from "@/features/adventures/types";
import { prisma } from "@/lib/supabase/prisma";

// Adventures are booked by requesting a date, so their start/end columns only
// describe how long the trip lasts. Unlike events, they never "end" and drop
// off the list: the only rules are type, status and isActive.
const publicAdventureWhere: Prisma.EventAdventureWhereInput = {
  eventType: EVENT_TYPE.ADVENTURE,
  status: EVENT_STATUS.PUBLISHED,
  isActive: true,
};

// Only the columns a card needs.
const adventureCardSelect = {
  id: true,
  slug: true,
  title: true,
  shortDescription: true,
  coverImagePath: true,
  price: true,
  startDatetime: true,
  endDatetime: true,
  location: { select: { name: true, city: true } },
} satisfies Prisma.EventAdventureSelect;

// The row shape Prisma returns for adventureCardSelect.
type AdventureCardRow = Prisma.EventAdventureGetPayload<{
  select: typeof adventureCardSelect;
}>;

/**
 * Gets the adventures the public may see, for the /adventures page.
 * @returns The adventures as card data, newest first.
 */
export async function getPublishedAdventures(): Promise<AdventureListItem[]> {
  const rows: AdventureCardRow[] = await prisma.eventAdventure.findMany({
    where: publicAdventureWhere,
    select: adventureCardSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return rows.map(toAdventureListItem);
}

/**
 * Searches the public adventures by keyword. Matches the title only, ignoring case.
 * @param term The trimmed search text.
 * @returns The matching adventures as card data, newest first.
 */
export async function searchPublishedAdventures(term: string): Promise<AdventureListItem[]> {
  const rows: AdventureCardRow[] = await prisma.eventAdventure.findMany({
    where: { AND: [publicAdventureWhere, { OR: keywordConditions(term) }] },
    select: adventureCardSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return rows.map(toAdventureListItem);
}

/**
 * Converts a database row into card data.
 * @param row The row returned for adventureCardSelect.
 * @returns The card data, with price as a number, the cover as a URL and the venue as text.
 */
function toAdventureListItem({
  coverImagePath,
  price,
  location,
  ...row
}: AdventureCardRow): AdventureListItem {
  return {
    ...row,
    price: price === null ? null : price.toNumber(),
    coverUrl: getCoverUrl(coverImagePath),
    venue: location ? `${location.name}, ${location.city}` : null,
  };
}

//---------- Detail page -------------

// Columns for the detail page, including the full venue address.
const adventureDetailSelect = {
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
  location: {
    select: { name: true, address: true, city: true, province: true, postalCode: true },
  },
} satisfies Prisma.EventAdventureSelect;

// The row shape Prisma returns for adventureDetailSelect.
type AdventureDetailRow = Prisma.EventAdventureGetPayload<{
  select: typeof adventureDetailSelect;
}>;

/**
 * Gets one adventure for its public detail page.
 * Wrapped in React's cache(): generateMetadata and the page both call it in
 * the same request, and cache() makes that a single database query.
 * @param slug The slug from the URL.
 * @returns The adventure, or null if it doesn't exist or isn't public.
 */
export const getPublicAdventureBySlug: (slug: string) => Promise<AdventureDetail | null> = cache(
  async (slug: string): Promise<AdventureDetail | null> => {
    if (!slug) {
      return null;
    }

    // findFirst, not findUnique: the visibility rules are not unique fields.
    const row: AdventureDetailRow | null = await prisma.eventAdventure.findFirst({
      where: { ...publicAdventureWhere, slug },
      select: adventureDetailSelect,
    });
    if (!row) {
      return null;
    }

    const { coverImagePath, price, ...rest } = row;

    return {
      ...rest,
      price: price === null ? null : price.toNumber(),
      coverUrl: getCoverUrl(coverImagePath),
    };
  },
);
