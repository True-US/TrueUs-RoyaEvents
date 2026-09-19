import Image from "next/image";
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
    <div className="flex-1 bg-roya-sand">
      <header className="border-b-4 border-roya-sun bg-roya-slate">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
          <Link className="flex items-center gap-4" href="/admin">
            <Image
              alt="Roya Event & Adventure"
              className="h-14 w-auto"
              height={172}
              loading="eager"
              src="/logo-mark.png"
              width={260}
            />
            <span className="font-display text-xl font-semibold uppercase tracking-wider text-white">
              Admin
            </span>
          </Link>
          <Link
            className="font-display text-lg font-semibold uppercase tracking-wider text-white/80 hover:text-roya-sun"
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
                className="border-l-4 border-transparent px-3 py-2 text-sm font-medium text-roya-slate hover:border-roya-sun hover:bg-white hover:text-roya-ink"
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
