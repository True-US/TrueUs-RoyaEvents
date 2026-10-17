"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { EVENT_TIME_ZONE, EVENT_TYPE } from "@/features/events/constants";
import type { ScheduleCalendarItem } from "@/features/dashboard/schedule-types";

const calendarDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const calendarMonthFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});

const calendarTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

async function fetchScheduleItems(): Promise<ScheduleCalendarItem[]> {
  const response = await fetch("/api/schedule", { cache: "no-store" });
  const result: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof result === "object" &&
      result !== null &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : "Unable to load the schedule.";
    throw new Error(message);
  }
  if (
    typeof result !== "object" ||
    result === null ||
    !("items" in result) ||
    !Array.isArray(result.items)
  ) {
    throw new Error("The schedule response was invalid.");
  }
  return result.items as ScheduleCalendarItem[];
}

function toDateKey(date: Date): string {
  const parts = calendarDateFormat.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return dateKeyFromParts(get("year"), get("month"), get("day"));
}

function getTodayParts(): { year: number; month: number; day: number } {
  const parts = calendarDateFormat.formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);

  return { year: get("year"), month: get("month"), day: get("day") };
}

function dateKeyFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatCalendarDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatItemTime(item: ScheduleCalendarItem): string {
  const start = new Date(item.startsAt);
  if (!item.endsAt) {
    return calendarTimeFormat.format(start);
  }

  return `${calendarTimeFormat.format(start)} – ${calendarTimeFormat.format(new Date(item.endsAt))}`;
}

function getCalendarDays(year: number, month: number): string[] {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_, index) => {
    const day = index - firstWeekday + 1;
    const date = new Date(Date.UTC(year, month, day));
    return date.toISOString().slice(0, 10);
  });
}

function typeLabel(eventType: string): string {
  return eventType === EVENT_TYPE.ADVENTURE ? "Adventure" : "Event";
}

