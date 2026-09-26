import Link from "next/link";

export default function AdminAdventuresPage() {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-roya-sun-deep">
            CMS
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold uppercase text-roya-ink">
            Adventures
          </h1>
        </div>
        <Link
          className="rounded-full bg-roya-sun px-5 py-3 text-sm font-semibold text-roya-ink hover:bg-roya-ink hover:text-white"
          href="/admin/adventures/new"
        >
          Create adventure
        </Link>
      </div>
      <div className="mt-8 bg-white p-6 text-roya-slate">
        Published and draft adventures will appear here.
      </div>
    </section>
  );
}
