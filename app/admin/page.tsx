export default function AdminDashboardPage() {
  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
        Admin workspace
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
        Content overview
      </h1>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Events", "Adventures", "Bookings", "Inquiries"].map((label) => (
          <div className="bg-white p-5" key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">0</p>
          </div>
        ))}
      </div>
    </section>
  );
}
