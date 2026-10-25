"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";

import { FieldError, FormError, invalidInputClass } from "@/components/ui/form-feedback";
import { EMAIL_MAX, PHONE_MAX } from "@/features/auth/constants";
import { createEventRequest } from "@/features/events/api";
import {
  EVENT_TITLE_MAX,
  LOCATION_ADDRESS_MAX,
  LOCATION_CITY_MAX,
  LOCATION_COUNTRY_MAX,
  LOCATION_NAME_MAX,
  LOCATION_POSTAL_CODE_MAX,
  LOCATION_PROVINCE_MAX,
  REQUEST_MESSAGE_MAX,
} from "@/features/events/constants";
import { customEventStep2Schema, customEventStep3Schema, requestContactSchema } from "@/features/events/schemas";
import type { CreateEventWithLocationInput } from "@/features/events/types";
import { dateToZonedInput, zonedInputToDate } from "@/features/events/utils/dates";
import { makeSlug } from "@/features/events/utils/slug";
import { getFieldErrors } from "@/lib/validation/errors";
import { msg } from "@/lib/validation/messages";

const inputClass: string =
  "mt-1 w-full rounded-md border border-roya-slate/30 bg-white px-3 py-2 text-sm text-roya-ink outline-none focus:border-roya-sun focus:ring-1 focus:ring-roya-sun";

// The names match the schemas the public request form uses, so they can be reused as they are.
type RequestFormData = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  title: string;
  startDate: string;
  endDate: string;
  numberOfGuests: string;
  location: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  message: string;
};

const emptyRequest: RequestFormData = {
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  title: "",
  startDate: "",
  endDate: "",
  numberOfGuests: "",
  location: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  country: "Canada",
  message: "",
};

type RequestFormDialogProps = {
  // Whether the popup is showing. The parent changes it; the effect below shows or hides the dialog.
  open: boolean;
  onClose: () => void;
  // Called after the request is saved, with the message to show on the page.
  onCreated: (message: string) => void;
};

/**
 * Popup for an admin to enter a customer's request (for example one taken by phone).
 * It is separate from the event form: a request has contact details and no price,
 * status or cover. Give it a new `key` each time it opens to start with an empty form.
 * @param props See RequestFormDialogProps.
 * @returns The dialog.
 */
