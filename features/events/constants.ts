// All event dates are shown and grouped in Alberta time. Alberta stays on UTC-6
// all year from Nov 2026 (no more clock changes), so this is a fixed UTC-6 zone
// ("Etc/GMT+6": the sign is inverted in the name). It does not depend on the
// runtime's tz data, which still has the old winter time for America/Edmonton.
// Change it only if Alberta's time rules change again.
export const EVENT_TIME_ZONE: string = "Etc/GMT+6";

// Values stored in event_adventure.status.
// "Ended" is not a status: it is worked out from the dates (endDatetime < now).
export const EVENT_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  UNPUBLISHED: "UNPUBLISHED",
  CANCELLED: "CANCELLED",
} as const;

// Union of the status values: "DRAFT" | "PUBLISHED" | ...
export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

// Values stored in event_adventure.event_type.
export const EVENT_TYPE = {
  EVENT: "EVENT",
  ADVENTURE: "ADVENTURE",
  CUSTOM_EVENT: "CUSTOM_EVENT",
} as const;

// Review status of a customer request (event_adventure.request_status).
export const REQUEST_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  CANCELLED: "CANCELLED",
} as const;

// Union of the type values: "EVENT" | "ADVENTURE" | "CUSTOM_EVENT".
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

// Cover image rules, shared by the browser (cover picker) and the server
// (cover-storage). Covers are cropped to 2:1 and saved as WebP.
export const COVER_WIDTH: number = 1600;
export const COVER_HEIGHT: number = 800;
export const COVER_CONTENT_TYPE: string = "image/webp";
// Matches the bucket's file size limit. A compressed cover is ~200-400 KB.
export const COVER_MAX_BYTES: number = 2 * 1024 * 1024;
// Smaller source images would look blurry when stretched to the cover size.
export const COVER_MIN_SOURCE_WIDTH: number = 800;
export const COVER_MIN_SOURCE_HEIGHT: number = 400;

// An event's end must be at least this many minutes after its start.
export const MIN_EVENT_DURATION_MINUTES: number = 10;

// Max lengths. Keep in step with the column sizes in prisma/schema.prisma.
export const EVENT_TITLE_MAX: number = 200;
export const EVENT_SLUG_MAX: number = 255;
export const EVENT_SHORT_DESCRIPTION_MAX: number = 500;
// description is a Text column, so this limit is ours, not the database's.
export const EVENT_DESCRIPTION_MAX: number = 5000;
export const LOCATION_NAME_MAX: number = 200;
export const LOCATION_ADDRESS_MAX: number = 255;
export const LOCATION_CITY_MAX: number = 100;
export const LOCATION_PROVINCE_MAX: number = 100;
export const LOCATION_COUNTRY_MAX: number = 100;
export const LOCATION_POSTAL_CODE_MAX: number = 20;

// Number limits. Postgres INTEGER tops out at 2,147,483,647; price is Decimal(10,2).
export const INT_MAX: number = 2147483647;
export const PRICE_MAX: number = 99999999.99;
// Stripe can't charge less than this, so a paid ticket costs at least this much.
export const MIN_PAID_PRICE: number = 0.5;

// Custom event / contact / private adventure requests.
export const REQUEST_GUESTS_MAX: number = 100000;
export const REQUEST_MESSAGE_MAX: number = 2000;