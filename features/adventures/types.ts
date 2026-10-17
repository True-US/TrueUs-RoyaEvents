import type { EventAdventure, Location } from "@/generated/prisma/client";

/**
 * One card on /adventures. Built from the Prisma model like EventListItem,
 * with plain values in place of Decimal and the cover path.
 */
export type AdventureListItem = Pick<
  EventAdventure,
  "id" | "slug" | "title" | "shortDescription" | "startDatetime" | "endDatetime"
> & {
  price: number | null; // Decimal -> number
  coverUrl: string | null; // coverImagePath -> full URL
  venue: string | null; // location -> "Elk Island National Park, Fort Saskatchewan"
};

/** The public detail page /adventures/[slug]. */
export type AdventureDetail = Pick<
  EventAdventure,
  | "id"
  | "slug"
  | "title"
  | "shortDescription"
  | "description"
  | "startDatetime"
  | "endDatetime"
  | "capacity"
> & {
  price: number | null; // Decimal -> number
  coverUrl: string | null; // coverImagePath -> full URL
  location: Pick<Location, "name" | "address" | "city" | "province" | "postalCode"> | null;
};
