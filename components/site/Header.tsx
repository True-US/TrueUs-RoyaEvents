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
  { href: "/tickets", label: "Tickets" },
];

export function Header() {
  const router = useRouter();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

    const term: string = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    if (!term) {
      return;
    }

    setIsSearchOpen(false);
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

    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b-4 border-roya-sun bg-roya-slate">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 gap-y-2 px-6 py-2 sm:px-10">
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
        <nav
          aria-label="Primary navigation"
          className="flex flex-1 items-center gap-5 font-display text-lg font-semibold uppercase tracking-wider text-white/80"
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
