import Link from "next/link";

const pathways = [
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
    <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:py-28">
      <div className="max-w-3xl">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
          Roya Events & Adventures
        </p>
        <h1 className="text-5xl font-semibold tracking-tight text-slate-950 sm:text-7xl">
          Make room for the experience.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
          Discover public events and guided adventures, or work with our team to
          create something personal.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            className="rounded-full bg-slate-950 px-6 py-3 font-medium text-white hover:bg-slate-800"
            href="/events"
          >
            Explore events
          </Link>
          <Link
            className="rounded-full border border-slate-300 px-6 py-3 font-medium text-slate-800 hover:border-slate-950"
            href="/custom-event"
          >
            Plan something custom
          </Link>
        </div>
      </div>
      <div className="mt-24 grid gap-5 md:grid-cols-2">
        {pathways.map((pathway) => (
          <Link
            className="border-t-2 border-amber-500 pt-5"
            href={pathway.href}
            key={pathway.href}
          >
            <h2 className="text-2xl font-semibold text-slate-950">
              {pathway.title}
            </h2>
            <p className="mt-3 max-w-md leading-7 text-slate-600">
              {pathway.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
