import Link from "next/link";

import HomeHero from "@/components/site/HomeHero";

const pathways: { title: string; description: string; href: string }[] = [
  {
    title: "Public events",
    description:
      "Join thoughtfully planned experiences with a shared sense of place.",
    href: "/events",
  },
  {
    title: "Guided adventures",
    description:
      "Choose an adventure, find a suitable date, and send your request.",
    href: "/adventures",
  },
];

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:py-20">
        <div className="grid gap-5 md:grid-cols-2">
          {pathways.map((pathway) => (
            <Link
              className="border-t-4 border-roya-sun bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              href={pathway.href}
              key={pathway.href}
            >
              <h2 className="font-display text-3xl font-bold uppercase text-roya-ink">
                {pathway.title}
              </h2>
              <p className="mt-3 max-w-md leading-7 text-roya-slate">
                {pathway.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
