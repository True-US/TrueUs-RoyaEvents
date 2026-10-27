import { EVENT_STATUS, EVENT_TYPE, REQUEST_STATUS } from "@/features/events/constants";
import { eventDetailsSchema, eventLocationSchema, getEventRuleErrors } from "@/features/events/schemas";
import type { eventAdventureRecord } from "@/features/events/types";

// What the admin list shows next to a record. A live record has no tag: its
// Unpublish button says it is live.
// Requests (customer private events) show their review status instead of DRAFT/READY.
export type EventTag = "DRAFT" | "READY" | "EXPIRED" | "CANCELLED" | "PENDING" | "APPROVED" | "DECLINED";

/**
 * Whether an event is over. Derived from the dates, never stored, so the
 * record keeps its publish state.
 * @param event The admin event.
 * @param now The current moment. Defaults to now.
 * @returns True when the end (or the start, with no end) is in the past.
 */
export function isEventExpired(event: eventAdventureRecord, now: Date = new Date()): boolean {
  const last: number = new Date(event.endsAt ?? event.startsAt).getTime();

  return last < now.getTime();
}

/**
 * Whether a saved event passes every rule needed to publish it: the same
 * schemas the form and server use. The cover image is optional.
 * @param event The admin event.
 * @returns True when nothing blocks publishing.
 */
export function isEventReady(event: eventAdventureRecord): boolean {
  if (!event.location) {
    return false;
  }

  const details: ReturnType<typeof eventDetailsSchema.safeParse> = eventDetailsSchema.safeParse({
    title: event.title,
    slug: event.slug,
    description: event.description,
  });
  if (!details.success) {
    return false;
  }

  const place: ReturnType<typeof eventLocationSchema.safeParse> = eventLocationSchema.safeParse({
    name: event.location.name,
    address: event.location.address,
    city: event.location.city,
    province: event.location.province,
    postalCode: event.location.postalCode,
    country: event.location.country,
  });
  if (!place.success) {
    return false;
  }

  const ruleErrors: ReturnType<typeof getEventRuleErrors> = getEventRuleErrors({
    price: event.price === null ? null : Number(event.price),
    capacity: event.capacity,
    availableSpots: event.availableSpots,
    startDatetime: event.startsAt,
    endDatetime: event.endsAt,
  });

  return Object.keys(ruleErrors).length === 0;
}

/**
 * The tags to show for an event.
 * @param event The admin event.
 * @returns EXPIRED when over, then DRAFT or READY while it is not live; CANCELLED as stored. [] for a live event.
 *   A request gets its review status (PENDING when none is stored yet) instead.
 */
export function getEventTags(event: eventAdventureRecord): EventTag[] {
  const tags: EventTag[] = [];

  if (isEventExpired(event)) {
    tags.push("EXPIRED");
  }

  if (event.eventType === EVENT_TYPE.CUSTOM_EVENT) {
    tags.push((event.requestStatus ?? REQUEST_STATUS.PENDING) as EventTag);

    return tags;
  }

  if (event.status === EVENT_STATUS.CANCELLED) {
    tags.push("CANCELLED");
  } else if (event.status !== EVENT_STATUS.PUBLISHED) {
    tags.push(isEventReady(event) ? "READY" : "DRAFT");
  }

  return tags;
}