export function RequestFormDialog({ open, onClose, onCreated }: RequestFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<RequestFormData>(emptyRequest);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  // Dates are Edmonton time, so the earliest pick is "now" in Edmonton.
  const minDateTime: string = dateToZonedInput(new Date());

  // showModal()/close() are methods, not props, so an effect keeps the dialog in step with `open`.
  useEffect(() => {
    const dialog: HTMLDialogElement | null = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  /**
   * Stores a typed value and clears that field's error.
   * @param e The input's change event.
   */
  function updateField(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
    const { name, value } = e.target;
    setSubmitError("");
    setForm((current: RequestFormData) => ({ ...current, [name]: value }));
    setErrors((current: Record<string, string>) => {
      const next: Record<string, string> = { ...current };
      delete next[name];

      return next;
    });
  }

  /**
   * Checks every field with the same schemas the public form and the server use.
   * @returns The first error message for each invalid field; {} when all is valid.
   */
  function validate(): Record<string, string> {
    const found: Record<string, string> = {};
    for (const schema of [requestContactSchema, customEventStep2Schema, customEventStep3Schema]) {
      const checked: ReturnType<typeof schema.safeParse> = schema.safeParse(form);
      if (!checked.success) {
        Object.assign(found, getFieldErrors(checked.error));
      }
    }

    return found;
  }

  /**
   * Saves the request. It lands as PENDING; the server sets that itself.
   * @param e The form's submit event.
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (saving) {
      return;
    }

    const found: Record<string, string> = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setSubmitError(msg.fixFields);
      return;
    }

    const start: Date | null = zonedInputToDate(form.startDate);
    const end: Date | null = zonedInputToDate(form.endDate);
    if (!start || !end) {
      setSubmitError(msg.invalid("Start and end dates"));
      return;
    }

    const payload: CreateEventWithLocationInput = {
      location: {
        name: form.location,
        address: form.address,
        city: form.city,
        province: form.province,
        postalCode: form.postalCode,
        country: form.country,
      },
      event: {
        title: form.title,
        slug: makeSlug(form.title, true),
        shortDescription: form.title,
        // The message only: who asked travels in the contact fields.
        description: form.message.trim(),
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
        capacity: Number(form.numberOfGuests),
        availableSpots: Number(form.numberOfGuests),
        // The same value the public request form sends; the server sets the status to PENDING.
        eventType: "custom_event",
        createdBy: form.contactName,
        updatedBy: form.contactName,
      },
    };

    try {
      setSaving(true);
      setSubmitError("");

      const result: Awaited<ReturnType<typeof createEventRequest>> = await createEventRequest(payload);
      if (!result.success) {
        setSubmitError(result.message ?? msg.unableTo("save the request"));
        return;
      }

      onCreated("Request created. It is pending your review.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : msg.unableTo("save the request"));
    } finally {
      setSaving(false);
    }
  }

  /**
   * One labelled text input with its error line.
   * @param name The field name (a key of RequestFormData).
   * @param label The label text.
   * @param options type, maxLength and min for the input; wide spans both columns.
   * @returns The field.
   */
  function textInput(
    name: keyof RequestFormData,
    label: string,
    options: { type?: string; maxLength?: number; min?: string; wide?: boolean } = {},
  ): ReactNode {
    const id: string = `request-${name}`;

    return (
      <div className={options.wide ? "md:col-span-2" : undefined}>
        <label className="text-sm font-semibold" htmlFor={id}>
          {label}
        </label>
        <input
          aria-describedby={`${id}-error`}
          aria-invalid={Boolean(errors[name])}
          className={errors[name] ? invalidInputClass : inputClass}
          id={id}
          maxLength={options.maxLength}
          min={options.min}
          name={name}
          onChange={updateField}
          type={options.type ?? "text"}
          value={form[name]}
        />
        <FieldError id={`${id}-error`} message={errors[name]} />
      </div>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="request-form-title"
      onClose={onClose}
      onCancel={(e) => {
        if (saving) {
          e.preventDefault();
        }
      }}
      className="roya-dialog m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl flex-col overflow-hidden rounded-xl bg-roya-sand p-0 shadow-xl open:flex"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-roya-slate/20 bg-white px-6 py-4">
        <h2 id="request-form-title" className="font-display text-3xl font-bold text-roya-ink">
          New Private
        </h2>

        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          disabled={saving}
          className="rounded-md px-3 py-1 text-2xl leading-none text-roya-slate hover:bg-roya-slate/10 hover:text-roya-ink disabled:opacity-50"
        >
          ×
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 [scrollbar-width:thin]">
        {submitError && <FormError message={submitError} />}

        <form
          noValidate
          onSubmit={handleSubmit}
          className="rounded-xl border border-roya-slate/20 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <h3 className="font-display text-xl font-bold text-roya-ink md:col-span-2">Contact info</h3>
            {textInput("contactName", "Name", { maxLength: 200, wide: true })}
            {textInput("contactEmail", "Email", { type: "email", maxLength: EMAIL_MAX })}
            {textInput("contactPhone", "Phone", { type: "tel", maxLength: PHONE_MAX })}

            <h3 className="mt-2 font-display text-xl font-bold text-roya-ink md:col-span-2">Event info</h3>
            {textInput("title", "Event name", { maxLength: EVENT_TITLE_MAX, wide: true })}
            {textInput("startDate", "Start (Edmonton time)", { type: "datetime-local", min: minDateTime })}
            {textInput("endDate", "End (Edmonton time)", { type: "datetime-local", min: minDateTime })}
            {textInput("numberOfGuests", "Number of guests", { type: "number", min: "1" })}
            {textInput("location", "Location name", { maxLength: LOCATION_NAME_MAX, wide: true })}
            {textInput("address", "Address", { maxLength: LOCATION_ADDRESS_MAX, wide: true })}
            {textInput("city", "City", { maxLength: LOCATION_CITY_MAX })}
            {textInput("province", "Province", { maxLength: LOCATION_PROVINCE_MAX })}
            {textInput("postalCode", "Postal code", { maxLength: LOCATION_POSTAL_CODE_MAX })}
            {textInput("country", "Country", { maxLength: LOCATION_COUNTRY_MAX })}

            <h3 className="mt-2 font-display text-xl font-bold text-roya-ink md:col-span-2">Description</h3>
            <div className="md:col-span-2">
              <label className="text-sm font-semibold" htmlFor="request-message">
                Message
              </label>
              <textarea
                aria-describedby="request-message-error"
                aria-invalid={Boolean(errors.message)}
                className={errors.message ? invalidInputClass : inputClass}
                id="request-message"
                maxLength={REQUEST_MESSAGE_MAX}
                name="message"
                onChange={updateField}
                rows={5}
                value={form.message}
              />
              <FieldError id="request-message-error" message={errors.message} />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-roya-sun px-5 py-2.5 text-sm font-bold text-roya-ink hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Request"}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-roya-slate/30 px-5 py-2.5 text-sm font-semibold text-roya-ink hover:bg-roya-slate/5 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
