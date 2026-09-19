import Link from "next/link";

import { PageIntro } from "@/components/ui/PageIntro";
import { getPublishedEvents } from "@/features/events/queries";

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <PageIntro
        eyebrow="Events"
        title="Gather around something worth remembering."
        description="Browse upcoming public events and open an event to see its details and ticket options."
      />
      {events.length === 0 ? (
        <div className="mt-14 border border-dashed border-roya-slate/40 p-8 text-roya-slate">
          Upcoming events will appear here soon.
        </div>
      ) : (
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {events.map((event) => (
            <Link
              className="border border-roya-slate/20 p-6 hover:border-roya-sun"
              href={`/events/${event.slug}`}
              key={event.id}
            >
              <h2 className="font-display text-3xl font-bold uppercase">{event.title}</h2>
              <p className="mt-3 text-roya-slate">{event.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
