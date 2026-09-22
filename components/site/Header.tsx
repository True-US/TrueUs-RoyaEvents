import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/adventures", label: "Adventures" },
  { href: "/custom-event", label: "Custom event" },
  { href: "/events", label: "Events" },
  { href: "/tickets", label: "Tickets" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b-4 border-roya-sun bg-roya-slate">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-2 sm:px-10">
        <Link href="/">
          <Image
            alt="Roya Event & Adventure"
            className="h-16 w-auto"
            height={172}
            loading="eager"
            src="/logo-mark.png"
            width={260}
          />
        </Link>
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-5 font-display text-lg font-semibold uppercase tracking-wider text-white/80"
        >
          {links.map((link) => (
            <Link
              className="hover:text-roya-sun"
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
