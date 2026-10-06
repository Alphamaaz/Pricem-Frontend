import type { Metadata } from "next";
import { listProductsServer } from "@/lib/products";
import { MarketplaceCatalog } from "@/components/MarketplaceCatalog";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}" — Search Results · PriceAm` : "Browse Marketplace · PriceAm" };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const { products, total } = await listProductsServer({
    search: q || undefined,
    limit: 36,
    sort: "featured",
  });

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Marketplace Search</span>
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-1">
          {q ? `Search results for “${q}”` : "All Marketplace Listings"}
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Filter by Nigerian state, category, Price Am eligibility, or price range.
        </p>
      </div>

      <MarketplaceCatalog
        initialProducts={products}
        initialTotal={total}
        initialSearch={q}
      />
    </div>
  );
}
