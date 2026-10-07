// "use client";

// import { useState } from "react";
// export function ManageEvents() {
//   return (
//     <div>
//       <h1>Manage Bookings</h1>
//     </div>
//   );
// }


"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import type {
  AdminEvent,
  CreateEventWithLocationInput,
  UpdateEventWithLocationInput,
} from "@/features/events/types";

import {
  createEventRequest,
  deleteEventRequest,
  getAdminEventsRequest,
  reactivateEventRequest,
  updateEventRequest,
} from "@/features/events/api";
import {
  getEventRuleErrors,
  validateEventRules,
  type EventRuleField,
  type EventRulesInput,
} from "@/features/events/schemas";
import { dateToZonedInput, zonedInputToDate } from "@/features/events/utils/dates";
import { formatPrice } from "@/features/events/utils/format";

const inputClass =
  "mt-1 w-full rounded-md border border-roya-slate/30 bg-white px-3 py-2 text-sm text-roya-ink outline-none focus:border-roya-sun focus:ring-1 focus:ring-roya-sun";

type EventForm = {
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string;
  startDatetime: string;
  endDatetime: string;
  capacity: string;
  availableSpots: string;
  status: string;
  isActive: boolean;

  locationName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

const emptyForm: EventForm = {
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  price: "",
  startDatetime: "",
  endDatetime: "",
  capacity: "",
  availableSpots: "",
  status: "DRAFT",
  isActive: true,

  locationName: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Canada",
};

// Same look as inputClass, with a red border and ring for invalid fields.
const invalidInputClass: string =
  "mt-1 w-full rounded-md border border-red-500 bg-white px-3 py-2 text-sm text-roya-ink outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500";

/**
 * Reads a number input, where an empty box means "not set".
 * @param value The input's text.
 * @returns The number, null when empty, or NaN when not a number (the rules report it).
 */
function toNumberOrNull(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  return Number(value);
}

/**
 * Picks the fields checked by the event rules from the form.
 * @param form The current form values.
 * @returns The rules input: numbers for price/spots, raw datetime-local strings for dates.
 */
function toRulesInput(form: EventForm): EventRulesInput {
  return {
    price: toNumberOrNull(form.price),
    capacity: toNumberOrNull(form.capacity),
    availableSpots: toNumberOrNull(form.availableSpots),
    startDatetime: form.startDatetime,
    endDatetime: form.endDatetime || null,
  };
}

/**
 * Red message under an input. Renders nothing when there is no error.
 * @param props.id The id the input points to with aria-describedby.
 * @param props.message The error message, if any.
 * @returns The message paragraph, or null.
 */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    // aria-live: screen readers announce the message when it appears.
    <p aria-live="polite" className="mt-1 text-sm text-red-600" id={id}>
      {message}
    </p>
  );
}

