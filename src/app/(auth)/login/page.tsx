"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { login } from "@/lib/auth";
import { ApiRequestError } from "@/lib/api";
import { Alert, Button, Input, Label } from "@/components/ui";
import { PasswordInput } from "@/components/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("verified") === "1";
  const justReset = searchParams.get("reset") === "1";

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();

    try {
      const response = await login({ email, password: String(form.get("password")) });
      router.replace(response.user.roles.includes("admin") ? "/admin" : "/");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        // Unverified account → send them to OTP entry
        if (err.status === 403 && /verify/i.test(err.message)) {
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
          return;
        }
        setError(err.message);
      } else {
        setError("Something went wrong. Please check your credentials and try again.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Account Access</span>
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-0.5">Welcome back</h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Log in to manage your bargain offers, track deliveries, or access your store.
        </p>
      </div>

      {justVerified && (
        <div className="mb-5 rounded-2xl bg-success-soft border border-success/30 p-3.5 text-xs text-success font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Email successfully verified! You can now log in to your account.</span>
        </div>
      )}

      {justReset && (
        <div className="mb-5 rounded-2xl bg-success-soft border border-success/30 p-3.5 text-xs text-success font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Your password was reset successfully. Please log in with your new password.</span>
        </div>
      )}

      {error && <div className="mb-5"><Alert kind="error">{error}</Alert></div>}

      <form onSubmit={onSubmit} className="space-y-4">
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
              placeholder="name@example.com"
              className="pl-10 h-11 rounded-2xl text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-bold text-ink">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-1">
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-11 rounded-2xl text-sm"
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
              "Signing in…"
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                Log In to Account
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-line text-center">
        <p className="text-xs sm:text-sm text-muted">
          New to Pricem?{" "}
          <Link href="/register" className="font-extrabold text-primary hover:underline">
            Create an account for free →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
