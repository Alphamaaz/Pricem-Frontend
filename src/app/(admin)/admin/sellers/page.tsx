"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/auth";
import { approveSeller, getPendingSellers, rejectSeller } from "@/lib/admin";
import type { PendingSeller } from "@/lib/admin";
import { ApiRequestError, tokenStore } from "@/lib/api";
import { Alert, Button } from "@/components/ui";
import { Logo } from "@/components/Logo";

export default function AdminSellersPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [applicants, setApplicants] = useState<PendingSeller[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    getMe()
      .then((res) => {
        if (!res.user.roles.includes("admin")) {
          router.replace("/");
          return;
        }
        return getPendingSellers().then((r) => {
          setApplicants(r.applicants);
          setReady(true);
        });
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function onApprove(id: string) {
    setBusyId(id);
    setError(null);
    setInfo(null);
    try {
      const res = await approveSeller(id);
      setInfo(res.message);
      setApplicants((a) => a.filter((x) => x._id !== id));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(id: string) {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    setBusyId(id);
    setError(null);
    setInfo(null);
    try {
      const res = await rejectSeller(id, reason);
      setInfo(res.message);
      setApplicants((a) => a.filter((x) => x._id !== id));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  if (!ready) {
    return (
      <main className="flex-1 flex items-center justify-center py-24">
        <div className="h-8 w-40 rounded-full bg-sunken animate-pulse" />
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <Logo />
        <span className="rounded-full bg-primary-soft text-primary text-xs font-bold px-3 py-1.5 uppercase tracking-wide">
          Admin
        </span>
      </div>

      <h1 className="text-2xl font-bold text-ink">Seller applications</h1>
      <p className="text-sm text-muted mt-1 mb-6">
        Approve or reject pending seller onboarding requests.
      </p>

      {error && <div className="mb-4"><Alert kind="error">{error}</Alert></div>}
      {info && <div className="mb-4"><Alert kind="success">{info}</Alert></div>}

      {applicants.length === 0 ? (
        <div className="rounded-3xl bg-surface border border-line shadow-soft p-12 text-center text-sm text-muted">
          No pending applications. 🎉
        </div>
      ) : (
        <ul className="space-y-4">
          {applicants.map((a) => (
            <li
              key={a._id}
              className="rounded-2xl bg-surface border border-line shadow-soft p-5 flex flex-wrap items-center gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {a.sellerProfile?.storeName}
                  <span className="ml-2 text-xs font-normal text-muted">
                    /{a.sellerProfile?.storeSlug}
                  </span>
                </p>
                <p className="text-sm text-body mt-0.5">
                  {a.fullName} · {a.email} · {a.contactNumber}
                </p>
                {a.sellerProfile?.description && (
                  <p className="text-xs text-muted mt-1 line-clamp-2">
                    {a.sellerProfile.description}
                  </p>
                )}
                <p className="text-xs text-muted mt-1">
                  Payout: {a.sellerProfile?.payoutDetails?.bankName} ·{" "}
                  {a.sellerProfile?.payoutDetails?.accountNumber} ·{" "}
                  {a.sellerProfile?.payoutDetails?.accountName}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  onClick={() => onApprove(a._id)}
                  disabled={busyId === a._id}
                  className="h-9 px-4"
                >
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onReject(a._id)}
                  disabled={busyId === a._id}
                  className="h-9 px-4 border-danger text-danger hover:bg-danger/10"
                >
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
