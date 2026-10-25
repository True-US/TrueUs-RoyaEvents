"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";

const links = [
  { href: "/events", label: "Events" },
  { href: "/adventures", label: "Adventures" },
  { href: "/custom-event", label: "Custom event" },
];

export function Header() {
  const router = useRouter();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsLoggedIn(true);
        setFirstName(user.user_metadata?.first_name ?? null);
      } else {
        setIsLoggedIn(false);
        setFirstName(null);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;

      if (user) {
        setIsLoggedIn(true);
        setFirstName(user.user_metadata?.first_name ?? null);
      } else {
        setIsLoggedIn(false);
        setFirstName(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Goes to the search page and closes the box. Navigating here instead of
   * letting the form submit: closing the box unmounts the form, which would
   * cancel a native submit.
   * @param event The form submit event.
   */
  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    const term: string = String(
      new FormData(event.currentTarget).get("q") ?? "",
    ).trim();
    if (!term) {
      return;
    }

    setIsSearchOpen(false);
    setIsMenuOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  async function handleLogout() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error.message);
      return;
    }

    setIsLoggedIn(false);
    setFirstName(null);
    setIsMenuOpen(false);

    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b-4 border-roya-sun bg-roya-slate">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-2 sm:px-10 md:gap-x-10">
        <Link href="/">
          <Image
            alt="Roya Event & Adventure"
            className="h-16 w-auto"
            height={172}
            priority
            src="/logo-mark.png"
            width={260}
          />
        </Link>
        <button
          aria-controls="mobile-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="ml-auto text-white hover:text-roya-sun md:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="28"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="28"
          >
            {isMenuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        {isMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="flex basis-full flex-col font-display text-lg font-semibold uppercase tracking-wider text-white/80 md:hidden"
            id="mobile-menu"
          >
            <form
              action="/search"
              className="pb-3 normal-case"
              onSubmit={handleSearchSubmit}
              role="search"
            >
              <input
                aria-label="Search events and adventures"
                className="w-full border border-white/30 bg-transparent px-3 py-2 text-base font-normal tracking-normal text-white placeholder:text-white/50 focus:border-roya-sun focus:outline-none"
                maxLength={100}
                name="q"
                placeholder="Search..."
                type="search"
              />
            </form>
            {links.map((link) => (
              <Link
                className="border-t border-white/10 py-3 hover:text-roya-sun"
                href={link.href}
                key={link.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <>
                <Link
                  className="border-t border-white/10 py-3 hover:text-roya-sun"
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <span className="border-t border-white/10 py-3 text-roya-sun">
                  Hi, {firstName ?? "User"}
                </span>
                <button
                  className="border-t border-white/10 py-3 text-left hover:text-roya-sun"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                className="border-t border-white/10 py-3 hover:text-roya-sun"
                href="/login"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </nav>
        )}
        <nav
          aria-label="Primary navigation"
          className="hidden flex-1 items-center gap-5 font-display text-lg font-semibold uppercase tracking-wider text-white/80 md:flex"
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
          <div className="ml-auto flex items-center gap-5">
            {isSearchOpen ? (
              <form
                action="/search"
                className="flex items-center normal-case"
                onSubmit={handleSearchSubmit}
                role="search"
              >
                <input
                  aria-label="Search events and adventures"
                  autoFocus
                  className="w-40 border border-white/30 bg-transparent px-3 py-1 text-base font-normal tracking-normal text-white placeholder:text-white/50 focus:border-roya-sun focus:outline-none sm:w-52"
                  maxLength={100}
                  name="q"
                  onBlur={(event) => {
                    if (!event.currentTarget.value) {
                      setIsSearchOpen(false);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setIsSearchOpen(false);
                    }
                  }}
                  placeholder="Search..."
                  type="search"
                />
              </form>
            ) : (
              <button
                aria-label="Open search"
                className="hover:text-roya-sun"
                onClick={() => setIsSearchOpen(true)}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="22"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="22"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </button>
            )}
            {isLoggedIn ? (
              <>
                <Link className="hover:text-roya-sun" href="/dashboard">
                  Dashboard
                </Link>
                <span className="text-roya-sun">Hi, {firstName ?? "User"}</span>

                <button
                  className="hover:text-roya-sun"
                  onClick={handleLogout}
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link className="hover:text-roya-sun" href="/login">
                Login
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