export function ManageEvents() {
  const [events, setEvents] = useState<AdminEvent[]>(
    [],
  );

  const [form, setForm] =
    useState<EventForm>(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  // Fields the admin has changed. Errors show only for these (or after a
  // submit attempt), so a fresh form doesn't open covered in red.
  const [touched, setTouched] = useState<Partial<Record<keyof EventForm, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState<boolean>(false);

  //---------- Create/edit popup -------------

  // Whether the create/edit popup is showing. The single source of truth:
  // buttons change this, and the effect below shows or hides the dialog.
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // A <dialog> is opened with showModal() and closed with close(), methods
  // on the DOM element rather than props, so an effect keeps the element in
  // step with isFormOpen. showModal() gives the backdrop, keeps keyboard
  // focus inside the popup and closes on Escape.
  useEffect(() => {
    const dialog: HTMLDialogElement | null = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isFormOpen && !dialog.open) {
      dialog.showModal();
    }
    if (!isFormOpen && dialog.open) {
      dialog.close();
    }
  }, [isFormOpen]);

  /**
   * Opens the popup with an empty form for a new event.
   */
  function openCreateForm(): void {
    resetForm();
    setMessage("");
    setIsFormOpen(true);
  }

  /**
   * Closes the popup. Also runs when the browser closes the dialog itself
   * (Escape), through the dialog's onClose. The form is not cleared here, so
   * its content stays put during the fade-out; opening the popup again
   * (Create or Edit) sets the form fresh.
   */
  function closeForm(): void {
    setIsFormOpen(false);
  }

  // Derived from the form on every render (every keystroke), so it is never
  // out of date. No extra state or useEffect needed.
  const ruleErrors: Partial<Record<EventRuleField, string>> = getEventRuleErrors(toRulesInput(form));

  /**
   * The error to show under a field right now.
   * @param field The field to check.
   * @returns The message once the field is touched or a submit was tried; otherwise undefined.
   */
  function fieldError(field: EventRuleField): string | undefined {
    if (!touched[field] && !submitAttempted) {
      return undefined;
    }

    return ruleErrors[field];
  }

  async function loadEvents() {
    try {
      setLoading(true);
      setMessage("");

      const result = await getAdminEventsRequest();

      setEvents(result.events ?? []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load events.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialEvents() {
      try {
        setLoading(true);
        setMessage("");

        const result = await getAdminEventsRequest();

        if (!cancelled) {
          setEvents(result.events ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Failed to load events.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitialEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof EventForm>(
    field: K,
    value: EventForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setTouched({});
    setSubmitAttempted(false);
  }

  function makeSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function editEvent(event: AdminEvent) {
    setEditingId(Number(event.id));
    setTouched({});
    setSubmitAttempted(false);

    setForm({
      title: event.title,
      slug: event.slug,
      shortDescription: event.summary,
      description: event.description,

      price:
        event.price === null
          ? ""
          : String(event.price),

      // Stored moment (UTC) -> Edmonton wall clock for the input.
      // slice(0, 16) would have shown the UTC time instead.
      startDatetime: dateToZonedInput(event.startsAt),

      endDatetime: event.endsAt
        ? dateToZonedInput(event.endsAt)
        : "",

      capacity:
        event.capacity === null
          ? ""
          : String(event.capacity),

      availableSpots:
        event.availableSpots === null
          ? ""
          : String(event.availableSpots),

      status: event.status,
      isActive: event.isActive,

      locationName:
        event.location?.name ?? "",

      address:
        event.location?.address ?? "",

      city:
        event.location?.city ?? "",

      province:
        event.location?.province ?? "",

      postalCode:
        event.location?.postalCode ?? "",

      country:
        event.location?.country ?? "Canada",
    });

    // Open the same popup, filled with this event.
    setMessage("");
    setIsFormOpen(true);
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    // Show every field's error, even untouched ones, and stop here if any.
    setSubmitAttempted(true);
    if (Object.keys(ruleErrors).length > 0) {
      setMessage("Please fix the fields marked in red.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const price =
        form.price.trim() === ""
          ? null
          : Number(form.price);

      const capacity =
        form.capacity.trim() === ""
          ? null
          : Number(form.capacity);

      const availableSpots =
        form.availableSpots.trim() === ""
          ? capacity
          : Number(form.availableSpots);

      // Same rules as /api/events (price, spots, dates), checked here first
      // so the admin gets the message without a round trip.
      const checked: ReturnType<typeof validateEventRules> = validateEventRules({
        price,
        capacity,
        availableSpots,
        startDatetime: form.startDatetime,
        endDatetime: form.endDatetime || null,
      });
      if (checked.error !== undefined) {
        throw new Error(checked.error);
      }

      // The inputs hold Edmonton wall-clock times. Convert them to exact
      // moments here, so the server (UTC on Vercel) saves the right time.
      const startMoment: Date | null = zonedInputToDate(form.startDatetime);
      if (!startMoment) {
        throw new Error("Start date and time is not valid.");
      }
      const endMoment: Date | null = form.endDatetime
        ? zonedInputToDate(form.endDatetime)
        : null;

      /*
       * CREATE
       */
      if (editingId === null) {
        const payload: CreateEventWithLocationInput =
        {
          location: {
            name: form.locationName,
            address:
              form.address || null,
            city: form.city,
            province: form.province,
            postalCode:
              form.postalCode || null,
            country: form.country,
          },

          event: {
            title: form.title,
            slug:
              form.slug ||
              makeSlug(form.title),

            shortDescription:
              form.shortDescription ||
              null,

            description:
              form.description || null,

            // Normalized by validateEventRules: 0 and empty are both null (free).
            price: checked.data.price,

            // ISO with "Z", e.g. "2026-10-11T01:00:00.000Z".
            startDatetime: startMoment.toISOString(),

            endDatetime: endMoment
              ? endMoment.toISOString()
              : null,

            capacity,
            availableSpots,

            status: form.status,
            isActive: form.isActive,
          },
        };

        await createEventRequest(
          payload,
        );

        setMessage(
          "Event created successfully.",
        );
      } else {
        /*
         * UPDATE
         */
        const existingEvent =
          events.find(
            (event) =>
              Number(event.id) ===
              editingId,
          );

        if (!existingEvent) {
          throw new Error(
            "Event not found.",
          );
        }

        if (!existingEvent.location) {
          throw new Error(
            "This event does not have a location.",
          );
        }

        const payload: UpdateEventWithLocationInput =
        {
          id: editingId,

          location: {
            id: existingEvent.location.id,

            name: form.locationName,

            address:
              form.address || null,

            city: form.city,

            province: form.province,

            postalCode:
              form.postalCode || null,

            country: form.country,
          },

          event: {
            title: form.title,

            slug: form.slug,

            shortDescription:
              form.shortDescription ||
              null,

            description:
              form.description || null,

            // Normalized by validateEventRules: 0 and empty are both null (free).
            price: checked.data.price,

            // ISO with "Z", e.g. "2026-10-11T01:00:00.000Z".
            startDatetime: startMoment.toISOString(),

            endDatetime: endMoment
              ? endMoment.toISOString()
              : null,

            capacity,
            availableSpots,

            status: form.status,
            isActive: form.isActive,
          },
        };

        await updateEventRequest(
          payload,
        );

        setMessage(
          "Event updated successfully.",
        );
      }

      setIsFormOpen(false);

      await loadEvents();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    eventId: number,
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete or deactivate this event?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");

      const result =
        await deleteEventRequest(
          eventId,
        );

      if (
        result.action ===
        "deactivated"
      ) {
        setMessage(
          "This event has bookings, so it was deactivated instead of permanently deleted.",
        );
      } else {
        setMessage(
          "Event deleted successfully.",
        );
      }

      await loadEvents();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete event.",
      );
    }
  }

  async function handleReactivate(
    eventId: number,
  ) {
    try {
      setMessage("");

      await reactivateEventRequest(
        eventId,
      );

      setMessage(
        "Event reactivated successfully. It is now a draft.",
      );

      await loadEvents();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to reactivate event.",
      );
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-roya-sun-deep">
          Event Management
        </p>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-roya-ink">
                All Events
              </h2>

              <p className="mt-1 text-sm text-roya-slate">
                Active and inactive events are shown here.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-md bg-roya-sun px-5 py-2.5 text-sm font-bold text-roya-ink hover:opacity-90"
            >
              New Event/Adventure
            </button>
          </div>

          {/* Results (saved, deleted, errors) show on the page while the popup is closed. */}
          {message && !isFormOpen && (
            <div className="mt-4 rounded-md border border-roya-slate/20 bg-white px-4 py-3 text-sm text-roya-ink">
              {message}
            </div>
          )}

          <div className="mt-5">
            {loading ? (
              <p className="text-sm text-roya-slate">
                Loading events...
              </p>
            ) : events.length === 0 ? (
              <p className="text-sm text-roya-slate">
                No events found.
              </p>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-roya-slate/20 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-xl font-bold text-roya-ink">
                            {event.title}
                          </h3>

                          <span className="rounded-full bg-roya-slate/10 px-2.5 py-1 text-xs font-semibold">
                            {event.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>

                          <span className="rounded-full bg-roya-slate/10 px-2.5 py-1 text-xs font-semibold">
                            {event.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-roya-slate">
                          {event.summary}
                        </p>

                        <div className="mt-3 space-y-1 text-sm text-roya-slate">
                          <p>
                            <strong>
                              Price:
                            </strong>{" "}
                            {/* Same "Free" / "$35" / "$12.50" text as the public pages. */}
                            {formatPrice(
                              event.price === null
                                ? null
                                : Number(event.price),
                            )}
                          </p>

                          <p>
                            <strong>
                              Location:
                            </strong>{" "}
                            {event.location
                              ?.name ??
                              "No location"}
                          </p>

                          <p>
                            <strong>
                              Starts:
                            </strong>{" "}
                            {new Date(
                              event.startsAt,
                            ).toLocaleString()}
                          </p>

                          <p>
                            <strong>
                              Capacity:
                            </strong>{" "}
                            {event.capacity ??
                              "Unlimited"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            editEvent(
                              event,
                            )
                          }
                          className="rounded-md border border-roya-slate/30 px-4 py-2 text-sm font-semibold hover:bg-roya-slate/5"
                        >
                          Edit
                        </button>

                        {event.isActive ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                Number(
                                  event.id,
                                ),
                              )
                            }
                            className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleReactivate(
                                Number(
                                  event.id,
                                ),
                              )
                            }
                            className="rounded-md border border-green-300 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>


      </div>

      {/* Create/edit popup. Shown and hidden by the isFormOpen effect (showModal/close). */}
      <dialog
        ref={dialogRef}
        aria-labelledby="event-form-title"
        onClose={closeForm}
        onCancel={(e) => {
          if (saving) {
            e.preventDefault();
          }
        }}

        className="roya-dialog m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl flex-col overflow-hidden rounded-xl bg-roya-sand p-0 shadow-xl open:flex"
      >
        {/* Header: doesn't scroll; the form area below does. */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-roya-slate/20 bg-white px-6 py-4">
          <h2
            id="event-form-title"
            className="font-display text-3xl font-bold text-roya-ink"
          >
            {editingId === null
              ? "Create Event"
              : "Edit Event"}
          </h2>

          <button
            type="button"
            aria-label="Close"
            onClick={closeForm}
            disabled={saving}
            className="rounded-md px-3 py-1 text-2xl leading-none text-roya-slate hover:bg-roya-slate/10 hover:text-roya-ink disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Scrolling area. min-h-0 lets it shrink inside the flex column. */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 [scrollbar-width:thin]">
          {/* Save errors show inside the popup, next to the form. */}
          {message && isFormOpen && (
            <div className="rounded-md border border-roya-slate/20 bg-white px-4 py-3 text-sm text-roya-ink">
              {message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-roya-slate/20 bg-white p-6 shadow-sm"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">
                  Event Title
                </label>

                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) =>
                    updateField(
                      "title",
                      e.target.value,
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Slug
                </label>

                <input
                  className={inputClass}
                  value={form.slug}
                  onChange={(e) =>
                    updateField(
                      "slug",
                      e.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold">
                  Short Description
                </label>

                <input
                  className={inputClass}
                  value={
                    form.shortDescription
                  }
                  onChange={(e) =>
                    updateField(
                      "shortDescription",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold">
                  Description
                </label>

                <textarea
                  className={inputClass}
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    updateField(
                      "description",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="event-price">
                  Price
                </label>

                <input
                  aria-describedby="event-price-error"
                  aria-invalid={Boolean(fieldError("price"))}
                  className={fieldError("price") ? invalidInputClass : inputClass}
                  id="event-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    updateField(
                      "price",
                      e.target.value,
                    )
                  }
                />
                <FieldError id="event-price-error" message={fieldError("price")} />
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="event-capacity">
                  Capacity
                </label>

                <input
                  aria-describedby="event-capacity-error"
                  aria-invalid={Boolean(fieldError("capacity"))}
                  className={fieldError("capacity") ? invalidInputClass : inputClass}
                  id="event-capacity"
                  type="number"
                  min="0"
                  value={form.capacity}
                  onChange={(e) =>
                    updateField(
                      "capacity",
                      e.target.value,
                    )
                  }
                />
                <FieldError id="event-capacity-error" message={fieldError("capacity")} />
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="event-available-spots">
                  Available Spots
                </label>

                <input
                  aria-describedby="event-available-spots-error"
                  aria-invalid={Boolean(fieldError("availableSpots"))}
                  className={fieldError("availableSpots") ? invalidInputClass : inputClass}
                  id="event-available-spots"
                  type="number"
                  min="0"
                  value={
                    form.availableSpots
                  }
                  onChange={(e) =>
                    updateField(
                      "availableSpots",
                      e.target.value,
                    )
                  }
                />
                <FieldError id="event-available-spots-error" message={fieldError("availableSpots")} />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Status
                </label>

                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) =>
                    updateField(
                      "status",
                      e.target.value,
                    )
                  }
                >
                  <option value="DRAFT">
                    Draft
                  </option>

                  <option value="PUBLISHED">
                    Published
                  </option>

                  <option value="UNPUBLISHED">
                    Unpublished
                  </option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="event-start">
                  Start Date & Time (Edmonton time)
                </label>

                <input
                  aria-describedby="event-start-error"
                  aria-invalid={Boolean(fieldError("startDatetime"))}
                  className={fieldError("startDatetime") ? invalidInputClass : inputClass}
                  id="event-start"
                  type="datetime-local"
                  value={
                    form.startDatetime
                  }
                  onChange={(e) =>
                    updateField(
                      "startDatetime",
                      e.target.value,
                    )
                  }
                  required
                />
                <FieldError id="event-start-error" message={fieldError("startDatetime")} />
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="event-end">
                  End Date & Time (Edmonton time)
                </label>

                <input
                  aria-describedby="event-end-error"
                  aria-invalid={Boolean(fieldError("endDatetime"))}
                  className={fieldError("endDatetime") ? invalidInputClass : inputClass}
                  id="event-end"
                  type="datetime-local"
                  value={
                    form.endDatetime
                  }
                  onChange={(e) =>
                    updateField(
                      "endDatetime",
                      e.target.value,
                    )
                  }
                />
                <FieldError id="event-end-error" message={fieldError("endDatetime")} />
              </div>

              <div className="md:col-span-2">
                <h3 className="font-display text-xl font-bold text-roya-ink">
                  Location
                </h3>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold">
                  Location Name
                </label>

                <input
                  className={inputClass}
                  value={
                    form.locationName
                  }
                  onChange={(e) =>
                    updateField(
                      "locationName",
                      e.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold">
                  Address
                </label>

                <input
                  className={inputClass}
                  value={form.address}
                  onChange={(e) =>
                    updateField(
                      "address",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  City
                </label>

                <input
                  className={inputClass}
                  value={form.city}
                  onChange={(e) =>
                    updateField(
                      "city",
                      e.target.value,
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Province
                </label>

                <input
                  className={inputClass}
                  value={form.province}
                  onChange={(e) =>
                    updateField(
                      "province",
                      e.target.value,
                    )
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Postal Code
                </label>

                <input
                  className={inputClass}
                  value={form.postalCode}
                  onChange={(e) =>
                    updateField(
                      "postalCode",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Country
                </label>

                <input
                  className={inputClass}
                  value={form.country}
                  onChange={(e) =>
                    updateField(
                      "country",
                      e.target.value,
                    )
                  }
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    updateField(
                      "isActive",
                      e.target.checked,
                    )
                  }
                />

                Active
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-roya-sun px-5 py-2.5 text-sm font-bold text-roya-ink hover:opacity-90 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId === null
                    ? "Create Event"
                    : "Update Event"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-md border border-roya-slate/30 px-5 py-2.5 text-sm font-semibold text-roya-ink hover:bg-roya-slate/5 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}