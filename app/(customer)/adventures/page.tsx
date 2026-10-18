import { PageIntro } from "@/components/ui/PageIntro";
import { AdventureCard } from "@/features/adventures/components/adventure-card";
import { getPublishedAdventures } from "@/features/adventures/server/queries";
import type { AdventureListItem } from "@/features/adventures/types";

/**
 * Public adventure list. Rendered per request so a newly published adventure
 * shows up without a rebuild.
 * @returns The page.
 */
export default async function AdventuresPage() {
  const adventures: AdventureListItem[] = await getPublishedAdventures();

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-10">
      <PageIntro
        eyebrow="Adventures"
        title="Go further, at your own pace."
        description="Explore guided adventures and send a request for a date that works for your group."
      />

      {adventures.length === 0 ? (
        <div className="mt-12 border border-dashed border-roya-slate/40 p-8 text-roya-slate">
          Adventures will appear here soon.
        </div>
      ) : (
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {adventures.map((adventure: AdventureListItem, index: number) => (
            <li key={adventure.id}>
              {/* The first row is visible on load, so start those images early. */}
              <AdventureCard adventure={adventure} preload={index < 3} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
