import { InquiryForm } from "@/components/forms/InquiryForm";

export default async function BookAdventurePage({
  params,
}: PageProps<"/adventures/[slug]/book">) {
  const { slug } = await params;

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 sm:px-10">
      <p className="text-sm uppercase tracking-[0.2em] text-amber-700">
        Adventure request
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
        Plan {slug.replaceAll("-", " ")}
      </h1>
      <p className="mt-5 max-w-xl leading-7 text-slate-600">
        Tell us about your preferred date, group, and requirements.
      </p>
      <InquiryForm
        kind="private_adventure"
        submitLabel="Send adventure request"
      />
    </section>
  );
}
