"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Gamepad2,
  Handshake,
  Headphones,
  Heart,
  Home as HomeIcon,
  LayoutGrid,
  List,
  MapPin,
  PackageOpen,
  Shirt,
  ShoppingCart,
  Sparkles,
  Store,
  Trash2,
} from "lucide-react";
import { clearWishlist, getWishlist, removeWishlistItem, type Wishlist } from "@/lib/wishlist";
import { addCartItem } from "@/lib/cart";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { notifyCommerceChanged } from "@/lib/commerce-events";
import { Button } from "@/components/ui";

const CATEGORY_LINKS = [
  { id: "electronics", label: "Electronics", icon: Headphones },
  { id: "fashion", label: "Fashion", icon: Shirt },
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "other", label: "General Goods", icon: Sparkles },
];

export default function WishlistPage() {
  const router = useRouter();

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  // Filters & Layout State
  const [activeFilter, setActiveFilter] = useState<"all" | "negotiable" | "instock">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    getWishlist()
      .then((res) => setWishlist(res.wishlist))
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  }

  async function onRemove(productId: string) {
    setBusyId(productId);
    setError(null);
    try {
      const res = await removeWishlistItem(productId);
      setWishlist(res.wishlist);
      notifyCommerceChanged();
      showSuccess("Item removed from your favorites.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Remove failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function onAddToCart(productId: string, hasVariants: boolean) {
    if (hasVariants) {
      router.push(`/products/${productId}`);
      return;
    }
    setBusyId(productId);
    setError(null);
    try {
      await addCartItem({ productId, quantity: 1 });
      notifyCommerceChanged();
      showSuccess("Added item to your shopping cart ✓");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not add to cart.");
    } finally {
      setBusyId(null);
    }
  }

  async function onClearAll() {
    if (!confirm("Are you sure you want to clear your entire wishlist?")) return;
    setClearing(true);
    setError(null);
    try {
      const res = await clearWishlist();
      setWishlist(res.wishlist);
      notifyCommerceChanged();
      showSuccess("Wishlist cleared.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to clear wishlist.");
    } finally {
      setClearing(false);
    }
  }

  async function onMoveAllInStockToCart() {
    if (!wishlist) return;
    const inStockItems = wishlist.items
      .filter((i) => i.product && i.product.stock > 0 && i.product.variants.length === 0);

    if (inStockItems.length === 0) {
      showSuccess("No simple in-stock items ready for direct cart transfer.");
      return;
    }

    setClearing(true);
    setError(null);
    try {
      for (const item of inStockItems) {
        if (item.product) {
          await addCartItem({ productId: item.product._id, quantity: 1 });
        }
      }
      notifyCommerceChanged();
      showSuccess(`Added ${inStockItems.length} items to your cart!`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to add items to cart.");
    } finally {
      setClearing(false);
    }
  }

  if (loading || !wishlist) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-muted font-bold tracking-wide uppercase">
          Loading your saved favorites…
        </p>
      </div>
    );
  }

  const allItems = wishlist.items.filter((i) => i.product);

  // Filter items
  const filteredItems = allItems.filter(({ product }) => {
    if (!product) return false;
    if (activeFilter === "negotiable") return product.negotiable !== false;
    if (activeFilter === "instock") return product.stock > 0;
    return true;
  });

  const negotiableCount = allItems.filter((i) => i.product?.negotiable !== false).length;
  const inStockCount = allItems.filter((i) => (i.product?.stock ?? 0) > 0).length;
  const totalValue = allItems.reduce((acc, i) => acc + (i.product?.price || 0), 0);

  // Empty State
  if (allItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12 sm:py-16 text-center space-y-6">
        <div className="relative mx-auto h-24 w-24 rounded-3xl bg-primary-soft/60 border border-primary/20 flex items-center justify-center text-primary shadow-glow">
          <Heart className="h-12 w-12 text-primary fill-primary/20 stroke-[1.75]" />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white shadow-soft">
            <Sparkles className="h-4 w-4" />
          </span>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
            Your Wishlist is Empty
          </h1>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Bookmark listings you love across Nigeria. When you&apos;re ready, submit a direct <strong>Price Am</strong> offer to negotiate your ideal price.
          </p>
        </div>

        {/* Quick Explore Departments */}
        <div className="pt-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-muted mb-3">
            Explore Popular Marketplace Categories
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
            {CATEGORY_LINKS.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.id}
                  href={`/category/${c.id}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-surface border border-line px-4 py-2.5 text-xs font-bold text-ink hover:border-primary hover:text-primary transition-all shadow-xs"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span>{c.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="pt-4">
          <Link href="/">
            <Button className="rounded-2xl px-7 h-11 text-xs sm:text-sm font-bold shadow-soft">
              Explore Featured Marketplace Deals
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* =================================================================== */}
      {/* 1. TOP HEADER & METRICS SUMMARY BANNER                              */}
      {/* =================================================================== */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-r from-white via-surface to-primary-soft/30 p-5 sm:p-7 shadow-soft">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl"
        />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Heading & Value Prop */}
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary">
                <Heart className="h-3.5 w-3.5 fill-primary" />
                Saved Favorites
              </span>
              <span className="text-xs text-muted font-bold">
                {allItems.length} {allItems.length === 1 ? "listing" : "listings"} saved
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
              Wishlist &amp; Deal Shortlist
            </h1>

            <p className="text-xs sm:text-sm text-body/80 leading-relaxed">
              Track your favorite products, monitor price drops, and jump directly into <strong>Price Am</strong> to make direct offers.
            </p>
          </div>

          {/* Right: Quick Action Stats & Batch Buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-[11px] text-muted block">Estimated Total</span>
                <strong className="text-base sm:text-lg font-black text-ink">
                  ₦{totalValue.toLocaleString()}
                </strong>
              </div>
              <div className="h-8 w-px bg-line" />
              <div className="text-left">
                <span className="text-[11px] text-muted block">Negotiable</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                  <Handshake className="h-3.5 w-3.5" />
                  {negotiableCount} items
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onMoveAllInStockToCart}
                disabled={clearing || inStockCount === 0}
                className="rounded-xl text-xs font-bold h-9"
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1 text-primary" />
                Cart All In-Stock ({inStockCount})
              </Button>
              <button
                type="button"
                onClick={onClearAll}
                disabled={clearing}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-bold text-muted hover:text-danger hover:border-danger/30 transition-colors"
                title="Clear all saved items"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Global Alerts / Toasts */}
      {successMsg && (
        <div className="rounded-2xl border border-success/30 bg-success-soft p-3.5 sm:p-4 flex items-center gap-3 text-xs sm:text-sm font-bold text-success animate-fade-in-up">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft p-3.5 sm:p-4 flex items-center gap-3 text-xs sm:text-sm font-bold text-danger animate-fade-in-up">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. FILTER TABS & VIEW CONTROLS TOOLBAR                              */}
      {/* =================================================================== */}
      <div className="rounded-2xl border border-line bg-surface p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "all"
                ? "bg-primary text-white shadow-soft"
                : "text-ink hover:bg-sunken/60"
            }`}
          >
            All Saved ({allItems.length})
          </button>
          <button
            onClick={() => setActiveFilter("negotiable")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === "negotiable"
                ? "bg-primary text-white shadow-soft"
                : "text-ink hover:bg-sunken/60"
            }`}
          >
            <Handshake className="h-3 w-3" />
            Price Am Only ({negotiableCount})
          </button>
          <button
            onClick={() => setActiveFilter("instock")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === "instock"
                ? "bg-primary text-white shadow-soft"
                : "text-ink hover:bg-sunken/60"
            }`}
          >
            In Stock ({inStockCount})
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 border border-line rounded-xl p-0.5 bg-sunken/60 ml-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === "grid"
                ? "bg-surface text-primary shadow-xs"
                : "text-muted hover:text-ink"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === "list"
                ? "bg-surface text-primary shadow-xs"
                : "text-muted hover:text-ink"
            }`}
            title="List View"
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. PRODUCT CARDS (GRID OR LIST VIEW)                                */}
      {/* =================================================================== */}
      {filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-line bg-surface p-12 text-center space-y-3 shadow-soft">
          <PackageOpen className="h-8 w-8 text-muted mx-auto" />
          <h3 className="text-base font-bold text-ink">No items match your filter</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Try switching to &quot;All Saved&quot; to see all bookmarked listings.
          </p>
          <Button variant="outline" size="sm" onClick={() => setActiveFilter("all")}>
            Show All Saved Items
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredItems.map(({ product }) => {
            const p = product!;
            const isNegotiable = p.negotiable !== false;
            const inStock = p.stock > 0;
            const locationText = p.location?.state
              ? p.location.city
                ? `${p.location.city}, ${p.location.state}`
                : p.location.state
              : "Nigeria";

            return (
              <article
                key={p._id}
                className="group rounded-3xl bg-surface border border-line shadow-soft overflow-hidden flex flex-col justify-between transition-all duration-200 hover:shadow-lifted hover:border-primary/40"
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="relative aspect-[4/3] bg-sunken overflow-hidden block">
                    <Link href={`/products/${p._id}`}>
                      <img
                        src={assetUrl(p.coverImage.url)}
                        alt={p.coverImage.alt ?? p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>

                    {/* Top Left Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur border shadow-xs ${
                          p.condition === "new"
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700"
                            : "bg-surface/90 border-line text-body"
                        }`}
                      >
                        {p.condition === "new" ? "Brand New" : "Pre-Owned"}
                      </span>
                    </div>

                    {/* Remove Heart Button */}
                    <button
                      type="button"
                      onClick={() => onRemove(p._id)}
                      disabled={busyId === p._id}
                      className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur text-danger shadow-soft hover:bg-danger hover:text-white transition-colors disabled:opacity-50"
                      title="Remove from favorites"
                    >
                      <Heart className="h-4 w-4 fill-danger" />
                    </button>

                    {/* Bottom Negotiable Chip */}
                    {isNegotiable && (
                      <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-0.5 text-[10px] font-black text-primary shadow-xs border border-line">
                        <Handshake className="h-3 w-3 text-primary" strokeWidth={2.2} />
                        Price Am
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <span className="inline-flex items-center gap-1 font-semibold text-ink/80 truncate max-w-[140px]">
                        <Store className="h-3 w-3 text-primary shrink-0" />
                        {p.storeName}
                      </span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <MapPin className="h-3 w-3 text-muted" />
                        {locationText}
                      </span>
                    </div>

                    <Link href={`/products/${p._id}`} className="block group-hover:text-primary transition-colors">
                      <h3 className="text-xs sm:text-sm font-bold text-ink leading-snug line-clamp-2">
                        {p.title}
                      </h3>
                    </Link>

                    {/* Price and Stock Row */}
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-base sm:text-lg font-black text-ink">
                        ₦{p.price.toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          inStock ? "text-success" : "text-danger"
                        }`}
                      >
                        {inStock ? "● In Stock" : "● Out of Stock"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3 pt-0 border-t border-line/50 mt-2 flex items-center gap-2">
                  {/* Direct Price Am Negotiate Link */}
                  {isNegotiable ? (
                    <Link
                      href={`/products/${p._id}?negotiate=1`}
                      className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary/10 border border-primary/25 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all shadow-xs"
                      title="Name your price with numeric offer"
                    >
                      <Handshake className="h-3.5 w-3.5" />
                      <span>Price Am</span>
                    </Link>
                  ) : null}

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={() => onAddToCart(p._id, p.variants.length > 0)}
                    disabled={busyId === p._id || !inStock}
                    className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all shadow-xs ${
                      isNegotiable
                        ? "bg-surface border border-line text-ink hover:border-primary hover:text-primary"
                        : "flex-1 bg-primary text-white hover:bg-primary-dark"
                    } disabled:opacity-40`}
                    title={inStock ? "Add to cart" : "Out of stock"}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{p.variants.length > 0 ? "Options" : "Cart"}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-3">
          {filteredItems.map(({ product }) => {
            const p = product!;
            const isNegotiable = p.negotiable !== false;
            const inStock = p.stock > 0;
            const locationText = p.location?.state
              ? p.location.city
                ? `${p.location.city}, ${p.location.state}`
                : p.location.state
              : "Nigeria";

            return (
              <article
                key={p._id}
                className="group rounded-3xl bg-surface border border-line p-3 sm:p-4 shadow-soft flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 transition-all hover:shadow-lifted hover:border-primary/40"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Link
                    href={`/products/${p._id}`}
                    className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-sunken overflow-hidden shrink-0 block"
                  >
                    <img
                      src={assetUrl(p.coverImage.url)}
                      alt={p.coverImage.alt ?? p.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {isNegotiable && (
                      <span className="absolute bottom-1 right-1 rounded-md bg-white/90 px-1.5 py-0.2 text-[9px] font-black text-primary">
                        ₦ Price Am
                      </span>
                    )}
                  </Link>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <span className="font-semibold text-primary">{p.storeName}</span>
                      <span>·</span>
                      <span>{locationText}</span>
                      <span>·</span>
                      <span className={inStock ? "text-success font-bold" : "text-danger font-bold"}>
                        {inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    <Link href={`/products/${p._id}`} className="block group-hover:text-primary transition-colors">
                      <h3 className="text-sm font-bold text-ink truncate">
                        {p.title}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-black text-ink">
                        ₦{p.price.toLocaleString()}
                      </span>
                      {isNegotiable && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.2 rounded-md">
                          Negotiable
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {isNegotiable && (
                    <Link
                      href={`/products/${p._id}?negotiate=1`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/25 px-3.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all"
                    >
                      <Handshake className="h-3.5 w-3.5" />
                      <span>Price Am</span>
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => onAddToCart(p._id, p.variants.length > 0)}
                    disabled={busyId === p._id || !inStock}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-bold text-white hover:bg-primary-dark transition-all disabled:opacity-40"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{p.variants.length > 0 ? "Options" : "Add to Cart"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemove(p._id)}
                    disabled={busyId === p._id}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-danger hover:border-danger/30 transition-colors"
                    title="Remove from favorites"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. BOTTOM DISCOVERY BANNER                                          */}
      {/* =================================================================== */}
      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1 max-w-lg">
          <h2 className="text-base sm:text-lg font-bold text-ink">
            Ready to negotiate or discover more?
          </h2>
          <p className="text-xs text-muted leading-relaxed">
            Thousands of ads across 36 Nigerian states are waiting for your offers.
          </p>
        </div>
        <Link href="/">
          <Button className="rounded-2xl px-6 h-10 text-xs sm:text-sm font-bold shadow-soft">
            Explore More Listings
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
