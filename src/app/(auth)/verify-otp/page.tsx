"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, KeyRound, Mail, RefreshCw } from "lucide-react";
import { resendVerification, verifyEmail } from "@/lib/auth";
import { ApiRequestError } from "@/lib/api";
import { Alert, Button, Input, Label } from "@/components/ui";

function VerifyOtpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const emailFromQuery = params.get("email") ?? "";

  const [emailValue, setEmailValue] = useState(emailFromQuery);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);

    try {
      await verifyEmail({
        email: String(form.get("email")).trim(),
        otp: String(form.get("otp")).trim(),
      });
      router.push("/login?verified=1");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Invalid or expired code. Please try again.",
      );
      setSubmitting(false);
    }
  }

  async function onResend() {
    const targetEmail = emailValue.trim();
    if (!targetEmail) {
      setError("Please provide your email address first.");
      return;
    }
    setError(null);
    setResending(true);
    try {
      const res = await resendVerification(targetEmail);
      setInfo(res.message || "A new 6-digit verification code has been sent to your email.");
    } catch {
      setError("Could not resend the code. Please wait a moment and try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Security Verification</span>
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-0.5">Check your inbox</h1>
        <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
          We sent a 6-digit confirmation code to your email. The code remains active for 10 minutes.
        </p>
      </div>

      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}
      {info && <div className="mb-4"><Alert kind="success">{info}</Alert></div>}

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
              placeholder="name@example.com"
              className="pl-10 h-11 rounded-2xl text-sm"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="otp" className="text-xs font-bold text-ink">6-Digit Verification Code</Label>
          <div className="mt-1">
            <Input
              id="otp"
              name="otp"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              placeholder="••••••"
              className="h-14 tracking-[0.6em] text-center font-black text-xl text-primary rounded-2xl border-line focus:ring-4 focus:ring-primary/20"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>
          <p className="text-[11px] text-muted mt-1.5 text-center">
            Enter the 6 numbers without spaces or hyphens.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            full
            size="lg"
            disabled={submitting}
            className="h-12 rounded-2xl font-extrabold text-sm shadow-soft transition-all"
          >
            {submitting ? "Verifying code…" : "Confirm Code & Continue →"}
          </Button>
        </div>
      </form>

      {/* Resend actions */}
      <div className="mt-6 pt-5 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-muted">Didn&apos;t get the code in your inbox?</span>
        <button
          type="button"
          disabled={resending}
          onClick={onResend}
          className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${resending ? "animate-spin" : ""}`} />
          {resending ? "Resending code…" : "Resend code"}
        </button>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
