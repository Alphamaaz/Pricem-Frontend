"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Handshake,
  MessageCircle,
  Package,
  ShieldAlert,
  Store,
  XCircle,
} from "lucide-react";
import { confirmOrderDelivery, getOrder } from "@/lib/orders";
import type { Order, OrderStatus } from "@/lib/orders";
import { getOrderConversation } from "@/lib/chat";
import { getMe } from "@/lib/auth";
import type { User } from "@/lib/types";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { Alert, Button } from "@/components/ui";
import { notifyCommerceChanged } from "@/lib/commerce-events";
import { OrderReviewSection } from "@/components/OrderReviewSection";

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "completed":
      return {
        label: "Deal Completed 🎉",
        className: "bg-success/20 text-success border-success/40",
        icon: CheckCircle2,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-danger/10 text-danger border-danger/20",
        icon: XCircle,
      };
    default:
      return {
        label: "Deal in Progress",
        className: "bg-primary-soft text-primary border-primary/20",
        icon: Handshake,
      };
  }
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<"chat" | "complete" | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }

    getMe()
      .then((res) => setCurrentUser(res.user))
      .catch(() => {});

    getOrder(id)
      .then((res) => setOrder(res.order))
      .catch((err) => {
        setError(err instanceof ApiRequestError ? err.message : "Could not load deal details.");
      });
  }, [id, router]);

  async function openOrderWorkspace() {
    setError(null);
    setNotice(null);
    setBusy("chat");
    try {
      const res = await getOrderConversation(id);
      router.push(`/conversations/${res.conversation._id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not open transaction chat.");
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirmComplete() {
    if (!confirm("Are you sure? Confirm that you have inspected and received the item, and payment has been made.")) {
      return;
    }
    setError(null);
    setNotice(null);
    setBusy("complete");
    try {
      const res = await confirmOrderDelivery(id);
      setOrder(res.order);
      setNotice("Deal marked as completed successfully! Thank you for using PriceAm.");
      notifyCommerceChanged();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not complete this deal.");
    } finally {
      setBusy(null);
    }
  }

  function copyOrderId() {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  if (error && !order) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <Alert kind="error">{error}</Alert>
        <Link href="/orders" className="mt-6 inline-block">
          <Button variant="outline" className="rounded-xl">Back to Deals &amp; Orders</Button>
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto py-20 space-y-4">
        <div className="h-10 w-48 rounded-2xl bg-sunken animate-pulse" />
        <div className="h-64 rounded-3xl bg-sunken animate-pulse" />
      </div>
    );
  }

  const isNegotiated = order.source === "offer";
  const originalSum = order.items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
  const savings = isNegotiated ? Math.max(0, originalSum - order.total) : 0;
  const isSeller = currentUser?._id === order.seller;
  const isBuyer = currentUser?._id === order.buyer;
  const isCompleted = order.orderStatus === "completed";
  const badge = getStatusBadge(order.orderStatus);
  const BadgeIcon = badge.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals &amp; Orders
        </Link>
        <span className="text-xs font-semibold text-muted">
          Viewing as: <strong className="text-ink capitalize">{isBuyer ? "Buyer" : isSeller ? "Seller" : "User"}</strong>
        </span>
      </div>

      {notice && <Alert kind="success">{notice}</Alert>}
      {error && <Alert kind="error">{error}</Alert>}

      {/* Hero Header Card */}
      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-body bg-sunken px-3 py-1 rounded-xl border border-line">
                #{order._id.slice(-8).toUpperCase()}
              </span>
              <button
                type="button"
                onClick={copyOrderId}
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors"
                title="Copy deal ID"
              >
                {copiedId ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-muted mt-2">
              Created on {new Date(order.createdAt).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })} at{" "}
              {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isNegotiated && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-3.5 py-1 text-xs font-bold text-ink border border-accent/30">
                <Handshake className="h-3.5 w-3.5 text-primary" />
                Price Am Deal
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold border ${badge.className}`}>
              <BadgeIcon className="h-3.5 w-3.5" />
              {badge.label}
            </span>
          </div>
        </div>

        {/* Price Am Deal Savings Ribbon */}
        {isNegotiated && savings > 0 && (
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-success-soft via-surface to-primary-soft/40 border border-success/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Agreed Price Am Deal
              </span>
              <p className="text-sm text-body mt-0.5">
                Original listed price: <span className="line-through">₦{originalSum.toLocaleString()}</span> · Agreed price: <strong className="text-ink font-extrabold">₦{order.total.toLocaleString()}</strong>
              </p>
            </div>
            <span className="self-start sm:self-center rounded-xl bg-success text-white px-3 py-1 text-xs font-extrabold shadow-xs">
              Saved ₦{savings.toLocaleString()}
            </span>
          </div>
        )}

        {/* Transaction Workspace (Chat) Card */}
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary-soft/30 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-ink">
                Transaction Chat &amp; Handover Arrangement
              </h3>
              <p className="text-xs text-body mt-1 leading-relaxed max-w-xl">
                Chat directly with the {isBuyer ? "seller" : "buyer"} to arrange your meetup location, schedule pickup time, or share delivery waybill slips and receipts.
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="rounded-2xl font-bold px-6 shrink-0 shadow-soft"
            loading={busy === "chat"}
            disabled={busy !== null}
            onClick={openOrderWorkspace}
          >
            <MessageCircle className="h-4 w-4" />
            Open Transaction Chat
          </Button>
        </div>
      </section>

      {/* Main Grid: Items & Handover Confirmation */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Totals (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchased Items Card */}
          <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
            <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
              <Package className="h-4.5 w-4.5 text-primary" />
              Listing Details ({order.items.length})
            </h2>

            <div className="divide-y divide-line/60">
              {order.items.map((item, i) => (
                <div key={i} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assetUrl(item.coverImage.url)}
                    alt={item.title}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border border-line object-cover shrink-0 shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.product}`}
                      className="font-bold text-sm sm:text-base text-ink hover:text-primary transition-colors truncate block"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                      <Store className="h-3 w-3" />
                      <span>{item.storeName}</span>
                      <span>·</span>
                      <span>Qty: {item.quantity}</span>
                    </p>
                    {item.variantSelections?.length > 0 && (
                      <p className="text-[11px] text-muted mt-1">
                        {item.variantSelections.map((v) => `${v.name}: ${v.value}`).join(", ")}
                      </p>
                    )}
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-sm font-extrabold text-primary">
                        ₦{item.finalPrice.toLocaleString()}
                      </span>
                      {item.finalPrice < item.originalPrice && (
                        <span className="text-xs text-muted line-through">
                          ₦{item.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-base font-extrabold text-ink shrink-0">
                    ₦{item.lineTotal.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="mt-6 pt-5 border-t border-line space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-body">
                <span>Agreed Price</span>
                <span className="font-bold">₦{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-line text-ink">
                <span className="font-extrabold text-sm sm:text-base">Total Deal Amount</span>
                <span className="font-black text-xl text-primary">₦{order.total.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Review Section (Shows when deal is completed) */}
          {isCompleted && (
            <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
              <OrderReviewSection order={order} />
            </section>
          )}
        </div>

        {/* Right Column: Handover Confirmation & Safety (1 col) */}
        <div className="space-y-6">
          {/* Handover & Completion Action Card */}
          <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft space-y-4">
            <h3 className="text-base font-bold text-ink">
              {isCompleted ? "Deal Status" : "Handover Confirmation"}
            </h3>

            {isCompleted ? (
              <div className="rounded-2xl bg-success-soft/60 border border-success/30 p-4 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
                <h4 className="font-black text-sm text-ink">Deal Completed!</h4>
                <p className="text-xs text-body leading-relaxed">
                  Both parties have confirmed successful handover and payment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-body leading-relaxed">
                  {isBuyer
                    ? "Once you have met the seller, inspected the item, and confirmed everything is in good condition, click below to mark the deal as completed."
                    : "Once you have handed over the item and verified payment from the buyer, click below to mark this deal as completed."}
                </p>

                <Button
                  size="lg"
                  full
                  loading={busy === "complete"}
                  disabled={busy !== null}
                  onClick={handleConfirmComplete}
                  className="rounded-2xl font-bold bg-[#00b53f] hover:bg-[#009e37] text-white shadow-soft"
                >
                  <CheckCircle2 className="h-4.5 w-4.5 mr-1" />
                  Confirm Deal Completed
                </Button>
              </div>
            )}
          </section>

          {/* Safety Guidelines Card */}
          <section className="rounded-3xl border border-warning/40 bg-warning/10 p-5 space-y-3">
            <div className="flex items-center gap-2 text-ink font-bold text-xs">
              <ShieldAlert className="h-4.5 w-4.5 text-warning shrink-0" />
              <span>P2P Marketplace Safety Tips</span>
            </div>
            <ul className="text-[11px] text-body space-y-2 list-disc list-inside leading-relaxed">
              <li>Always meet in a busy, well-lit public place (e.g. shopping mall or bank).</li>
              <li>Never send payments in advance before inspecting the item.</li>
              <li>Test all electronics, phones, and devices thoroughly before paying.</li>
              <li>Keep all communication and waybill slips logged in the Transaction Chat.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
