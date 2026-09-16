import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/adventures", label: "Adventures" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/gallery", label: "Gallery" },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-full bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link className="font-semibold text-slate-950" href="/admin">
            Roya Admin
          </Link>
          <Link
            className="text-sm text-slate-600 hover:text-slate-950"
            href="/"
          >
            View website
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <nav aria-label="Admin navigation" className="grid gap-1">
            {adminLinks.map((link) => (
              <Link
                className="px-3 py-2 text-sm text-slate-600 hover:bg-white hover:text-slate-950"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
