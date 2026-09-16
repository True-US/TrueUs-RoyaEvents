import Link from "next/link";

const links = [
  { href: "/adventures", label: "Adventures" },
  { href: "/custom-event", label: "Custom event" },
  { href: "/events", label: "Events" },
  { href: "/tickets", label: "Tickets" },
];

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10">
        <Link
          className="text-lg font-semibold tracking-tight text-slate-950"
          href="/"
        >
          Roya
        </Link>
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-5 text-sm text-slate-600"
        >
          {links.map((link) => (
            <Link
              className="hover:text-slate-950"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
