import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicAdventureBySlug } from "@/features/adventures/server/queries";
import type { AdventureDetail } from "@/features/adventures/types";
import { formatAdventurePrice, formatDuration } from "@/features/adventures/utils/format";
import { formatVenueLines } from "@/features/events/utils/format";

/**
 * Sets the browser tab title and the link preview for the adventure.
 * @param props.params The route params: slug.
 * @returns The page metadata.
 */
export async function generateMetadata({
  params,
}: PageProps<"/adventures/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  // Same call as the page below; cache() runs the query only once.
  const adventure: AdventureDetail | null = await getPublicAdventureBySlug(slug);
  if (!adventure) {
    return { title: "Adventure not found" };
  }

  return {
    title: adventure.title,
    description: adventure.shortDescription ?? undefined,
    openGraph: { images: adventure.coverUrl ? [adventure.coverUrl] : [] },
  };
}

/**
 * Public adventure detail page. Unknown slugs, unpublished or inactive
 * adventures, and events show the 404 page.
 * @param props.params The route params: slug.
 * @returns The page.
 */
export default async function AdventureDetailsPage({
  params,
}: PageProps<"/adventures/[slug]">) {
  const { slug } = await params;
  const adventure: AdventureDetail | null = await getPublicAdventureBySlug(slug);
  if (!adventure) {
    notFound();
  }

  const duration: string | null = formatDuration(adventure.startDatetime, adventure.endDatetime);

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:px-10">
      <Link className="text-sm font-semibold text-roya-slate hover:text-roya-ink" href="/adventures">
        ← All adventures
      </Link>

      <div className="relative mt-6 aspect-[2/1] overflow-hidden bg-roya-slate">
        {adventure.coverUrl ? (
          <Image
            alt=""
            className="object-cover"
            fill
            preload
            sizes="(min-width: 1152px) 1088px, 100vw"
            src={adventure.coverUrl}
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl font-bold uppercase tracking-widest text-white/40">
            Roya
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-roya-sun-deep">
            Adventure
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold uppercase leading-none tracking-tight text-roya-ink">
            {adventure.title}
          </h1>
          {adventure.shortDescription && (
            <p className="mt-5 text-lg leading-8 text-roya-slate">{adventure.shortDescription}</p>
          )}
          {/* whitespace-pre-line keeps the paragraphs typed into the description. */}
          <div className="mt-8 whitespace-pre-line leading-7 text-roya-ink">
            {adventure.description ?? "More details coming soon."}
          </div>
        </div>

        <aside className="h-fit space-y-5 border border-roya-slate/20 bg-white p-6 lg:sticky lg:top-6">
          {duration && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-roya-slate">Duration</h2>
              <p className="mt-1 text-roya-ink">{duration}</p>
            </div>
          )}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-roya-slate">Where</h2>
            {adventure.location ? (
              <address className="mt-1 not-italic text-roya-ink">
                {formatVenueLines(adventure.location).map((line: string) => (
                  <span className="block" key={line}>
                    {line}
                  </span>
                ))}
              </address>
            ) : (
              <p className="mt-1 text-roya-ink">Location to be announced</p>
            )}
          </div>

          {adventure.capacity !== null && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-roya-slate">Group size</h2>
              <p className="mt-1 text-roya-ink">Up to {adventure.capacity} guests</p>
            </div>
          )}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-roya-slate">Price</h2>
            <p className="mt-1 text-2xl font-semibold text-roya-ink">
              {formatAdventurePrice(adventure.price)}
            </p>
          </div>

          <Link
            className="block rounded-full bg-roya-sun px-6 py-3 text-center font-semibold text-roya-ink hover:bg-roya-ink hover:text-white"
            href={`/adventures/${adventure.slug}/book`}
          >
            Request a date
          </Link>
        </aside>
      </div>
    </article>
  );
}
