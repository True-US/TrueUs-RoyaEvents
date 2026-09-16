import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdventureBySlug } from "@/features/adventures/queries";

export default async function AdventureDetailsPage({
  params,
}: PageProps<"/adventures/[slug]">) {
  const { slug } = await params;
  const adventure = await getAdventureBySlug(slug);

  if (!adventure) notFound();

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 sm:px-10">
      <p className="text-sm uppercase tracking-[0.2em] text-amber-700">
        Adventure details
      </p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight text-slate-950">
        {adventure.title}
      </h1>
      <p className="mt-6 text-lg leading-8 text-slate-600">
        {adventure.summary}
      </p>
      <Link
        className="mt-8 inline-block rounded-full bg-slate-950 px-6 py-3 font-medium text-white"
        href={`/adventures/${adventure.slug}/book`}
      >
        Request a date
      </Link>
    </section>
  );
}
