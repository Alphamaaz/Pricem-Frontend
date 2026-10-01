"use client";

/*
  Checkout — collects a shipping address and creates orders from the cart
  (one order per seller, handled by the backend).
  Demo payment currently exercises the complete order lifecycle without calling external gateway.
*/

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Handshake,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  Truck,
  User,
} from "lucide-react";
import { getCart } from "@/lib/cart";
import type { Cart, CartTotals } from "@/lib/cart";
import { checkoutCart, checkoutOfferOrder, getOrder } from "@/lib/orders";
import type { Order } from "@/lib/orders";
import { initializePayment } from "@/lib/payments";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { notifyCommerceChanged } from "@/lib/commerce-events";
import { Alert, Button, Input, Label } from "@/components/ui";

const NIGERIAN_STATES = [
  "Lagos",
  "Abuja (FCT)",
  "Rivers",
  "Oyo",
  "Kano",
  "Anambra",
  "Ogun",
  "Delta",
  "Edo",
  "Enugu",
  "Kaduna",
  "Abia",
  "Akwa Ibom",
  "Benue",
  "Borno",
  "Cross River",
  "Ebonyi",
  "Ekiti",
  "Gombe",
  "Imo",
  "Jigawa",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Nasarawa",
  "Niger",
  "Ondo",
  "Osun",
  "Plateau",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const negotiatedOrderId = searchParams.get("order");
  const [cart, setCart] = useState<Cart | null>(null);
  const [negotiatedOrder, setNegotiatedOrder] = useState<Order | null>(null);
  const [totals, setTotals] = useState<CartTotals>({ subtotal: 0, totalItems: 0 });
  const [deliveryMode, setDeliveryMode] = useState<"courier" | "pickup">("courier");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Address fields
  const [selectedState, setSelectedState] = useState("Lagos");

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    if (negotiatedOrderId) {
      getOrder(negotiatedOrderId)
        .then((res) => {
          if (res.order.source !== "offer") throw new Error("Not a negotiated order");
          if (res.order.orderStatus !== "pending_payment") {
            router.replace(`/orders/${res.order._id}`);
            return;
          }
          setNegotiatedOrder(res.order);
          setTotals({
            subtotal: res.order.total,
            totalItems: res.order.items.reduce((sum, item) => sum + item.quantity, 0),
          });
        })
        .catch(() => router.replace("/orders"));
      return;
    }
    getCart()
      .then((res) => {
        setCart(res.cart);
        setTotals(res.totals);
      })
      .catch(() => router.replace("/login"));
  }, [router, negotiatedOrderId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const val = (k: string) => String(form.get(k) || "").trim();

    try {
      const landmark = val("landmark");
      const addressLine2 = val("addressLine2");
      const combinedLine2 = [addressLine2, landmark ? `Landmark: ${landmark}` : null]
        .filter(Boolean)
        .join(" | ");

      const shippingAddress = {
        fullName: val("fullName"),
        phone: val("phone"),
        addressLine1: val("addressLine1"),
        addressLine2: combinedLine2 || undefined,
        city: val("city"),
        state: val("state") || selectedState,
        country: val("country") || "Nigeria",
      };

      const orderIds = negotiatedOrder
        ? [(await checkoutOfferOrder(negotiatedOrder._id, shippingAddress)).order._id]
        : (await checkoutCart(shippingAddress)).orders.map((order) => order._id);

      notifyCommerceChanged();

      const paymentResponse = await initializePayment(orderIds);
      if (!paymentResponse.payment.authorizationUrl) {
        throw new Error("The payment service did not return a confirmation URL");
      }
      window.location.assign(paymentResponse.payment.authorizationUrl);
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Checkout failed. Please try again.",
      );
      setSubmitting(false);
    }
  }

  if (!cart && !negotiatedOrder) {
    return (
      <div className="py-24 max-w-4xl mx-auto space-y-6">
        <div className="h-10 w-48 rounded-2xl bg-sunken animate-pulse" />
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 h-96 rounded-3xl bg-sunken animate-pulse" />
          <div className="lg:col-span-2 h-72 rounded-3xl bg-sunken animate-pulse" />
        </div>
      </div>
    );
  }

  if (cart && cart.items.length === 0) {
    return (
      <div className="py-24 text-center max-w-md mx-auto">
        <div className="h-16 w-16 mx-auto mb-4 rounded-3xl bg-primary-soft text-primary flex items-center justify-center">
          <Truck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-ink">Nothing to check out</h1>
        <p className="mt-2 text-sm text-muted">Your cart is currently empty.</p>
        <div className="mt-6">
          <Link href="/">
            <Button size="lg" className="rounded-2xl px-6">Explore marketplace listings</Button>
          </Link>
        </div>
      </div>
    );
  }

  const summaryItems = negotiatedOrder
    ? negotiatedOrder.items.map((item) => ({ ...item, priceSnapshot: item.finalPrice }))
    : cart!.items;

  const originalTotal = negotiatedOrder
    ? negotiatedOrder.items.reduce((acc, it) => acc + it.originalPrice * it.quantity, 0)
    : totals.subtotal;
  const totalSavings = Math.max(0, originalTotal - totals.subtotal);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Breadcrumb & Header */}
      <div>
        <Link
          href={negotiatedOrder ? "/offers" : "/cart"}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          {negotiatedOrder ? "Back to Offers" : "Back to Cart"}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              Logistics & Checkout
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Provide delivery destination details for dispatch riders or confirm store pickup.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-surface border border-line px-3.5 py-1.5 text-xs shadow-soft">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="font-semibold text-ink">Escrow Protected</span>
          </div>
        </div>
      </div>

      {negotiatedOrder && (
        <div className="rounded-3xl border border-success/30 bg-gradient-to-r from-success-soft/70 via-surface to-primary-soft/40 p-5 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-success text-white">
                <Handshake className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  Price Am Agreed Deal
                  <span className="rounded-full bg-success/20 text-success text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wide">
                    Secured
                  </span>
                </h3>
                <p className="text-xs text-body mt-0.5">
                  You are checking out at the mutually accepted offer price.
                  {negotiatedOrder.inventoryReservation?.expiresAt && (
                    <span className="text-muted block sm:inline sm:ml-1">
                      (Reservation held until {new Date(negotiatedOrder.inventoryReservation.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                    </span>
                  )}
                </p>
              </div>
            </div>
            {totalSavings > 0 && (
              <span className="rounded-xl bg-success text-white px-3.5 py-1 text-xs font-extrabold shadow-soft self-start sm:self-center">
                Save ₦{totalSavings.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}

      {error && <Alert kind="error">{error}</Alert>}

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Delivery Method & Address (7 cols) */}
        <form onSubmit={onSubmit} className="lg:col-span-7 space-y-6">
          {/* Delivery Method Selector */}
          <section className="rounded-3xl bg-surface border border-line shadow-soft p-6 space-y-4">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider text-muted flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              1. Delivery / Logistics Method
            </h2>

            <div className="grid sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setDeliveryMode("courier")}
                className={`rounded-2xl border p-4 text-left transition-all relative ${
                  deliveryMode === "courier"
                    ? "border-primary bg-primary-soft/40 ring-2 ring-primary/20 shadow-soft"
                    : "border-line bg-surface hover:border-line-strong shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
                    <Truck className="h-4 w-4" />
                  </span>
                  {deliveryMode === "courier" && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-ink">Dispatch Rider / Courier</h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Delivered directly to your home, office, or interstate transit park.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryMode("pickup")}
                className={`rounded-2xl border p-4 text-left transition-all relative ${
                  deliveryMode === "pickup"
                    ? "border-primary bg-primary-soft/40 ring-2 ring-primary/20 shadow-soft"
                    : "border-line bg-surface hover:border-line-strong shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sunken border border-line text-ink">
                    <Building2 className="h-4 w-4" />
                  </span>
                  {deliveryMode === "pickup" && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <h4 className="text-sm font-bold text-ink">Store / Hub Walk-in Pickup</h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Inspect and collect directly from merchant&apos;s physical shop.
                </p>
              </button>
            </div>
          </section>

          {/* Delivery Address Form */}
          <section className="rounded-3xl bg-surface border border-line shadow-soft p-6 space-y-4">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider text-muted flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              2. {deliveryMode === "courier" ? "Recipient & Delivery Destination" : "Contact & Pickup Identification"}
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-xs font-bold text-ink">Recipient Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                  <Input
                    id="fullName"
                    name="fullName"
                    required
                    autoComplete="name"
                    placeholder="e.g. Chukwuma Obi"
                    className="pl-10 h-11 rounded-2xl text-sm"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs font-bold text-ink">Recipient Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+234 802 345 6789"
                    className="pl-10 h-11 rounded-2xl text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="addressLine1" className="text-xs font-bold text-ink">
                {deliveryMode === "courier" ? "Street Address / Building" : "Your Residential Address (for receipt)"}
              </Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  required
                  autoComplete="address-line1"
                  placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                  className="pl-10 h-11 rounded-2xl text-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="landmark" className="text-xs font-bold text-ink">
                  Nearest Landmark / Bus Stop <span className="text-primary font-normal">(Crucial for Riders)</span>
                </Label>
                <Input
                  id="landmark"
                  name="landmark"
                  placeholder="e.g. Opp. Total Filling Station"
                  className="h-11 rounded-2xl text-sm mt-1"
                />
              </div>

              <div>
                <Label htmlFor="addressLine2" className="text-xs font-bold text-ink">Apartment / Suite (Optional)</Label>
                <Input
                  id="addressLine2"
                  name="addressLine2"
                  placeholder="Flat 4B, 2nd Floor"
                  className="h-11 rounded-2xl text-sm mt-1"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="state" className="text-xs font-bold text-ink">State</Label>
                <select
                  id="state"
                  name="state"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-line bg-surface px-3.5 text-sm text-ink focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-shadow mt-1"
                >
                  {NIGERIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="city" className="text-xs font-bold text-ink">City / LGA</Label>
                <Input
                  id="city"
                  name="city"
                  required
                  autoComplete="address-level2"
                  placeholder="e.g. Ikeja"
                  className="h-11 rounded-2xl text-sm mt-1"
                />
              </div>

              <div>
                <Label htmlFor="country" className="text-xs font-bold text-ink">Country</Label>
                <Input
                  id="country"
                  name="country"
                  required
                  defaultValue="Nigeria"
                  readOnly
                  className="h-11 rounded-2xl text-sm mt-1 bg-sunken/60 text-muted"
                />
              </div>
            </div>
          </section>

          {/* Submission Button */}
          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              full
              size="lg"
              disabled={submitting}
              className="h-14 rounded-2xl font-black text-base shadow-soft"
            >
              {submitting ? (
                "Processing Order & Dispatch…"
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Confirm Order & Settle ₦{totals.subtotal.toLocaleString()}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>

            <p className="text-xs text-muted text-center leading-relaxed">
              🔒 Direct Settlement & Escrow Protection: Funds are reserved safely. Settle directly with the dispatch rider or seller upon receiving your items in good order.
            </p>
          </div>
        </form>

        {/* Right Aside: Sticky Order Summary (5 cols) */}
        <aside className="lg:col-span-5">
          <div className="rounded-3xl bg-surface border border-line shadow-soft p-6 sm:p-7 sticky top-24 space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h2 className="text-base font-bold text-ink">Order Summary</h2>
              <span className="text-xs font-bold text-primary bg-primary-soft px-2.5 py-1 rounded-full">
                {totals.totalItems} {totals.totalItems === 1 ? "item" : "items"}
              </span>
            </div>

            {/* Items List */}
            <ul className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {summaryItems.map((item) => {
                const lineTotal = item.priceSnapshot * item.quantity;
                const hasDiscount = "originalPrice" in item && item.priceSnapshot < item.originalPrice;

                return (
                  <li
                    key={("_id" in item && item._id) || `${item.product}-${item.variantKey}`}
                    className="flex items-center gap-3.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assetUrl(item.coverImage.url)}
                      alt={item.title}
                      className="h-14 w-14 rounded-2xl border border-line object-cover shrink-0 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-ink truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                        <Store className="h-3 w-3" />
                        <span>{item.storeName}</span>
                        <span>·</span>
                        <span>Qty: {item.quantity}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {hasDiscount && (
                        <p className="text-[10px] text-muted line-through">
                          ₦{(item.originalPrice * item.quantity).toLocaleString()}
                        </p>
                      )}
                      <span className="text-sm font-black text-ink">
                        ₦{lineTotal.toLocaleString()}
                      </span>
                      {negotiatedOrder && (
                        <span className="block text-[9px] font-black uppercase text-success">
                          Bargained
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Calculations Breakdown */}
            <div className="border-t border-line pt-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-body">
                <span>Items Subtotal</span>
                <span className="font-semibold text-ink">₦{totals.subtotal.toLocaleString()}</span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between text-success font-semibold">
                  <span className="flex items-center gap-1">
                    <Handshake className="h-3.5 w-3.5" />
                    Price Am Discount
                  </span>
                  <span>-₦{totalSavings.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-body">
                <span>Logistics & Dispatch</span>
                <span className="font-semibold text-primary">Arranged with Seller</span>
              </div>

              <div className="border-t border-line pt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-muted block">
                    Agreed Total
                  </span>
                  <span className="text-[10px] text-muted">Excludes external dispatch fee</span>
                </div>
                <span className="text-2xl font-black text-primary">
                  ₦{totals.subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Reassurance Banner */}
            <div className="rounded-2xl bg-sunken/60 border border-line p-4 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-ink">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Fast Logistics Handoff</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Once confirmed, use the Transaction Chat on your order page to view dispatch updates, coordinate rider arrival, or exchange waybill numbers.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
