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
      <label className="grid gap-2 text-sm font-medium text-roya-slate">
        Name
        <input
          className="border border-roya-slate/40 bg-white px-4 py-3 focus:border-roya-sun focus:outline-none focus:ring-2 focus:ring-roya-sun/50"
          name="name"
          required
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-roya-slate">
        Email
        <input
          className="border border-roya-slate/40 bg-white px-4 py-3 focus:border-roya-sun focus:outline-none focus:ring-2 focus:ring-roya-sun/50"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-roya-slate">
        Tell us what you are planning
        <textarea
          className="min-h-36 border border-roya-slate/40 bg-white px-4 py-3 focus:border-roya-sun focus:outline-none focus:ring-2 focus:ring-roya-sun/50"
          name="message"
          required
        />
      </label>
      <button
        className="w-fit rounded-full bg-roya-sun px-6 py-3 font-semibold text-roya-ink hover:bg-roya-ink hover:text-white"
        type="submit"
      >
        {submitLabel}
      </button>
    </form>
  );
}
