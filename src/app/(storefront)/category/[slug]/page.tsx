import type { Metadata } from "next";
import { listProductsServer } from "@/lib/products";
import { MarketplaceCatalog } from "@/components/MarketplaceCatalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug[0].toUpperCase()}${slug.slice(1)} Deals · Pricem` };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { products, total } = await listProductsServer({
    category: slug,
    limit: 36,
    sort: "featured",
  });

  const formattedName = slug.charAt(0).toUpperCase() + slug.slice(1);

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Department Category</span>
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-1">
          {formattedName}
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Explore bargain deals on {formattedName.toLowerCase()} across Nigeria. Filter by state, price, or condition.
        </p>
      </div>

      <MarketplaceCatalog
        initialProducts={products}
        initialTotal={total}
        initialCategory={slug}
      />
    </div>
  );
}
