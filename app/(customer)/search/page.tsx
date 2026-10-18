import { PageIntro } from "@/components/ui/PageIntro";
import { AdventureCard } from "@/features/adventures/components/adventure-card";
import { searchPublishedAdventures } from "@/features/adventures/server/queries";
import type { AdventureListItem } from "@/features/adventures/types";
import { EventCard } from "@/features/events/components/event-card";
import { searchPublicEvents } from "@/features/events/server/queries";
import type { EventListItem } from "@/features/events/types";

// Longest search text accepted, so a pasted essay can't become a huge query.
const MAX_TERM_LENGTH: number = 100;

/**
 * Public keyword search across events and adventures. Reading searchParams
 * makes this page render on every request.
 * @param props.searchParams The URL params: q.
 * @returns The page.
 */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const raw: string = typeof q === "string" ? q : "";
  const term: string = raw.trim().slice(0, MAX_TERM_LENGTH);

  const [events, adventures]: [EventListItem[], AdventureListItem[]] = term
    ? await Promise.all([searchPublicEvents(term), searchPublishedAdventures(term)])
    : [[], []];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-10">
      <PageIntro
        eyebrow="Search"
        title={term ? `Results for "${term}"` : "Search"}
        description="Find events and adventures by title."
      />

      {!term ? (
        <div className="mt-12 border border-dashed border-roya-slate/40 p-8 text-roya-slate">
          Type a keyword in the search box to get started.
        </div>
      ) : events.length === 0 && adventures.length === 0 ? (
        <div className="mt-12 border border-dashed border-roya-slate/40 p-8 text-roya-slate">
          Nothing matches &ldquo;{term}&rdquo;. Try a different keyword.
        </div>
      ) : (
        <>
          {events.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-2xl font-bold uppercase text-roya-ink">Events</h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event: EventListItem) => (
                  <li key={event.id}>
                    <EventCard event={event} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {adventures.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-2xl font-bold uppercase text-roya-ink">
                Adventures
              </h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {adventures.map((adventure: AdventureListItem) => (
                  <li key={adventure.id}>
                    <AdventureCard adventure={adventure} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
