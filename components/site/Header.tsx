"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

const links = [
  { href: "/adventures", label: "Adventures" },
  { href: "/custom-event", label: "Custom event" },
  { href: "/events", label: "Events" },
  { href: "/tickets", label: "Tickets" },
];

export function Header() {
  const router = useRouter();

  const [firstName, setFirstName] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

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

      setLoading(false);
    }

    loadUser();

    // Automatically update the header when login/logout happens
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

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
          {!loading &&
            (isLoggedIn ? (
              <>
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
            ))}
        </nav>
      </div>
    </header>
  );
}
