"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, KeyRound, Mail } from "lucide-react";
import { resetPassword } from "@/lib/auth";
import { ApiRequestError } from "@/lib/api";
import { Alert, Button, Input, Label } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const emailFromQuery = params.get("email") ?? "";

  const [emailValue, setEmailValue] = useState(emailFromQuery);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    const confirmPassword = String(form.get("confirmPassword"));

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please enter the same new password in both fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword({
        email: emailValue.trim(),
        otp: String(form.get("otp")).trim(),
        password,
      });
      router.push("/login?reset=1");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Invalid or expired code. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Set New Password</span>
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-0.5">Reset your password</h1>
        <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
          Enter the 6-digit code sent to your email and select your new password.
        </p>
      </div>

      {error && <div className="mb-5"><Alert kind="error">{error}</Alert></div>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-xs font-bold text-ink">Account email</Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              autoComplete="email"
              className="pl-10 h-11 rounded-2xl text-sm"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="otp" className="text-xs font-bold text-ink">6-Digit Reset Code</Label>
          <div className="mt-1">
            <Input
              id="otp"
              name="otp"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              placeholder="••••••"
              className="h-12 tracking-[0.5em] text-center font-black text-lg text-primary rounded-2xl border-line"
              autoComplete="one-time-code"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3.5">
          <div>
            <Label htmlFor="password" className="text-xs font-bold text-ink">New password</Label>
            <div className="mt-1">
              <PasswordInput
                id="password"
                name="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Min 6 chars"
                className="h-11 rounded-2xl text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-xs font-bold text-ink">Confirm new password</Label>
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
          </div>
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
              "Updating password…"
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Save New Password & Log In
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-line text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
