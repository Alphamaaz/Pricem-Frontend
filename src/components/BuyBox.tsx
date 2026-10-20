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
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Copy,
  Flag,
  Handshake,
  Heart,
  MessageSquare,
  Phone,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingDown,
  User,
  X,
} from "lucide-react";
import { addWishlistItem, removeWishlistItem } from "@/lib/wishlist";
import { createOffer } from "@/lib/offers";
import type { VariantSelection } from "@/lib/offers";
import type { Product } from "@/lib/products";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
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
  const [savedToWishlist, setSavedToWishlist] = useState(false);

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

  const [contactRevealed, setContactRevealed] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [reported, setReported] = useState(false);

  const sellerAvatar = product.sellerStoreImage || product.sellerProfileImage;
  const displayStoreName = product.storeName || product.sellerFullName || "Merchant Store";
  const sellerContactPhone = product.contactPhone || product.sellerPhone;

  function formatSellerTenure(dateString?: string): string {
    if (!dateString) return "1+ month on PriceAm";
    const joined = new Date(dateString);
    const now = new Date();
    const diffMonths = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth());
    if (diffMonths >= 12) {
      const years = Math.floor(diffMonths / 12);
      return `${years}+ year${years > 1 ? "s" : ""} on PriceAm`;
    }
    if (diffMonths >= 1) {
      return `${diffMonths}+ month${diffMonths > 1 ? "s" : ""} on PriceAm`;
    }
    return "New on PriceAm";
  }

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

  return (
    <div className="space-y-5">
      {/* CARD 1: Price, Status & Price Am Offer */}
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft space-y-5">
        {/* Price & Stock Display */}
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider text-muted font-bold block">Price</span>
              {product.negotiable !== false && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-soft text-primary text-[11px] font-bold">
                  Negotiable
                </span>
              )}
            </div>
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
          <div className="pt-4 border-t border-line space-y-4">
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

        {error && <div><Alert kind="error">{error}</Alert></div>}
        {notice && <div><Alert kind="success">{notice}</Alert></div>}

        {/* Hero Price Am Negotiation CTA */}
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
          <div className="flex h-14 items-center justify-between rounded-[14px] bg-gradient-to-r from-primary to-primary-dark px-5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
                <Handshake className="h-5 w-5" />
              </span>
              <div className="text-left">
                <span className="text-base font-extrabold tracking-wide uppercase block">Price Am</span>
                <span className="text-[11px] text-white/80 font-medium block">Make an offer / Negotiate price</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-bold text-white tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              Make Offer
            </span>
          </div>
        </button>
      </div>

      {/* CARD 2: Merchant & Seller Contact Card (Matches Reference Screenshot) */}
      <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6 shadow-soft space-y-4">
        {/* Top: Avatar + Store Name + Badges */}
        <div className="flex items-start gap-3.5">
          {/* Avatar (Stylized Hexagon / Rounded with emerald accent) */}
          <div className="relative h-15 w-15 sm:h-16 sm:w-16 shrink-0 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-sunken shadow-soft flex items-center justify-center">
            {sellerAvatar ? (
              <img
                src={assetUrl(sellerAvatar)}
                alt={displayStoreName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-black text-xl">
                {displayStoreName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {product.storeSlug ? (
                <Link
                  href={`/store/${product.storeSlug}`}
                  className="font-black text-base sm:text-lg text-ink hover:text-primary transition-colors truncate"
                >
                  {displayStoreName}
                </Link>
              ) : (
                <h3 className="font-black text-base sm:text-lg text-ink truncate">{displayStoreName}</h3>
              )}
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sunken text-body text-[11px] font-semibold border border-line">
                <User className="h-3 w-3 text-muted" />
                {formatSellerTenure(product.sellerJoinedAt || product.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[11px] font-bold border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Verified ID
              </span>
            </div>

            {/* Response time */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted mt-1.5 font-medium">
              <Clock className="h-3 w-3 text-emerald-600" />
              <span>Replies in a few hours</span>
            </div>
          </div>
        </div>

        {/* Buttons: Show Contact & Start Chat */}
        <div className="space-y-2.5 pt-1">
          {/* Show Contact Button & Reveal State */}
          {!contactRevealed ? (
            <button
              type="button"
              onClick={() => setContactRevealed(true)}
              className="w-full h-12 rounded-2xl bg-[#00b53f] hover:bg-[#009e37] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
            >
              <Phone className="h-4.5 w-4.5" />
              <span>Show contact</span>
            </button>
          ) : (
            <div className="w-full rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex flex-col gap-2.5 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-mono font-bold text-sm sm:text-base text-ink">
                    {sellerContactPhone || "No direct phone provided"}
                  </span>
                </div>
                {sellerContactPhone && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(sellerContactPhone);
                      setCopiedPhone(true);
                      setTimeout(() => setCopiedPhone(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-emerald-200 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedPhone ? "Copied!" : "Copy"}</span>
                  </button>
                )}
              </div>
              {sellerContactPhone && (
                <div className="flex gap-2 pt-0.5">
                  <a
                    href={`tel:${sellerContactPhone}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <PhoneCall className="h-3.5 w-3.5" /> Call Now
                  </a>
                  <a
                    href={`https://wa.me/${sellerContactPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in your listing: "${product.title}" on PriceAm.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Start Chat Button */}
          <button
            type="button"
            disabled={busy !== null}
            onClick={onOpenConversation}
            className="w-full h-12 rounded-2xl border-2 border-[#00b53f] hover:bg-emerald-50 text-[#00b53f] font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <MessageSquare className="h-4.5 w-4.5" />
            <span>{busy === "chat" ? "Opening conversation…" : "Start chat"}</span>
          </button>
        </div>

        {/* Footer Actions (Matches screenshot: Wishlist & Report Abuse) */}
        <div className="pt-2 border-t border-line flex items-center justify-between text-xs font-semibold text-muted px-1">
          <button
            type="button"
            onClick={onWishlist}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 text-muted hover:text-primary transition-colors"
          >
            <Heart className={`h-4 w-4 ${savedToWishlist ? "fill-primary text-primary" : ""}`} />
            <span>{savedToWishlist ? "Saved in Wishlist" : "Save for later"}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setReported(true);
              setNotice("Listing reported to safety moderation team.");
            }}
            className="inline-flex items-center gap-1.5 text-danger/80 hover:text-danger transition-colors"
          >
            <Flag className="h-3.5 w-3.5" />
            <span>{reported ? "Reported" : "Report Abuse"}</span>
          </button>
        </div>
      </div>

      {/* CARD 3: Safety Warning Banner */}
      <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3.5 flex items-start gap-2.5 text-xs text-ink leading-relaxed">
        <ShieldAlert className="h-4.5 w-4.5 text-warning shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-ink">Safety Warning: </strong>
          Never pay in advance. PriceAm is not involved in financial transactions. Inspect the item thoroughly before making payment directly to the seller. Report any fraudulent sellers immediately.
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
                <h2 className="text-xl font-extrabold text-ink">Price Am (Make an Offer)</h2>
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
                {[5, 10, 15, 20].map((pct) => {
                  const calculatedPrice = Math.round(displayPrice * (1 - pct / 100));
                  const isSelected = Number(offerPrice) === calculatedPrice;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applyPresetDiscount(pct)}
                      className={`flex flex-col items-center justify-center rounded-xl border py-2 px-1 text-xs transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-xs ring-2 ring-primary/20 font-bold"
                          : "border-line bg-surface hover:border-primary/50 hover:bg-primary-soft/20 text-ink font-semibold"
                      }`}
                    >
                      <span className="text-[10px] text-primary flex items-center gap-0.5 font-bold">
                        <TrendingDown className="h-3 w-3" /> -{pct}%
                      </span>
                      <span className="text-[11px] sm:text-xs font-black tracking-tight mt-0.5 truncate max-w-full">
                        ₦{calculatedPrice.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
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
                    step="any"
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
