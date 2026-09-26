"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEventRequest } from "@/features/events/api";
import type { CreateEventWithLocationInput } from "@/features/events/types";
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
  capacity: "",
  numberOfGuests: "",
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Minimum date/time = current local date/time
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  const resetForm = () => {
    setFormData(initialFormData);
    setStep(1);
  };

  const updateField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const goToStep2 = () => {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim()
    ) {
      alert("Please fill in all contact information before continuing.");
      return;
    }

    setStep(2);
  };

  const goToStep3 = () => {
    if (
      !formData.title.trim() ||
      !formData.startDate.trim() ||
      !formData.endDate.trim() ||
      !formData.numberOfGuests.trim()
    ) {
      alert("Please complete all event details before continuing.");
      return;
    }
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        alert("End date and time cannot be earlier than start date and time.");
        return;
      }
    }

    setStep(3);
  };

  const goToStep4 = () => {
    if (
      !formData.location.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.province.trim() ||
      !formData.postalCode.trim() ||
      !formData.country.trim()
    ) {
      alert("Please complete all location details before continuing.");
      return;
    }

    setStep(4);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    let status = "";
    if (
      kind === "contact" ||
      kind === "private_adventure" ||
      kind === "custom_event"
    ) {
      status = "DRAFT";
    } else {
      status = "PUBLISHED";
    }
    const requiredFields = [
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.phone,
      formData.title,
      formData.startDate,
      formData.endDate,
      formData.numberOfGuests,
      formData.location,
      formData.address,
      formData.city,
      formData.province,
      formData.postalCode,
      formData.country,
    ];

    try {
      if (requiredFields.some((value) => !value.trim())) {
        alert("Please complete every required field before submitting.");
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
          slug: formData.title.toLowerCase().trim().replace(/\s+/g, "-"),
          shortDescription: formData.title,
          description: `${formData.firstName} ${formData.lastName} — ${formData.email} — ${formData.phone}`,
          startDatetime: formData.startDate,
          endDatetime: formData.endDate,
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
        console.log("Created:", result);
        resetForm();
        alert("Event request submitted successfully.");
      } else {
        console.error("Event request submission failed:", result);
        alert("Something went wrong while submitting the event.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while submitting the event.");
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
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                  step >= number
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step > number ? "✓" : number}
              </div>

              {number < 4 && (
                <div className="mx-3 h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-slate-900 transition-all duration-500 ${
                      step > number ? "w-full" : "w-0"
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
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-10"
      >
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
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  First Name
                </label>

                <input
                  name="firstName"
                  value={formData.firstName}
                  onChange={updateField}
                  placeholder="John"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Last Name
                </label>

                <input
                  name="lastName"
                  value={formData.lastName}
                  onChange={updateField}
                  placeholder="Smith"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={updateField}
                placeholder="john@example.com"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={updateField}
                placeholder="(780) 555-0123"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
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
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Event Name
              </label>

              <input
                name="title"
                value={formData.title}
                onChange={updateField}
                placeholder="John's Birthday Party"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Start Date
                </label>

                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={updateField}
                  min={minDateTime}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  End Date
                </label>

                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={updateField}
                  min={formData.startDate || minDateTime}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Number of Guests
              </label>

              <input
                type="number"
                name="numberOfGuests"
                value={formData.numberOfGuests}
                onChange={updateField}
                placeholder="20"
                min="1"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
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
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                name="location"
                value={formData.location}
                onChange={updateField}
                placeholder="Roya Event & Adventure Center"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Address
              </label>
              <input
                name="address"
                value={formData.address}
                onChange={updateField}
                placeholder="123 Main St 12Ave"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  City
                </label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={updateField}
                  placeholder="Edmonton"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Province
                </label>
                <input
                  name="province"
                  value={formData.province}
                  onChange={updateField}
                  placeholder="Alberta"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Postal Code
                </label>
                <input
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={updateField}
                  placeholder="T6G 2T6"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Country
                </label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={updateField}
                  placeholder="Canada"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
                />
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
                className={`rounded-xl bg-amber-500 px-7 py-3 font-semibold text-slate-950 shadow-sm transition hover:bg-amber-400 ${
                  isSubmitting ? "cursor-not-allowed opacity-70" : ""
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
