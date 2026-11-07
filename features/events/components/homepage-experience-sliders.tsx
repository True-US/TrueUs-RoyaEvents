"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import {
  formatEventDate,
  formatPrice,
} from "@/features/events/utils/format";

import type { EventListItem } from "@/features/events/types";

type ExperienceRowProps = {
  title: string;
  description: string;
  items: EventListItem[];
  hrefPrefix: string;
  viewAllHref: string;
};

function ExperienceRow({
  title,
  description,
  items,
  hrefPrefix,
  viewAllHref,
}: ExperienceRowProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  function scrollSlider(direction: number) {
    const slider = sliderRef.current;

    if (!slider) return;

    slider.scrollBy({
      left: direction * slider.clientWidth * 0.8,
      behavior: "smooth",
    });
  }

  return (
    <section className="pt-0 pb-4">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-roya-sun-deep">
            Discover ROYA
          </p>

          <h2 className="font-display text-4xl font-bold uppercase text-roya-ink sm:text-5xl">
            {title}
          </h2>

          <p className="mt-2 text-roya-slate">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={viewAllHref}
            className="mr-2 text-sm font-semibold uppercase tracking-wider text-roya-slate transition hover:text-roya-sun-deep"
          >
            View all
          </Link>

          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => scrollSlider(-1)}
            className="flex h-10 w-10 items-center justify-center border border-roya-slate/30 text-xl text-roya-ink transition hover:border-roya-sun hover:bg-roya-sun"
          >
            &#8592;
          </button>

          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => scrollSlider(1)}
            className="flex h-10 w-10 items-center justify-center border border-roya-slate/30 text-xl text-roya-ink transition hover:border-roya-sun hover:bg-roya-sun"
          >
            &#8594;
          </button>
        </div>
      </div>

      {items.length > 0 ? (
        <div
          ref={sliderRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={`${hrefPrefix}/${item.slug}`}
              className="group w-[85%] min-w-[280px] max-w-[380px] shrink-0 snap-start overflow-hidden border border-roya-slate/20 bg-white transition hover:border-roya-sun hover:shadow-md sm:w-[48%] lg:w-[32%]"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-roya-slate">
                {item.coverUrl ? (
                  <Image
                    src={item.coverUrl}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 48vw, 85vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-roya-slate-deep px-4 text-center font-display text-lg font-bold uppercase tracking-widest text-white">
                    ROYA Events &amp; Adventures
                  </div>
                )}
              </div>

              <div className="flex min-h-[180px] flex-col p-5">
                <p className="text-sm font-semibold uppercase tracking-wider text-roya-sun-deep">
                  {formatEventDate(item.startDatetime, item.endDatetime)}
                </p>

                <h3 className="mt-2 line-clamp-2 font-display text-2xl font-bold uppercase leading-tight text-roya-ink">
                  {item.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-roya-slate">
                  {item.shortDescription || "Discover this ROYA experience."}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="font-semibold text-roya-ink">
                    {formatPrice(item.price)}
                  </span>

                  <span className="text-sm font-semibold uppercase tracking-wider text-roya-sun-deep transition group-hover:translate-x-1">
                    Explore &#8594;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-roya-slate/20 bg-white px-6 py-6 text-center">
          <p className="text-roya-slate">
            New experiences are coming soon. Please check back later.
          </p>
        </div>
      )}
    </section>
  );
}

type HomepageExperienceSlidersProps = {
  events: EventListItem[];
  adventures: EventListItem[];
};

export default function HomepageExperienceSliders({
  events,
  adventures,
}: HomepageExperienceSlidersProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-0 sm:px-10">
      <ExperienceRow
        title="Upcoming Events"
        description="Find your next event and make unforgettable memories."
        items={events}
        hrefPrefix="/events"
        viewAllHref="/events"
      />

      <div className="border-t border-roya-slate/20" />

      <ExperienceRow
        title="Explore Adventures"
        description="Discover new places and experiences across Alberta."
        items={adventures}
        hrefPrefix="/adventures"
        viewAllHref="/adventures"
      />
    </div>
  );
}