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
  eventAdventureRecord,
  CreateEventWithLocationInput,
  EventActionResult,
  UpdateEventWithLocationInput,
} from "@/features/events/types";

import {
  deleteEventRequest,
  getAllRecordsRequest,
  reactivateEventRequest,
} from "@/features/events/api";
import { FieldError, FormError, FormSuccess, invalidInputClass } from "@/components/ui/form-feedback";
import { CoverInput } from "@/features/events/components/cover-input";
import {
  EVENT_DESCRIPTION_MAX,
  EVENT_SHORT_DESCRIPTION_MAX,
  EVENT_SLUG_MAX,
  EVENT_STATUS,
  EVENT_TITLE_MAX,
  EVENT_TYPE,
  LOCATION_ADDRESS_MAX,
  LOCATION_CITY_MAX,
  LOCATION_COUNTRY_MAX,
  LOCATION_NAME_MAX,
  LOCATION_POSTAL_CODE_MAX,
  LOCATION_PROVINCE_MAX,
} from "@/features/events/constants";
// Server Actions: called like normal async functions, but run on the server.
import { createEventAction, setEventPublishedAction, updateEventAction } from "@/features/events/server/actions";
import {
  eventDetailsSchema,
  eventLocationSchema,
  getEventRuleErrors,
  validateEventRules,
  type EventRulesInput,
} from "@/features/events/schemas";
import { dateToZonedInput, zonedInputToDate } from "@/features/events/utils/dates";
import { formatPrice } from "@/features/events/utils/format";
import { getEventTags, isEventExpired, isEventReady, type EventTag } from "@/features/events/utils/status";
import { makeSlug } from "@/features/events/utils/slug";
import { getFieldErrors } from "@/lib/validation/errors";
import { msg } from "@/lib/validation/messages";

const inputClass =
  "mt-1 w-full rounded-md border border-roya-slate/30 bg-white px-3 py-2 text-sm text-roya-ink outline-none focus:border-roya-sun focus:ring-1 focus:ring-roya-sun";

// Records shown per page in the list.
const EVENTS_PAGE_SIZE: number = 10;

// Left-side tabs: one per event type.
const typeTabs: { value: string; label: string }[] = [
  { value: EVENT_TYPE.EVENT, label: "Event" },
  { value: EVENT_TYPE.ADVENTURE, label: "Adventure" },
  { value: EVENT_TYPE.CUSTOM_EVENT, label: "Request" },
];

type SortBy = "name" | "date" | "status";
type SortDir = "asc" | "desc";

/**
 * Orders records for the "status" sort: live, READY, DRAFT, then CANCELLED.
 * @param event The record.
 * @returns A rank; lower comes first when ascending.
 */
function statusRank(event: eventAdventureRecord): number {
  const tags: EventTag[] = getEventTags(event);
  if (tags.includes("READY")) {
    return 1;
  }
  if (tags.includes("DRAFT")) {
    return 2;
  }
  if (tags.includes("CANCELLED")) {
    return 3;
  }

  return 0;
}

// Colour of each list tag.
const tagClass: Record<EventTag, string> = {
  DRAFT: "bg-roya-slate/10 text-roya-slate",
  READY: "bg-blue-100 text-blue-800",
  EXPIRED: "bg-amber-100 text-amber-800",
  CANCELLED: "bg-red-100 text-red-800",
};

// Choices in the form's Type dropdown. A Request is a customer's custom event.
const typeOptions: { value: string; label: string }[] = [
  { value: EVENT_TYPE.EVENT, label: "Event" },
  { value: EVENT_TYPE.ADVENTURE, label: "Adventure" },
  { value: EVENT_TYPE.CUSTOM_EVENT, label: "Request" },
];

type EventForm = {
  eventType: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string;
  startDatetime: string;
  endDatetime: string;
  capacity: string;
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
  eventType: EVENT_TYPE.EVENT,
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  price: "",
  startDatetime: "",
  endDatetime: "",
  capacity: "",
  status: "DRAFT",
  isActive: true,

  locationName: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Canada",
};

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
    startDatetime: form.startDatetime,
    endDatetime: form.endDatetime || null,
  };
}

/**
 * Packs a create/update payload and the optional new cover for a Server Action.
 * @param payload The event + location data.
 * @param cover The new cover image, or null to keep the current one.
 * @returns FormData with "payload" (JSON) and, if given, "cover" (File).
 */
