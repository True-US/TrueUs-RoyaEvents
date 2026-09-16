import Link from "next/link";

export default function AdminEventsPage() {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-amber-700">
            CMS
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">Events</h1>
        </div>
        <Link
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
          href="/admin/events/new"
        >
          Create event
        </Link>
      </div>
      <div className="mt-8 bg-white p-6 text-slate-600">
        Published and draft events will appear here.
      </div>
    </section>
  );
}
