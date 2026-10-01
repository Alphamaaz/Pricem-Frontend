"use client";

/*
  Interactive BuyBox for the product detail page.
  Features:
  - "Price Am" numeric bargaining drawer with fast % discount presets
  - Direct Seller Contact reveal ("Show Contact / Call Seller")
  - Variant selection, Add to Cart, Buy Now, and Wishlist
  - Nigerian Marketplace Safety Tips
*/

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Handshake,
  Heart,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  X,
} from "lucide-react";
import { addCartItem } from "@/lib/cart";
import { addWishlistItem, removeWishlistItem } from "@/lib/wishlist";
import { createOffer } from "@/lib/offers";
import type { VariantSelection } from "@/lib/offers";
import type { Product } from "@/lib/products";
import { ApiRequestError, tokenStore } from "@/lib/api";
import { notifyCommerceChanged } from "@/lib/commerce-events";
import { openListingConversation } from "@/lib/chat";
import { Alert, Button, Input } from "@/components/ui";

export function BuyBox({ product }: { product: Product }) {
  const router = useRouter();
  const hasVariants = product.variants.length > 0;

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const isNegotiateParam = useSyncExternalStore(
    () => () => {},
    () => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("negotiate") === "1" : false),
    () => false
  );
  const [offerOpenManual, setOfferOpenManual] = useState<boolean | null>(null);
  const offerOpen = offerOpenManual ?? isNegotiateParam;
  const setOfferOpen = (val: boolean) => setOfferOpenManual(val);

  const [offerPrice, setOfferPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [savedToWishlist, setSavedToWishlist] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const allSelected =
    !hasVariants || product.variants.every((v) => selected[v.name]);

  const selections: VariantSelection[] = useMemo(
    () =>
      hasVariants
        ? Object.entries(selected).map(([name, value]) => ({ name, value }))
        : [],
    [hasVariants, selected],
  );

  /** Price/stock for the current selection — mirrors backend logic. */
  const { displayPrice, availableStock } = useMemo(() => {
    if (!hasVariants || !allSelected) {
      return { displayPrice: product.price, availableStock: product.stock };
    }
    const options = product.variants.map(
      (v) => v.options.find((o) => o.value === selected[v.name])!,
    );
    return {
      displayPrice: Math.max(...options.map((o) => o.price)),
      availableStock: Math.min(...options.map((o) => o.stock)),
    };
  }, [hasVariants, allSelected, selected, product]);

  const inStock = availableStock > 0;

  function requireAuthOrSelection(): boolean {
    setError(null);
    setNotice(null);
    if (!tokenStore.get()) {
      router.push("/login");
      return false;
    }
    if (!allSelected) {
      setError("Please select an option for each variant first.");
      return false;
    }
    return true;
  }

  function showApiError(err: unknown, fallback: string) {
    setError(err instanceof ApiRequestError ? err.message : fallback);
  }

  async function onAddToCart(goToCart = false) {
    if (!requireAuthOrSelection()) return;
    setBusy(goToCart ? "buy" : "cart");
    try {
      await addCartItem({
        productId: product._id,
        quantity: Math.min(quantity, availableStock),
        ...(selections.length ? { variantSelections: selections } : {}),
      });
      notifyCommerceChanged();
      if (goToCart) {
        router.push("/cart");
      } else {
        setNotice("Added to cart ✓");
      }
    } catch (err) {
      showApiError(err, "Could not add to cart.");
    } finally {
      setBusy(null);
    }
  }

  async function onWishlist() {
    setError(null);
    setNotice(null);
    if (!tokenStore.get()) {
      router.push("/login");
      return;
    }
    setBusy("wish");
    try {
      if (savedToWishlist) {
        await removeWishlistItem(product._id);
        setSavedToWishlist(false);
        notifyCommerceChanged();
        setNotice("Removed from wishlist.");
        return;
      }
      await addWishlistItem(product._id);
      setSavedToWishlist(true);
      notifyCommerceChanged();
      setNotice("Saved to wishlist ♥");
    } catch (err) {
      showApiError(err, "Could not save to wishlist.");
    } finally {
      setBusy(null);
    }
  }

  async function onOpenConversation() {
    setError(null);
    setNotice(null);
    if (!tokenStore.get()) {
      router.push("/login");
      return;
    }

    setBusy("chat");
    try {
      const response = await openListingConversation(product._id);
      router.push(`/conversations/${response.conversation._id}`);
    } catch (err) {
      showApiError(err, "Could not open the listing conversation.");
    } finally {
      setBusy(null);
    }
  }

  async function onSubmitOffer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!requireAuthOrSelection()) return;
    const numericPrice = Number(offerPrice);
    if (!numericPrice || numericPrice <= 0) {
      setError("Please enter a valid offer price.");
      return;
    }

    setBusy("offer");
    try {
      await createOffer({
        productId: product._id,
        price: numericPrice,
        ...(selections.length ? { variantSelections: selections } : {}),
      });
      setOfferOpen(false);
      setOfferPrice("");
      setNotice("Price Am offer submitted to seller! You will be notified when they accept or counter.");
      router.push("/offers?tab=buyer");
    } catch (err) {
      showApiError(err, "Could not submit Price Am offer.");
    } finally {
      setBusy(null);
    }
  }

  function applyPresetDiscount(percent: number) {
    const discounted = Math.round(displayPrice * (1 - percent / 100));
    setOfferPrice(String(discounted));
  }

  function handleCopyPhone(phone: string) {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft">
      {/* Price & Stock Display */}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted font-bold block mb-0.5">Price</span>
          <div className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            ₦{displayPrice.toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          {inStock ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success border border-success/20">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              In stock ({availableStock} left)
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger border border-danger/20">
              {allSelected ? "Out of stock" : "Select options"}
            </span>
          )}
        </div>
      </div>

      {/* Variant selection */}
      {hasVariants && (
        <div className="mt-5 pt-5 border-t border-line space-y-4">
          {product.variants.map((v) => (
            <div key={v.name}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">
                {v.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {v.options.map((o) => {
                  const active = selected[v.name] === o.value;
                  const out = o.stock <= 0;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      disabled={out}
                      onClick={() =>
                        setSelected((s) => ({ ...s, [v.name]: o.value }))
                      }
                      className={`rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? "border-primary bg-primary text-white shadow-soft"
                          : out
                            ? "border-line text-muted line-through opacity-50 cursor-not-allowed bg-sunken"
                            : "border-line text-body hover:border-primary hover:text-primary bg-surface"
                      }`}
                    >
                      {o.value} · ₦{o.price.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="mt-4"><Alert kind="error">{error}</Alert></div>}
      {notice && <div className="mt-4"><Alert kind="success">{notice}</Alert></div>}

      {/* Quantity Selector */}
      <div className="mt-5 flex items-center justify-between rounded-2xl bg-sunken p-3">
        <span className="text-xs font-bold uppercase tracking-wider text-body">Select Quantity</span>
        <div className="flex items-center rounded-xl border border-line bg-surface shadow-xs">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            disabled={quantity <= 1 || busy !== null}
            className="flex h-9 w-9 items-center justify-center text-body hover:text-primary disabled:opacity-30 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-sm font-bold text-ink">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.min(availableStock, current + 1))}
            disabled={quantity >= availableStock || busy !== null || !allSelected}
            className="flex h-9 w-9 items-center justify-center text-body hover:text-primary disabled:opacity-30 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div className="mt-5 space-y-3">
        {/* Row 1: PRICE AM (Bargaining Hero CTA) */}
        <button
          type="button"
          disabled={!inStock || busy !== null}
          onClick={() => {
            setError(null);
            setNotice(null);
            setOfferOpen(true);
          }}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-light to-accent p-0.5 shadow-soft hover:shadow-glow transition-all active:scale-[0.99] disabled:opacity-50"
        >
          <div className="flex h-13 items-center justify-between rounded-[14px] bg-gradient-to-r from-primary to-primary-dark px-5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-xs">
                <Handshake className="h-4.5 w-4.5" />
              </span>
              <div className="text-left">
                <span className="text-base font-extrabold tracking-wide uppercase block">Price Am</span>
                <span className="text-[11px] text-white/80 font-medium block">Negotiate your custom price</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Bargain
            </span>
          </div>
        </button>

        {/* Row 2: Buy Now + Add to Cart */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            full
            variant="dark"
            disabled={!inStock || busy !== null}
            loading={busy === "buy"}
            onClick={() => onAddToCart(true)}
            className="rounded-2xl"
          >
            Buy Now
          </Button>

          <Button
            size="lg"
            full
            variant="outline"
            disabled={!inStock || busy !== null}
            loading={busy === "cart"}
            onClick={() => onAddToCart(false)}
            className="rounded-2xl"
          >
            <ShoppingCart className="h-4 w-4" strokeWidth={2} />
            Add to Cart
          </Button>
        </div>

        {/* Row 3: Chat, Show Contact, Wishlist */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="md"
            full
            disabled={busy !== null}
            loading={busy === "chat"}
            onClick={onOpenConversation}
            className="rounded-xl border-line text-xs font-semibold"
          >
            <MessageCircle className="h-4 w-4 text-primary" strokeWidth={2} />
            Chat With Seller
          </Button>

          {/* Show Contact button (Jiji style) */}
          {(product.contactPhone || product.sellerPhone) && (
            <button
              type="button"
              onClick={() => setShowPhone((prev) => !prev)}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-xs font-semibold text-ink hover:border-primary hover:text-primary transition-colors"
            >
              <Phone className="h-3.5 w-3.5 text-success" />
              {showPhone ? "Hide Contact" : "Show Contact"}
            </button>
          )}

          <button
            type="button"
            onClick={onWishlist}
            disabled={busy !== null}
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              savedToWishlist
                ? "border-primary bg-primary-soft text-primary"
                : "border-line text-muted hover:border-primary hover:text-primary bg-surface"
            }`}
            aria-label={savedToWishlist ? "Saved" : "Save to wishlist"}
          >
            <Heart className={`h-4.5 w-4.5 ${savedToWishlist ? "fill-current" : ""}`} strokeWidth={2} />
          </button>
        </div>

        {/* Revealed Contact Card */}
        {showPhone && (product.contactPhone || product.sellerPhone) && (
          <div className="mt-3 rounded-2xl border border-success/30 bg-success-soft/40 p-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-success">Verified Seller Phone</span>
                <p className="text-base font-extrabold text-ink mt-0.5">{product.contactPhone || product.sellerPhone}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyPhone(product.contactPhone || product.sellerPhone!)}
                  className="inline-flex items-center gap-1 rounded-lg border border-success/30 bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-success-soft transition-colors"
                >
                  {copiedPhone ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 text-muted" />}
                  {copiedPhone ? "Copied" : "Copy"}
                </button>
                <a
                  href={`tel:${product.contactPhone || product.sellerPhone}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-success/90 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
              </div>
            </div>
            <p className="text-[11px] text-muted mt-2">
              Mention Pricem when contacting the seller. Settle payments safely on delivery/inspection.
            </p>
          </div>
        )}
      </div>

      {/* Safety Notice Box */}
      <div className="mt-5 rounded-2xl border border-line bg-sunken/60 p-3.5 flex items-start gap-2.5">
        <ShieldCheck className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-body leading-relaxed">
          <strong className="text-ink font-semibold">Pricem Safety Tip: </strong>
          Do not make advance prepayments. Negotiate via <span className="font-semibold text-primary">Price Am</span>, inspect the item in person or upon delivery, and settle payment directly.
        </div>
      </div>

      {/* "Price Am" Negotiation Modal */}
      {offerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs px-4"
          onClick={() => setOfferOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-surface p-6 shadow-2xl relative border border-line animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOfferOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-sunken hover:text-ink transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-soft">
                <Handshake className="h-5 w-5" strokeWidth={2} />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-ink">Price Am (Bargain)</h2>
                <p className="text-xs text-muted">Make a numeric offer to the seller</p>
              </div>
            </div>

            {/* Product summary card */}
            <div className="mt-4 rounded-2xl border border-line bg-sunken/60 p-3.5 flex items-center justify-between">
              <div className="truncate pr-2">
                <p className="text-xs text-muted font-medium truncate">{product.title}</p>
                <p className="text-sm font-bold text-ink">
                  Listed Price: ₦{displayPrice.toLocaleString()}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-1 shrink-0">
                Official Listing
              </span>
            </div>

            {/* Discount preset chips */}
            <div className="mt-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-2">
                Quick Discount Presets
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => applyPresetDiscount(pct)}
                    className="flex flex-col items-center justify-center rounded-xl border border-line bg-surface py-2 text-xs hover:border-primary hover:bg-primary-soft/30 transition-all font-semibold text-ink"
                  >
                    <span className="text-[10px] text-primary flex items-center gap-0.5">
                      <TrendingDown className="h-3 w-3" /> -{pct}%
                    </span>
                    <span>₦{(Math.round(displayPrice * (1 - pct / 100)) / 1000).toFixed(0)}k</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Form */}
            <form onSubmit={onSubmitOffer} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-ink block mb-1.5">
                  Enter Your Proposed Price (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">
                    ₦
                  </span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="100"
                    step="100"
                    required
                    autoFocus
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder={String(Math.round(displayPrice * 0.9))}
                    className="h-14 pl-10 text-xl font-extrabold text-ink rounded-2xl border-line-strong focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Rules banner */}
              <div className="rounded-xl bg-sunken p-3 text-[11px] text-body leading-relaxed border border-line">
                <strong className="text-ink font-semibold">How Price Am works: </strong>
                Your offer is strictly numeric. The seller can accept your price or propose a counter-offer. Once agreed, you can click &quot;Buy&quot; to open the Transaction Chat.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  size="lg"
                  full
                  disabled={busy === "offer"}
                  loading={busy === "offer"}
                  className="rounded-2xl bg-primary text-white font-bold"
                >
                  Send Price Am Offer
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => setOfferOpen(false)}
                  className="rounded-2xl"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
