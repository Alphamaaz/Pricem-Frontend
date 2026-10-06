"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Handshake,
  Image as ImageIcon,
  MessageSquare,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";
import {
  addDisputeMessage,
  getDispute,
  resolveDispute,
  type Dispute,
  type DisputeOutcome,
} from "@/lib/disputes";
import { getMe } from "@/lib/auth";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { Alert, Button, Input, Label } from "@/components/ui";

function getDisputeStatusBadge(status: Dispute["status"]) {
  switch (status) {
    case "open":
      return {
        label: "Case Open • Awaiting Response",
        className: "bg-warning/15 text-warning-dark border-warning/30",
        icon: Clock,
      };
    case "under_review":
      return {
        label: "PriceAm Mediation in Progress",
        className: "bg-primary-soft text-primary border-primary/20",
        icon: Scale,
      };
    case "resolved":
      return {
        label: "Case Concluded & Resolved",
        className: "bg-success/15 text-success border-success/30",
        icon: CheckCircle2,
      };
    default:
      return {
        label: String(status).replace("_", " "),
        className: "bg-sunken text-muted border-line",
        icon: Clock,
      };
  }
}

function getOutcomeVisuals(outcome?: DisputeOutcome) {
  switch (outcome) {
    case "amicable_agreement":
      return {
        title: "Amicable Agreement Reached",
        subtitle: "Both parties agreed on a direct return, replacement, or settlement.",
        icon: Handshake,
        border: "border-success/40",
        bg: "bg-success-soft/50",
        badge: "bg-success/15 text-success border-success/30",
      };
    case "seller_penalized_strike":
      return {
        title: "Official Merchant Strike Issued",
        subtitle: "PriceAm penalized the merchant for misconduct or failure to honor terms.",
        icon: AlertTriangle,
        border: "border-amber-500/40",
        bg: "bg-amber-500/10",
        badge: "bg-amber-500/15 text-amber-700 border-amber-500/30",
      };
    case "seller_banned_blacklisted":
      return {
        title: "Merchant Permanently Banned & Blacklisted",
        subtitle: "Seller account suspended and phone/identity blacklisted for fraud or non-fulfillment.",
        icon: Ban,
        border: "border-danger/40",
        bg: "bg-danger-soft/60",
        badge: "bg-danger/15 text-danger border-danger/30",
      };
    case "claim_dismissed":
      return {
        title: "Claim Dismissed in Seller Favor",
        subtitle: "Evidence verified that the seller fulfilled the agreement accurately.",
        icon: ShieldCheck,
        border: "border-blue-500/40",
        bg: "bg-blue-500/10",
        badge: "bg-blue-500/15 text-blue-700 border-blue-500/30",
      };
    case "full_refund":
    case "cancel_order":
      return {
        title: "Order Cancelled / Refund Processed",
        subtitle: "Order transaction has been formally terminated.",
        icon: CheckCircle2,
        border: "border-purple-500/40",
        bg: "bg-purple-500/10",
        badge: "bg-purple-500/15 text-purple-700 border-purple-500/30",
      };
    default:
      return {
        title: "Dispute Resolved",
        subtitle: "Administrative ruling recorded.",
        icon: CheckCircle2,
        border: "border-line",
        bg: "bg-sunken",
        badge: "bg-sunken text-ink border-line",
      };
  }
}

