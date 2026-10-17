export default function AdminBookingsLoading() {
  return (
    <section aria-busy="true" aria-label="Loading bookings">
      <p className="text-sm uppercase tracking-[0.2em] text-roya-sun-deep">
        Operations
      </p>
      <h1 className="mt-3 font-display text-5xl font-bold uppercase text-roya-ink">
        Bookings
      </h1>
      <div className="mt-8 animate-pulse space-y-4" aria-hidden="true">
        {[1, 2].map((item) => (
          <div
            className="h-48 rounded-lg border border-roya-slate/15 bg-white"
            key={item}
          />
        ))}
      </div>
    </section>
  );
}
