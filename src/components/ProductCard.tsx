"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Handshake, Heart, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";
import { assetUrl, PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/api";
import type { Product } from "@/lib/products";

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
}

export function ProductCard({ product, viewMode = "grid" }: ProductCardProps) {
  const isNegotiable = product.negotiable !== false;
  const locationText = product.location?.state
    ? product.location.city
      ? `${product.location.city}, ${product.location.state}`
      : product.location.state
    : "Nigeria";
  const listedDate = new Date(product.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" });

  const mobileCard = (
    <article className="overflow-hidden rounded-[1.15rem] bg-surface shadow-[0_3px_12px_rgba(36,27,18,.10)] sm:hidden">
      <Link href={`/products/${product._id}`} className="relative block aspect-[1.08/1] overflow-hidden bg-sunken">
        <img
          src={product.coverImage?.url ? assetUrl(product.coverImage.url) : PRODUCT_IMAGE_PLACEHOLDER}
          alt={product.coverImage?.alt ?? product.title}
          loading="lazy"
          onError={(event) => {
            if (!event.currentTarget.src.endsWith(PRODUCT_IMAGE_PLACEHOLDER)) {
              event.currentTarget.src = PRODUCT_IMAGE_PLACEHOLDER;
            }
          }}
          className="h-full w-full object-cover"
        />
        <span className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-ink/45 text-white" aria-hidden>
          <Heart className="h-5 w-5" strokeWidth={2.2} />
        </span>
      </Link>
      <div className="p-3">
        <p className="text-lg font-bold tracking-tight text-primary">₦{product.price.toLocaleString()}</p>
        <Link href={`/products/${product._id}`} className="mt-1 block truncate text-[15px] font-medium text-ink">{product.title}</Link>
        <p className="mt-2 flex items-center gap-1 truncate text-[11px] text-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0 fill-muted text-muted" /> {locationText}
        </p>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
          <span className="rounded-md bg-sunken px-2 py-1 lowercase">{product.condition === "new" ? "new" : "used"}</span>
          <span>{listedDate}</span>
        </div>
      </div>
    </article>
  );

  if (viewMode === "list") {
    return (
      <>
      {mobileCard}
      <article className="group hidden rounded-2xl border-2 border-emerald-500/80 bg-surface transition-all duration-300 hover:border-emerald-600 hover:shadow-lifted sm:flex sm:flex-row sm:rounded-3xl">
        {/* Left / Top Image Container: Full-width on mobile, fixed horizontal column on sm+ */}
        <Link
          href={`/products/${product._id}`}
          className="relative w-full aspect-[16/10] sm:aspect-auto sm:w-64 md:w-72 lg:w-80 shrink-0 bg-sunken overflow-hidden block"
        >
          <img
            src={product.coverImage?.url ? assetUrl(product.coverImage.url) : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"}
            alt={product.coverImage?.alt ?? product.title}
            loading="lazy"
            onError={(e) => {
              const el = e.currentTarget;
              if (!el.src.includes("photo-1523275335684-37898b6baf30")) {
                el.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";
              }
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 items-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 text-sky-700 font-bold text-xs px-2.5 py-1 shadow-xs border border-sky-100">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
              Verified ID
            </span>
          </div>

          {/* Enterprise Label */}
          <div className="absolute bottom-2.5 left-2.5">
            <span className="inline-flex items-center rounded bg-white/90 backdrop-blur px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-ink shadow-xs">
              ENTERPRISE
            </span>
          </div>

          {/* Featured / Condition Tag */}
          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
            {product.isFeatured && (
              <span className="rounded-full bg-ink/90 backdrop-blur px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-soft">
                Featured
              </span>
            )}
          </div>
        </Link>

        {/* Right Details Container */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
          <div>
            {/* Title & Price Top Row */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 sm:gap-4">
              <Link href={`/products/${product._id}`} className="min-w-0 flex-1 group-hover:text-primary transition-colors">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-ink leading-snug line-clamp-2">
                  {product.title}
                </h3>
              </Link>
              <div className="shrink-0 sm:text-right">
                <span className="text-lg sm:text-2xl font-black text-emerald-600 block tracking-tight">
                  ₦ {product.price.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Description Snippet */}
            {product.description && (
              <p className="text-xs sm:text-sm text-muted line-clamp-2 leading-relaxed mt-2">
                {product.description}
              </p>
            )}

            {/* Attribute Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="rounded-lg bg-sunken px-3 py-1 text-xs font-semibold text-body border border-line/60">
                {product.condition === "new" ? "Brand New" : "Local Used"}
              </span>
              {product.brand && (
                <span className="rounded-lg bg-sunken px-3 py-1 text-xs font-semibold text-body border border-line/60">
                  {product.brand}
                </span>
              )}
              <span className="rounded-lg bg-sunken px-3 py-1 text-xs font-semibold text-body border border-line/60 capitalize">
                {product.category}
              </span>
              {isNegotiable && (
                <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary border border-primary/20 flex items-center gap-1">
                  <Handshake className="h-3 w-3" />
                  Price Am
                </span>
              )}
            </div>
          </div>

          {/* Footer Row: Location & Actions */}
          <div className="flex items-center justify-between pt-3 mt-4 border-t border-line/50 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5 font-medium text-muted">
              <MapPin className="h-3.5 w-3.5 text-muted/70" />
              <span>{locationText}</span>
            </span>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 text-sm" title="Top Verified Seller">
                👑
              </span>
              <Link
                href={`/products/${product._id}`}
                className="inline-flex h-8 items-center justify-center rounded-xl border border-line bg-surface px-3 text-xs font-bold text-ink hover:border-primary hover:text-primary transition-all"
              >
                View Details
              </Link>
              {isNegotiable && (
                <Link
                  href={`/products/${product._id}?negotiate=1`}
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-primary to-accent px-3.5 text-xs font-bold text-white shadow-soft hover:brightness-105 active:scale-95 transition-all"
                  title="Make an offer with Price Am"
                >
                  <Handshake className="h-3.5 w-3.5" />
                  <span>Price Am</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </article>
      </>
    );
  }

  // Grid view (Standard / 2-column on mobile)
  return (
    <>
    {mobileCard}
    <article className="group relative hidden h-full flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lifted sm:flex">
      {/* Product Image Cover */}
      <Link href={`/products/${product._id}`} className="relative aspect-[4/3] bg-sunken overflow-hidden block">
        <img
          src={product.coverImage?.url ? assetUrl(product.coverImage.url) : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"}
          alt={product.coverImage?.alt ?? product.title}
          loading="lazy"
          onError={(e) => {
            const el = e.currentTarget;
            if (!el.src.includes("photo-1523275335684-37898b6baf30")) {
              el.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80";
            }
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col gap-1 items-start">
          {product.isFeatured && (
            <span className="rounded-full bg-ink/90 backdrop-blur px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white shadow-soft">
              Featured
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider backdrop-blur border shadow-xs ${
              product.condition === "new"
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-800"
                : "bg-surface/90 border-line text-body"
            }`}
          >
            {product.condition === "new" ? "New" : "Used"}
          </span>
        </div>

        {/* Location Pin Bottom Left */}
        <div className="absolute bottom-2 left-2 sm:bottom-2.5 sm:left-2.5">
          <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-white">
            <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white/80" />
            <span className="truncate max-w-[70px] xs:max-w-[85px] sm:max-w-[110px]">{product.location?.state || "Nigeria"}</span>
          </span>
        </div>

        {/* Negotiable Tag Bottom Right */}
        {isNegotiable && (
          <div className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5">
            <span className="inline-flex items-center gap-0.5 sm:gap-1 rounded-full bg-white/95 backdrop-blur px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black text-primary shadow-soft border border-line">
              <Handshake className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" strokeWidth={2.2} />
              <span className="hidden xs:inline">Price Am</span>
              <span className="xs:hidden">Offer</span>
            </span>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between gap-2 sm:gap-3">
        <div className="space-y-1 min-w-0">
          {/* Store Name & Ratings */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-muted">
            <span className="truncate hover:text-primary transition-colors font-medium max-w-[70%]">
              {product.storeName}
            </span>
            {product.ratingCount > 0 ? (
              <span className="flex items-center gap-0.5 font-bold text-ink shrink-0">
                <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-accent text-accent" />
                {product.ratingAverage.toFixed(1)}
              </span>
            ) : (
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted/70 truncate">
                {product.category}
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/products/${product._id}`} className="block">
            <h3 className="text-xs sm:text-sm font-bold text-ink leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Pricing & Quick Action */}
        <div className="pt-1.5 sm:pt-2 border-t border-line/60 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-muted block leading-none">
              Price
            </span>
            <span className="text-xs sm:text-base font-black text-ink mt-0.5 block tracking-tight truncate">
              ₦{product.price.toLocaleString()}
            </span>
          </div>

          {isNegotiable ? (
            <Link
              href={`/products/${product._id}?negotiate=1`}
              className="inline-flex h-7 sm:h-8 items-center gap-1 rounded-xl bg-primary/10 border border-primary/20 px-2 sm:px-3 text-[10px] sm:text-xs font-black text-primary hover:bg-primary hover:text-white transition-all shadow-xs active:scale-95 shrink-0"
              title="Negotiate with Price Am"
            >
              <Sparkles className="h-3 w-3" />
              <span>Price Am</span>
            </Link>
          ) : (
            <Link
              href={`/products/${product._id}`}
              className="inline-flex h-7 sm:h-8 items-center rounded-xl border border-line bg-surface px-2 sm:px-3 text-[10px] sm:text-xs font-bold text-ink hover:border-primary hover:text-primary transition-colors shadow-xs shrink-0"
            >
              <span>View</span>
            </Link>
          )}
        </div>
      </div>
    </article>
    </>
  );
}