export default function DisputePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showIncidentReport, setShowIncidentReport] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    Promise.all([getDispute(id), getMe()])
      .then(([d, me]) => {
        setDispute(d.dispute);
        setIsAdmin(me.user.roles.includes("admin"));
      })
      .catch(() => router.replace("/orders"));
  }, [id, router]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const evidence = form
      .getAll("evidence")
      .filter((value): value is File => value instanceof File && value.size > 0);

    setBusy(true);
    setError(null);
    try {
      const result = await addDisputeMessage(id, {
        message: String(form.get("message") ?? ""),
        evidence,
      });
      setDispute(result.dispute);
      event.currentTarget.reset();
      setNotice("Your response was recorded in the case file.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not send response.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = String(form.get("amount") ?? "").trim();
    setBusy(true);
    setError(null);
    try {
      const result = await resolveDispute(id, {
        outcome: String(form.get("outcome")) as DisputeOutcome,
        decision: String(form.get("decision")),
        ...(amount ? { amount: Number(amount) } : {}),
      });
      setDispute(result.dispute);
      setNotice("Dispute officially resolved and disciplinary actions applied.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not resolve dispute.");
    } finally {
      setBusy(false);
    }
  }

  if (!dispute) {
    return (
      <div className="py-24 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-40 rounded-2xl bg-sunken animate-pulse" />
        <div className="h-64 rounded-3xl bg-sunken animate-pulse" />
      </div>
    );
  }

  const badge = getDisputeStatusBadge(dispute.status);
  const BadgeIcon = badge.icon;
  const outcomeVisuals = getOutcomeVisuals(dispute.resolution?.outcome);
  const OutcomeIcon = outcomeVisuals.icon;

  const buyerName = typeof dispute.buyer === "object" ? dispute.buyer.fullName : "Buyer";
  const sellerName = typeof dispute.seller === "object" ? dispute.seller.fullName : "Seller";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Top Navigation */}
      <div>
        <Link
          href={`/orders/${dispute.order}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Order #{dispute.order.slice(-8).toUpperCase()}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-danger flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              PriceAm Mediation & Protection Desk
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-1">
              Case: {dispute.reason}
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Case Ref: #{dispute._id.slice(-8).toUpperCase()} · Opened by{" "}
              <span className="capitalize font-bold text-ink">{dispute.openedByRole}</span> on{" "}
              {new Date(dispute.createdAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold border ${badge.className}`}
            >
              <BadgeIcon className="h-3.5 w-3.5" />
              {badge.label}
            </span>
          </div>
        </div>
      </div>

      {notice && <Alert kind="success">{notice}</Alert>}
      {error && <Alert kind="error">{error}</Alert>}

      {/* How Mediation Works Banner */}
      <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6 shadow-soft space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
          <Scale className="h-4 w-4" />
          How PriceAm Marketplace Mediation Protects You
        </h2>
        <div className="grid sm:grid-cols-3 gap-3 pt-1">
          <div className="rounded-2xl bg-sunken/60 border border-line p-3.5 text-xs space-y-1">
            <p className="font-bold text-ink flex items-center gap-1.5">
              <Handshake className="h-3.5 w-3.5 text-primary" /> 1. Direct Mediation
            </p>
            <p className="text-muted leading-relaxed text-[11px]">
              Buyer and seller communicate directly in this room to arrange item exchange, repair, or direct transfer refund.
            </p>
          </div>

          <div className="rounded-2xl bg-sunken/60 border border-line p-3.5 text-xs space-y-1">
            <p className="font-bold text-ink flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-success" /> 2. Evidence Verification
            </p>
            <p className="text-muted leading-relaxed text-[11px]">
              Our compliance team reviews bank transfer receipts, waybill slips, and defect photos to evaluate the dispute.
            </p>
          </div>

          <div className="rounded-2xl bg-sunken/60 border border-line p-3.5 text-xs space-y-1">
            <p className="font-bold text-ink flex items-center gap-1.5">
              <Ban className="h-3.5 w-3.5 text-danger" /> 3. Strict Accountability
            </p>
            <p className="text-muted leading-relaxed text-[11px]">
              Sellers who commit fraud or refuse legitimate settlements face permanent store bans and identity blacklisting.
            </p>
          </div>
        </div>
      </section>

      {/* Case Details Card */}
      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-xs font-bold text-ink uppercase tracking-wider text-muted flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Claim Statement & Evidence
          </h2>
          <button
            type="button"
            onClick={() => setShowIncidentReport((v) => !v)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <Download className="h-3.5 w-3.5" />
            {showIncidentReport ? "Hide Incident Sheet" : "Generate Incident Report"}
          </button>
        </div>

        {/* Printable/Copyable Incident Report Pack */}
        {showIncidentReport && (
          <div className="rounded-2xl border border-primary/30 bg-primary-soft/30 p-5 space-y-3 text-xs animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-ink text-sm flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-danger" />
                Official PriceAm Incident Record
              </h3>
              <span className="text-[10px] font-mono text-muted">Ref: {dispute._id}</span>
            </div>
            <p className="text-muted leading-relaxed text-[11px]">
              Use this summary when filing a fraud dispute with your Nigerian commercial bank or reporting scam activity to law enforcement (Police/EFCC).
            </p>
            <div className="bg-surface rounded-xl p-3 border border-line space-y-1.5 font-mono text-[11px]">
              <p><strong>Order ID:</strong> #{dispute.order}</p>
              <p><strong>Dispute Ref:</strong> #{dispute._id}</p>
              <p><strong>Complainant:</strong> {buyerName} ({dispute.openedByRole})</p>
              <p><strong>Merchant:</strong> {sellerName}</p>
              <p><strong>Claim Reason:</strong> {dispute.reason}</p>
              <p><strong>Case Status:</strong> {dispute.status.toUpperCase()}</p>
              <p><strong>Date Logged:</strong> {new Date(dispute.createdAt).toISOString()}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl bg-sunken/60 border border-line p-4 sm:p-5 text-sm text-body leading-relaxed whitespace-pre-wrap">
          {dispute.description}
        </div>

        {/* Evidence Photos */}
        {dispute.evidenceUrls.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider text-muted mb-2">
              Attached Proof & Receipts ({dispute.evidenceUrls.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              {dispute.evidenceUrls.map((url, i) => (
                <a
                  key={url}
                  href={assetUrl(url)}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative rounded-2xl border border-line overflow-hidden bg-sunken hover:border-primary transition-all shadow-xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assetUrl(url)}
                    alt={`Evidence proof ${i + 1}`}
                    className="h-20 w-20 sm:h-24 sm:w-24 object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <ExternalLink className="h-4 w-4" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Official Ruling Card (When Resolved) */}
      {dispute.status === "resolved" && dispute.resolution?.outcome && (
        <section
          className={`rounded-3xl border ${outcomeVisuals.border} ${outcomeVisuals.bg} p-6 sm:p-7 shadow-soft space-y-3`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wide">
              <OutcomeIcon className="h-5 w-5 text-primary" />
              Official Compliance Finding & Decision
            </div>
            <span
              className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold border ${outcomeVisuals.badge}`}
            >
              Concluded
            </span>
          </div>
          <div>
            <h3 className="text-lg font-black text-ink">{outcomeVisuals.title}</h3>
            <p className="text-xs text-muted mt-0.5">{outcomeVisuals.subtitle}</p>
          </div>
          <div className="rounded-2xl bg-surface/90 border border-line p-4 text-sm text-body leading-relaxed">
            <strong className="text-ink block text-xs font-bold uppercase tracking-wider mb-1">
              Officer Rationale:
            </strong>
            {dispute.resolution.decision}
          </div>
          {dispute.resolution.resolvedAt && (
            <p className="text-[11px] text-muted">
              Decided on {new Date(dispute.resolution.resolvedAt).toLocaleString()}
            </p>
          )}
        </section>
      )}

      {/* Mediation Conversation Thread */}
      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <MessageSquare className="h-4.5 w-4.5 text-primary" />
            Case Mediation Stream ({dispute.messages.length})
          </h2>
          <span className="text-xs text-muted">
            All statements are permanently archived for legal & compliance verification.
          </span>
        </div>

        <div className="space-y-4">
          {dispute.messages.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted border border-dashed border-line rounded-2xl">
              No replies yet. Parties can present evidence and discuss an amicable return or exchange below.
            </div>
          ) : (
            dispute.messages.map((m) => {
              const isAdminMsg = m.authorRole === "admin";
              const isBuyerMsg = m.authorRole === "buyer";
              return (
                <article
                  key={m._id}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                    isAdminMsg
                      ? "bg-primary-soft/50 border-primary/30"
                      : isBuyerMsg
                        ? "bg-surface border-line"
                        : "bg-sunken/40 border-line"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isAdminMsg
                          ? "bg-primary text-white"
                          : isBuyerMsg
                            ? "bg-ink text-white"
                            : "bg-surface border border-line text-ink"
                      }`}
                    >
                      {isAdminMsg ? (
                        <Scale className="h-3 w-3" />
                      ) : isBuyerMsg ? (
                        <User className="h-3 w-3" />
                      ) : (
                        <Store className="h-3 w-3" />
                      )}
                      {isAdminMsg
                        ? "PriceAm Compliance Desk"
                        : isBuyerMsg
                          ? "Buyer Statement"
                          : "Merchant Statement"}
                    </span>
                    <time className="text-[11px] text-muted">
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>

                  <p className="text-sm text-body leading-relaxed whitespace-pre-wrap">{m.message}</p>

                  {m.evidenceUrls.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-line/60">
                      {m.evidenceUrls.map((url, idx) => (
                        <a
                          key={url}
                          href={assetUrl(url)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline bg-surface px-2.5 py-1 rounded-lg border border-line"
                        >
                          <ImageIcon className="h-3 w-3" />
                          Evidence file {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>

        {/* Message Input if Not Resolved */}
        {dispute.status !== "resolved" && (
          <form onSubmit={sendMessage} className="mt-6 pt-4 border-t border-line space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Add Statement or Proof
            </h3>
            <div>
              <Label htmlFor="message" className="text-xs font-bold text-ink">
                Response / Proposal Details
              </Label>
              <textarea
                id="message"
                name="message"
                required
                maxLength={3000}
                rows={3}
                placeholder="State your position, describe waybill tracking, item condition, or offer a replacement..."
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-shadow mt-1"
              />
            </div>

            <div>
              <Label htmlFor="evidence" className="text-xs font-bold text-ink">
                Supporting Photos / Waybill / Transfer Proof (Optional)
              </Label>
              <Input
                id="evidence"
                name="evidence"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="mt-1 h-11 rounded-2xl text-xs"
              />
            </div>

            <Button
              type="submit"
              loading={busy}
              disabled={busy}
              className="rounded-2xl px-6 font-bold shadow-soft"
            >
              <Send className="h-4 w-4 mr-1.5" />
              Post Case Statement
            </Button>
          </form>
        )}
      </section>

      {/* Admin Disciplinary & Resolution Console */}
      {isAdmin && dispute.status !== "resolved" && (
        <section className="rounded-3xl border border-warning/40 bg-surface p-6 sm:p-7 shadow-soft space-y-4">
          <div className="flex items-center gap-2 text-warning font-bold text-sm uppercase tracking-wider">
            <Scale className="h-4.5 w-4.5" />
            Administrative Mediation & Disciplinary Action
          </div>
          <p className="text-xs text-muted">
            As an administrator, review evidence submitted by both buyer and merchant before finalizing the binding decision.
          </p>

          <form onSubmit={decide} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="outcome" className="text-xs font-bold text-ink">
                Resolution & Merchant Action
              </Label>
              <select
                id="outcome"
                name="outcome"
                className="w-full h-11 rounded-2xl border border-line bg-surface px-4 text-sm text-ink focus:outline-none focus:ring-4 focus:ring-primary/15 mt-1 font-medium"
              >
                <option value="amicable_agreement">
                  🤝 Amicable Settlement (Direct Return, Replacement, or Direct Refund Agreed)
                </option>
                <option value="seller_penalized_strike">
                  ⚠️ Issue Seller Strike (Penalize Merchant for Misconduct)
                </option>
                <option value="seller_banned_blacklisted">
                  🚫 Ban Seller & Blacklist Store (Immediate Suspension for Fraud)
                </option>
                <option value="claim_dismissed">
                  🛡️ Dismiss Claim (Seller Fulfilled Obligations Correctly)
                </option>
                <option value="release_seller_payment">
                  💳 Release Seller Payout (Dispute Rejected)
                </option>
                <option value="cancel_order">
                  ❌ Cancel Order & Terminate Transaction
                </option>
              </select>
            </div>

            <div>
              <Label htmlFor="decision" className="text-xs font-bold text-ink">
                Official Compliance Finding & Statement
              </Label>
              <textarea
                id="decision"
                name="decision"
                required
                minLength={5}
                maxLength={3000}
                rows={3}
                placeholder="State the official finding, rationale, and instructions for buyer and seller..."
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-shadow mt-1"
              />
            </div>

            <Button
              type="submit"
              loading={busy}
              disabled={busy}
              className="rounded-2xl px-6 font-black bg-ink text-white hover:bg-ink/90 shadow-soft"
            >
              Finalize Mediation Ruling
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
