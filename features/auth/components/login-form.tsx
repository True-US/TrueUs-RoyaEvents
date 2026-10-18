"use client";

import { createClient } from "@/lib/supabase/browser";
import { FieldError, FormError } from "@/components/ui/form-feedback";
import { checkActiveProfileForLogin } from "@/features/auth/actions";
import { EMAIL_MAX, PASSWORD_MAX } from "@/features/auth/constants";
import { loginSchema } from "@/features/auth/schemas";
import { getFieldErrors } from "@/lib/validation/errors";
import { msg } from "@/lib/validation/messages";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

/**
 * Turns a Supabase sign-in error into our own wording.
 * @param code The error's code, e.g. "invalid_credentials".
 * @returns The message to show.
 */
function getSignInErrorMessage(code: string | undefined): string {
  if (code === "invalid_credentials") {
    return "Email or password is incorrect.";
  }
  if (code === "email_not_confirmed") {
    return "Confirm your email before logging in.";
  }

  return msg.unableTo("log in");
}

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Check if user is already logged in
  useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const profileStatus = await checkActiveProfileForLogin();

          if (profileStatus.isActive) {
            router.replace("/");
            return;
          }

          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) throw signOutError;
          setError(profileStatus.message);
        }
      } catch (authError) {
        await supabase.auth.signOut();
        console.error("Login: could not verify account status:", authError);
        setError(msg.unableTo("verify your account"));
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const parsed: ReturnType<typeof loginSchema.safeParse> = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      return;
    }

    setFieldErrors({});
    setLoading(true);
    const supabase = createClient();

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });

      if (signInError) {
        setError(getSignInErrorMessage(signInError.code));
        return;
      }

      if (!data.user) {
        setError(msg.unableTo("log in"));
        return;
      }

      const profileStatus = await checkActiveProfileForLogin();
      if (!profileStatus.isActive) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
        setError(profileStatus.message);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      await supabase.auth.signOut();
      console.error("Login error:", err);
      setError(msg.unableTo("log in"));
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 py-16">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-3xl font-bold text-slate-900">Login</h1>

        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="email"
            >
              Email
            </label>

            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
              id="email"
              autoComplete="email"
              maxLength={EMAIL_MAX}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldErrors((current) => ({ ...current, email: "" }));
              }}
              placeholder="you@example.com"
              type="email"
              value={email}
              required
            />
            <FieldError id="email-error" message={fieldErrors.email} />
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="password"
            >
              Password
            </label>

            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-500"
              id="password"
              autoComplete="current-password"
              maxLength={PASSWORD_MAX}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              onChange={(event) => {
                setPassword(event.target.value);
                setFieldErrors((current) => ({ ...current, password: "" }));
              }}
              placeholder="••••••••"
              type="password"
              value={password}
              required
            />
            <FieldError id="password-error" message={fieldErrors.password} />
          </div>

          <FormError message={error} />

          <button
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            className="font-semibold text-slate-900 underline"
            href="/signup"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
