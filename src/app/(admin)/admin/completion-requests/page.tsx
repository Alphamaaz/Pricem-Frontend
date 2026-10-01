"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  XCircle,
} from "lucide-react";
import { Alert, Button, Label } from "@/components/ui";
import { ApiRequestError, assetUrl } from "@/lib/api";
import {
  listCompletionRequests,
  reviewCompletionRequest,
  type Order,
} from "@/lib/orders";

export default function CompletionRequestsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = () =>
    listCompletionRequests()
      .then((result) => setOrders(result.orders))
      .catch((err) =>
        setError(
          err instanceof ApiRequestError
            ? err.message
            : "Could not load completion requests.",
        ),
      );

  useEffect(() => {
    void load();
  }, []);

  async function decide(
    event: React.FormEvent<HTMLFormElement>,
    order: Order,
    decision: "approve" | "reject",
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const note = String(form.get("note") ?? "").trim();

    if (!note) {
      setError("Please provide an administrative note explaining the decision.");
      return;
    }

    setBusy(order._id);
    setError(null);
    setNotice(null);
    try {
      await reviewCompletionRequest(order._id, decision, note);
      setNotice(
        `Order #${order._id.slice(-8).toUpperCase()} completion request ${decision === "approve" ? "approved" : "rejected"}.`,
      );
      await load();
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not review completion request.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6 pb-20">
      {/* Top Navigation */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Admin Center
        </Link>
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <FileCheck2 className="h-4.5 w-4.5" />
          </span>
          <h1 className="text-2xl font-black text-ink tracking-tight">
            Order Completion Requests
          </h1>
        </div>
        <p className="text-xs text-muted mt-1">
          Review seller delivery proofs (waybill receipts, signed dispatch notes) when a buyer has not manually confirmed receipt.
        </p>
      </div>

      {notice && <Alert kind="success">{notice}</Alert>}
      {error && <Alert kind="error">{error}</Alert>}

      {/* Orders Stream */}
      <div className="space-y-4">
        {orders.map((order) => {
          const req = order.completionRequest;
          const itemsTitle = order.items.map((item) => item.title).join(", ");

          return (
            <article
              key={order._id}
              className="rounded-3xl border border-line bg-surface p-6 shadow-soft space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/60 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-warning/15 text-amber-700 border border-warning/30">
                      <Clock className="h-3 w-3" />
                      Pending Delivery Review
                    </span>
                    <span className="text-xs font-mono text-muted">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-ink text-base mt-1">{itemsTitle}</h3>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-muted">Total Order Value</p>
                  <p className="text-xl font-black text-ink">₦{order.total.toLocaleString()}</p>
                </div>
              </div>

              {/* Seller Dispatch Note */}
              <div className="rounded-2xl bg-sunken/60 border border-line p-4 space-y-1 text-xs">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted">
                  Seller Dispatch Statement:
                </p>
                <p className="text-sm text-body leading-relaxed whitespace-pre-wrap">
                  {req?.note || "No statement provided."}
                </p>
                {req?.requestedAt && (
                  <p className="text-[11px] text-muted pt-1">
                    Submitted on {new Date(req.requestedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Photo Proof Gallery */}
              {req?.evidenceUrls && req.evidenceUrls.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-ink uppercase tracking-wider text-muted">
                    Waybill & Dispatch Proof ({req.evidenceUrls.length} file{req.evidenceUrls.length === 1 ? "" : "s"})
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {req.evidenceUrls.map((url, index) => (
                      <a
                        key={url}
                        href={assetUrl(url)}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative rounded-2xl border border-line overflow-hidden bg-sunken hover:border-primary transition-all shadow-xs"
                      >
                        <img
                          src={assetUrl(url)}
                          alt={`Delivery proof ${index + 1}`}
                          className="h-24 w-24 object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <ExternalLink className="h-4 w-4" />
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Administrative Action Form */}
              <form
                onSubmit={(e) => {
                  const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
                  const action = (submitter?.value as "approve" | "reject") || "approve";
                  decide(e, order, action);
                }}
                className="pt-2 border-t border-line/60 space-y-3"
              >
                <div>
                  <Label htmlFor={`note-${order._id}`} className="text-xs font-bold text-ink">
                    Administrative Decision Note <span className="text-danger">*</span>
                  </Label>
                  <textarea
                    id={`note-${order._id}`}
                    name="note"
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={2}
                    placeholder="State reason for approving completion or rejecting proof..."
                    className="w-full rounded-2xl border border-line bg-surface px-4 py-2.5 text-xs sm:text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-shadow mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    name="decision"
                    value="approve"
                    type="submit"
                    size="sm"
                    loading={busy === order._id}
                    disabled={busy !== null}
                    className="rounded-xl font-bold bg-success text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Approve Order Completion
                  </Button>
                  <Button
                    name="decision"
                    value="reject"
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={busy !== null}
                    className="rounded-xl font-bold text-danger border-danger/30 hover:bg-danger-soft"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Reject Delivery Proof
                  </Button>
                  <Link href={`/orders/${order._id}`} className="ml-auto">
                    <Button variant="ghost" size="sm" className="rounded-xl text-xs text-muted hover:text-ink">
                      View Full Order
                    </Button>
                  </Link>
                </div>
              </form>
            </article>
          );
        })}

        {orders.length === 0 && (
          <div className="rounded-3xl border border-line bg-surface p-12 text-center text-muted space-y-2">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
            <p className="font-bold text-ink">No completion requests awaiting review</p>
            <p className="text-xs">All seller completion claims have been examined.</p>
          </div>
        )}
      </div>
    </main>
  );
}