function buildActionFormData(
  payload: CreateEventWithLocationInput | UpdateEventWithLocationInput,
  cover: File | null,
): FormData {
  const formData: FormData = new FormData();
  formData.set("payload", JSON.stringify(payload));
  if (cover) {
    formData.set("cover", cover);
  }

  return formData;
}

/**
 * Checks every field of the form with the same schemas the server uses.
 * @param form The current form values.
 * @returns The first error message for each invalid field; {} when all is valid.
 */
function getFormErrors(form: EventForm): Partial<Record<keyof EventForm, string>> {
  const errors: Partial<Record<keyof EventForm, string>> = getEventRuleErrors(toRulesInput(form));

  const details: ReturnType<typeof eventDetailsSchema.safeParse> = eventDetailsSchema.safeParse({
    title: form.title,
    // An empty slug is filled from the title on save, so check what will be saved.
    slug: form.slug.trim() || makeSlug(form.title),
    shortDescription: form.shortDescription,
    description: form.description,
    status: form.status,
  });
  if (!details.success) {
    Object.assign(errors, getFieldErrors(details.error));
  }

  const place: ReturnType<typeof eventLocationSchema.safeParse> = eventLocationSchema.safeParse({
    name: form.locationName,
    address: form.address,
    city: form.city,
    province: form.province,
    postalCode: form.postalCode,
    country: form.country,
  });
  if (!place.success) {
    const placeErrors: Record<string, string> = getFieldErrors(place.error);
    for (const [field, message] of Object.entries(placeErrors)) {
      // The schema calls the location's name "name"; the form calls it "locationName".
      const formField: keyof EventForm = field === "name" ? "locationName" : (field as keyof EventForm);
      if (!errors[formField]) {
        errors[formField] = message;
      }
    }
  }

  return errors;
}

