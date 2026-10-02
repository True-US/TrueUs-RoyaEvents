import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatEventDateLong,
  formatPrice,
  formatSpotsLeft,
  formatVenueLines,
  getEventState,
  type EventState,
} from "@/features/events/format";
import { getPublicEventBySlug } from "@/features/events/queries";
import type { EventDetail } from "@/features/events/types";

// Notice shown above the details when tickets can't be bought.
const stateNotices: Partial<Record<EventState, string>> = {
  cancelled: "This event has been cancelled.",
  ended: "This event has ended.",
};

/**
 * Sets the browser tab title and the link preview for the event.
 * @param props.params The route params: slug.
 * @returns The page metadata.
 */
export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  // Same call as the page below; cache() runs the query only once.
  const event: EventDetail | null = await getPublicEventBySlug(slug);
  if (!event) {
    return { title: "Event not found" };
  }

  return {
    title: event.title,
    description: event.shortDescription ?? undefined,
    openGraph: { images: event.coverUrl ? [event.coverUrl] : [] },
  };
}

/**
 * Public event detail page. Unknown slugs, drafts, inactive events and
 * adventures show the 404 page.
 * @param props.params The route params: slug.
 * @returns The page.
 */
export default async function EventDetailsPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const event: EventDetail | null = await getPublicEventBySlug(slug);
  if (!event) {
    // Stops rendering here and shows the not-found page with a 404 status.
    notFound();
  }

  const state: EventState = getEventState(event);
  const spotsLeft: string | null = formatSpotsLeft(event);
  const notice: string | undefined = stateNotices[state];

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:px-10">
      <Link className="text-sm font-semibold text-roya-slate hover:text-roya-ink" href="/events">
        ← All events
      </Link>

      <div className="relative mt-6 aspect-[2/1] overflow-hidden bg-roya-slate">
        {event.coverUrl ? (
          <Image
            alt=""
            className="object-cover"
            fill
            // The cover is the largest thing on screen, so load it first.
            preload
            sizes="(min-width: 1152px) 1088px, 100vw"
            src={event.coverUrl}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl font-bold uppercase tracking-widest text-white/40">
            Roya
          </div>
        )}
      </div>

      {notice && (
        <p className="mt-6 border-l-4 border-roya-sun bg-white px-4 py-3 font-semibold text-roya-ink" role="status">
          {notice}
        </p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-roya-sun-deep">
            {formatEventDateLong(event.startDatetime, event.endDatetime)}
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold uppercase leading-none tracking-tight text-roya-ink">
            {event.title}
          </h1>
          {event.shortDescription && (
            <p className="mt-5 text-lg leading-8 text-roya-slate">{event.shortDescription}</p>
          )}
          {/* whitespace-pre-line keeps the paragraphs typed into the description. */}
          <div className="mt-8 whitespace-pre-line leading-7 text-roya-ink">
            {event.description ?? "More details coming soon."}
          </div>
        </div>

        <aside className="h-fit space-y-5 border border-roya-slate/20 bg-white p-6 lg:sticky lg:top-6">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-roya-slate">When</h2>
            <p className="mt-1 text-roya-ink">
              {formatEventDateLong(event.startDatetime, event.endDatetime)}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-roya-slate">Where</h2>
            {event.location ? (
              <address className="mt-1 not-italic text-roya-ink">
                {formatVenueLines(event.location).map((line: string) => (
                  <span className="block" key={line}>
                    {line}
                  </span>
                ))}
              </address>
            ) : (
              <p className="mt-1 text-roya-ink">Venue to be announced</p>
            )}
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-roya-slate">Price</h2>
            <p className="mt-1 text-2xl font-semibold text-roya-ink">{formatPrice(event.price)}</p>
            {spotsLeft && state === "open" && (
              <p className="mt-1 text-sm text-roya-slate">{spotsLeft}</p>
            )}
          </div>

          {state === "open" && (
            <Link
              className="block rounded-full bg-roya-sun px-6 py-3 text-center font-semibold text-roya-ink hover:bg-roya-ink hover:text-white"
              href={`/events/${event.slug}/checkout`}
            >
              Buy tickets
            </Link>
          )}
          {state === "sold-out" && (
            <p className="rounded-full bg-roya-ink px-6 py-3 text-center font-semibold text-white">
              Sold out
            </p>
          )}
        </aside>
      </div>
    </article>
  );
}
