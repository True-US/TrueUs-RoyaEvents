"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { FieldError, FormError } from "@/components/ui/form-feedback";
import { EMAIL_MAX, PASSWORD_MAX, PERSON_NAME_MAX, PHONE_MAX } from "@/features/auth/constants";
import { signupSchema, type SignupInput } from "@/features/auth/schemas";
import { getFieldErrors } from "@/lib/validation/errors";
import { msg } from "@/lib/validation/messages";

import { signup } from "../api";

const initialValues: SignupInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

const inputClass: string = "w-full rounded-md border px-3 py-2";
const invalidClass: string = "w-full rounded-md border border-red-500 px-3 py-2";

export function SignupForm() {
  const router = useRouter();

  const [values, setValues] = useState<SignupInput>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Updates one field and clears its error.
   * @param name The field's name in the form values.
   * @param value The new text.
   */
  function updateField(name: keyof SignupInput, value: string): void {
    setValues((current: SignupInput) => ({ ...current, [name]: value }));
    setFieldErrors((current: Record<string, string>) => {
      const next: Record<string, string> = { ...current };
      delete next[name];
      return next;
    });
  }

  /**
   * Props shared by every input: the error styling and its aria link.
   * @param name The field's name in the form values.
   * @returns The className and aria attributes.
   */
  function fieldProps(name: keyof SignupInput) {
    return {
      className: fieldErrors[name] ? invalidClass : inputClass,
      "aria-invalid": Boolean(fieldErrors[name]),
      "aria-describedby": fieldErrors[name] ? `${name}-error` : undefined,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const parsed: ReturnType<typeof signupSchema.safeParse> = signupSchema.safeParse(values);
    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      setError(msg.fixFields);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await signup(values);

      // Account created successfully
      setValues(initialValues);

      // Redirect to login page
      router.replace("/login");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : msg.unableTo("create the account"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold">Create your account</h1>

        <p className="mt-2 text-gray-600">Join Roya Events & Adventures</p>
      </div>

      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="mb-1 block text-sm font-medium"
            >
              First name
            </label>

            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              maxLength={PERSON_NAME_MAX}
              value={values.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              required
              {...fieldProps("firstName")}
            />
            <FieldError id="firstName-error" message={fieldErrors.firstName} />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="mb-1 block text-sm font-medium"
            >
              Last name
            </label>

            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              maxLength={PERSON_NAME_MAX}
              value={values.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              required
              {...fieldProps("lastName")}
            />
            <FieldError id="lastName-error" message={fieldErrors.lastName} />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            maxLength={EMAIL_MAX}
            value={values.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
            {...fieldProps("email")}
          />
          <FieldError id="email-error" message={fieldErrors.email} />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            Phone (optional)
          </label>

          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            maxLength={PHONE_MAX}
            placeholder="(780) 555-0123"
            value={values.phone ?? ""}
            onChange={(e) => updateField("phone", e.target.value)}
            {...fieldProps("phone")}
          />
          <FieldError id="phone-error" message={fieldErrors.phone} />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>

          <input
            id="password"
            type="password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX}
            value={values.password}
            onChange={(e) => updateField("password", e.target.value)}
            required
            {...fieldProps("password")}
          />
          <FieldError id="password-error" message={fieldErrors.password} />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1 block text-sm font-medium"
          >
            Confirm password
          </label>

          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            maxLength={PASSWORD_MAX}
            value={values.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            required
            {...fieldProps("confirmPassword")}
          />
          <FieldError id="confirmPassword-error" message={fieldErrors.confirmPassword} />
        </div>

        <FormError message={error} />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black px-4 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
