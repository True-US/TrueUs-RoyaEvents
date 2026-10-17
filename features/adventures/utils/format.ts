import { formatPrice } from "@/features/events/utils/format";

const HOUR: number = 60 * 60 * 1000;
const DAY: number = 24 * HOUR;

/**
 * Describes how long an adventure lasts, from its start and end columns:
 * "About 6 hours" or "2 days".
 * @param start The adventure's start.
 * @param end The adventure's end, or null if not set.
 * @returns The text, or null when there is no end to measure to.
 */
export function formatDuration(start: Date, end: Date | null): string | null {
  if (!end || end <= start) {
    return null;
  }

  const ms: number = end.getTime() - start.getTime();
  // Overnight trips (10 pm to 2 am) are hours; a day or more counts calendar-ish days.
  if (ms >= DAY) {
    const days: number = Math.round(ms / DAY);
    return days === 1 ? "1 day" : `${days} days`;
  }

  const hours: number = Math.max(1, Math.round(ms / HOUR));
  return hours === 1 ? "About 1 hour" : `About ${hours} hours`;
}

/**
 * Formats the price of an adventure. Adventures are not free, so a missing
 * price means "ask us" rather than "Free" as it does for events.
 * @param price The price, or null if not set.
 * @returns "From $55" or "Price on request".
 */
export function formatAdventurePrice(price: number | null): string {
  if (!price) {
    return "Price on request";
  }

  return `From ${formatPrice(price)}`;
}
