"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Filter,
  HandCoins,
  Scale,
  X,
} from "lucide-react";
import { getMe } from "@/lib/auth";
import {
  approvePayout,
  confirmPayout,
  listPayouts,
  type SellerPayout,
} from "@/lib/payouts";
import { ApiRequestError, tokenStore } from "@/lib/api";
import { Alert, Button, Input, Label } from "@/components/ui";

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [items, setItems] = useState<SellerPayout[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal state for confirming payment
  const [confirmingPayout, setConfirmingPayout] = useState<SellerPayout | null>(null);
  const [transferRef, setTransferRef] = useState("");
  const [transferMethod, setTransferMethod] = useState("Direct NIP Bank Transfer");

  const load = () =>
    listPayouts()
      .then((data) => setItems(data.payouts))
      .catch((err) =>
        setError(err instanceof ApiRequestError ? err.message : "Failed to load payouts"),
      );

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    getMe()
      .then((me) => {
        if (!me.user.roles.includes("admin")) {
          router.replace("/");
        } else {
          return load();
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function handleApprove(id: string) {
    setBusy(id);
    setError(null);
    setNotice(null);
    try {
      await approvePayout(id);
      setNotice("Payout approved. You can now execute the bank transfer and confirm.");
      await load();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Approval failed");
    } finally {
      setBusy(null);
    }
  }

  async function submitPaymentConfirmation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirmingPayout) return;
    if (!transferRef.trim()) {
      setError("Please enter the bank transfer reference or transaction ID.");
      return;
    }

    setBusy(confirmingPayout._id);
    setError(null);
    setNotice(null);
    try {
      await confirmPayout(confirmingPayout._id, {
        transferReference: transferRef.trim(),
        transferMethod: transferMethod.trim(),
      });
      setNotice(`Payout for ${confirmingPayout.seller.fullName} marked as paid!`);
      setConfirmingPayout(null);
      setTransferRef("");
      await load();
    } catch (e) {
      setError(e instanceof ApiRequestError ? e.message : "Payment confirmation failed");
    } finally {
      setBusy(null);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (!items) {
    return (
      <main className="py-24 text-center text-muted">
        <div className="h-8 w-40 rounded-full bg-sunken animate-pulse mx-auto" />
      </main>
    );
  }

  const filteredItems = statusFilter === "all"
    ? items
    : items.filter((p) => p.status === statusFilter);

  const eligibleCount = items.filter((p) => p.status === "eligible").length;
  const approvedCount = items.filter((p) => p.status === "approved").length;
  const paidCount = items.filter((p) => p.status === "paid").length;

  const totalEligibleAmount = items
    .filter((p) => p.status === "eligible")
    .reduce((sum, p) => sum + p.amountKobo, 0) / 100;

  const totalApprovedAmount = items
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + p.amountKobo, 0) / 100;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6 pb-20">
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
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-success-soft text-success">
              <HandCoins className="h-4.5 w-4.5" />
            </span>
            <h1 className="text-2xl font-black text-ink tracking-tight">
              Seller Payout Settlement
            </h1>
          </div>
          <p className="text-xs text-muted mt-1">
            Review completed marketplace sales, verify seller bank details, and log payout transfers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/disputes"
            className="text-xs font-bold text-primary hover:underline px-3 py-1.5 rounded-xl border border-line bg-surface flex items-center gap-1.5"
          >
            <Scale className="h-3.5 w-3.5" />
            Mediation Queue →
          </Link>
          <Link
            href="/admin/sellers"
            className="text-xs font-bold text-ink hover:underline px-3 py-1.5 rounded-xl border border-line bg-surface"
          >
            Merchant Registry →
          </Link>
        </div>
      </div>

      {notice && <Alert kind="success">{notice}</Alert>}
      {error && <Alert kind="error">{error}</Alert>}

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter("eligible")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            statusFilter === "eligible"
              ? "bg-warning/15 border-warning/50 shadow-soft"
              : "bg-surface border-line hover:border-line-dark"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Eligible to Approve
          </p>
          <p className="text-xl sm:text-2xl font-black text-ink mt-1">
            ₦{totalEligibleAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted mt-0.5">{eligibleCount} orders</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("approved")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            statusFilter === "approved"
              ? "bg-primary-soft border-primary/50 shadow-soft"
              : "bg-surface border-line hover:border-line-dark"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Ready for Transfer
          </p>
          <p className="text-xl sm:text-2xl font-black text-ink mt-1">
            ₦{totalApprovedAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted mt-0.5">{approvedCount} orders</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("paid")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            statusFilter === "paid"
              ? "bg-success-soft border-success/50 shadow-soft"
              : "bg-surface border-line hover:border-line-dark"
          }`}
        >
          <p className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed / Paid
          </p>
          <p className="text-xl sm:text-2xl font-black text-ink mt-1">{paidCount}</p>
          <p className="text-[11px] text-muted mt-0.5">settled payouts</p>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-3 overflow-x-auto">
        <Filter className="h-3.5 w-3.5 text-muted ml-1" />
        <span className="text-xs font-bold text-muted uppercase tracking-wider mr-2">
          Filter:
        </span>
        {(["all", "eligible", "approved", "paid", "held"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`rounded-xl px-3 py-1 text-xs font-bold transition-all shrink-0 ${
              statusFilter === tab
                ? "bg-primary text-white shadow-xs"
                : "bg-surface text-muted hover:text-ink hover:bg-sunken"
            }`}
          >
            {tab === "all" ? "All Payouts" : tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Payouts Stream */}
      <div className="space-y-3.5">
        {filteredItems.map((p) => {
          const bank = p.seller.sellerProfile?.payoutDetails;
          const isEligible = p.status === "eligible";
          const isApproved = p.status === "approved";
          const isPaid = p.status === "paid";
          const isHeld = p.status === "held";
          const amountNaira = (p.amountKobo / 100).toLocaleString();

          return (
            <article
              key={p._id}
              className="rounded-3xl border border-line bg-surface p-5 sm:p-6 shadow-soft space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/60 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                        isPaid
                          ? "bg-success-soft text-success border-success/30"
                          : isApproved
                            ? "bg-primary-soft text-primary border-primary/30"
                            : isHeld
                              ? "bg-danger-soft text-danger border-danger/30"
                              : "bg-warning/15 text-amber-700 border-warning/30"
                      }`}
                    >
                      {p.status}
                    </span>
                    <span className="text-xs font-mono text-muted">
                      Order #{p.order._id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-ink text-base">
                    {p.seller.fullName}{" "}
                    {p.seller.sellerProfile?.storeName && (
                      <span className="text-muted font-normal text-xs">
                        ({p.seller.sellerProfile.storeName})
                      </span>
                    )}
                  </h3>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-muted">Payable Amount</p>
                  <p className="text-xl font-black text-ink tracking-tight">₦{amountNaira}</p>
                </div>
              </div>

              {/* Settlement Bank Details Card */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-sunken/60 border border-line p-3.5 space-y-1 text-xs">
                  <p className="text-muted font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Recipient Nigerian Bank
                  </p>
                  {bank?.bankName ? (
                    <div>
                      <p className="font-bold text-ink">{bank.bankName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-ink font-bold text-sm">
                          {bank.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(bank.accountNumber || "", p._id)}
                          className="text-[11px] text-primary hover:underline flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedId === p._id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-muted text-[11px]">{bank.accountName}</p>
                    </div>
                  ) : (
                    <p className="text-danger font-medium pt-1">
                      ⚠️ No payout bank entered yet by seller.
                    </p>
                  )}
                </div>

                <div className="rounded-2xl bg-sunken/60 border border-line p-3.5 space-y-1.5 text-xs">
                  <p className="text-muted font-bold uppercase tracking-wider text-[10px]">
                    Settlement Status & Logs
                  </p>
                  {isPaid ? (
                    <div className="space-y-0.5 text-body">
                      <p className="text-success font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Transfer Complete
                      </p>
                      <p className="text-muted text-[11px]">
                        Ref: <span className="font-mono text-ink">{p.transferReference || "N/A"}</span>
                      </p>
                      <p className="text-muted text-[11px]">Method: {p.transferMethod || "Bank Transfer"}</p>
                    </div>
                  ) : isHeld ? (
                    <p className="text-danger text-xs font-semibold">
                      Held: {p.holdReason || "Financial release on hold due to dispute"}
                    </p>
                  ) : (
                    <p className="text-muted text-[11px] leading-relaxed">
                      Funds are ready for transfer upon admin approval. Once transferred via your bank, log the transfer reference.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {isEligible && (
                  <Button
                    size="sm"
                    loading={busy === p._id}
                    disabled={busy !== null}
                    onClick={() => handleApprove(p._id)}
                    className="rounded-xl font-bold"
                  >
                    Approve for Transfer
                  </Button>
                )}

                {isApproved && (
                  <Button
                    size="sm"
                    loading={busy === p._id}
                    disabled={busy !== null}
                    onClick={() => setConfirmingPayout(p)}
                    className="rounded-xl font-bold bg-success text-white shadow-soft"
                  >
                    Confirm Bank Transfer →
                  </Button>
                )}

                <Link href={`/orders/${p.order._id}`}>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs">
                    View Order
                  </Button>
                </Link>
              </div>
            </article>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="rounded-3xl border border-line bg-surface p-12 text-center text-muted space-y-2">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
            <p className="font-bold text-ink">No payouts found in this category</p>
            <p className="text-xs">All seller settlement requests have been processed.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Bank Transfer */}
      {confirmingPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface rounded-3xl border border-line p-6 sm:p-7 max-w-md w-full shadow-lifted space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-ink text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Confirm Settlement Transfer
              </h3>
              <button
                type="button"
                onClick={() => setConfirmingPayout(null)}
                className="text-muted hover:text-ink p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-sunken/60 border border-line p-3.5 text-xs space-y-1">
              <p>
                <strong>Recipient:</strong> {confirmingPayout.seller.fullName}
              </p>
              <p>
                <strong>Bank:</strong> {confirmingPayout.seller.sellerProfile?.payoutDetails?.bankName} (
                {confirmingPayout.seller.sellerProfile?.payoutDetails?.accountNumber})
              </p>
              <p>
                <strong>Amount:</strong> ₦
                {(confirmingPayout.amountKobo / 100).toLocaleString()}
              </p>
            </div>

            <form onSubmit={submitPaymentConfirmation} className="space-y-3">
              <div>
                <Label htmlFor="transferRef" className="text-xs font-bold text-ink">
                  Bank Transfer Reference / Session ID <span className="text-danger">*</span>
                </Label>
                <Input
                  id="transferRef"
                  name="transferRef"
                  required
                  placeholder="e.g. 100004240928123456"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <div>
                <Label htmlFor="transferMethod" className="text-xs font-bold text-ink">
                  Transfer Method / Channel
                </Label>
                <Input
                  id="transferMethod"
                  name="transferMethod"
                  value={transferMethod}
                  onChange={(e) => setTransferMethod(e.target.value)}
                  placeholder="e.g. GTBank Online Banking, Moniepoint"
                  className="mt-1 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  full
                  size="md"
                  loading={busy === confirmingPayout._id}
                  disabled={busy !== null}
                  className="rounded-xl font-bold bg-success text-white"
                >
                  Mark as Paid & Notify Seller
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setConfirmingPayout(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
