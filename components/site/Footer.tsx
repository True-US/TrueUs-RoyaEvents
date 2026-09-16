import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-10 text-sm sm:px-10 md:flex-row md:items-center md:justify-between">
        <p>Roya Events & Adventures</p>
        <div className="flex gap-5">
          <Link href="/private-adventure">Private adventure</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
