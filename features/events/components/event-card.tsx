import Image from "next/image";
import Link from "next/link";

import {
  formatEventDate,
  formatPrice,
  getEventBadge,
  type EventBadge,
} from "@/features/events/format";
import type { EventListItem } from "@/features/events/types";

// Badge colours by tone.
const badgeStyles: Record<EventBadge["tone"], string> = {
  "sold-out": "bg-roya-ink text-white",
  low: "bg-roya-sun text-roya-ink",
  live: "bg-white text-roya-ink",
};

type EventCardProps = {
  event: EventListItem;
  preload?: boolean;
};

/**
 * One event card linking to the detail page. Every card has the same size:
 * full width of its grid cell, fixed image ratio, and text rows that reserve
 * the same height whatever their content.
 * @param props.event The event to show.
 * @param props.preload Load the image early; set for cards visible without scrolling.
 * @returns The card.
 */
export function EventCard({ event, preload = false }: EventCardProps) {
  const badge: EventBadge | null = getEventBadge(event);

  return (
    <Link
      className="group flex h-full w-full flex-col overflow-hidden border border-roya-slate/20 bg-white transition hover:border-roya-sun focus-visible:outline-2 focus-visible:outline-roya-sun"
      href={`/events/${event.slug}`}
    >
      <div className="relative aspect-[2/1] overflow-hidden bg-roya-slate">
        {event.coverUrl ? (
          <Image
            alt=""
            className="object-cover transition duration-300 group-hover:scale-105"
            fill
            preload={preload}
            // Image width at each breakpoint, so phones download a small file.
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
            src={event.coverUrl}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-2xl font-bold uppercase tracking-widest text-white/40">
            Roya
          </div>
        )}
        {badge && (
          <span
            className={`absolute left-3 top-3 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${badgeStyles[badge.tone]}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="truncate text-sm font-semibold uppercase tracking-wider text-roya-sun-deep">
          {formatEventDate(event.startDatetime, event.endDatetime)}
        </p>
        {/* Always two lines tall: long titles are cut with "…", short ones keep the space. */}
        <h2 className="line-clamp-2 min-h-[2lh] font-display text-2xl font-bold uppercase leading-tight text-roya-ink">
          {event.title}
        </h2>
        <p className="truncate text-sm text-roya-slate">
          {event.venue ?? "Venue to be announced"}
        </p>
        <p className="mt-auto pt-2 font-semibold text-roya-ink">
          {formatPrice(event.price)}
        </p>
      </div>
    </Link>
  );
}
