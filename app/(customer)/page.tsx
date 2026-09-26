import Link from "next/link";

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
      <section className="bg-roya-slate">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:py-28">
          <div className="max-w-3xl">
            <p className="mb-5 font-display text-lg font-semibold uppercase tracking-[0.25em] text-roya-sun">
              Roya Events &amp; Adventures
            </p>
            <h1 className="font-display text-6xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-8xl">
              Make room for the <span className="text-roya-sun">experience.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/80">
              Discover public events and guided adventures, or work with our
              team to create something personal.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                className="rounded-full bg-roya-sun px-6 py-3 font-semibold text-roya-ink hover:bg-white"
                href="/events"
              >
                Explore events
              </Link>
              <Link
                className="rounded-full border border-white/60 px-6 py-3 font-semibold text-white hover:border-roya-sun hover:text-roya-sun"
                href="/custom-event"
              >
                Plan something custom
              </Link>
            </div>
          </div>
        </div>
      </section>
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
