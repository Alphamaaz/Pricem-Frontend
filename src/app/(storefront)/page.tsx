import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Handshake,
  Headphones,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";
import { listProductsServer } from "@/lib/products";
import { MarketplaceCatalog } from "@/components/MarketplaceCatalog";

const HOW_IT_WORKS = [
  {
    icon: Sparkles,
    title: "1. Find listings you like",
    body: "Browse thousands of ads across Nigeria from verified merchants and individual sellers.",
  },
  {
    icon: Handshake,
    title: "2. Name your price with Price Am",
    body: "Send a numeric bargain offer. The seller can accept or counter with zero spam chat.",
  },
  {
    icon: Truck,
    title: "3. Direct logistics & delivery",
    body: "Once an agreed price is locked, your transaction chat opens for delivery arrangement.",
  },
];

export default async function HomePage() {
  const { products, total } = await listProductsServer({ limit: 36, sort: "featured" });

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Sleek, Warm PriceAm Banner — Aligned with Warm Cream Theme & Compact Height */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-white via-cream to-primary-soft/50 p-5 sm:p-7 shadow-soft">
        {/* Subtle Ambient Brand Glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-5%] h-64 w-64 rounded-full bg-accent/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-[-5%] h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        />

        <div className="relative grid lg:grid-cols-[1.3fr_1fr] items-center gap-6 lg:gap-8">
          {/* Left Column: Brand Statement & Actions */}
          <div className="space-y-3 text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-surface border border-line shadow-xs px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-darker">
              <Handshake className="h-3.5 w-3.5 text-primary" />
              The negotiation-first marketplace
            </span>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink leading-[1.12] tracking-tight">
              Name your price.{" "}
              <span className="bg-gradient-to-r from-primary via-primary to-accent-dark bg-clip-text text-transparent">
                Own every deal.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-body/90 max-w-lg leading-relaxed">
              PriceAm is where buyers make numeric offers and sellers counter — agree on a price that works for both of you, then arrange direct delivery.
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <a
                href="#catalog-section"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-primary-dark to-primary px-5 text-xs sm:text-sm font-bold text-white shadow-glow hover:brightness-105 active:scale-95 transition-all"
              >
                Start shopping
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <Link
                href="/seller/onboarding"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface/90 px-5 text-xs sm:text-sm font-bold text-ink hover:border-primary hover:text-primary transition-colors shadow-xs"
              >
                <Store className="h-3.5 w-3.5" />
                Become a seller
              </Link>
            </div>
          </div>

          {/* Right Column: Scaled-Down Iconic Negotiation Showcase */}
          <div className="hidden lg:flex justify-end relative" aria-hidden>
            <div className="relative w-full max-w-[19rem] rounded-2xl bg-surface border border-line shadow-lifted p-4 rotate-[1deg]">
              {/* Product Info Strip */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-line">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-soft to-accent/30 flex items-center justify-center shrink-0">
                  <Headphones className="h-4.5 w-4.5 text-primary" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-ink truncate">
                    Wireless Headphones Pro
                  </p>
                  <p className="text-[11px] text-muted">
                    Listed at <span className="line-through">₦52,000</span>
                  </p>
                </div>
              </div>

              {/* Negotiation Step Rows */}
              <div className="pt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-sunken px-2.5 py-1 text-[11px] font-semibold text-body">
                    You offered
                  </span>
                  <span className="font-bold text-ink">₦42,000</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-darker">
                    Seller countered
                  </span>
                  <span className="font-bold text-ink">₦46,500</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-success-soft px-3 py-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-success">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Deal agreed
                  </span>
                  <span className="text-sm font-black text-success">
                    ₦44,000
                  </span>
                </div>
              </div>

              {/* Floating savings pill */}
              <div className="absolute -left-4 -top-3 rotate-[-4deg] rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 shadow-glow flex items-center gap-1">
                <ArrowDown className="h-3 w-3 text-white" strokeWidth={2.5} />
                <span className="text-[11px] font-black text-white">
                  You saved ₦8,000
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Marketplace Catalog with Filter Sidebar & Products (Immediately visible on screen!) */}
      <MarketplaceCatalog initialProducts={products} initialTotal={total} />

      {/* How it works — clean informational footer section below products */}
      <section className="rounded-3xl border border-line bg-surface p-5 sm:p-7 shadow-soft mt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xs space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-primary">How PriceAm Works</span>
            <h2 className="text-lg sm:text-xl font-black text-ink tracking-tight">Nigeria&apos;s Smartest Way to Trade</h2>
            <p className="text-xs text-muted leading-relaxed">
              No back-and-forth haggling chat. Offer your numeric budget, get accepted, and buy with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 flex-1">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-2xl bg-sunken/60 border border-line p-3.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-soft text-primary shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <h3 className="text-xs font-bold text-ink">{step.title}</h3>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
