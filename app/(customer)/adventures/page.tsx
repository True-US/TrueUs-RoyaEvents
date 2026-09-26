import Link from "next/link";

import { PageIntro } from "@/components/ui/PageIntro";
import { getPublishedAdventures } from "@/features/adventures/queries";

//TODO: 
// - Documantation.
// - type.
export default async function AdventuresPage() {
  const adventures = await getPublishedAdventures();

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
      <PageIntro
        eyebrow="Adventures"
        title="Go further, at your own pace."
        description="Explore guided adventures and send a request for a date that works for your group."
      />
      {adventures.length === 0 ? (
        <div className="mt-14 border border-dashed border-roya-slate/40 p-8 text-roya-slate">
          Adventures will appear here soon.
        </div>
      ) : (
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {adventures.map((adventure) => (
            <Link
              className="border border-roya-slate/20 p-6 hover:border-roya-sun"
              href={`/adventures/${adventure.slug}`}
              key={adventure.id}
            >
              <h2 className="font-display text-3xl font-bold uppercase">{adventure.title}</h2>
              <p className="mt-3 text-roya-slate">{adventure.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
