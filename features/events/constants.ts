// All event dates are shown and grouped in Edmonton time. Use the IANA name,
// never a fixed offset: Alberta stays on UTC-6 year-round from Nov 2026, and
// the name picks that up once the runtime's tz data is updated.
export const EVENT_TIME_ZONE: string = "America/Edmonton";

// Values stored in event_adventure.status.
// "Ended" is not a status: it is worked out from the dates (endDatetime < now).
export const EVENT_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  CANCELLED: "CANCELLED",
} as const;

// Union of the status values: "DRAFT" | "PUBLISHED" | ...
export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

// Values stored in event_adventure.event_type.
export const EVENT_TYPE = {
  EVENT: "EVENT",
  ADVENTURE: "ADVENTURE",
} as const;

// Union of the type values: "EVENT" | "ADVENTURE".
export type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];

// Date filter tabs. `value` is what goes in the URL (?when=this-week).
export const EVENT_TABS = [
  { value: "all", label: "All" },
  { value: "this-week", label: "This week" },
  { value: "this-weekend", label: "This weekend" },
  { value: "this-month", label: "This month" },
  { value: "free", label: "Free" },
] as const;

// Union of the tab values: "all" | "this-week" | ...
export type EventTab = (typeof EVENT_TABS)[number]["value"];

// Sort options. `value` is what goes in the URL (?sort=price-low).
// To add one: add it here, then add its order to EVENT_SORT_ORDER in
// filters.ts (TypeScript reports an error until you do).
export const EVENT_SORTS = [
  { value: "date", label: "Date" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
] as const;

// Union of the sort values: "date" | "price-low" | "price-high".
export type EventSort = (typeof EVENT_SORTS)[number]["value"];

// Show "Only N left" when this many spots or fewer remain.
export const LOW_SPOTS_THRESHOLD: number = 5;

// Supabase Storage bucket holding event cover images.
export const EVENT_COVER_BUCKET: string = "event-covers";