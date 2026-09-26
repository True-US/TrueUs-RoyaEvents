import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-4 border-roya-sun bg-roya-slate text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3 text-sm sm:px-10 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Image
            alt="Roya Event & Adventure"
            className="h-10 w-auto"
            height={172}
            src="/logo-mark.png"
            width={260}
          />
          <p>&copy; Roya Events &amp; Adventures</p>
        </div>
        <div className="flex gap-6 font-display text-base font-semibold uppercase tracking-wider">
          <Link className="hover:text-roya-sun" href="/private-adventure">
            Private adventure
          </Link>
          <Link className="hover:text-roya-sun" href="/contact">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
