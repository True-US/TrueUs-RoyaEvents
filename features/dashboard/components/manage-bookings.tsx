"use client";

import { useEffect, useState } from "react";

import {
  ADMIN_BOOKINGS_PAGE_SIZE,
  type AdminBookingEvent,
  type AdminEventBookingsPage,
} from "@/features/dashboard/booking-types";
import { EVENT_TYPE } from "@/features/events/constants";

const bookingDateFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Edmonton",
});

const eventDateFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "full",
  timeZone: "America/Edmonton",
});

const moneyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function eventTypeLabel(eventType: string) {
  if (eventType === EVENT_TYPE.ADVENTURE) return "Adventure";
  if (eventType === EVENT_TYPE.EVENT) return "Event";
  return formatStatus(eventType);
}

export function ManageBookings() {
  const [events, setEvents] = useState<AdminBookingEvent[] | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [bookingsPage, setBookingsPage] =
    useState<AdminEventBookingsPage | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [retryEvents, setRetryEvents] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const response = await fetch("/api/bookings", {
          cache: "no-store",
          signal: controller.signal,
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof result === "object" &&
            result !== null &&
            "message" in result &&
            typeof result.message === "string"
              ? result.message
              : "Unable to load events.";
          throw new Error(message);
        }

        if (
          typeof result !== "object" ||
          result === null ||
          !("events" in result) ||
          !Array.isArray(result.events)
        ) {
          throw new Error("The event list response was invalid.");
        }

        setEvents(result.events as AdminBookingEvent[]);
      } catch (error) {
        if (controller.signal.aborted) return;
        setEventsError(
          error instanceof Error ? error.message : "Unable to load events.",
        );
      } finally {
        if (!controller.signal.aborted) setEventsLoading(false);
      }
    }

    void loadEvents();
    return () => controller.abort();
  }, [retryEvents]);

  useEffect(() => {
    if (selectedEventId === null) return;

    const controller = new AbortController();

    async function loadBookings() {
      setBookingsLoading(true);
      setBookingsError(null);
      try {
        const query = new URLSearchParams({
          eventId: String(selectedEventId),
          page: String(page),
        });
        const response = await fetch(`/api/bookings?${query}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof result === "object" &&
            result !== null &&
            "message" in result &&
            typeof result.message === "string"
              ? result.message
              : "Unable to load bookings.";
          throw new Error(message);
        }

        setBookingsPage(result as AdminEventBookingsPage);
      } catch (error) {
        if (controller.signal.aborted) return;
        setBookingsPage(null);
        setBookingsError(
          error instanceof Error ? error.message : "Unable to load bookings.",
        );
      } finally {
        if (!controller.signal.aborted) setBookingsLoading(false);
      }
    }

    void loadBookings();
    return () => controller.abort();
  }, [page, selectedEventId]);

  function selectEvent(eventId: number) {
    if (eventId === selectedEventId) return;
    setBookingsPage(null);
    setBookingsError(null);
    setPage(1);
    setSelectedEventId(eventId);
  }

  function changePage(nextPage: number) {
    if (
      nextPage < 1 ||
      nextPage > (bookingsPage?.totalPages ?? 1) ||
      nextPage === page
    ) {
      return;
    }
    setBookingsPage(null);
    setPage(nextPage);
  }

  const selectedEvent =
    events?.find((event) => event.id === selectedEventId) ?? null;

  return (
    <div className="mt-8 space-y-8">
      <section aria-labelledby="active-booking-events">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              className="font-display text-2xl font-bold uppercase text-roya-ink"
              id="active-booking-events"
            >
              Active events and adventures
            </h2>
            <p className="mt-1 text-sm text-roya-slate">
              Select an event or adventure to view its bookings.
            </p>
          </div>
          {events && (
            <p className="text-sm text-roya-slate">
              {events.length} {events.length === 1 ? "listing" : "listings"}
            </p>
          )}
        </div>

        {eventsLoading && (
          <div
            aria-busy="true"
            aria-label="Loading active events and adventures"
            className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {[1, 2, 3].map((item) => (
              <div
                aria-hidden="true"
                className="h-36 animate-pulse rounded-lg border border-roya-slate/15 bg-white"
                key={item}
              />
            ))}
          </div>
        )}

        {eventsError && (
          <div
            className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <p>{eventsError}</p>
            <button
              className="mt-2 font-semibold underline"
              onClick={() => setRetryEvents((current) => current + 1)}
              type="button"
            >
              Try again
            </button>
          </div>
        )}

        {!eventsLoading && !eventsError && events?.length === 0 && (
          <p className="mt-4 rounded-lg bg-white p-6 text-roya-slate">
            No active future events or adventures found.
          </p>
        )}

        {!eventsLoading && !eventsError && events && events.length > 0 && (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => {
              const isSelected = selectedEventId === event.id;
              return (
                <li key={event.id}>
                  <button
                    aria-pressed={isSelected}
                    className={`h-full w-full rounded-lg border p-4 text-left transition-colors ${
                      isSelected
                        ? "border-roya-sun bg-roya-sun/10 ring-1 ring-roya-sun"
                        : "border-roya-slate/20 bg-white hover:border-roya-sun"
                    }`}
                    onClick={() => selectEvent(event.id)}
                    type="button"
                  >
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-roya-sun-deep">
                      {eventTypeLabel(event.eventType)}
                    </span>
                    <span className="mt-1 block font-display text-lg font-bold uppercase text-roya-ink">
                      {event.title}
                    </span>
                    <span className="mt-2 block text-sm text-roya-slate">
                      {eventDateFormatter.format(new Date(event.startDatetime))}
                    </span>
                    <span className="mt-1 block text-sm text-roya-slate">
                      {event.location
                        ? `${event.location.name} · ${event.location.city}, ${event.location.province}`
                        : "Location not specified"}
                    </span>
                    <span className="mt-3 block text-sm font-medium text-roya-ink">
                      {event.spotsPurchased} spots purchased
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selectedEvent && (
        <section
          aria-labelledby={`booking-event-${selectedEvent.id}`}
          className="overflow-hidden rounded-lg border border-roya-slate/15 bg-white shadow-sm"
        >
          <div className="border-b border-roya-slate/15 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-roya-sun-deep">
              {eventTypeLabel(selectedEvent.eventType)}
            </p>
            <h2
              className="mt-1 font-display text-2xl font-bold uppercase text-roya-ink"
              id={`booking-event-${selectedEvent.id}`}
            >
              {selectedEvent.title}
            </h2>
            <p className="mt-2 text-sm text-roya-slate">
              {selectedEvent.location
                ? [
                    selectedEvent.location.name,
                    selectedEvent.location.address,
                    [
                      selectedEvent.location.city,
                      selectedEvent.location.province,
                    ]
                      .filter(Boolean)
                      .join(", "),
                    selectedEvent.location.country,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "Location not specified"}
            </p>
            <p className="mt-1 text-sm text-roya-slate">
              {eventDateFormatter.format(new Date(selectedEvent.startDatetime))}
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              Status: {formatStatus(selectedEvent.status)}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Capacity",
                  value:
                    selectedEvent.capacity === null
                      ? "Unlimited"
                      : selectedEvent.capacity,
                },
                {
                  label: "Available spots",
                  value:
                    selectedEvent.availableSpots === null
                      ? "Not tracked"
                      : selectedEvent.availableSpots,
                },
                {
                  label: "Spots purchased",
                  value: selectedEvent.spotsPurchased,
                },
              ].map((stat) => (
                <div
                  className="rounded-md bg-roya-sand/60 px-3 py-2"
                  key={stat.label}
                >
                  <dt className="text-xs font-medium text-roya-slate">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-roya-ink">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-roya-ink">Bookings</h3>
              {bookingsPage && (
                <p className="text-sm text-roya-slate">
                  {bookingsPage.totalBookings} total ·{" "}
                  {ADMIN_BOOKINGS_PAGE_SIZE} per page
                </p>
              )}
            </div>

            {bookingsLoading && (
              <div
                aria-busy="true"
                aria-label="Loading bookings"
                className="mt-4 space-y-3"
              >
                {[1, 2, 3].map((item) => (
                  <div
                    aria-hidden="true"
                    className="h-16 animate-pulse rounded-md bg-roya-sand/60"
                    key={item}
                  />
                ))}
              </div>
            )}

            {bookingsError && (
              <p
                className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800"
                role="alert"
              >
                {bookingsError}
              </p>
            )}

            {!bookingsLoading &&
              !bookingsError &&
              bookingsPage?.totalBookings === 0 && (
                <p className="mt-4 rounded-md bg-roya-sand/50 px-4 py-3 text-sm text-roya-slate">
                  No bookings for this event yet.
                </p>
              )}

            {!bookingsLoading &&
              !bookingsError &&
              bookingsPage &&
              bookingsPage.bookings.length > 0 && (
                <>
                  <ul className="mt-3 divide-y divide-roya-slate/15">
                    {bookingsPage.bookings.map((booking) => (
                      <li
                        className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                        key={booking.id}
                      >
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-roya-ink">
                            {booking.customerName}
                          </p>
                          <p className="break-all text-sm text-roya-slate">
                            {booking.customerEmail ?? "No email on file"}
                          </p>
                          {booking.customerPhone && (
                            <p className="text-sm text-roya-slate">
                              {booking.customerPhone}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-roya-slate">
                            Booking #{booking.id} ·{" "}
                            {bookingDateFormatter.format(
                              new Date(booking.createdAt),
                            )}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm sm:justify-end">
                          <span className="rounded-full bg-roya-sand px-3 py-1 font-medium text-roya-ink">
                            {booking.quantity}{" "}
                            {booking.quantity === 1 ? "spot" : "spots"}
                          </span>
                          <span className="rounded-full border border-roya-slate/20 px-3 py-1 text-roya-slate">
                            {formatStatus(booking.status)}
                          </span>
                          <span className="font-medium text-roya-ink">
                            {moneyFormatter.format(Number(booking.totalAmount))}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {bookingsPage.totalPages > 1 && (
                    <nav
                      aria-label="Booking pages"
                      className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-roya-slate/15 pt-4"
                    >
                      <p className="text-sm text-roya-slate">
                        Page {bookingsPage.page} of {bookingsPage.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          className="rounded-md border border-roya-slate/30 px-4 py-2 text-sm font-medium text-roya-ink hover:bg-roya-slate/5 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={bookingsLoading || page <= 1}
                          onClick={() => changePage(page - 1)}
                          type="button"
                        >
                          Previous
                        </button>
                        <button
                          className="rounded-md border border-roya-slate/30 px-4 py-2 text-sm font-medium text-roya-ink hover:bg-roya-slate/5 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={
                            bookingsLoading || page >= bookingsPage.totalPages
                          }
                          onClick={() => changePage(page + 1)}
                          type="button"
                        >
                          Next
                        </button>
                      </div>
                    </nav>
                  )}
                </>
              )}
          </div>
        </section>
      )}

      {events && events.length > 0 && selectedEventId === null && (
        <p className="rounded-lg bg-white p-5 text-sm text-roya-slate">
          Choose an event or adventure above to see its bookings.
        </p>
      )}
    </div>
  );
}
