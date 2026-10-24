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


/**
 * This type is only for the Admin Manage Events page.
 * It does not replace the customer Event type above.
 */
export type eventAdventureRecord = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  price: number | string | null;
  startsAt: string;
  endsAt: string | null;
  status: string;
  capacity: number | null;
  availableSpots: number | null;
  eventType: string;
  isActive: boolean;
  // Customer requests only: who asked, and where the review stands. Null otherwise.
  contact: { name: string; email: string; phone: string } | null;
  requestStatus: string | null;
  coverUrl: string | null; // Shown in the edit popup; null when there is no cover.
  location: {
    id: number;
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  } | null;
};


export type CreateEventLocationInput = {
  name: string;
  address?: string | null;
  city: string;
  province: string;
  postalCode?: string | null;
  country: string;
};

export type UpdateEventLocationInput = {
  id: number;
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
  price?: number | null;
  startDatetime: string;
  endDatetime?: string | null;
  capacity?: number | null;
  availableSpots?: number | null;
  eventType?: string;
  status?: string;
  isActive?: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  // Sent by the public request form only. The request status is set by the server.
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  // Set only by the server after a cover upload; never sent by the form.
  coverImagePath?: string | null;
};

export type CreateEventWithLocationInput = {
  location: CreateEventLocationInput;
  event: CreateEventInput;
};

export type UpdateEventWithLocationInput = {
  id: number;
  location: UpdateEventLocationInput;
  event: CreateEventInput;
};

/**
 * What the create/update server actions return. Expected problems come back
 * as values, not thrown errors: Next.js hides thrown error messages in
 * production, so the form could not show them.
 */
export type EventActionResult =
  | {
      success: true;
      eventId: number;
      // Set when the event was saved but its cover upload failed.
      coverError?: string;
    }
  | { success: false; message: string };