export function ManageEvents() {
  const [events, setEvents] = useState<eventAdventureRecord[]>(
    [],
  );

  const [form, setForm] =
    useState<EventForm>(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  // List view: which type tab is open, which page, and which rows are expanded.
  const [activeType, setActiveType] = useState<string>(EVENT_TYPE.EVENT);
  const [page, setPage] = useState<number>(1);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  // List settings (the Settings dropdown above the list).
  const [hideExpired, setHideExpired] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");
  // True when `message` is an error; false for a success message.
  const [messageIsError, setMessageIsError] = useState<boolean>(false);

  // Fields the admin has changed. Errors show only for these (or after a
  // submit attempt), so a fresh form doesn't open covered in red.
  const [touched, setTouched] = useState<Partial<Record<keyof EventForm, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState<boolean>(false);

  //---------- Cover image -------------

  // The new cover picked in the popup (already a 1600x800 WebP), or null.
  const [coverFile, setCoverFile] = useState<File | null>(null);
  // True while the picker is preparing an image: saving waits for it.
  const [coverBusy, setCoverBusy] = useState<boolean>(false);

  // The event being edited, for its saved cover. Derived, not stored.
  const editingEvent: eventAdventureRecord | null =
    editingId === null ? null : events.find((event: eventAdventureRecord) => Number(event.id) === editingId) ?? null;
  const currentCoverUrl: string | null = editingEvent?.coverUrl ?? null;

  // Same rule as the server: a published event needs a cover.
  const coverRequiredError: string | undefined =
    form.status === EVENT_STATUS.PUBLISHED && !coverFile && !currentCoverUrl
      ? "A cover image is required to publish. Add one, or save as a draft."
      : undefined;

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
    // New records take the type of the tab that is open.
    setForm((current: EventForm) => ({ ...current, eventType: activeType }));
    setCoverFile(null);
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
  const formErrors: Partial<Record<keyof EventForm, string>> = getFormErrors(form);

  /**
   * The error to show under a field right now.
   * @param field The field to check.
   * @returns The message once the field is touched or a submit was tried; otherwise undefined.
   */
  function fieldError(field: keyof EventForm): string | undefined {
    if (!touched[field] && !submitAttempted) {
      return undefined;
    }

    return formErrors[field];
  }

  /**
   * Shows a failure message (red).
   * @param text The message.
   */
  function showError(text: string): void {
    setMessageIsError(true);
    setMessage(text);
  }

  /**
   * Shows a success message (green).
   * @param text The message.
   */
  function showSuccess(text: string): void {
    setMessageIsError(false);
    setMessage(text);
  }

  // Refreshes the list after a save, delete or publish. It does not touch
  // `loading` (the first load does): swapping the list for "Loading events..."
  // made the page flash, and it would also wipe the success message just shown.
  async function loadAllRecords() {
    try {
      const result = await getAllRecordsRequest();

      setEvents(result.events ?? []);
    } catch (error) {
      showError(error instanceof Error ? error.message : msg.unableTo("load events"));
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialEvents() {
      try {
        setLoading(true);
        setMessage("");

        const result = await getAllRecordsRequest();

        if (!cancelled) {
          setEvents(result.events ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          showError(error instanceof Error ? error.message : msg.unableTo("load events"));
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

  function editEvent(event: eventAdventureRecord) {
    setEditingId(Number(event.id));
    setTouched({});
    setSubmitAttempted(false);

    setForm({
      eventType: event.eventType,
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

    // Open the same popup, filled with this event (its saved cover shows
    // through currentCoverUrl; no new image picked yet).
    setCoverFile(null);
    setMessage("");
    setIsFormOpen(true);
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    // Show every field's error, even untouched ones, and stop here if any.
    setSubmitAttempted(true);
    if (coverBusy) {
      showError("Wait until the cover image is ready.");
      return;
    }
    if (Object.keys(formErrors).length > 0 || coverRequiredError) {
      showError(msg.fixFields);
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

      // Same rules as /api/events (price, spots, dates), checked here first
      // so the admin gets the message without a round trip.
      const checked: ReturnType<typeof validateEventRules> = validateEventRules({
        price,
        capacity,
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
        throw new Error(msg.invalid("Start date and time"));
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
            eventType: form.eventType,
            title: form.title,
            slug:
              form.slug.trim() ||
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

            status: form.status,
            isActive: form.isActive,
          },
        };

        // Files can't go in JSON, so the event goes as a JSON entry and the
        // cover as a File entry of one FormData.
        const result: EventActionResult = await createEventAction(
          buildActionFormData(payload, coverFile),
        );
        if (!result.success) {
          throw new Error(result.message);
        }

        if (result.coverError) {
          // The event exists (as a draft) but its cover failed. Keep the
          // popup open, now editing the new event, so the admin can retry:
          // the picked image stays selected.
          await loadAllRecords();
          setEditingId(result.eventId);
          showError(result.coverError);
          return;
        }

        showSuccess("Event created successfully.");
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
            eventType: form.eventType,
            title: form.title,

            slug: form.slug.trim() || makeSlug(form.title),

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

            status: form.status,
            isActive: form.isActive,
          },
        };

        const result: EventActionResult = await updateEventAction(
          buildActionFormData(payload, coverFile),
        );
        if (!result.success) {
          throw new Error(result.message);
        }

        showSuccess("Event updated successfully.");
      }

      setIsFormOpen(false);

      await loadAllRecords();
    } catch (error) {
      showError(error instanceof Error ? error.message : msg.unableTo("save the event"));
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
        showSuccess(
          "This event has bookings, so it was deactivated instead of permanently deleted.",
        );
      } else {
        showSuccess("Event deleted successfully.");
      }

      await loadAllRecords();
    } catch (error) {
      showError(error instanceof Error ? error.message : msg.unableTo("delete the event"));
    }
  }

  /**
   * Publishes or unpublishes a record, then reloads the list.
   * @param eventId The event id.
   * @param publish True to publish, false to unpublish.
   */
  async function handleSetPublished(eventId: number, publish: boolean): Promise<void> {
    try {
      setMessage("");

      const result: EventActionResult = await setEventPublishedAction(eventId, publish);
      if (!result.success) {
        throw new Error(result.message);
      }

      showSuccess(publish ? "Event published." : "Event unpublished.");

      await loadAllRecords();
    } catch (error) {
      showError(error instanceof Error ? error.message : msg.unableTo(publish ? "publish the event" : "unpublish the event"));
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

      showSuccess("Event reactivated successfully. It is now a draft.");

      await loadAllRecords();
    } catch (error) {
      showError(error instanceof Error ? error.message : msg.unableTo("reactivate the event"));
    }
  }

  // The open tab's records, cut into pages. Derived on every render.
  const visibleEvents: eventAdventureRecord[] = events
    .filter((event: eventAdventureRecord) => event.eventType === activeType)
    .filter((event: eventAdventureRecord) => !hideExpired || !isEventExpired(event))
    .sort((a: eventAdventureRecord, b: eventAdventureRecord) => {
      const byStart: number = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      let order: number = byStart;
      if (sortBy === "name") {
        order = a.title.localeCompare(b.title) || byStart;
      }
      if (sortBy === "status") {
        order = statusRank(a) - statusRank(b) || byStart;
      }

      return sortDir === "asc" ? order : -order;
    });
  const totalPages: number = Math.max(1, Math.ceil(visibleEvents.length / EVENTS_PAGE_SIZE));
  // Clamped, so deleting the last record of a page lands on the previous page.
  const currentPage: number = Math.min(page, totalPages);
  const pagedEvents: eventAdventureRecord[] = visibleEvents.slice(
    (currentPage - 1) * EVENTS_PAGE_SIZE,
    currentPage * EVENTS_PAGE_SIZE,
  );

  /**
   * Opens a type tab, starting at its first page.
   * @param type The event type of the tab.
   */
  function selectType(type: string): void {
    setActiveType(type);
    setPage(1);
  }

  /**
   * Expands a collapsed row, or collapses an expanded one.
   * @param id The event id.
   */
  function toggleExpanded(id: string): void {
    setExpandedIds((current: string[]) =>
      current.includes(id) ? current.filter((item: string) => item !== id) : [...current, id],
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-mid font-semibold uppercase tracking-[0.2em] text-roya-sun-deep">
          Event & Adventure
        </p>

        <section>
          <div className="flex flex-wrap items-center justify-end gap-4">
            {/* Pager sits in front of the create button (same markup as Manage Bookings). */}
            {!loading && visibleEvents.length > 0 && (
              <nav aria-label="Record pages" className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-roya-slate">
                  Page {currentPage} of {totalPages} · {visibleEvents.length} total
                </p>
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-roya-slate/30 px-4 py-2 text-sm font-medium text-roya-ink hover:bg-roya-slate/5 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    className="rounded-md border border-roya-slate/30 px-4 py-2 text-sm font-medium text-roya-ink hover:bg-roya-slate/5 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}

            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-md bg-roya-sun px-5 py-2.5 text-sm font-bold text-roya-ink hover:opacity-90"
            >
              New Event/Adventure
            </button>

            {/* Settings dropdown (a native <details>, so no open/close state). */}
            <details className="relative">
              <summary
                aria-label="List settings"
                title="List settings"
                className="cursor-pointer list-none rounded-md border border-roya-slate/30 p-2 text-roya-ink hover:bg-roya-slate/5"
              >
                <span aria-hidden="true" className="block px-1 text-lg leading-none">⚙︎</span>
              </summary>

              <div className="absolute right-0 z-10 mt-2 w-64 space-y-3 rounded-md border border-roya-slate/20 bg-white p-4 shadow-lg">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={hideExpired}
                    onChange={(e) => {
                      setHideExpired(e.target.checked);
                      setPage(1);
                    }}
                  />
                  Hide expired
                </label>

                <div>
                  <label className="text-sm font-semibold" htmlFor="event-sort-by">
                    Sort by
                  </label>
                  <select
                    id="event-sort-by"
                    className={inputClass}
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as SortBy);
                      setPage(1);
                    }}
                  >
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold" htmlFor="event-sort-dir">
                    Order
                  </label>
                  <select
                    id="event-sort-dir"
                    className={inputClass}
                    value={sortDir}
                    onChange={(e) => {
                      setSortDir(e.target.value as SortDir);
                      setPage(1);
                    }}
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>
            </details>
          </div>

          {/* Results (saved, deleted, errors) show on the page while the popup is closed. */}
          {message && !isFormOpen && (
            <div className="mt-4">
              {messageIsError ? <FormError message={message} /> : <FormSuccess message={message} />}
            </div>
          )}

          {/* Type tabs on the left; the list shrinks to fit beside them. */}
          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start">
            <div
              role="tablist"
              aria-orientation="vertical"
              className="flex shrink-0 gap-1 md:w-32 md:flex-col md:border-r md:border-roya-slate/20"
            >
              {typeTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={activeType === tab.value}
                  onClick={() => selectType(tab.value)}
                  className={`px-4 py-3 text-left text-sm font-semibold md:border-r-2 ${activeType === tab.value
                    ? "border-roya-sun text-roya-ink md:bg-white"
                    : "border-transparent text-roya-slate hover:text-roya-ink"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="min-w-0 flex-1">
              {loading ? (
                <p className="text-sm text-roya-slate">
                  Loading events...
                </p>
              ) : visibleEvents.length === 0 ? (
                <p className="text-sm text-roya-slate">
                  No {typeTabs.find((tab) => tab.value === activeType)?.label.toLowerCase()} records found.
                </p>
              ) : (
                <>
                  <div className="space-y-4">
                    {pagedEvents.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-xl border border-roya-slate/20 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            {/* One line: toggle, title, date, status. As tall as the buttons on the right, so the card's top and bottom space match. */}
                            <div className="flex min-h-10 flex-wrap items-center gap-2">
                              <button
                                type="button"
                                aria-expanded={expandedIds.includes(event.id)}
                                aria-label={expandedIds.includes(event.id) ? "Hide details" : "Show details"}
                                onClick={() => toggleExpanded(event.id)}
                                className="rounded-md px-2 py-1 text-sm text-roya-slate hover:bg-roya-slate/10"
                              >
                                {expandedIds.includes(event.id) ? "▼" : "▶"}
                              </button>

                              <h3 className="font-display text-xl font-bold text-roya-ink">
                                {event.title}
                              </h3>

                              <span className="text-sm text-roya-slate">
                                {new Date(
                                  event.startsAt,
                                ).toLocaleString()}
                              </span>

                              {getEventTags(event).map((tag: EventTag) => (
                                <span
                                  key={tag}
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tagClass[tag]}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {/* Hidden until the toggle is clicked. */}
                            {expandedIds.includes(event.id) && (
                              <>
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
                                      Capacity:
                                    </strong>{" "}
                                    {event.capacity ??
                                      "Unlimited"}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {/* Requests are private, so they have no Publish button. */}
                            {event.eventType !== EVENT_TYPE.CUSTOM_EVENT && (
                              <button
                                type="button"
                                disabled={event.status !== EVENT_STATUS.PUBLISHED && !isEventReady(event)}
                                title={
                                  event.status !== EVENT_STATUS.PUBLISHED && !isEventReady(event)
                                    ? "Fill in the required details and add a cover image to publish."
                                    : undefined
                                }
                                onClick={() =>
                                  handleSetPublished(Number(event.id), event.status !== EVENT_STATUS.PUBLISHED)
                                }
                                className={
                                  event.status === EVENT_STATUS.PUBLISHED
                                    ? "rounded-md border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                                    : "rounded-md bg-roya-sun px-4 py-2 text-sm font-semibold text-roya-ink hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                }
                              >
                                {event.status === EVENT_STATUS.PUBLISHED ? "Unpublish" : "Publish"}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => editEvent(event)}
                              aria-label="Edit"
                              title="Edit"
                              className="rounded-md border border-roya-slate/30 p-2 text-roya-ink hover:bg-roya-slate/5"
                            >
                              {/* Pen. */}
                              <svg
                                aria-hidden="true"
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.8"
                                viewBox="0 0 24 24"
                              >
                                <path d="M4 20l1-4L16 5l3 3L8 19l-4 1z" />
                                <path d="M14 7l3 3" />
                              </svg>
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
                                aria-label="Delete"
                                title="Delete"
                                className="rounded-md border border-red-300 p-2 text-red-700 hover:bg-red-50"
                              >
                                {/* Trash can: lid, handle, body. */}
                                <svg
                                  aria-hidden="true"
                                  className="h-5 w-5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="1.8"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M4 7h16" />
                                  <path d="M9 7V4h6v3" />
                                  <path d="M6 7l1 13h10l1-13" />
                                  <path d="M10 11v5M14 11v5" />
                                </svg>
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
                </>
              )}
            </div>
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
            messageIsError ? <FormError message={message} /> : <FormSuccess message={message} />
          )}

          <form
            noValidate
            onSubmit={handleSubmit}
            className="rounded-xl border border-roya-slate/20 bg-white p-6 shadow-sm"
          >
            <div className="grid gap-5 md:grid-cols-2">
              {/* Cover first: it's the biggest thing on the public card. */}
              <div className="md:col-span-2">
                <CoverInput
                  currentCoverUrl={currentCoverUrl}
                  disabled={saving}
                  // Shown when a save is tried on a published event with no cover.
                  error={submitAttempted ? coverRequiredError : undefined}
                  file={coverFile}
                  id="event-cover"
                  onBusyChange={setCoverBusy}
                  onFileChange={setCoverFile}
                />
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="event-type">
                  Type
                </label>

                <select
                  className={inputClass}
                  id="event-type"
                  value={form.eventType}
                  onChange={(e) => updateField("eventType", e.target.value)}
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="event-title">
                  Event Title
                </label>

                <input
                  aria-describedby="event-title-error"
                  aria-invalid={Boolean(fieldError("title"))}
                  className={fieldError("title") ? invalidInputClass : inputClass}
                  id="event-title"
                  maxLength={EVENT_TITLE_MAX}
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  required
                />
                <FieldError id="event-title-error" message={fieldError("title")} />
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="event-slug">
                  Slug
                </label>

                <input
                  aria-describedby="event-slug-error"
                  aria-invalid={Boolean(fieldError("slug"))}
                  className={fieldError("slug") ? invalidInputClass : inputClass}
                  id="event-slug"
                  maxLength={EVENT_SLUG_MAX}
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  required
                />
                <FieldError id="event-slug-error" message={fieldError("slug")} />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold" htmlFor="event-short-description">
                  Short Description
                </label>

                <input
                  aria-describedby="event-short-description-error"
                  aria-invalid={Boolean(fieldError("shortDescription"))}
                  className={fieldError("shortDescription") ? invalidInputClass : inputClass}
                  id="event-short-description"
                  maxLength={EVENT_SHORT_DESCRIPTION_MAX}
                  value={form.shortDescription}
                  onChange={(e) => updateField("shortDescription", e.target.value)}
                />
                <FieldError id="event-short-description-error" message={fieldError("shortDescription")} />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold" htmlFor="event-description">
                  Description
                </label>

                <textarea
                  aria-describedby="event-description-error"
                  aria-invalid={Boolean(fieldError("description"))}
                  className={fieldError("description") ? invalidInputClass : inputClass}
                  id="event-description"
                  maxLength={EVENT_DESCRIPTION_MAX}
                  rows={5}
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                />
                <FieldError id="event-description-error" message={fieldError("description")} />
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
                  step="1"
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
                <label className="text-sm font-semibold" htmlFor="event-location-name">
                  Location Name
                </label>

                <input
                  aria-describedby="event-location-name-error"
                  aria-invalid={Boolean(fieldError("locationName"))}
                  className={fieldError("locationName") ? invalidInputClass : inputClass}
                  id="event-location-name"
                  maxLength={LOCATION_NAME_MAX}
                  value={form.locationName}
                  onChange={(e) => updateField("locationName", e.target.value)}
                  required
                />
                <FieldError id="event-location-name-error" message={fieldError("locationName")} />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold" htmlFor="event-address">
                  Address
                </label>

                <input
                  aria-describedby="event-address-error"
                  aria-invalid={Boolean(fieldError("address"))}
                  className={fieldError("address") ? invalidInputClass : inputClass}
                  id="event-address"
                  maxLength={LOCATION_ADDRESS_MAX}
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                />
                <FieldError id="event-address-error" message={fieldError("address")} />
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="event-city">
                  City
                </label>

                <input
                  aria-describedby="event-city-error"
                  aria-invalid={Boolean(fieldError("city"))}
                  className={fieldError("city") ? invalidInputClass : inputClass}
                  id="event-city"
                  maxLength={LOCATION_CITY_MAX}
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  required
                />
                <FieldError id="event-city-error" message={fieldError("city")} />
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="event-province">
                  Province
                </label>

                <input
                  aria-describedby="event-province-error"
                  aria-invalid={Boolean(fieldError("province"))}
                  className={fieldError("province") ? invalidInputClass : inputClass}
                  id="event-province"
                  maxLength={LOCATION_PROVINCE_MAX}
                  value={form.province}
                  onChange={(e) => updateField("province", e.target.value)}
                  required
                />
                <FieldError id="event-province-error" message={fieldError("province")} />
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="event-postal-code">
                  Postal Code
                </label>

                <input
                  aria-describedby="event-postal-code-error"
                  aria-invalid={Boolean(fieldError("postalCode"))}
                  className={fieldError("postalCode") ? invalidInputClass : inputClass}
                  id="event-postal-code"
                  maxLength={LOCATION_POSTAL_CODE_MAX}
                  value={form.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                />
                <FieldError id="event-postal-code-error" message={fieldError("postalCode")} />
              </div>

              <div>
                <label className="text-sm font-semibold" htmlFor="event-country">
                  Country
                </label>

                <input
                  aria-describedby="event-country-error"
                  aria-invalid={Boolean(fieldError("country"))}
                  className={fieldError("country") ? invalidInputClass : inputClass}
                  id="event-country"
                  maxLength={LOCATION_COUNTRY_MAX}
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  required
                />
                <FieldError id="event-country-error" message={fieldError("country")} />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving || coverBusy}
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