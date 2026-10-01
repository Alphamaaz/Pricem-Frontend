"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, Phone, ShieldCheck, User as UserIcon } from "lucide-react";
import { register } from "@/lib/auth";
import { ApiRequestError } from "@/lib/api";
import { Alert, Button, Input, Label } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));
    const confirmPassword = String(form.get("confirmPassword"));

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      setError("Please make sure both passwords match.");
      return;
    }

    if (password.length < 6) {
      setFieldErrors({ password: "Password must be at least 6 characters." });
      return;
    }

    setSubmitting(true);

    try {
      await register({
        fullName: String(form.get("fullName")).trim(),
        email,
        contactNumber: String(form.get("contactNumber")).trim(),
        password,
      });
      // Registered (or unverified re-register) → both paths need OTP entry
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.errors?.length) {
          setFieldErrors(
            Object.fromEntries(err.errors.map((e) => [e.field, e.message])),
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please check your inputs and try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Join Pricem Nigeria</span>
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-0.5">Create your account</h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Start bargaining prices, ordering items, or opening your own verified merchant store.
        </p>
      </div>

      {error && <div className="mb-5"><Alert kind="error">{error}</Alert></div>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-xs font-bold text-ink">Full name</Label>
          <div className="relative mt-1">
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <Input
              id="fullName"
              name="fullName"
              required
              autoComplete="name"
              placeholder="e.g. Adebayo Johnson"
              className="pl-10 h-11 rounded-2xl text-sm"
            />
          </div>
          {fieldErrors.fullName && (
            <p className="text-xs text-danger mt-1 font-medium">{fieldErrors.fullName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="text-xs font-bold text-ink">Email address</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="adebayo@example.com"
              className="pl-10 h-11 rounded-2xl text-sm"
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-danger mt-1 font-medium">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="contactNumber" className="text-xs font-bold text-ink">Nigerian Phone number</Label>
          <div className="relative mt-1">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <Input
              id="contactNumber"
              name="contactNumber"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+234 801 234 5678"
              className="pl-10 h-11 rounded-2xl text-sm"
            />
          </div>
          {fieldErrors.contactNumber && (
            <p className="text-xs text-danger mt-1 font-medium">{fieldErrors.contactNumber}</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5">
          <div>
            <Label htmlFor="password" className="text-xs font-bold text-ink">Password</Label>
            <div className="mt-1">
              <PasswordInput
                id="password"
                name="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Min 6 characters"
                className="h-11 rounded-2xl text-sm"
              />
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-danger mt-1 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-xs font-bold text-ink">Confirm password</Label>
            <div className="mt-1">
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Repeat password"
                className="h-11 rounded-2xl text-sm"
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-danger mt-1 font-medium">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-sunken/60 border border-line p-3 text-[11px] text-muted leading-relaxed flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            By signing up, you agree to Pricem Marketplace terms, fair bargaining standards, and safe delivery guidelines.
          </span>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            full
            size="lg"
            disabled={submitting}
            className="h-12 rounded-2xl font-extrabold text-sm shadow-soft transition-all"
          >
            {submitting ? (
              "Creating account…"
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Create Account & Continue
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-line text-center">
        <p className="text-xs sm:text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-extrabold text-primary hover:underline">
            Log in here →
          </Link>
        </p>
      </div>
    </div>
  );
}
