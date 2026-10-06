"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, KeyRound, Mail } from "lucide-react";
import { forgotPassword } from "@/lib/auth";
import { Alert, Button, Input, Label } from "@/components/ui";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();

    try {
      await forgotPassword(email);
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Something went wrong. Please check your email and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Password Recovery</span>
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-0.5">Reset your password</h1>
        <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
          Enter the email associated with your PriceAm account. We&apos;ll send you a 6-digit verification code to reset your password.
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
              autoComplete="email"
              placeholder="name@example.com"
              className="pl-10 h-11 rounded-2xl text-sm"
              autoFocus
            />
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
              "Sending reset code…"
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Send 6-Digit Code
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-line text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Remember your password? Return to login
        </Link>
      </div>
    </div>
  );
}
