"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Handshake,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import {
  acknowledgeDeliveryArrangement,
  confirmOrderDelivery,
  getOrder,
  markOrderDelivered,
  proposeDeliveryArrangement,
  recordOrderShipment,
  startOrderProcessing,
  requestOrderCompletion,
} from "@/lib/orders";
import type { Order, OrderStatus } from "@/lib/orders";
import { getOrderConversation } from "@/lib/chat";
import { initializePayment } from "@/lib/payments";
import { getMe } from "@/lib/auth";
import type { User } from "@/lib/types";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { Alert, Button, Input, Label } from "@/components/ui";
import { notifyCommerceChanged } from "@/lib/commerce-events";
import { openDispute } from "@/lib/disputes";
import { OrderReviewSection } from "@/components/OrderReviewSection";

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "pending_payment":
      return { label: "Awaiting Settlement", className: "bg-warning/15 text-ink border-warning/30", icon: Clock };
    case "paid":
    case "processing":
      return { label: "Processing / Logistics", className: "bg-primary-soft text-primary border-primary/20", icon: Package };
    case "shipped":
      return { label: "In Transit / Shipped", className: "bg-accent/20 text-ink border-accent/30", icon: Truck };
    case "delivered":
      return { label: "Delivered", className: "bg-success/15 text-success border-success/30", icon: PackageCheck };
    case "completed":
      return { label: "Completed", className: "bg-success/20 text-success border-success/40", icon: CheckCircle2 };
    case "cancelled":
      return { label: "Cancelled", className: "bg-danger/10 text-danger border-danger/20", icon: AlertCircle };
    default:
      return { label: String(status).replace(/_/g, " "), className: "bg-sunken text-muted border-line", icon: Clock };
  }
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    Promise.all([getOrder(id), getMe()])
      .then(([orderResponse, userResponse]) => {
        setOrder(orderResponse.order);
        setCurrentUser(userResponse.user);
      })
      .catch((err) => {
        setError(
          err instanceof ApiRequestError ? err.message : "Could not load order.",
        );
      });
  }, [id, router]);

  async function openOrderWorkspace() {
    setError(null);
    setBusy("chat");
    try {
      const response = await getOrderConversation(id);
      router.push(`/conversations/${response.conversation._id}`);
    } catch (requestError) {
      setError(requestError instanceof ApiRequestError ? requestError.message : "Could not open the order workspace.");
    } finally {
      setBusy(null);
    }
  }

  async function payPendingOrder() {
    setError(null);
    setBusy("payment");
    try {
      const response = await initializePayment([id]);
      if (!response.payment.authorizationUrl) throw new Error("The payment service did not return a confirmation URL");
      window.location.assign(response.payment.authorizationUrl);
    } catch (requestError) {
      setError(requestError instanceof ApiRequestError ? requestError.message : "Could not initialize payment.");
      setBusy(null);
    }
  }

  async function onConfirmDelivery() {
    setError(null);
    setBusy("confirm");
    try {
      const response = await confirmOrderDelivery(id);
      setOrder(response.order);
      setNotice(response.message);
      notifyCommerceChanged();
    } catch (requestError) {
      setError(requestError instanceof ApiRequestError ? requestError.message : "Could not confirm delivery.");
    } finally {
      setBusy(null);
    }
  }

  async function runOrderAction(actionName: string, action: () => Promise<{ message: string; order: Order }>) {
    setError(null);
    setNotice(null);
    setBusy(actionName);
    try {
      const response = await action();
      setOrder(response.order);
      setNotice(response.message);
      notifyCommerceChanged();
    } catch (requestError) {
      setError(requestError instanceof ApiRequestError ? requestError.message : "Could not update the order.");
    } finally {
      setBusy(null);
    }
  }

  function submitDeliveryArrangement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const cost = String(form.get("externalCost") ?? "").trim();
    void runOrderAction("arrangement", () => proposeDeliveryArrangement(id, {
      courierName: String(form.get("courierName") ?? ""),
      ...(cost ? { externalCost: Number(cost) } : {}),
      notes: String(form.get("notes") ?? "") || undefined,
    }));
  }

  function submitShipment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim() || undefined;
    void runOrderAction("shipment", () => recordOrderShipment(id, {
      courierName: String(form.get("courierName") ?? ""),
      trackingNumber: value("trackingNumber"),
      trackingUrl: value("trackingUrl"),
      estimatedDeliveryAt: value("estimatedDeliveryAt"),
      proofUrl: value("proofUrl"),
    }));
  }

  async function submitDispute(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const evidence = form.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
    setBusy("dispute");
    setError(null);
    try {
      const response = await openDispute(id, {
        reason: String(form.get("reason") ?? ""),
        description: String(form.get("description") ?? ""),
        evidence,
      });
      router.push(`/disputes/${response.dispute._id}`);
    } catch (requestError) {
      setError(requestError instanceof ApiRequestError ? requestError.message : "Could not open dispute.");
      setBusy(null);
    }
  }

  async function submitCompletionRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const files = form.getAll("evidence").filter((value): value is File => value instanceof File && value.size > 0);
    await runOrderAction("completion", () => requestOrderCompletion(id, String(form.get("note") ?? ""), files));
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
          <Button variant="outline" className="rounded-xl">Back to orders</Button>
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

  const addr = order.shippingAddress;
  const isNegotiated = order.source === "offer";
  const originalSum = order.items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
  const savings = isNegotiated ? Math.max(0, originalSum - order.total) : 0;
  const isSeller = currentUser?._id === order.seller;
  const isBuyer = currentUser?._id === order.buyer;
  const arrangementStatus = order.deliveryArrangement?.status ?? "pending";
  const badge = getStatusBadge(order.orderStatus);
  const BadgeIcon = badge.icon;

  // Stepper milestones
  const steps = [
    { key: "created", label: "Deal Agreed", done: true },
    {
      key: "arranged",
      label: "Logistics Arranged",
      done: arrangementStatus === "acknowledged" || ["shipped", "delivered", "completed"].includes(order.orderStatus),
    },
    {
      key: "shipped",
      label: "Dispatched",
      done: ["shipped", "delivered", "completed"].includes(order.orderStatus),
    },
    {
      key: "completed",
      label: "Delivered & Settled",
      done: ["delivered", "completed"].includes(order.orderStatus),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
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
                title="Copy full order ID"
              >
                {copiedId ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedId ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-muted mt-2">
              Placed on {new Date(order.createdAt).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" })} at{" "}
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

        {/* Price Am Deal Celebration Ribbon */}
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

        {/* Visual Progress Stepper */}
        <div className="mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {steps.map((step, idx) => (
              <div
                key={step.key}
                className={`rounded-2xl border p-3 text-center transition-all ${
                  step.done
                    ? "border-primary bg-primary-soft/40 text-primary shadow-xs"
                    : "border-line bg-sunken/40 text-muted opacity-60"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold mb-1">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    step.done ? "bg-primary text-white" : "bg-sunken border border-line text-muted"
                  }`}>
                    {step.done ? "✓" : idx + 1}
                  </span>
                  <span className="truncate">{step.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Chat Hero Banner */}
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary-soft/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-soft">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink">
                Transaction Workspace & Direct Settlement
              </h3>
              <p className="text-xs text-body mt-0.5 leading-relaxed">
                Connect directly with the {isBuyer ? "seller" : "buyer"} to arrange pickup or delivery, share courier info, and settle payment upon delivery.
              </p>
            </div>
          </div>
          <Button
            size="md"
            className="rounded-xl font-bold px-6 shrink-0 shadow-soft"
            loading={busy === "chat"}
            disabled={busy !== null}
            onClick={openOrderWorkspace}
          >
            <MessageCircle className="h-4 w-4" />
            Open Transaction Chat
          </Button>
        </div>
      </section>

      {/* Main Grid: Items & Logistics */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Totals (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchased Items Card */}
          <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
            <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
              <Package className="h-4.5 w-4.5 text-primary" />
              Order Items ({order.items.length})
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
                <span>Items Subtotal</span>
                <span>₦{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4 text-body">
                <span>Delivery Charge</span>
                <span className="text-right font-medium">
                  {order.deliveryPolicy?.mode === "seller_included"
                    ? "Included in price"
                    : "Settled externally outside PriceAm"}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-line text-ink">
                <span className="font-extrabold text-sm sm:text-base">Agreed Order Total</span>
                <span className="font-black text-xl text-primary">₦{order.total.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Delivery & Logistics Arrangement Card */}
          <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-primary" />
                Delivery Arrangement
              </h2>
              <span className="rounded-full bg-sunken px-3 py-1 text-xs font-bold capitalize text-body border border-line">
                Status: {arrangementStatus}
              </span>
            </div>

            <div className="rounded-2xl bg-sunken/60 border border-line p-4 space-y-2 text-xs sm:text-sm">
              <p>
                <strong className="text-ink">Delivery Mode: </strong>
                {order.deliveryPolicy.mode === "seller_included"
                  ? "Seller includes delivery in item price."
                  : "Buyer pays courier separately upon delivery."}
              </p>
              {order.deliveryArrangement?.courierName && (
                <p>
                  <strong className="text-ink">Courier / Logistics: </strong>
                  {order.deliveryArrangement.courierName}
                </p>
              )}
              {order.deliveryArrangement?.externalCost !== undefined && (
                <p>
                  <strong className="text-ink">External Courier Fee: </strong>
                  ₦{order.deliveryArrangement.externalCost.toLocaleString()}
                </p>
              )}
              {order.deliveryArrangement?.notes && (
                <p>
                  <strong className="text-ink">Notes: </strong>
                  {order.deliveryArrangement.notes}
                </p>
              )}
            </div>

            {/* Seller Delivery Proposal Form */}
            {isSeller && ["pending_payment", "paid", "processing"].includes(order.orderStatus) && (
              <form onSubmit={submitDeliveryArrangement} className="mt-5 pt-4 border-t border-line space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Update Courier Logistics
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="arrangementCourier">Courier / Dispatch Service</Label>
                    <Input
                      id="arrangementCourier"
                      name="courierName"
                      required
                      placeholder="e.g. GIG Logistics, Kwik, Rider"
                      defaultValue={order.deliveryArrangement?.courierName ?? ""}
                    />
                  </div>
                  {order.deliveryPolicy.mode === "buyer_pays_externally" && (
                    <div>
                      <Label htmlFor="externalCost">Agreed Courier Fee (₦)</Label>
                      <Input
                        id="externalCost"
                        name="externalCost"
                        type="number"
                        min="0"
                        step="100"
                        placeholder="0"
                        defaultValue={order.deliveryArrangement?.externalCost ?? ""}
                      />
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="arrangementNotes">Dispatch Notes / Pickup Location</Label>
                  <textarea
                    id="arrangementNotes"
                    name="notes"
                    rows={2}
                    maxLength={1000}
                    defaultValue={order.deliveryArrangement?.notes ?? ""}
                    placeholder="Provide any instructions for the buyer..."
                    className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-xs text-ink focus:outline-none focus:ring-4 focus:ring-primary/15"
                  />
                </div>
                <Button type="submit" size="sm" loading={busy === "arrangement"} disabled={busy !== null} className="rounded-xl">
                  Save Delivery Arrangement
                </Button>
              </form>
            )}

            {/* Buyer Acknowledge Action */}
            {isBuyer && order.deliveryPolicy.mode === "buyer_pays_externally" && arrangementStatus === "proposed" && (
              <div className="mt-4 pt-3 border-t border-line">
                <Button
                  loading={busy === "acknowledge"}
                  disabled={busy !== null}
                  onClick={() => void runOrderAction("acknowledge", () => acknowledgeDeliveryArrangement(id))}
                  className="rounded-xl"
                >
                  Acknowledge External Delivery Fee
                </Button>
              </div>
            )}
          </section>

          {/* Shipment & Tracking Details */}
          {(order.shipment?.courierName || (isSeller && order.orderStatus === "processing")) && (
            <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
              <h2 className="text-base font-bold text-ink mb-3 flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-primary" />
                Shipment & Tracking
              </h2>

              {order.shipment?.courierName && (
                <div className="rounded-2xl bg-sunken/60 border border-line p-4 space-y-1.5 text-xs sm:text-sm">
                  <p><strong className="text-ink">Courier:</strong> {order.shipment.courierName}</p>
                  {order.shipment.trackingNumber && <p><strong className="text-ink">Tracking Number:</strong> {order.shipment.trackingNumber}</p>}
                  {order.shipment.trackingUrl && (
                    <p>
                      <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">
                        Open Tracking URL →
                      </a>
                    </p>
                  )}
                  {order.shipment.estimatedDeliveryAt && (
                    <p><strong className="text-ink">Estimated Arrival:</strong> {new Date(order.shipment.estimatedDeliveryAt).toLocaleString()}</p>
                  )}
                </div>
              )}

              {isSeller && order.orderStatus === "processing" && (
                <form onSubmit={submitShipment} className="mt-4 grid gap-3 sm:grid-cols-2 pt-3 border-t border-line">
                  <div>
                    <Label htmlFor="shipmentCourier">Courier Name</Label>
                    <Input id="shipmentCourier" name="courierName" required defaultValue={order.deliveryArrangement?.courierName ?? ""} />
                  </div>
                  <div>
                    <Label htmlFor="trackingNumber">Waybill / Tracking No.</Label>
                    <Input id="trackingNumber" name="trackingNumber" placeholder="Optional" />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" size="sm" loading={busy === "shipment"} disabled={busy !== null} className="rounded-xl">
                      Record Shipment Dispatched
                    </Button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* Order Fulfilment Timeline */}
          <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
            <h2 className="text-base font-bold text-ink mb-4 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-primary" />
              Activity Timeline
            </h2>
            <ol className="space-y-4">
              {(order.timeline ?? []).map((event) => (
                <li
                  key={event._id}
                  className="relative pl-6 text-xs sm:text-sm before:absolute before:left-1 before:top-1.5 before:h-2.5 before:w-2.5 before:rounded-full before:bg-primary after:absolute after:left-[8px] after:top-4 after:h-[calc(100%+8px)] after:w-px after:bg-line last:after:hidden"
                >
                  <p className="font-semibold text-ink">{event.message}</p>
                  <p className="mt-0.5 text-[11px] text-muted capitalize">
                    {event.actorRole} · {new Date(event.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Customer Reviews once completed */}
          {isBuyer && order.orderStatus === "completed" && <OrderReviewSection order={order} />}
        </div>

        {/* Right Column: Address, Quick Actions, Dispute (1 col) */}
        <div className="space-y-6">
          {/* Buyer Delivery Address */}
          {addr?.addressLine1 && (
            <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
              <h2 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Delivery Destination
              </h2>
              <div className="text-xs sm:text-sm text-body leading-relaxed space-y-1">
                <p className="font-bold text-ink">{addr.fullName}</p>
                <p className="flex items-center gap-1.5 text-muted">
                  <Phone className="h-3 w-3" />
                  {addr.phone}
                </p>
                <p className="pt-1 text-muted">
                  {addr.addressLine1}
                  {addr.addressLine2 && `, ${addr.addressLine2}`}
                  <br />
                  {[addr.city, addr.state, addr.country].filter(Boolean).join(", ")}
                </p>
              </div>
            </section>
          )}

          {/* Primary Action Buttons Card */}
          <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft space-y-3">
            <h2 className="text-sm font-bold text-ink mb-2">Order Actions</h2>

            {/* Buyer Delivery Confirmation */}
            {order.orderStatus === "delivered" && isBuyer && (
              <Button
                size="lg"
                full
                loading={busy === "confirm"}
                disabled={busy !== null}
                onClick={onConfirmDelivery}
                className="rounded-2xl bg-success text-white font-extrabold shadow-soft"
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm Received & Settled
              </Button>
            )}

            {/* Seller Delivery State Changes */}
            {isSeller && order.orderStatus === "paid" && (
              <Button
                size="md"
                full
                loading={busy === "processing"}
                disabled={busy !== null}
                onClick={() => void runOrderAction("processing", () => startOrderProcessing(id))}
                className="rounded-xl"
              >
                Start Processing
              </Button>
            )}
            {isSeller && order.orderStatus === "shipped" && (
              <Button
                size="md"
                full
                loading={busy === "delivered"}
                disabled={busy !== null}
                onClick={() => void runOrderAction("delivered", () => markOrderDelivered(id))}
                className="rounded-xl bg-success text-white"
              >
                Mark as Delivered
              </Button>
            )}

            {/* Seller Completion Request */}
            {isSeller && order.orderStatus === "delivered" && (
              <div className="pt-2 border-t border-line">
                {order.completionRequest?.status === "pending" ? (
                  <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs text-primary font-semibold text-center">
                    Completion Request Under Admin Review
                  </div>
                ) : (
                  <details className="group">
                    <summary className="cursor-pointer text-xs font-semibold text-primary hover:underline flex items-center justify-between py-1">
                      <span>Request Order Completion</span>
                      <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <form onSubmit={submitCompletionRequest} className="mt-3 space-y-2.5">
                      <div>
                        <Label htmlFor="completionNote">Note / Dispatch Proof</Label>
                        <Input id="completionNote" name="note" placeholder="Handover confirmation, waybill #..." />
                      </div>
                      <div>
                        <Label htmlFor="completionEvidence">Proof Images (Optional)</Label>
                        <Input id="completionEvidence" name="evidence" type="file" accept="image/*" multiple />
                      </div>
                      <Button
                        type="submit"
                        size="sm"
                        full
                        loading={busy === "completion"}
                        disabled={busy !== null}
                        className="rounded-xl"
                      >
                        Submit Completion Request
                      </Button>
                    </form>
                  </details>
                )}
              </div>
            )}

            {/* Open Workspace Action */}
            <Button
              variant="outline"
              size="md"
              full
              loading={busy === "chat"}
              disabled={busy !== null}
              onClick={openOrderWorkspace}
              className="rounded-xl"
            >
              <MessageCircle className="h-4 w-4 text-primary" />
              Open Transaction Chat
            </Button>

            {/* Fallback demo payment if needed */}
            {isBuyer && order.orderStatus === "pending_payment" && order.paymentStatus === "pending" && order.source !== "offer" && (
              <Button
                size="md"
                full
                loading={busy === "payment"}
                disabled={busy !== null}
                onClick={payPendingOrder}
                className="rounded-xl"
              >
                <CreditCard className="h-4 w-4" />
                Complete Payment
              </Button>
            )}
          </section>

          {/* Safety & Direct Settlement Notice */}
          <section className="rounded-3xl border border-line bg-sunken/60 p-5 space-y-2 text-xs text-body">
            <div className="flex items-center gap-2 text-ink font-bold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Direct Settlement Notice
            </div>
            <p className="leading-relaxed">
              PriceAm facilitates price negotiation and communication. Settle payments directly upon courier arrival or inspection. Keep all delivery references in the Transaction Chat.
            </p>
          </section>

          {/* Dispute & Mediation Center */}
          <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
            {order.disputeStatus && order.disputeStatus !== "none" && order.activeDispute ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-danger font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="h-4 w-4" />
                  Active Dispute Case #{String(order.activeDispute).slice(-6).toUpperCase()}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  A mediation case is currently open for this order. Both parties and PriceAm support can review evidence and communicate in the Case Room.
                </p>
                <Link href={`/disputes/${order.activeDispute}`}>
                  <Button full size="sm" className="rounded-xl font-bold bg-danger text-white">
                    Open Dispute Case Room →
                  </Button>
                </Link>
              </div>
            ) : (
              <details className="group">
                <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-danger flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" />
                    Have an Issue? Report to Mediation Desk
                  </span>
                  <span className="text-muted group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <form onSubmit={submitDispute} className="mt-4 space-y-3 pt-3 border-t border-line">
                  <div className="rounded-xl bg-danger-soft/50 border border-danger/20 p-3 text-[11px] text-body leading-relaxed">
                    <strong className="text-danger font-bold">PriceAm Protection:</strong> We mediate directly between buyers and sellers. Sellers in violation face immediate store bans and blacklisting.
                  </div>
                  <div>
                    <Label htmlFor="disputeReason">Select Primary Issue</Label>
                    <select
                      id="disputeReason"
                      name="reason"
                      required
                      className="w-full h-10 rounded-xl border border-line bg-surface px-3 text-xs text-ink focus:outline-none focus:ring-4 focus:ring-primary/15 mt-1"
                    >
                      <option value="">Select reason...</option>
                      <option value="Item not delivered / Seller delayed delivery">Item not delivered / Seller uncontactable</option>
                      <option value="Defective or damaged product received">Defective or damaged product received</option>
                      <option value="Wrong item / Different from description">Wrong item / Different from description</option>
                      <option value="Counterfeit / Fake product">Counterfeit / Fake product</option>
                      <option value="Seller refusing agreed return or exchange">Seller refusing agreed return or exchange</option>
                      <option value="Suspected fraud / Scammer alert">Suspected fraud / Scammer alert</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="disputeDescription">Explain What Happened</Label>
                    <textarea
                      id="disputeDescription"
                      name="description"
                      minLength={10}
                      maxLength={3000}
                      required
                      rows={3}
                      placeholder="Detail transaction history, payment method, delivery arrangement, or defects found..."
                      className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-xs text-ink focus:outline-none focus:ring-4 focus:ring-primary/15 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="disputeEvidence">Photo Proof (Transfer slip, chats, defective item)</Label>
                    <Input id="disputeEvidence" name="evidence" type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-1" />
                  </div>
                  <Button type="submit" size="sm" loading={busy === "dispute"} disabled={busy !== null} className="rounded-xl bg-danger text-white w-full">
                    Submit Case to Mediation Desk
                  </Button>
                </form>
              </details>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
