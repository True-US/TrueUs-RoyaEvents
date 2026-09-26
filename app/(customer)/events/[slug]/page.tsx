import Link from "next/link";
import { notFound } from "next/navigation";

import { getEventBySlug } from "@/features/events/queries";

export default async function EventDetailsPage({
  params,
}: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 sm:px-10">
      <p className="text-sm uppercase tracking-[0.2em] text-roya-sun-deep">
        Event details
      </p>
      <h1 className="mt-4 text-5xl font-display font-bold uppercase tracking-tight text-roya-ink">
        {event.title}
      </h1>
      <p className="mt-6 text-lg leading-8 text-roya-slate">{event.summary}</p>
      <Link
        className="mt-8 inline-block rounded-full bg-roya-sun px-6 py-3 font-semibold text-roya-ink hover:bg-roya-ink hover:text-white"
        href={`/events/${event.slug}/checkout`}
      >
        View ticket options
      </Link>
    </section>
  );
}
