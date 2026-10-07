// Shown instantly while page.tsx waits for the database. Next.js wraps the
// page in a <Suspense> boundary with this as the fallback.
export default function EventsLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading events"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-10"
    >
      <div className="h-4 w-24 animate-pulse bg-roya-slate/20" />
      <div className="mt-4 h-14 max-w-xl animate-pulse bg-roya-slate/20" />
      <div className="mt-12 h-10 max-w-md animate-pulse rounded-full bg-roya-slate/10" />
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li className="border border-roya-slate/20 bg-white" key={i}>
            <div className="aspect-[2/1] animate-pulse bg-roya-slate/20" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-1/2 animate-pulse bg-roya-slate/20" />
              <div className="h-6 w-3/4 animate-pulse bg-roya-slate/20" />
              <div className="h-4 w-2/3 animate-pulse bg-roya-slate/10" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
