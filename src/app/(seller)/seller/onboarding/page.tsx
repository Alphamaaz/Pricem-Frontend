"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Handshake,
  PackagePlus,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { getMe } from "@/lib/auth";
import { applyToSell } from "@/lib/users";
import { ApiRequestError, tokenStore } from "@/lib/api";
import { Alert, Button, Input, Label } from "@/components/ui";
import { Logo } from "@/components/Logo";
import type { SellerProfile, User } from "@/lib/types";

const NIGERIAN_BANKS = [
  "Access Bank",
  "Guaranty Trust Bank (GTBank)",
  "Zenith Bank",
  "First Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Kuda Bank",
  "OPay",
  "Moniepoint Microfinance Bank",
  "Stanbic IBTC Bank",
  "Fidelity Bank",
  "First City Monument Bank (FCMB)",
  "Sterling Bank",
  "Union Bank of Nigeria",
  "Wema Bank / ALAT",
  "Polaris Bank",
  "Ecobank Nigeria",
];

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdProfile, setCreatedProfile] = useState<SellerProfile | null>(null);
  const [slugPreview, setSlugPreview] = useState("");
  const [showBankDetails, setShowBankDetails] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login?next=/seller/onboarding");
      return;
    }
    getMe()
      .then((res) => setUser(res.user))
      .catch(() => router.replace("/login?next=/seller/onboarding"))
      .finally(() => setLoading(false));
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const storeName = String(form.get("storeName") || "").trim();
    const storeSlug = String(form.get("storeSlug") || "").trim().toLowerCase();
    const description = String(form.get("description") || "").trim();
    const bankName = String(form.get("bankName") || "").trim();
    const accountNumber = String(form.get("accountNumber") || "").trim();
    const accountName = String(form.get("accountName") || "").trim();

    try {
      const res = await applyToSell({
        storeName,
        storeSlug: storeSlug || undefined,
        description: description || undefined,
        bankName: bankName || undefined,
        accountNumber: accountNumber || undefined,
        accountName: accountName || undefined,
      });

      setCreatedProfile(res.sellerProfile);
      if (res.user) {
        setUser(res.user);
      } else {
        // Refresh local user profile
        const me = await getMe().catch(() => null);
        if (me?.user) setUser(me.user);
      }
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
        setError("Failed to activate store. Please check your network and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center py-24">
        <div className="h-8 w-40 rounded-full bg-sunken animate-pulse" />
      </main>
    );
  }

  // Instant Success Screen (After just launching)
  if (createdProfile) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 bg-[radial-gradient(ellipse_at_top,_rgba(240,118,43,0.12)_0%,_transparent_70%)]">
        <div className="rounded-3xl bg-surface border border-line p-8 sm:p-12 shadow-lifted text-center max-w-lg w-full space-y-6 animate-fade-in-up">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-success-soft text-success shadow-soft">
            <CheckCircle2 className="h-11 w-11" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft text-success px-3 py-1 text-xs font-bold">
              <Zap className="h-3.5 w-3.5 fill-current" /> Store Active & Live
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              Congratulations! Your Store is Ready 🎉
            </h1>
            <p className="text-xs sm:text-sm text-body leading-relaxed max-w-md mx-auto">
              <strong className="text-ink">{createdProfile.storeName}</strong> is now live on Pricem. You can post listings immediately, receive customer bargaining offers, and sell across Nigeria.
            </p>
          </div>

          <div className="rounded-2xl bg-sunken/60 border border-line p-4 text-xs text-muted flex items-center justify-between">
            <span className="font-mono text-ink text-left truncate mr-2">
              pricem.ng/store/{createdProfile.storeSlug}
            </span>
            <span className="shrink-0 px-2 py-0.5 rounded-md bg-primary-soft text-primary font-bold text-[11px]">
              Live
            </span>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link href="/seller/products/new" className="flex-1">
              <Button full size="lg" className="rounded-2xl font-black text-sm shadow-soft">
                <PackagePlus className="h-4 w-4 mr-2" />
                Post Your First Listing
              </Button>
            </Link>
            <Link href="/seller" className="flex-1">
              <Button variant="outline" full size="lg" className="rounded-2xl font-bold text-sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Seller Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Already a seller screen
  if (user?.roles.includes("seller") && user?.sellerProfile?.approvalStatus === "approved") {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-20 bg-[radial-gradient(ellipse_at_top,_rgba(240,118,43,0.08)_0%,_transparent_70%)]">
        <div className="rounded-3xl bg-surface border border-line p-8 sm:p-10 shadow-lifted text-center max-w-md w-full space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success-soft text-success shadow-soft">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-ink">You are already a Merchant 🎉</h1>
            <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
              Your store <strong className="text-ink">{user.sellerProfile?.storeName}</strong> is active. You can manage your listings, analyze real-time performance, and accept buyer bargains anytime.
            </p>
          </div>
          
          <div className="pt-2 flex flex-col gap-2.5">
            <Link href="/seller/products/new">
              <Button full size="md" className="rounded-xl font-bold">
                <PackagePlus className="h-4 w-4 mr-2" />
                Post New Product
              </Button>
            </Link>
            <Link href="/seller">
              <Button variant="outline" full size="md" className="rounded-xl font-bold">
                <BarChart3 className="h-4 w-4 mr-2" />
                Merchant Dashboard
              </Button>
            </Link>
            <Link href="/seller/products">
              <Button variant="ghost" full size="sm" className="rounded-xl text-muted hover:text-ink">
                Manage Existing Listings
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-8 sm:py-12 bg-[radial-gradient(ellipse_at_top,_rgba(240,118,43,0.08)_0%,_transparent_70%)]">
      <div className="w-full max-w-4xl grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Merchant Benefits (5 cols) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col space-y-6 pt-2">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
            <Logo variant="wordmark" />
          </Link>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft/80 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
              <Zap className="h-3.5 w-3.5 fill-current" />
              Instant Seller Activation
            </span>
            <h2 className="text-2xl font-black text-ink tracking-tight mt-3 leading-snug">
              Launch your store & start selling right away.
            </h2>
            <p className="text-xs sm:text-sm text-body mt-2 leading-relaxed">
              No waiting for manual approvals. Post your items instantly (just like Jiji), receive automated Price Am bargain offers, and get paid with zero upfront fees.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 rounded-2xl bg-surface border border-line p-3.5 shadow-soft">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Zap className="h-4 w-4 fill-current" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-ink">Instant Listing & Go-Live</h4>
                <p className="text-[11px] text-muted">Post your products immediately. No review delays or waiting periods.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-surface border border-line p-3.5 shadow-soft">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-ink">
                <Handshake className="h-4 w-4 text-primary" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-ink">Automated Price Am Negotiation</h4>
                <p className="text-[11px] text-muted">Set reserve prices. The platform auto-counters buyer bargains on your terms.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-surface border border-line p-3.5 shadow-soft">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-ink">Safe Escrow Protection</h4>
                <p className="text-[11px] text-muted">Buyers pay into escrow before you dispatch. Your payout is guaranteed.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-surface border border-line p-3.5 shadow-soft">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-ink">0% Listing Fees</h4>
                <p className="text-[11px] text-muted">Free store creation. Pay zero monthly subscription fees.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Instant Onboarding Card (7 cols) */}
        <div className="w-full lg:col-span-7">
          <div className="rounded-3xl bg-surface border border-line p-6 sm:p-8 shadow-lifted">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-soft text-success text-[11px] font-bold mb-2">
                <Zap className="h-3 w-3 fill-current" /> Instant Setup — 30 Seconds
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
                Launch Your Seller Store
              </h1>
              <p className="text-xs sm:text-sm text-muted mt-1">
                Enter your store name and pick your public link to start listing products immediately.
              </p>
            </div>

            {error && <div className="mb-5"><Alert kind="error">{error}</Alert></div>}

            <form onSubmit={onSubmit} className="space-y-4">
              {/* Store Details */}
              <div>
                <Label htmlFor="storeName" className="text-xs font-bold text-ink">
                  Store or Business Name <span className="text-danger">*</span>
                </Label>
                <Input
                  id="storeName"
                  name="storeName"
                  required
                  placeholder="e.g. Lagos Tech Mart or Abuja Fashion Hub"
                  className="mt-1 h-11 rounded-2xl text-sm"
                  onChange={(e) => {
                    const generated = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "");
                    setSlugPreview(generated);
                  }}
                />
                {fieldErrors.storeName && (
                  <p className="text-xs text-danger mt-1 font-medium">{fieldErrors.storeName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="storeSlug" className="text-xs font-bold text-ink">
                  Store Public Link
                </Label>
                <div className="mt-1 flex items-center rounded-2xl border border-line bg-surface px-3 focus-within:ring-4 focus-within:ring-primary/15 focus-within:border-primary transition-shadow">
                  <span className="text-xs text-muted font-mono select-none">
                    pricem.ng/store/
                  </span>
                  <input
                    id="storeSlug"
                    name="storeSlug"
                    pattern="[a-z0-9-]+"
                    value={slugPreview}
                    onChange={(e) => setSlugPreview(e.target.value.toLowerCase())}
                    placeholder="my-store-name"
                    title="Lowercase letters, numbers, and hyphens only"
                    className="w-full h-11 bg-transparent px-1 text-xs sm:text-sm font-semibold text-ink focus:outline-none"
                  />
                </div>
                {fieldErrors.storeSlug && (
                  <p className="text-xs text-danger mt-1 font-medium">{fieldErrors.storeSlug}</p>
                )}
                <p className="text-[11px] text-muted mt-1">
                  Buyers can visit this link directly to browse all your items.
                </p>
              </div>

              <div>
                <Label htmlFor="description" className="text-xs font-bold text-ink">
                  Store Description <span className="text-muted font-normal">(Optional)</span>
                </Label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-2.5 text-xs sm:text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-shadow mt-1"
                  placeholder="What products or brands do you specialize in?"
                />
              </div>

              {/* Bank Payout Section (Optional) */}
              <div className="pt-2">
                <div className="rounded-2xl border border-line bg-sunken/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-ink">
                        Nigerian Bank Payout Details
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBankDetails((v) => !v)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {showBankDetails ? "Hide bank fields" : "+ Add payout bank now (Optional)"}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    You can add your Nigerian bank account now, or add it later in your profile before requesting your first withdrawal.
                  </p>

                  {showBankDetails && (
                    <div className="pt-2 space-y-3 border-t border-line/60">
                      <div>
                        <Label htmlFor="bankName" className="text-xs font-bold text-ink">
                          Select Bank
                        </Label>
                        <select
                          id="bankName"
                          name="bankName"
                          className="w-full h-11 rounded-2xl border border-line bg-surface px-3.5 text-sm text-ink focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-shadow mt-1"
                        >
                          <option value="">Select your bank (Optional)</option>
                          {NIGERIAN_BANKS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                        {fieldErrors.bankName && (
                          <p className="text-xs text-danger mt-1 font-medium">{fieldErrors.bankName}</p>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="accountNumber" className="text-xs font-bold text-ink">
                            10-Digit Account Number
                          </Label>
                          <Input
                            id="accountNumber"
                            name="accountNumber"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="0123456789"
                            className="mt-1 h-11 rounded-2xl text-sm font-mono font-bold"
                          />
                          {fieldErrors.accountNumber && (
                            <p className="text-xs text-danger mt-1 font-medium">{fieldErrors.accountNumber}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="accountName" className="text-xs font-bold text-ink">
                            Account Holder Name
                          </Label>
                          <Input
                            id="accountName"
                            name="accountName"
                            placeholder="As registered with bank"
                            className="mt-1 h-11 rounded-2xl text-sm"
                          />
                          {fieldErrors.accountName && (
                            <p className="text-xs text-danger mt-1 font-medium">{fieldErrors.accountName}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  full
                  size="lg"
                  disabled={submitting}
                  className="h-12 rounded-2xl font-black text-sm shadow-soft transition-all"
                >
                  {submitting ? (
                    "Activating Your Store…"
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4 fill-current" />
                      Launch Store & Start Selling Instantly
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
                <p className="text-[11px] text-center text-muted mt-2">
                  By clicking launch, you agree to Pricem Merchant Terms & Safe Escrow Trading Policy.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
