import Link from "next/link";

import { PageIntro } from "@/components/ui/PageIntro";
import { EventCard } from "@/features/events/components/event-card";
import { EventFilterBar } from "@/features/events/components/event-filter-bar";
import { getEventRegions, getPublicEventList } from "@/features/events/queries";
import {
  hasActiveFilters,
  parseEventListParams,
  type EventListParams,
} from "@/features/events/search-params";
import type { EventListItem } from "@/features/events/types";

/**
 * Public event list. Reading searchParams makes this page render on every
 * request, so the list is always current (past events drop off without a rebuild).
 * @param props.searchParams The URL params: when, region, sort.
 * @returns The page.
 */
export default async function EventsPage({ searchParams }: PageProps<"/events">) {
  // Regions first: the region param is only accepted if it is in this list.
  const regions: string[] = await getEventRegions();
  const params: EventListParams = parseEventListParams(await searchParams, regions);

  // Get the event list.
  const events: EventListItem[] = await getPublicEventList(params);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-10">
      <PageIntro
        eyebrow="Events"
        title="Gather around something worth remembering."
        description="Browse upcoming public events and open an event to see its details and ticket options."
      />

      <div className="mt-12">
        <EventFilterBar params={params} regions={regions} />
      </div>

      {events.length === 0 ? (
        <div className="mt-8 border border-dashed border-roya-slate/40 p-8 text-roya-slate">
          {hasActiveFilters(params) ? (
            <>
              No events match these filters.{" "}
              <Link className="font-semibold text-roya-sun-deep underline" href="/events">
                See all events
              </Link>
            </>
          ) : (
            "Upcoming events will appear here soon."
          )}
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event: EventListItem, index: number) => (
            <li key={event.id}>
              {/* The first row is visible on load, so start those images early. */}
              <EventCard event={event} preload={index < 3} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
