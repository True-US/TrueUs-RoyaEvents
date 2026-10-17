import Image from "next/image";
import Link from "next/link";

import { formatAdventurePrice, formatDuration } from "@/features/adventures/utils/format";
import type { AdventureListItem } from "@/features/adventures/types";

type AdventureCardProps = {
  adventure: AdventureListItem;
  preload?: boolean;
};

/**
 * One adventure card linking to the detail page. Same size and layout as the
 * event card so the two list pages look alike.
 * @param props.adventure The adventure to show.
 * @param props.preload Load the image early; set for cards visible without scrolling.
 * @returns The card.
 */
export function AdventureCard({ adventure, preload = false }: AdventureCardProps) {
  const duration: string | null = formatDuration(adventure.startDatetime, adventure.endDatetime);

  return (
    <Link
      className="group flex h-full w-full flex-col overflow-hidden border border-roya-slate/20 bg-white transition hover:border-roya-sun focus-visible:outline-2 focus-visible:outline-roya-sun"
      href={`/adventures/${adventure.slug}`}
    >
      <div className="relative aspect-[2/1] overflow-hidden bg-roya-slate">
        {adventure.coverUrl ? (
          <Image
            alt=""
            className="object-cover transition duration-300 group-hover:scale-105"
            fill
            preload={preload}
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
            src={adventure.coverUrl}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-2xl font-bold uppercase tracking-widest text-white/40">
            Roya
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        {/* Keeps the row's height when an adventure has no duration. */}
        <p className="min-h-[1lh] truncate text-sm font-semibold uppercase tracking-wider text-roya-sun-deep">
          {duration}
        </p>
        <h2 className="line-clamp-2 min-h-[2lh] font-display text-2xl font-bold uppercase leading-tight text-roya-ink">
          {adventure.title}
        </h2>
        <p className="truncate text-sm text-roya-slate">
          {adventure.venue ?? "Location to be announced"}
        </p>
        <p className="mt-auto pt-2 font-semibold text-roya-ink">
          {formatAdventurePrice(adventure.price)}
        </p>
      </div>
    </Link>
  );
}
