"use client";

import { useState } from "react";

type InquiryFormProps = {
  kind: "contact" | "custom_event" | "private_adventure";
  submitLabel: string;
};

export function InquiryForm({ kind, submitLabel }: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <p className="border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        Thanks. Your request has been received.
      </p>
    );
  }

  return (
    <form
      className="mt-10 grid max-w-xl gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <input name="kind" type="hidden" value={kind} />
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Name
        <input
          className="border border-slate-300 px-4 py-3"
          name="name"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Email
        <input
          className="border border-slate-300 px-4 py-3"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Tell us what you are planning
        <textarea
          className="min-h-36 border border-slate-300 px-4 py-3"
          name="message"
          required
        />
      </label>
      <button
        className="w-fit rounded-full bg-slate-950 px-6 py-3 font-medium text-white hover:bg-slate-800"
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  );
}
