"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FieldError, FormError, FormSuccess } from "@/components/ui/form-feedback";
import { EMAIL_MAX, PERSON_NAME_MAX, PHONE_MAX } from "@/features/auth/constants";
import { createEventRequest } from "@/features/events/api";
import {
  EVENT_STATUS,
  EVENT_TITLE_MAX,
  LOCATION_ADDRESS_MAX,
  LOCATION_CITY_MAX,
  LOCATION_COUNTRY_MAX,
  LOCATION_NAME_MAX,
  LOCATION_POSTAL_CODE_MAX,
  LOCATION_PROVINCE_MAX,
  REQUEST_GUESTS_MAX,
  REQUEST_MESSAGE_MAX,
} from "@/features/events/constants";
import {
  customEventStep1Schema,
  customEventStep2Schema,
  customEventStep3Schema,
} from "@/features/events/schemas";
import type { CreateEventWithLocationInput } from "@/features/events/types";
import { dateToZonedInput, zonedInputToDate } from "@/features/events/utils/dates";
import { makeSlug } from "@/features/events/utils/slug";
import { getFieldErrors } from "@/lib/validation/errors";
import { msg } from "@/lib/validation/messages";

type CustomEventFormProps = {
  kind: string;
  submitLabel: string;
};
const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  title: "",
  startDate: "",
  endDate: "",
  numberOfGuests: "",
  message: "",
  location: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  country: "",
};

