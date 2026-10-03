// Fails the build if a Client Component imports this file.
import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { EVENT_STATUS, EVENT_TYPE, type EventSort, type EventTab } from "@/features/events/constants";
import { getZonedDate, startOfZonedDay, type ZonedDate } from "@/features/events/utils/dates";
import type { EventListParams } from "@/features/events/utils/search-params";

// Prisma `where` and `orderBy` objects for the public event list. Typing them
// with Prisma's generated types makes a misspelled or renamed field a compile
// error, and the same objects can be reused by any query.

type EventWhere = Prisma.EventAdventureWhereInput;
type EventOrderBy = Prisma.EventAdventureOrderByWithRelationInput[];

//---------- Filtering -------------

/**
 * Events the public may see: published, active, type EVENT, not yet over.
 * Multi-day events stay listed until they end.
 * @param now The current moment.
 * @returns The Prisma where condition.
 */
export function visibleEventsWhere(now: Date): EventWhere {
  return {
    eventType: EVENT_TYPE.EVENT,
    status: EVENT_STATUS.PUBLISHED,
    isActive: true,
    OR: stillRunningAt(now),
  };
}

/**
 * Which event a public detail page may show: a published or cancelled event
 * (cancelled ones show a notice), active, type EVENT. Unlike the list, past
 * events are included so old shared links keep working.
 * @param slug The slug from the URL.
 * @returns The Prisma where condition.
 */
export function publicEventDetailWhere(slug: string): EventWhere {
  return {
    slug,
    eventType: EVENT_TYPE.EVENT,
    status: { in: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.CANCELLED] },
    isActive: true,
  };
}

/**
 * Everything the /events page lists for the given params.
 * @param params The validated tab and region.
 * @param now The current moment. Defaults to now.
 * @returns The Prisma where condition.
 */
export function eventListWhere(params: EventListParams, now: Date = new Date()): EventWhere {
  // AND keeps every condition intact. Spreading them into one object would
  // let one condition's OR silently replace another's.
  const conditions: EventWhere[] = [
    visibleEventsWhere(now),
    eventTabWhere(params.tab, now),
  ];

  if (params.region) {
    conditions.push({ location: { city: params.region } });
  }

  return { AND: conditions };
}

/**
 * Narrows the visible events to one date/price tab.
 * @param tab The selected tab.
 * @param now The current moment.
 * @returns The Prisma where condition ({} for "all").
 */
function eventTabWhere(tab: EventTab, now: Date): EventWhere {
  const today: ZonedDate = getZonedDate(now);

  switch (tab) {
    case "this-week": {
      // Weeks run Monday to Sunday. On Sunday, "this week" is just today.
      const daysToNextMonday: number = (8 - today.weekday) % 7 || 7;
      return overlaps(now, startOfZonedDay(today, daysToNextMonday));
    }
    case "this-weekend": {
      // Saturday 00:00 to Monday 00:00. On a Sunday, use the current weekend.
      const toSaturday: number = today.weekday === 0 ? -1 : 6 - today.weekday;
      return overlaps(
        startOfZonedDay(today, toSaturday),
        startOfZonedDay(today, toSaturday + 2),
      );
    }
    case "this-month": {
      // Month 13 rolls over to January of next year inside Date.UTC.
      const firstOfNextMonth: ZonedDate = { ...today, month: today.month + 1, day: 1 };
      return overlaps(now, startOfZonedDay(firstOfNextMonth));
    }
    case "free": {
      // No price set counts as free.
      return { OR: [{ price: null }, { price: 0 }] };
    }
    case "all": {
      return {};
    }
  }
}

/**
 * Has not ended by `moment`. With no end time, the start time is used.
 * @param moment The moment to compare against.
 * @returns Two alternatives to use as an OR.
 */
function stillRunningAt(moment: Date): EventWhere[] {
  return [
    { endDatetime: { gte: moment } },
    { endDatetime: null, startDatetime: { gte: moment } },
  ];
}

/**
 * Takes place at some point in [from, to): starts before `to`, ends after `from`.
 * @param from Start of the range (inclusive).
 * @param to End of the range (exclusive).
 * @returns The Prisma where condition.
 */
function overlaps(from: Date, to: Date): EventWhere {
  return {
    startDatetime: { lt: to },
    OR: stillRunningAt(from),
  };
}

//---------- Sorting -------------

// One entry per sort option. Record<EventSort, ...> makes TypeScript require
// an entry here for every value in EVENT_SORTS.
const EVENT_SORT_ORDER: Record<EventSort, EventOrderBy> = {
  date: [{ startDatetime: "asc" }, { id: "asc" }],
  // No price means free, so it sorts as the cheapest.
  "price-low": [
    { price: { sort: "asc", nulls: "first" } },
    { startDatetime: "asc" },
    { id: "asc" },
  ],
  "price-high": [
    { price: { sort: "desc", nulls: "last" } },
    { startDatetime: "asc" },
    { id: "asc" },
  ],
};

/**
 * The Prisma orderBy for a sort option. Ties fall back to date, then id,
 * so the order is always stable.
 * @param sort The selected sort option.
 * @returns The Prisma orderBy list.
 */
export function eventListOrderBy(sort: EventSort): EventOrderBy {
  return EVENT_SORT_ORDER[sort];
}
