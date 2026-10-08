import { EVENT_TIME_ZONE } from "@/features/events/constants";

// JavaScript Dates are absolute moments with no time zone. These helpers answer
// "what day is it in Edmonton?" and "when does that Edmonton day start?",
// using Intl so that daylight-saving rules come from the runtime's tz data.

export type ZonedDate = {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 = Sunday ... 6 = Saturday
};

const WEEKDAYS: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Date time segments formater.
const partsFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
});

// Time zone offset formater.
const offsetFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  timeZoneName: "longOffset",
});

/**
 * Helper to get the Edmonton calendar date for a given moment.
 * @param date The date to get the Edmonton calendar date for.
 * @returns The Edmonton calendar date corresponding to the given moment.
 */
export function getZonedDate(date: Date): ZonedDate {
  const parts: Intl.DateTimeFormatPart[] = partsFormat.formatToParts(date);

  // Reads one part, e.g. get("year") -> "2026".
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part: Intl.DateTimeFormatPart) => part.type === type)!.value;

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: WEEKDAYS.indexOf(get("weekday")),
  };
}

/**
 * Helper to get the start of an Edmonton calendar day for a given date and optional day offset.
 * @param date The date to get the start of the Edmonton calendar day for.
 * @param dayOffset The number of days to offset from the given date. Defaults to 0 (the same day).
 * @returns A Date object representing the start of the Edmonton calendar day at 00:00 local time, adjusted by the specified day offset.
 */
export function startOfZonedDay(date: ZonedDate, dayOffset = 0): Date {
  // Treat midnight as if it were UTC, then shift by Edmonton's offset.
  // Alberta changes clocks at 2 am, so the offset at midnight is never ambiguous.
  const wallClock: number = Date.UTC(date.year, date.month - 1, date.day + dayOffset);
  return new Date(wallClock - utcOffsetMinutes(new Date(wallClock)) * 60 * 1000);
}

//---------- <input type="datetime-local"> <-> moment -------------
// A datetime-local input gives a wall-clock time with no zone, e.g.
// "2026-10-10T19:00". These helpers read and write it as Edmonton time, so the
// result is the same whatever zone the browser or server runs in (Vercel is UTC).

// One minute in milliseconds.
const MINUTE: number = 60 * 1000;

// Edmonton date and 24-hour time parts, for building input values.
const inputFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * Converts a datetime-local value, read as Edmonton time, to a moment.
 * @param value The input value, e.g. "2026-10-10T19:00" (seconds optional).
 * @returns The moment, or null if the value is empty or malformed.
 * @example zonedInputToDate("2026-10-10T19:00").toISOString() // "2026-10-11T01:00:00.000Z"
 */
export function zonedInputToDate(value: string): Date | null {
  const match: RegExpExecArray | null = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) {
    return null;
  }

  const [year, month, day, hour, minute, second] = match.slice(1).map((part: string | undefined) => Number(part ?? 0));
  // Treat the wall-clock time as UTC, then shift by Edmonton's offset. The
  // offset is looked up twice so a time near a clock change uses the offset
  // that applies at the real moment, not at the first guess.
  const wallClock: number = Date.UTC(year, month - 1, day, hour, minute, second);
  const firstGuess: number = wallClock - utcOffsetMinutes(new Date(wallClock)) * MINUTE;

  return new Date(wallClock - utcOffsetMinutes(new Date(firstGuess)) * MINUTE);
}

/**
 * Converts a moment to a datetime-local value in Edmonton time.
 * @param date The moment, as a Date or an ISO string.
 * @returns The input value, e.g. "2026-10-10T19:00", or "" if the date is invalid.
 */
export function dateToZonedInput(date: Date | string): string {
  const moment: Date = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(moment.getTime())) {
    return "";
  }

  const parts: Intl.DateTimeFormatPart[] = inputFormat.formatToParts(moment);
  // Reads one part, e.g. get("hour") -> "19".
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part: Intl.DateTimeFormatPart) => part.type === type)!.value;

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/**
 * Helper to get the UTC offset in minutes for a given date in Edmonton time zone.
 * @param date The date to get the UTC offset for.
 * @returns The UTC offset in minutes for the given date in Edmonton time zone.
 */
function utcOffsetMinutes(date: Date): number {
  const name: string = offsetFormat
    .formatToParts(date)
    .find((part: Intl.DateTimeFormatPart) => part.type === "timeZoneName")!.value; // "GMT-06:00"
    
  const match: RegExpExecArray | null = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  
  if (!match) {
    return 0; // "GMT" exactly means UTC+0
  } 

  const minutes: number = Number(match[2]) * 60 + Number(match[3]);
  
  return match[1] === "-" ? -minutes : minutes;
}