export function ManageSchedule() {
  const [items, setItems] = useState<ScheduleCalendarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [today] = useState(getTodayParts);
  const [viewedMonth, setViewedMonth] = useState(() => ({
    year: today.year,
    month: today.month - 1,
  }));
  const [selectedDay, setSelectedDay] = useState(() => {
    const now = getTodayParts();
    return dateKeyFromParts(now.year, now.month, now.day);
  });

  const loadSchedule = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setItems(await fetchScheduleItems());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the schedule.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialSchedule() {
      try {
        const loadedItems = await fetchScheduleItems();
        if (!cancelled) {
          setItems(loadedItems);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Unable to load the schedule.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialSchedule();
    return () => {
      cancelled = true;
    };
  }, []);

  const calendarDays = useMemo(
    () => getCalendarDays(viewedMonth.year, viewedMonth.month),
    [viewedMonth],
  );

  const itemsByDay = useMemo(() => {
    const grouped = new Map<string, ScheduleCalendarItem[]>();
    for (const item of items) {
      const firstDay = toDateKey(new Date(item.startsAt));
      const lastDay = item.endsAt
        ? toDateKey(new Date(item.endsAt))
        : firstDay;
      for (const day of calendarDays) {
        if (day < firstDay || day > lastDay) {
          continue;
        }
        const dayItems = grouped.get(day) ?? [];
        dayItems.push(item);
        grouped.set(day, dayItems);
      }
    }
    for (const dayItems of grouped.values()) {
      dayItems.sort(
        (left, right) =>
          new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
      );
    }
    return grouped;
  }, [calendarDays, items]);

  const selectedItems = itemsByDay.get(selectedDay) ?? [];
  const monthLabel = calendarMonthFormat.format(
    new Date(Date.UTC(viewedMonth.year, viewedMonth.month, 1)),
  );

  function moveMonth(offset: number): void {
    const nextMonth = new Date(
      Date.UTC(viewedMonth.year, viewedMonth.month + offset, 1),
    );
    const year = nextMonth.getUTCFullYear();
    const month = nextMonth.getUTCMonth();
    setViewedMonth({ year, month });
    setSelectedDay(dateKeyFromParts(year, month + 1, 1));
  }

  function goToToday(): void {
    setViewedMonth({ year: today.year, month: today.month - 1 });
    setSelectedDay(dateKeyFromParts(today.year, today.month, today.day));
  }

  return (
    <section className="space-y-6" aria-label="Schedule calendar">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-roya-sun-deep">
            Event &amp; adventure planning
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-roya-ink">
            Schedule
          </h2>
          <p className="mt-1 text-sm text-roya-slate">
            Events and adventures, including draft requests, shown in Edmonton time.
          </p>
        </div>
        <button
          className="rounded-md border border-roya-slate/30 bg-white px-4 py-2 text-sm font-semibold text-roya-ink hover:border-roya-sun"
          onClick={() => void loadSchedule()}
          type="button"
        >
          Refresh
        </button>
      </header>

      {error && (
        <div
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          <span>{error}</span>
          <button
            className="font-semibold underline"
            onClick={() => void loadSchedule()}
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      <div className="rounded-xl border border-roya-slate/15 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous month"
              className="grid h-10 w-10 place-items-center rounded-full border border-roya-slate/20 text-xl text-roya-ink hover:bg-roya-sand"
              onClick={() => moveMonth(-1)}
              type="button"
            >
              ‹
            </button>
            <button
              aria-label="Next month"
              className="grid h-10 w-10 place-items-center rounded-full border border-roya-slate/20 text-xl text-roya-ink hover:bg-roya-sand"
              onClick={() => moveMonth(1)}
              type="button"
            >
              ›
            </button>
            <h3 className="ml-2 font-display text-xl font-bold text-roya-ink sm:text-2xl">
              {monthLabel}
            </h3>
          </div>
          <button
            className="rounded-md border border-roya-slate/25 px-4 py-2 text-sm font-semibold text-roya-ink hover:bg-roya-sand"
            onClick={goToToday}
            type="button"
          >
            Today
          </button>
        </div>

        <div className="grid grid-cols-7 border-l border-t border-roya-slate/15">
          {weekdays.map((weekday) => (
            <div
              className="border-b border-r border-roya-slate/15 bg-roya-sand/70 py-2 text-center text-xs font-bold uppercase tracking-wide text-roya-slate sm:text-sm"
              key={weekday}
            >
              {weekday}
            </div>
          ))}
          {calendarDays.map((day) => {
            const date = new Date(`${day}T00:00:00Z`);
            const inMonth =
              date.getUTCFullYear() === viewedMonth.year &&
              date.getUTCMonth() === viewedMonth.month;
            const dayItems = itemsByDay.get(day) ?? [];
            const dayNumber = date.getUTCDate();

            return (
              <button
                aria-current={day === dateKeyFromParts(today.year, today.month, today.day) ? "date" : undefined}
                aria-label={`${formatCalendarDate(day)}${dayItems.length ? `, ${dayItems.length} scheduled items` : ""}`}
                aria-pressed={selectedDay === day}
                className={`min-h-24 border-b border-r border-roya-slate/15 p-1.5 text-left align-top transition-colors sm:min-h-32 sm:p-2 ${
                  selectedDay === day
                    ? "bg-roya-sun/15 ring-2 ring-inset ring-roya-sun"
                    : "hover:bg-roya-sand/70"
                } ${inMonth ? "text-roya-ink" : "bg-slate-50 text-slate-400"}`}
                key={day}
                onClick={() => setSelectedDay(day)}
                type="button"
              >
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold sm:text-sm ${
                    day === dateKeyFromParts(today.year, today.month, today.day)
                      ? "bg-roya-ink text-white"
                      : ""
                  }`}
                >
                  {dayNumber}
                </span>
                <span className="mt-1 grid gap-1">
                  {dayItems.slice(0, 3).map((item) => (
                    <span
                      className={`truncate rounded px-1.5 py-1 text-left text-[10px] font-semibold leading-tight sm:text-xs ${
                        !item.isActive || item.status === "CANCELLED"
                          ? "bg-slate-100 text-slate-500 line-through"
                          : item.eventType === EVENT_TYPE.ADVENTURE
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-amber-100 text-amber-950"
                      }`}
                      key={`${day}-${item.id}`}
                    >
                      <span className="hidden sm:inline">{formatItemTime(item)} </span>
                      {item.title}
                    </span>
                  ))}
                  {dayItems.length > 3 && (
                    <span className="pl-1 text-[10px] font-semibold text-roya-slate sm:text-xs">
                      +{dayItems.length - 3} more
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-roya-slate">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-amber-200" />
            Event
          </span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-emerald-200" />
            Adventure
          </span>
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-slate-200" />
            Inactive or cancelled
          </span>
        </div>
      </div>

      <section aria-live="polite" className="rounded-xl border border-roya-slate/15 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-xl font-bold text-roya-ink">
            {formatCalendarDate(selectedDay)}
          </h3>
          <span className="text-sm text-roya-slate">
            {selectedItems.length} {selectedItems.length === 1 ? "scheduled item" : "scheduled items"}
          </span>
        </div>
        {isLoading ? (
          <p className="mt-4 text-sm text-roya-slate">Loading schedule…</p>
        ) : selectedItems.length === 0 ? (
          <p className="mt-4 rounded-lg bg-roya-sand/60 px-4 py-5 text-sm text-roya-slate">
            Nothing is scheduled for this day.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-roya-slate/10">
            {selectedItems.map((item) => (
              <li
                className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                key={item.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.eventType === EVENT_TYPE.ADVENTURE
                          ? "bg-emerald-100 text-emerald-900"
                          : "bg-amber-100 text-amber-950"
                      }`}
                    >
                      {typeLabel(item.eventType)}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wide text-roya-slate">
                      {item.status}
                    </span>
                    {!item.isActive && (
                      <span className="text-xs font-semibold text-slate-500">Inactive</span>
                    )}
                  </div>
                  <h4 className="mt-2 font-semibold text-roya-ink">{item.title}</h4>
                  {item.location && (
                    <p className="mt-1 text-sm text-roya-slate">{item.location}</p>
                  )}
                </div>
                <p className="whitespace-nowrap text-sm font-semibold text-roya-ink">
                  {formatItemTime(item)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