export function CustomEventForm({ kind, submitLabel }: CustomEventFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  // The form's dates are Edmonton time, so the earliest pick is "now" in Edmonton.
  const minDateTime: string = dateToZonedInput(new Date());

  const resetForm = () => {
    setFormData(initialFormData);
    setStep(1);
  };

  const updateField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setSubmitError("");
    setSuccessMessage("");

    setFormData({
      ...formData,
      [name]: value,
    });

    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
  };

  const validateStep = (stepNumber: number) => {
    const schema =
      stepNumber === 1
        ? customEventStep1Schema
        : stepNumber === 2
          ? customEventStep2Schema
          : customEventStep3Schema;

    const result = schema.safeParse(formData);

    if (!result.success) {
      setErrors(getFieldErrors(result.error));
      return false;
    }

    setErrors({});
    return true;
  };

  const goToStep2 = () => {
    if (!validateStep(1)) {
      return;
    }

    setStep(2);
  };

  const goToStep3 = () => {
    if (!validateStep(2)) {
      return;
    }

    setStep(3);
  };

  const goToStep4 = () => {
    if (!validateStep(3)) {
      return;
    }

    setStep(4);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmitError("");

    // Check every step again; if one fails, go back to the first step with an error.
    const stepSchemas = [customEventStep1Schema, customEventStep2Schema, customEventStep3Schema];
    for (let index = 0; index < stepSchemas.length; index++) {
      const checked = stepSchemas[index].safeParse(formData);
      if (!checked.success) {
        setErrors(getFieldErrors(checked.error));
        setStep(index + 1);
        return;
      }
    }

    setIsSubmitting(true);
    // Every request lands as a draft. The server enforces this too.
    const status: string = EVENT_STATUS.DRAFT;
    const start: Date | null = zonedInputToDate(formData.startDate);
    const end: Date | null = zonedInputToDate(formData.endDate);

    try {
      if (!start || !end) {
        setSubmitError(msg.invalid("Start and end dates"));
        return;
      }

      const payload: CreateEventWithLocationInput = {
        location: {
          name: formData.location,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        event: {
          title: formData.title,
          slug: makeSlug(formData.title, true),
          shortDescription: formData.title,
          description: [
            `${formData.firstName} ${formData.lastName} — ${formData.email} — ${formData.phone}`,
            formData.message.trim(),
          ]
            .filter(Boolean)
            .join("\n\n"),
          startDatetime: start.toISOString(),
          endDatetime: end.toISOString(),
          capacity: Number(formData.numberOfGuests),
          availableSpots: Number(formData.numberOfGuests),
          eventType: kind,
          status: status,
          isActive: true,
          createdBy: `${formData.firstName} ${formData.lastName}`,
          updatedBy: `${formData.firstName} ${formData.lastName}`,
        },
      };

      const result = await createEventRequest(payload);
      if (result.success) {
        resetForm();
        setSuccessMessage("Event request submitted successfully.");
      } else {
        // An expected rejection (validation, auth, schedule clash): show it on the form.
        // No console.error, which would open the Next.js error overlay in dev.
        setSubmitError(result.message ?? msg.unableTo("submit your request"));
      }
    } catch (error) {
      console.error(error);
      // parseResponse throws the server's message for a rejected request.
      setSubmitError(error instanceof Error ? error.message : msg.unableTo("submit your request"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 text-center">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-amber-600">
          Custom Experience
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Plan Your Event
        </h1>

        <p className="mt-3 text-slate-500">
          Tell us a little about what you're planning and we'll help bring your
          experience to life.
        </p>
      </div>

      <div className="mb-10">
        <div className="flex items-center">
          {[1, 2, 3, 4].map((number) => (
            <div
              key={number}
              className="flex flex-1 items-center last:flex-none"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${step >= number
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-400"
                  }`}
              >
                {step > number ? "✓" : number}
              </div>

              {number < 4 && (
                <div className="mx-3 h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-slate-900 transition-all duration-500 ${step > number ? "w-full" : "w-0"
                      }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-between text-xs font-medium text-slate-500">
          <span>Contact</span>
          <span>Event Details</span>
          <span>Location</span>
          <span>Review</span>
        </div>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-10"
      >
        {successMessage && (
          <div className="mb-6">
            <FormSuccess message={successMessage} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-amber-600">Step 1 of 4</p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Contact Information
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Let us know how we can get in touch with you.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="firstName">
                  First Name
                </label>

                <input
                  id="firstName"
                  name="firstName"
                  maxLength={PERSON_NAME_MAX}
                  value={formData.firstName}
                  onChange={updateField}
                  placeholder="John"
                  required
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={errors.firstName ? "firstName-error" : undefined}
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.firstName
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-300 focus:border-slate-900"
                    }`}
                />
                <FieldError id="firstName-error" message={errors.firstName} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="lastName">
                  Last Name
                </label>

                <input
                  id="lastName"
                  name="lastName"
                  maxLength={PERSON_NAME_MAX}
                  value={formData.lastName}
                  onChange={updateField}
                  placeholder="Smith"
                  required
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={errors.lastName ? "lastName-error" : undefined}
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.lastName
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-300 focus:border-slate-900"
                    }`}
                />
                <FieldError id="lastName-error" message={errors.lastName} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
                Email Address
              </label>

              <input
                type="email"
                id="email"
                name="email"
                maxLength={EMAIL_MAX}
                value={formData.email}
                onChange={updateField}
                placeholder="john@example.com"
                required
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.email
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-300 focus:border-slate-900"
                  }`}
              />
              <FieldError id="email-error" message={errors.email} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="phone">
                Phone Number
              </label>

              <input
                type="tel"
                id="phone"
                name="phone"
                maxLength={PHONE_MAX}
                value={formData.phone}
                onChange={updateField}
                placeholder="(780) 555-0123"
                required
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.phone
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-300 focus:border-slate-900"
                  }`}
              />
              <FieldError id="phone-error" message={errors.phone} />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={goToStep2}
                className="rounded-xl bg-slate-900 px-7 py-3 font-semibold text-white transition hover:bg-slate-700"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-amber-600">Step 2 of 4</p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Event Details
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Tell us about the experience you're planning.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="title">
                Event Name
              </label>

              <input
                id="title"
                name="title"
                maxLength={EVENT_TITLE_MAX}
                value={formData.title}
                onChange={updateField}
                placeholder="John's Birthday Party"
                required
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "title-error" : undefined}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.title
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-300 focus:border-slate-900"
                  }`}
              />
              <FieldError id="title-error" message={errors.title} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="startDate">
                  Start Date
                </label>

                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={updateField}
                  min={minDateTime}
                  required
                  aria-invalid={Boolean(errors.startDate)}
                  aria-describedby={errors.startDate ? "startDate-error" : undefined}
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.startDate
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-300 focus:border-slate-900"
                    }`}
                />
                <FieldError id="startDate-error" message={errors.startDate} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="endDate">
                  End Date
                </label>

                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={updateField}
                  min={formData.startDate || minDateTime}
                  required
                  aria-invalid={Boolean(errors.endDate)}
                  aria-describedby={errors.endDate ? "endDate-error" : undefined}
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.endDate
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-300 focus:border-slate-900"
                    }`}
                />
                <FieldError id="endDate-error" message={errors.endDate} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="numberOfGuests">
                Number of Guests
              </label>

              <input
                type="number"
                id="numberOfGuests"
                name="numberOfGuests"
                value={formData.numberOfGuests}
                onChange={updateField}
                placeholder="20"
                min="1"
                max={REQUEST_GUESTS_MAX}
                required
                aria-invalid={Boolean(errors.numberOfGuests)}
                aria-describedby={errors.numberOfGuests ? "numberOfGuests-error" : undefined}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.numberOfGuests
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-300 focus:border-slate-900"
                  }`}
              />
              <FieldError id="numberOfGuests-error" message={errors.numberOfGuests} />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-slate-700"
                htmlFor="message"
              >
                Message (optional)
              </label>

              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={updateField}
                maxLength={REQUEST_MESSAGE_MAX}
                rows={4}
                placeholder="Tell us about your preferred date, group, and requirements."
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "message-error" : undefined}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.message
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-300 focus:border-slate-900"
                  }`}
              />
              <FieldError id="message-error" message={errors.message} />
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={goToStep3}
                className="rounded-xl bg-slate-900 px-7 py-3 font-semibold text-white transition hover:bg-slate-700"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-amber-600">Step 3 of 4</p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Location Details
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Tell us where the experience will take place.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="location">
                Location
              </label>
              <input
                id="location"
                name="location"
                maxLength={LOCATION_NAME_MAX}
                value={formData.location}
                onChange={updateField}
                placeholder="Roya Event & Adventure Center"
                required
                aria-invalid={Boolean(errors.location)}
                aria-describedby={errors.location ? "location-error" : undefined}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.location
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-300 focus:border-slate-900"
                  }`}
              />
              <FieldError id="location-error" message={errors.location} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="address">
                Address
              </label>
              <input
                id="address"
                name="address"
                maxLength={LOCATION_ADDRESS_MAX}
                value={formData.address}
                onChange={updateField}
                placeholder="123 Main St 12Ave"
                required
                aria-invalid={Boolean(errors.address)}
                aria-describedby={errors.address ? "address-error" : undefined}
                className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.address
                    ? "border-red-500 focus:border-red-500"
                    : "border-slate-300 focus:border-slate-900"
                  }`}
              />
              <FieldError id="address-error" message={errors.address} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="city">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  maxLength={LOCATION_CITY_MAX}
                  value={formData.city}
                  onChange={updateField}
                  placeholder="Edmonton"
                  required
                  aria-invalid={Boolean(errors.city)}
                  aria-describedby={errors.city ? "city-error" : undefined}
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.city
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-300 focus:border-slate-900"
                    }`}
                />
                <FieldError id="city-error" message={errors.city} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="province">
                  Province
                </label>
                <input
                  id="province"
                  name="province"
                  maxLength={LOCATION_PROVINCE_MAX}
                  value={formData.province}
                  onChange={updateField}
                  placeholder="Alberta"
                  required
                  aria-invalid={Boolean(errors.province)}
                  aria-describedby={errors.province ? "province-error" : undefined}
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.province
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-300 focus:border-slate-900"
                    }`}
                />
                <FieldError id="province-error" message={errors.province} />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="postalCode">
                  Postal Code
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  maxLength={LOCATION_POSTAL_CODE_MAX}
                  value={formData.postalCode}
                  onChange={updateField}
                  placeholder="T6G 2T6"
                  required
                  aria-invalid={Boolean(errors.postalCode)}
                  aria-describedby={errors.postalCode ? "postalCode-error" : undefined}
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.postalCode
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-300 focus:border-slate-900"
                    }`}
                />
                <FieldError id="postalCode-error" message={errors.postalCode} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="country">
                  Country
                </label>
                <input
                  id="country"
                  name="country"
                  maxLength={LOCATION_COUNTRY_MAX}
                  value={formData.country}
                  onChange={updateField}
                  placeholder="Canada"
                  required
                  aria-invalid={Boolean(errors.country)}
                  aria-describedby={errors.country ? "country-error" : undefined}
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-900/10 ${errors.country
                      ? "border-red-500 focus:border-red-500"
                      : "border-slate-300 focus:border-slate-900"
                    }`}
                />
                <FieldError id="country-error" message={errors.country} />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={goToStep4}
                className="rounded-xl bg-slate-900 px-7 py-3 font-semibold text-white transition hover:bg-slate-700"
              >
                Review →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-amber-600">Step 4 of 4</p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Review Your Request
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Make sure everything looks right before submitting.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="border-b border-slate-200 p-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Contact
                </p>

                <p className="font-semibold text-slate-900">
                  {formData.firstName} {formData.lastName}
                </p>

                <p className="mt-1 text-sm text-slate-500">{formData.email}</p>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Event
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formData.title || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Dates
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formData.startDate || "—"} / {formData.endDate || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Guests
                  </p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formData.numberOfGuests || "—"}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 p-5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Location
                </p>
                <p className="font-medium text-slate-900">
                  {formData.location || "—"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formData.address || ""} {formData.city || ""}{" "}
                  {formData.province || ""}
                  {formData.postalCode ? `, ${formData.postalCode}` : ""}
                  {formData.country ? `, ${formData.country}` : ""}
                </p>
              </div>
            </div>

            <FormError message={submitError} />

            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className={`rounded-xl bg-amber-500 px-7 py-3 font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 ${isSubmitting ? "cursor-not-allowed opacity-70" : ""
                  }`}
              >
                {isSubmitting ? "Submitting..." : submitLabel}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
