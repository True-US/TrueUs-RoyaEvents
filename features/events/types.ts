import type { EventAdventure, Location } from "@/generated/prisma/client";

/**
 * The public detail page /events/[slug]. Built from the Prisma models like
 * EventListItem, with the same plain-value replacements.
 */
export type EventDetail = Pick<
  EventAdventure,
  | "id"
  | "slug"
  | "title"
  | "shortDescription"
  | "description"
  | "startDatetime"
  | "endDatetime"
  | "capacity"
  | "availableSpots"
  | "status"
> & {
  price: number | null; // Decimal -> number
  coverUrl: string | null; // coverImagePath -> full URL
  location: Pick<Location, "name" | "address" | "city" | "province" | "postalCode"> | null;
};

/**
 * One card on /events. Built from the Prisma model, so a renamed or retyped
 * column shows up here as a compile error. Fields the UI needs in a different
 * form are replaced with plain values (no Prisma Decimal), so it can be passed
 * safely to any component, including Client Components.
 */
export type EventListItem = Pick<
  EventAdventure,
  | "id"
  | "slug"
  | "title"
  | "shortDescription"
  | "startDatetime"
  | "endDatetime"
  | "capacity"
  | "availableSpots"
> & {
  price: number | null; // Decimal -> number
  coverUrl: string | null; // coverImagePath -> full URL
  venue: string | null; // location -> "Winspear Centre, Edmonton"
};

export type CreateEventLocationInput = {
  name: string;
  address?: string | null;
  city: string;
  province: string;
  postalCode?: string | null;
  country: string;
};

export type CreateEventInput = {
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  startDatetime: string;
  endDatetime?: string | null;
  capacity?: number | null;
  availableSpots?: number | null;
  eventType: string;
  status?: string;
  isActive?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type CreateEventWithLocationInput = {
  location: CreateEventLocationInput;
  event: CreateEventInput;
};
