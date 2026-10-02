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

import { useEffect, useState } from "react";
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
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
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

    setForm({
      title: event.title,
      slug: event.slug,
      shortDescription: event.summary,
      description: event.description,

      price:
        event.price === null
          ? ""
          : String(event.price),

      startDatetime: event.startsAt.slice(
        0,
        16,
      ),

      endDatetime: event.endsAt
        ? event.endsAt.slice(0, 16)
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

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

      if (
        price !== null &&
        !Number.isFinite(price)
      ) {
        throw new Error("Invalid price.");
      }

      if (
        capacity !== null &&
        !Number.isInteger(capacity)
      ) {
        throw new Error(
          "Capacity must be a whole number.",
        );
      }

      if (
        availableSpots !== null &&
        !Number.isInteger(availableSpots)
      ) {
        throw new Error(
          "Available spots must be a whole number.",
        );
      }

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

              price,

              startDatetime:
                form.startDatetime,

              endDatetime:
                form.endDatetime || null,

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

              price,

              startDatetime:
                form.startDatetime,

              endDatetime:
                form.endDatetime || null,

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

      resetForm();

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
          <h2 className="font-display text-2xl font-bold text-roya-ink">
            All Events
          </h2>

          <p className="mt-1 text-sm text-roya-slate">
            Active and inactive events are shown here.
          </p>

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
                            {event.price ===
                            null
                              ? "Free"
                              : `$${event.price}`}
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

      <div>
        <h2 className="mt-2 font-display text-3xl font-bold text-roya-ink">
          {editingId === null
            ? "Create Event"
            : "Edit Event"}
        </h2>
      </div>

      {message && (
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
            <label className="text-sm font-semibold">
              Price
            </label>

            <input
              className={inputClass}
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
          </div>

          <div>
            <label className="text-sm font-semibold">
              Capacity
            </label>

            <input
              className={inputClass}
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
          </div>

          <div>
            <label className="text-sm font-semibold">
              Available Spots
            </label>

            <input
              className={inputClass}
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
            <label className="text-sm font-semibold">
              Start Date & Time
            </label>

            <input
              className={inputClass}
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
          </div>

          <div>
            <label className="text-sm font-semibold">
              End Date & Time
            </label>

            <input
              className={inputClass}
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

          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-roya-slate/30 px-5 py-2.5 text-sm font-semibold text-roya-ink hover:bg-roya-slate/5"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

    </div>
  );
}