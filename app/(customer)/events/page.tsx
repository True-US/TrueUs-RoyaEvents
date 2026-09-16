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
        <div className="mt-14 border border-dashed border-slate-300 p-8 text-slate-600">
          Upcoming events will appear here soon.
        </div>
      ) : (
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {events.map((event) => (
            <Link
              className="border border-slate-200 p-6 hover:border-amber-500"
              href={`/events/${event.slug}`}
              key={event.id}
            >
              <h2 className="text-2xl font-semibold">{event.title}</h2>
              <p className="mt-3 text-slate-600">{event.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
