"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Filter,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { getMe } from "@/lib/auth";
import { listDisputes, type Dispute, type DisputeStatus } from "@/lib/disputes";
import { tokenStore } from "@/lib/api";

export default function AdminDisputesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Dispute[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<DisputeStatus | "all">("all");

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    Promise.all([getMe(), listDisputes()])
      .then(([me, data]) => {
        if (!me.user.roles.includes("admin")) {
          router.replace("/");
        } else {
          setItems(data.disputes);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!items) {
    return (
      <main className="py-24 text-center text-muted">
        <div className="h-8 w-40 rounded-full bg-sunken animate-pulse mx-auto" />
      </main>
    );
  }

  const filteredItems = statusFilter === "all"
    ? items
    : items.filter((d) => d.status === statusFilter);

  const openCount = items.filter((d) => d.status === "open").length;
  const reviewCount = items.filter((d) => d.status === "under_review").length;
  const resolvedCount = items.filter((d) => d.status === "resolved").length;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Admin Center
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <ShieldAlert className="h-4.5 w-4.5" />
            </span>
            <h1 className="text-2xl font-black text-ink tracking-tight">
              Marketplace Mediation Desk
            </h1>
          </div>
          <p className="text-xs text-muted mt-1">
            Review claims, mediate between buyers and merchants, and enforce merchant accountability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/payouts"
            className="text-xs font-bold text-primary hover:underline px-3 py-1.5 rounded-xl border border-line bg-surface"
          >
            Payout Queue →
          </Link>
          <Link
            href="/admin/sellers"
            className="text-xs font-bold text-ink hover:underline px-3 py-1.5 rounded-xl border border-line bg-surface"
          >
            Merchant Registry →
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter("open")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            statusFilter === "open"
              ? "bg-warning/15 border-warning/50 shadow-soft"
              : "bg-surface border-line hover:border-line-dark"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Awaiting Review
          </p>
          <p className="text-2xl font-black text-ink mt-1">{openCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("under_review")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            statusFilter === "under_review"
              ? "bg-primary-soft border-primary/50 shadow-soft"
              : "bg-surface border-line hover:border-line-dark"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" />
            In Mediation
          </p>
          <p className="text-2xl font-black text-ink mt-1">{reviewCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("resolved")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            statusFilter === "resolved"
              ? "bg-success-soft border-success/50 shadow-soft"
              : "bg-surface border-line hover:border-line-dark"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Resolved
          </p>
          <p className="text-2xl font-black text-ink mt-1">{resolvedCount}</p>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <Filter className="h-3.5 w-3.5 text-muted ml-1" />
        <span className="text-xs font-bold text-muted uppercase tracking-wider mr-2">
          Filter:
        </span>
        {(["all", "open", "under_review", "resolved"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
              statusFilter === tab
                ? "bg-primary text-white shadow-xs"
                : "bg-surface text-muted hover:text-ink hover:bg-sunken"
            }`}
          >
            {tab === "all" ? "All Cases" : tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Dispute Queue List */}
      <div className="space-y-3">
        {filteredItems.map((d) => {
          const isResolved = d.status === "resolved";
          const isReview = d.status === "under_review";
          return (
            <Link
              key={d._id}
              href={`/disputes/${d._id}`}
              className="block rounded-3xl border border-line bg-surface p-5 sm:p-6 shadow-soft hover:border-primary transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                        isResolved
                          ? "bg-success-soft text-success border-success/30"
                          : isReview
                            ? "bg-primary-soft text-primary border-primary/30"
                            : "bg-warning/15 text-amber-700 border-warning/30"
                      }`}
                    >
                      {d.status.replace("_", " ")}
                    </span>
                    <span className="text-xs font-mono text-muted">
                      Case #{d._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-ink text-base group-hover:text-primary transition-colors">
                    {d.reason}
                  </h3>
                  <p className="text-xs text-muted">
                    Order #{d.order.slice(-8).toUpperCase()} · Opened by{" "}
                    <span className="capitalize font-semibold text-ink">{d.openedByRole}</span> ·{" "}
                    {new Date(d.createdAt).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-primary group-hover:underline">
                    View Case Room & Decide →
                  </span>
                  {d.messages.length > 0 && (
                    <p className="text-[11px] text-muted mt-1">
                      {d.messages.length} statement{d.messages.length === 1 ? "" : "s"} on file
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="rounded-3xl border border-line bg-surface p-12 text-center text-muted space-y-2">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
            <p className="font-bold text-ink">No disputes found in this filter</p>
            <p className="text-xs">All marketplace transactions are operating normally.</p>
          </div>
        )}
      </div>
    </main>
  );
}
