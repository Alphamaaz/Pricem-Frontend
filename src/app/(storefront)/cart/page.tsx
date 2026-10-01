"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Handshake,
  Heart,
  Loader2,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import {
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/cart";
import type { Cart, CartItem, CartTotals } from "@/lib/cart";
import { addWishlistItem } from "@/lib/wishlist";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { notifyCommerceChanged } from "@/lib/commerce-events";
import { Alert, Button, Input } from "@/components/ui";

interface SellerGroup {
  sellerId: string;
  storeName: string;
  storeSlug: string;
  items: CartItem[];
  subtotal: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [totals, setTotals] = useState<CartTotals>({ subtotal: 0, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    getCart()
      .then((res) => {
        setCart(res.cart);
        setTotals(res.totals);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function mutate(
    id: string,
    fn: () => Promise<{ cart: Cart; totals: CartTotals }>,
  ) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fn();
      setCart(res.cart);
      setTotals(res.totals);
      notifyCommerceChanged();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Update failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSaveForLater(item: CartItem) {
    setBusyId(item._id);
    setError(null);
    try {
      await addWishlistItem(item.product);
      const res = await removeCartItem(item._id);
      setCart(res.cart);
      setTotals(res.totals);
      notifyCommerceChanged();
      setNotice(`"${item.title}" moved to your Wishlist.`);
      setTimeout(() => setNotice(null), 3500);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not move item to wishlist.");
    } finally {
      setBusyId(null);
    }
  }

  // Group items by Seller / Store for clear multi-vendor overview
  const sellerGroups = useMemo<SellerGroup[]>(() => {
    if (!cart?.items || cart.items.length === 0) return [];
    const map = new Map<string, SellerGroup>();

    for (const item of cart.items) {
      const key = item.seller || item.storeName || "seller";
      const existing = map.get(key);
      if (existing) {
        existing.items.push(item);
        existing.subtotal += item.priceSnapshot * item.quantity;
      } else {
        map.set(key, {
          sellerId: item.seller,
          storeName: item.storeName || "Marketplace Merchant",
          storeSlug: item.storeSlug || "",
          items: [item],
          subtotal: item.priceSnapshot * item.quantity,
        });
      }
    }

    return Array.from(map.values());
  }, [cart]);

  // Loading skeleton
  if (loading && !cart) {
    return (
      <div className="max-w-6xl mx-auto py-8 sm:py-12 space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-sunken rounded-2xl" />
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="h-44 bg-surface rounded-3xl border border-line" />
            <div className="h-44 bg-surface rounded-3xl border border-line" />
          </div>
          <div className="h-80 bg-surface rounded-3xl border border-line" />
        </div>
      </div>
    );
  }

  // Empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-16 sm:py-24 text-center">
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-primary/20 via-accent/20 to-primary/10 border border-primary/20 shadow-glow">
          <ShoppingBag className="h-12 w-12 text-primary animate-bounce duration-1000" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Your shopping cart is empty
        </h1>
        <p className="mt-3 max-w-md mx-auto text-sm sm:text-base text-muted leading-relaxed">
          Looks like you haven&apos;t added any items yet. Discover thousands of verified listings across Nigeria, or bargain for the best deals using Price Am!
        </p>

        {/* Quick Category Discovery */}
        <div className="mt-8 flex flex-wrap justify-center gap-2.5 max-w-lg mx-auto">
          {[
            { label: "Electronics", href: "/category/electronics" },
            { label: "Fashion & Wears", href: "/category/fashion" },
            { label: "Home & Furniture", href: "/category/home" },
            { label: "Gaming & Consoles", href: "/category/gaming" },
            { label: "Books & Stationeries", href: "/category/books" },
          ].map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink shadow-soft hover:border-primary hover:text-primary transition-all"
            >
              {cat.label}
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/">
            <Button size="lg" className="rounded-2xl px-8 shadow-soft">
              Explore All Listings
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 space-y-8">
      {/* Top Banner & Flow Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Shopping Cart
            </h1>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
              {totals.totalItems} {totals.totalItems === 1 ? "item" : "items"}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            Direct peer-to-peer settlement. Negotiate prices or coordinate delivery with each merchant.
          </p>
        </div>

        {/* Stepper Trail */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-primary font-bold">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[11px]">1</span>
            Cart Review
          </span>
          <span className="text-muted">→</span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sunken text-muted text-[11px]">2</span>
            Logistics & Delivery
          </span>
          <span className="text-muted">→</span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sunken text-muted text-[11px]">3</span>
            Settlement
          </span>
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl bg-success/15 border border-success/30 p-4 text-xs sm:text-sm text-success font-semibold flex items-center gap-2 shadow-soft">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <Alert kind="error" className="rounded-2xl">
          {error}
        </Alert>
      )}

      {/* Main Grid: Items (Left) + Sticky Summary (Right) */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px] items-start">
        {/* Left Column: Multi-Seller Grouped Items */}
        <div className="space-y-6">
          {sellerGroups.map((group) => (
            <div
              key={group.sellerId}
              className="rounded-3xl border border-line bg-surface shadow-soft overflow-hidden transition-all hover:border-line-strong"
            >
              {/* Seller / Store Header */}
              <div className="flex items-center justify-between bg-sunken/60 px-5 py-3.5 border-b border-line text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Store className="h-4 w-4" />
                  </div>
                  <span>{group.storeName}</span>
                  <span className="rounded-md bg-surface border border-line px-2 py-0.5 text-[10px] font-medium text-muted">
                    Verified Seller
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted">Store Subtotal: </span>
                  <strong className="text-xs sm:text-sm font-bold text-ink">
                    ₦{group.subtotal.toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Items in this Store */}
              <ul className="divide-y divide-line">
                {group.items.map((item) => {
                  const lineTotal = item.priceSnapshot * item.quantity;
                  const isItemBusy = busyId === item._id;

                  return (
                    <li
                      key={item._id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 transition-colors hover:bg-sunken/20"
                    >
                      {/* Product Thumbnail */}
                      <Link
                        href={`/products/${item.product}`}
                        className="group relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl border border-line bg-sunken"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={assetUrl(item.coverImage.url)}
                          alt={item.coverImage.alt ?? item.title}
                          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        />
                      </Link>

                      {/* Product Metadata & Actions */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/products/${item.product}`}
                              className="font-bold text-ink hover:text-primary line-clamp-2 text-sm sm:text-base leading-snug"
                            >
                              {item.title}
                            </Link>
                            <span className="text-sm sm:text-base font-extrabold text-ink whitespace-nowrap">
                              ₦{lineTotal.toLocaleString()}
                            </span>
                          </div>

                          {/* Selected Variants */}
                          {item.variantSelections.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {item.variantSelections.map((v) => (
                                <span
                                  key={v.name}
                                  className="inline-flex items-center gap-1 rounded-md bg-sunken px-2 py-0.5 text-[11px] font-medium text-body border border-line"
                                >
                                  <span className="text-muted">{v.name}:</span>
                                  <strong className="text-ink">{v.value}</strong>
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="mt-1 text-xs text-muted">
                            ₦{item.priceSnapshot.toLocaleString()} each
                          </div>
                        </div>

                        {/* Controls & Quick Actions Row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line/60">
                          {/* Quantity Stepper */}
                          <div className="flex items-center rounded-xl border border-line bg-surface p-1 shadow-soft">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              disabled={isItemBusy || item.quantity <= 1}
                              onClick={() =>
                                mutate(item._id, () =>
                                  updateCartItem(item._id, item.quantity - 1),
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink hover:bg-sunken disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>

                            <span className="w-8 text-center text-xs sm:text-sm font-bold text-ink">
                              {isItemBusy ? (
                                <Loader2 className="mx-auto h-3 w-3 animate-spin text-primary" />
                              ) : (
                                item.quantity
                              )}
                            </span>

                            <button
                              type="button"
                              aria-label="Increase quantity"
                              disabled={isItemBusy}
                              onClick={() =>
                                mutate(item._id, () =>
                                  updateCartItem(item._id, item.quantity + 1),
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink hover:bg-sunken disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Quick Actions: Price Am Bargain, Wishlist, Remove */}
                          <div className="flex items-center gap-2 sm:gap-3 text-xs">
                            {/* Price Am Bargain Shortcut */}
                            <Link
                              href={`/products/${item.product}?negotiate=1`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary-soft/50 px-2.5 py-1.5 font-bold text-primary hover:bg-primary-soft hover:shadow-soft transition-all"
                              title="Bargain a lower price on this item"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Price Am</span>
                            </Link>

                            {/* Save to Wishlist */}
                            <button
                              type="button"
                              disabled={isItemBusy}
                              onClick={() => handleSaveForLater(item)}
                              className="inline-flex items-center gap-1 text-muted hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-sunken"
                              title="Save to wishlist"
                            >
                              <Heart className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Save for Later</span>
                            </button>

                            {/* Remove item */}
                            <button
                              type="button"
                              disabled={isItemBusy}
                              onClick={() =>
                                mutate(item._id, () => removeCartItem(item._id))
                              }
                              className="inline-flex items-center gap-1 text-muted hover:text-danger transition-colors p-1.5 rounded-lg hover:bg-danger/10"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Clear Cart Trigger */}
          <div className="flex justify-end pt-2">
            {confirmClear ? (
              <div className="flex items-center gap-2 rounded-2xl bg-danger/10 border border-danger/20 p-2.5 text-xs">
                <span className="font-semibold text-danger">Remove all items from cart?</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-danger/30 text-danger hover:bg-danger/15 rounded-lg"
                  onClick={() => {
                    setConfirmClear(false);
                    mutate("clear", clearCart);
                  }}
                >
                  Yes, Clear
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 text-muted hover:text-ink font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-xs font-semibold text-muted hover:text-danger flex items-center gap-1.5 transition-colors px-2 py-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear entire cart
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Order Summary */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft space-y-5">
            <h2 className="text-lg font-bold text-ink flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Order Summary
            </h2>

            {/* Breakdown */}
            <div className="space-y-2.5 text-xs sm:text-sm border-b border-line pb-4">
              <div className="flex justify-between text-muted">
                <span>Items Subtotal ({totals.totalItems} items)</span>
                <span className="font-bold text-ink">
                  ₦{totals.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Direct Seller Delivery</span>
                <span className="font-semibold text-primary">Arranged with Seller</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Delivery arrangements (courier or pickup) and costs are confirmed directly with each seller during checkout.
              </p>
            </div>

            {/* Coupon Promo Section */}
            <div className="pt-1">
              <label htmlFor="cartCoupon" className="block text-xs font-bold text-ink mb-1.5">
                Have a Promo Code or Voucher?
              </label>
              <div className="flex gap-2">
                <Input
                  id="cartCoupon"
                  placeholder="Enter promo code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  disabled={couponApplied}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 rounded-xl px-4 text-xs font-bold"
                  disabled={!couponCode.trim() || couponApplied}
                  onClick={() => {
                    setCouponApplied(true);
                    setNotice(`Promo "${couponCode.toUpperCase()}" will be verified during settlement.`);
                  }}
                >
                  {couponApplied ? "Applied" : "Apply"}
                </Button>
              </div>
            </div>

            {/* Total Estimated */}
            <div className="border-t border-line pt-4 flex items-baseline justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted font-bold block">
                  Estimated Total
                </span>
                <span className="text-[10px] text-muted">Excludes external dispatch fee</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-primary">
                ₦{totals.subtotal.toLocaleString()}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2.5 pt-2">
              <Link href="/checkout" className="block">
                <Button full size="lg" className="rounded-2xl shadow-soft font-extrabold text-sm sm:text-base">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button variant="outline" full size="md" className="rounded-2xl text-xs sm:text-sm">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>

          {/* Safety & Direct Settlement Assurance */}
          <div className="rounded-3xl border border-line bg-sunken/60 p-5 space-y-3 text-xs shadow-soft">
            <div className="flex items-center gap-2 font-bold text-ink">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Nigerian Marketplace Protection</span>
            </div>
            <ul className="space-y-2 text-muted leading-relaxed text-[11px] sm:text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Pay on Delivery / Meetup:</strong> Inspect your items in person or settle with the dispatch rider.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Handshake className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Price Am Bargaining:</strong> Click &quot;Price Am&quot; on any item to negotiate directly before purchasing.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Truck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Multi-Vendor Dispatch:</strong> Each seller packages and dispatches their items independently.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
