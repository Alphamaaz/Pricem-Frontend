import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Store } from "lucide-react";
import { listProductsServer } from "@/lib/products";
import { MarketplaceCatalog } from "@/components/MarketplaceCatalog";

export default async function HomePage() {
  const { products, total } = await listProductsServer({ limit: 36, sort: "featured" });
  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-soft sm:block">
        <div className="flex min-h-[148px] flex-col justify-between gap-5 p-5 sm:min-h-[160px] sm:flex-row sm:items-center sm:p-6 lg:px-8">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-4 text-[11px] font-bold text-muted">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> Across Nigeria</span>
              <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-success" /> Verified sellers</span>
            </div>
            <h1 className="text-2xl font-black leading-tight tracking-[-0.025em] text-ink sm:text-3xl">
              Find it. <span className="text-primary">Price Am.</span> Make the deal.
            </h1>
            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-body sm:text-sm">
              Browse nearby listings, send a numeric offer and connect after you agree.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a href="#catalog-section" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-extrabold text-white hover:bg-primary-dark active:scale-[.98]">
              Browse deals <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <Link href="/seller/onboarding" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-cream px-4 text-xs font-bold text-ink hover:border-primary hover:text-primary">
              <Store className="h-3.5 w-3.5" /> Sell
            </Link>
          </div>
        </div>
      </section>
      <MarketplaceCatalog initialProducts={products} initialTotal={total} />
    </div>
  );
}
