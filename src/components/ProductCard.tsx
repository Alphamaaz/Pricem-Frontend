"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Handshake, MapPin, Sparkles, Star, Store, Truck } from "lucide-react";
import { assetUrl } from "@/lib/api";
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

  if (viewMode === "list") {
    return (
      <article className="group rounded-3xl bg-surface border border-line overflow-hidden transition-all duration-200 hover:shadow-lifted hover:border-primary/40 flex flex-col sm:flex-row">
        {/* Left: Image Container */}
        <Link
          href={`/products/${product._id}`}
          className="relative w-full sm:w-64 sm:min-w-[16rem] aspect-[4/3] sm:aspect-auto bg-sunken overflow-hidden block shrink-0"
        >
          <img
            src={assetUrl(product.coverImage.url)}
            alt={product.coverImage.alt ?? product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {product.isFeatured && (
              <span className="rounded-full bg-ink/90 backdrop-blur px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-soft">
                Featured
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur border shadow-xs ${
                product.condition === "new"
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700"
                  : "bg-surface/90 border-line text-body"
              }`}
            >
              {product.condition === "new" ? "Brand New" : "Pre-Owned"}
            </span>
          </div>

          {isNegotiable && (
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[11px] font-black text-primary shadow-soft border border-line">
              <Handshake className="h-3.5 w-3.5 text-primary" strokeWidth={2.2} />
              Price Am
            </span>
          )}
        </Link>

        {/* Right: Content & Actions */}
        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1 font-semibold text-ink/80 hover:text-primary transition-colors">
                <Store className="h-3.5 w-3.5 text-primary" />
                {product.storeName}
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-muted">
                <MapPin className="h-3.5 w-3.5 text-muted" />
                {locationText}
              </span>
            </div>

            <Link href={`/products/${product._id}`} className="block group-hover:text-primary transition-colors">
              <h3 className="text-base font-bold text-ink leading-snug line-clamp-2">
                {product.title}
              </h3>
            </Link>

            <p className="text-xs text-muted line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Price, Delivery & Action */}
          <div className="pt-3 border-t border-line/60 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-ink">
                  ₦{product.price.toLocaleString()}
                </span>
                {isNegotiable && (
                  <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    Negotiable
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-1 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <Truck className="h-3 w-3 text-muted" />
                  {product.delivery?.mode === "seller_included" ? "Free Delivery" : "Buyer Arranges Delivery"}
                </span>
                {product.ratingCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-ink font-semibold">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    {product.ratingAverage.toFixed(1)} ({product.ratingCount})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/products/${product._id}`}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-line bg-surface px-4 text-xs font-bold text-ink hover:border-primary hover:text-primary transition-all shadow-xs"
              >
                View Details
              </Link>
              {isNegotiable && (
                <Link
                  href={`/products/${product._id}?negotiate=1`}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-accent px-4 text-xs font-black text-white shadow-soft hover:brightness-105 active:scale-95 transition-all"
                >
                  <Handshake className="h-3.5 w-3.5" />
                  Price Am
                </Link>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Grid view (Standard)
  return (
    <article className="group rounded-3xl bg-surface border border-line overflow-hidden transition-all duration-300 hover:shadow-lifted hover:-translate-y-1 hover:border-primary/40 h-full flex flex-col relative">
      {/* Product Image Cover */}
      <Link href={`/products/${product._id}`} className="relative aspect-[4/3] bg-sunken overflow-hidden block">
        <img
          src={assetUrl(product.coverImage.url)}
          alt={product.coverImage.alt ?? product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
          {product.isFeatured && (
            <span className="rounded-full bg-ink/90 backdrop-blur px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-soft">
              Featured
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur border shadow-xs ${
              product.condition === "new"
                ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-800"
                : "bg-surface/90 border-line text-body"
            }`}
          >
            {product.condition === "new" ? "New" : "Used"}
          </span>
        </div>

        {/* Location Pin Bottom Left */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-semibold text-white">
            <MapPin className="h-3 w-3 text-white/80" />
            <span className="truncate max-w-[110px]">{product.location?.state || "Nigeria"}</span>
          </span>
        </div>

        {/* Negotiable Tag Bottom Right */}
        {isNegotiable && (
          <div className="absolute bottom-2.5 right-2.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[10px] font-black text-primary shadow-soft border border-line">
              <Handshake className="h-3 w-3 text-primary" strokeWidth={2.2} />
              Price Am
            </span>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-1">
          {/* Store Name & Ratings */}
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span className="truncate hover:text-primary transition-colors font-medium">
              {product.storeName}
            </span>
            {product.ratingCount > 0 ? (
              <span className="flex items-center gap-0.5 font-bold text-ink shrink-0">
                <Star className="h-3 w-3 fill-accent text-accent" />
                {product.ratingAverage.toFixed(1)}
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold text-muted/70">
                {product.category}
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/products/${product._id}`} className="block">
            <h3 className="text-sm font-bold text-ink leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Pricing & Quick Action */}
        <div className="pt-2 border-t border-line/60 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted block leading-none">
              Price
            </span>
            <span className="text-base sm:text-lg font-black text-ink mt-0.5 block tracking-tight">
              ₦{product.price.toLocaleString()}
            </span>
          </div>

          {isNegotiable ? (
            <Link
              href={`/products/${product._id}?negotiate=1`}
              className="inline-flex h-8 items-center gap-1 rounded-xl bg-primary/10 border border-primary/20 px-3 text-xs font-black text-primary hover:bg-primary hover:text-white transition-all shadow-xs active:scale-95 shrink-0"
              title="Negotiate with Price Am"
            >
              <Sparkles className="h-3 w-3" />
              <span>Bargain</span>
            </Link>
          ) : (
            <Link
              href={`/products/${product._id}`}
              className="inline-flex h-8 items-center rounded-xl border border-line bg-surface px-3 text-xs font-bold text-ink hover:border-primary hover:text-primary transition-colors shadow-xs shrink-0"
            >
              <span>View</span>
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
