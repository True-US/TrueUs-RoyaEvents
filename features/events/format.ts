import { EVENT_STATUS, EVENT_TIME_ZONE, LOW_SPOTS_THRESHOLD } from "@/features/events/constants";
import type { EventDetail, EventListItem } from "@/features/events/types";

// Display helpers. They take plain numbers and Dates, so convert Prisma's
// Decimal to a number before calling them.

// One day in milliseconds.
const DAY: number = 24 * 60 * 60 * 1000;

// "Fri, Oct 2, 7:30 PM" in Edmonton time.
const dayAndTime: Intl.DateTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// "Oct 2" in Edmonton time.
const dayOnly: Intl.DateTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  month: "short",
  day: "numeric",
});

// "Friday, October 2, 2026 at 7:30 PM" in Edmonton time.
const fullDateTime: Intl.DateTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// "$35"
const wholeDollars: Intl.NumberFormat = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// "$12.50"
const withCents: Intl.NumberFormat = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

/**
 * Formats event dates for display: "Fri, Oct 2, 7:30 PM" for a single event,
 * or "Sep 30 – Oct 4" when it runs 24 hours or more. Overnight events
 * (8 pm to 1 am) count as single events.
 * @param start The start of the event.
 * @param end The end of the event, or null if not set.
 * @returns The formatted date text.
 */
export function formatEventDate(start: Date, end: Date | null): string {
  if (end && end.getTime() - start.getTime() >= DAY) {
    // formatRange drops repeated parts: "Oct 2 – 5", "Sep 30 – Oct 4".
    return dayOnly.formatRange(start, end);
  }

  return dayAndTime.format(start);
}

/**
 * Formats the full date and time for the detail page, with the end time when
 * set. formatRange shortens same-day ranges by itself:
 * "Friday, October 2, 2026, 7:30 – 10:30 PM".
 * @param start The start of the event.
 * @param end The end of the event, or null if not set.
 * @returns The formatted date text.
 */
export function formatEventDateLong(start: Date, end: Date | null): string {
  if (!end) {
    return fullDateTime.format(start);
  }

  return fullDateTime.formatRange(start, end);
}

/**
 * Formats a price: "Free" for no price or 0, "$35" for whole dollars,
 * "$12.50" otherwise.
 * @param price The price, or null if not set.
 * @returns The formatted price text.
 */
export function formatPrice(price: number | null): string {
  if (!price) {
    return "Free";
  }

  if (Number.isInteger(price)) {
    return wholeDollars.format(price);
  }

  return withCents.format(price);
}

// A label shown on top of a card's cover image.
export type EventBadge = {
  label: string;
  tone: "sold-out" | "low" | "live";
};

/**
 * Picks the one badge to show on a card, most important first:
 * Sold out, then Only N left, then Happening now.
 * @param event The event's start time and spots.
 * @param now The current moment. Defaults to now.
 * @returns The badge, or null if none applies.
 */
export function getEventBadge(
  event: Pick<EventListItem, "startDatetime" | "capacity" | "availableSpots">,
  now: Date = new Date(),
): EventBadge | null {
  // No capacity means unlimited. available_spots defaults to 0 in the
  // database, so it can't be trusted on its own.
  if (event.capacity !== null && event.availableSpots !== null) {
    if (event.availableSpots <= 0) {
      return { label: "Sold out", tone: "sold-out" };
    }
    if (event.availableSpots <= LOW_SPOTS_THRESHOLD) {
      return { label: `Only ${event.availableSpots} left`, tone: "low" };
    }
  }

  if (event.startDatetime <= now) {
    return { label: "Happening now", tone: "live" };
  }

  return null;
}

// Whether tickets can be bought, and if not, why.
export type EventState = "open" | "sold-out" | "ended" | "cancelled";

/**
 * Works out the event's ticket state, most important first:
 * cancelled, then ended, then sold out.
 * @param event The event's status, dates and spots.
 * @param now The current moment. Defaults to now.
 * @returns The state.
 */
export function getEventState(
  event: Pick<EventDetail, "status" | "startDatetime" | "endDatetime" | "capacity" | "availableSpots">,
  now: Date = new Date(),
): EventState {
  if (event.status === EVENT_STATUS.CANCELLED) {
    return "cancelled";
  }

  // With no end time, the event counts as over once it has started.
  const endsAt: Date = event.endDatetime ?? event.startDatetime;
  if (endsAt < now) {
    return "ended";
  }

  // No capacity means unlimited.
  if (event.capacity !== null && event.availableSpots !== null && event.availableSpots <= 0) {
    return "sold-out";
  }

  return "open";
}

/**
 * Describes the remaining spots, e.g. "64 of 120 spots left".
 * @param event The event's capacity and spots.
 * @returns The text, or null when there is no limit.
 */
export function formatSpotsLeft(
  event: Pick<EventDetail, "capacity" | "availableSpots">,
): string | null {
  if (event.capacity === null || event.availableSpots === null) {
    return null;
  }

  return `${Math.max(event.availableSpots, 0)} of ${event.capacity} spots left`;
}

/**
 * Splits a venue into display lines: name, street, then city line.
 * @param location The event's location.
 * @returns The non-empty lines, e.g. ["Winspear Centre", "9720 102 Ave NW", "Edmonton, Alberta T5J 4B2"].
 */
export function formatVenueLines(location: NonNullable<EventDetail["location"]>): string[] {
  const cityLine: string = [`${location.city}, ${location.province}`, location.postalCode]
    .filter(Boolean)
    .join(" ");

  return [location.name, location.address, cityLine].filter(
    (line: string | null): line is string => Boolean(line),
  );
}
