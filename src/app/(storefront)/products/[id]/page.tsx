import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Handshake,
  MapPin,
  Package,
  ShieldAlert,
  ShieldCheck,
  Star,
  Store,
  Tag,
  Truck,
} from "lucide-react";
import { getProductServer, listProductsServer } from "@/lib/products";
import { BuyBox } from "@/components/BuyBox";
import { ProductGallery } from "@/components/ProductGallery";
import { listProductReviewsServer, listSellerReviewsServer } from "@/lib/reviews";
import { listProductQuestionsServer } from "@/lib/questions";
import { PromotionActions } from "@/components/PromotionActions";
import { ProductQuestions } from "@/components/ProductQuestions";
import { ProductCard } from "@/components/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductServer(id);
  if (!product) return { title: "Listing Not Found · PriceAm" };
  return {
    title: `${product.title} · ₦${product.price.toLocaleString()} · PriceAm Nigeria`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { id } = await params;
  const { ref } = await searchParams;
  const product = await getProductServer(id);
  if (!product) notFound();

  const [reviewResult, sellerReviewResult, questionResult, relatedResult] = await Promise.all([
    listProductReviewsServer(id),
    listSellerReviewsServer(product.seller),
    listProductQuestionsServer(id),
    listProductsServer({ category: product.category, limit: 4, sort: "popular" }),
  ]);

  const listingMedia = product.media?.length
    ? product.media
    : product.images.map((image) => ({ ...image, type: "image" as const }));

  const locationText = product.location?.state
    ? product.location.city
      ? `${product.location.city}, ${product.location.state}`
      : `${product.location.state}, Nigeria`
    : "Nigeria";

  const relatedProducts = relatedResult.products.filter((p) => p._id !== id).slice(0, 3);

  return (
    <div className="space-y-10 sm:space-y-12 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-muted/60" />
        <Link
          href={`/category/${product.category}`}
          className="capitalize hover:text-primary transition-colors font-medium"
        >
          {product.category}
        </Link>
        <ChevronRight className="h-3 w-3 text-muted/60" />
        {product.location?.state && (
          <>
            <span className="hover:text-primary transition-colors">{product.location.state}</span>
            <ChevronRight className="h-3 w-3 text-muted/60" />
          </>
        )}
        <span className="text-ink font-semibold truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Showcase Section */}
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* ================================================================= */}
        {/* LEFT COLUMN: Media Gallery + Specifications + Detailed Description */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 space-y-8">
          {/* Enhanced Media Gallery */}
          <ProductGallery
            title={product.title}
            cover={product.coverImage}
            media={listingMedia}
            condition={product.condition}
            locationText={locationText}
            isNegotiable={product.negotiable !== false}
          />

          {/* Quick Specifications Highlights Grid */}
          <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Listing Specifications &amp; Overview
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl bg-sunken/60 p-3.5 border border-line space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted">Condition</span>
                <div className="font-extrabold text-ink capitalize flex items-center gap-1">
                  <span>{product.condition === "new" ? "Brand New (Sealed)" : "Pre-Owned"}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-sunken/60 p-3.5 border border-line space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted">Location</span>
                <div className="font-extrabold text-ink truncate">{locationText}</div>
              </div>

              <div className="rounded-2xl bg-sunken/60 p-3.5 border border-line space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted">Price Am Status</span>
                <div className="font-extrabold text-primary flex items-center gap-1">
                  <Handshake className="h-3.5 w-3.5" />
                  <span>{product.negotiable !== false ? "Negotiable" : "Fixed Price"}</span>
                </div>
              </div>

              {product.brand && (
                <div className="rounded-2xl bg-sunken/60 p-3.5 border border-line space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted">Brand</span>
                  <div className="font-extrabold text-ink">{product.brand}</div>
                </div>
              )}

              {product.warranty && (
                <div className="rounded-2xl bg-sunken/60 p-3.5 border border-line space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted">Warranty</span>
                  <div className="font-extrabold text-success flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{product.warranty}</span>
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-sunken/60 p-3.5 border border-line space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted">Stock Availability</span>
                <div className="font-extrabold text-ink">
                  {product.stock > 0 ? `${product.stock} units available` : "Out of stock"}
                </div>
              </div>
            </div>
          </section>

          {/* Description Section */}
          <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-3">
            <h2 className="text-base font-bold text-ink">Item Description</h2>
            <div className="prose prose-sm text-body/90 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
              {product.description}
            </div>
          </section>

          {/* Delivery & Logistics Arrangement Card */}
          <section className="rounded-3xl border border-line bg-surface p-6 shadow-soft space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Delivery &amp; Logistics Arrangement</h3>
                <p className="text-xs text-muted">
                  {product.delivery?.mode === "seller_included"
                    ? "Delivery is included in the agreed purchase price and handled by the merchant."
                    : "Direct Nigerian peer-to-peer delivery arranged after offer acceptance in Transaction Chat."}
                  {product.delivery?.estimatedDays ? ` Expected within ${product.delivery.estimatedDays}.` : ""}
                </p>
              </div>
            </div>
            {product.delivery?.details && (
              <div className="rounded-2xl bg-sunken p-3.5 text-xs text-muted border border-line mt-2">
                <strong className="text-ink">Seller Delivery Note:</strong> {product.delivery.details}
              </div>
            )}
          </section>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Sticky Executive BuyBox & Merchant Card             */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
          {/* Header Title & Store Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-primary">
                <Package className="h-3.5 w-3.5" />
                {product.category}
              </span>
              <span className="flex items-center gap-1 font-semibold text-muted">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {locationText}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Merchant Identity & Feedback */}
            <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-line px-3 py-1 text-xs font-semibold text-ink shadow-xs">
                <Store className="h-3.5 w-3.5 text-primary" />
                <span>{product.storeName}</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-success fill-success/20 ml-0.5" />
              </div>

              {(product.sellerRatingCount ?? 0) > 0 && (
                <div className="inline-flex items-center gap-1 text-xs font-bold text-ink">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  <span>{product.sellerRatingAverage?.toFixed(1)}</span>
                  <span className="text-muted font-normal">({product.sellerRatingCount} ratings)</span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive BuyBox (Variants, Price Am bargaining drawer, WhatsApp/Call) */}
          <BuyBox product={product} />

          {/* Promotion / Affiliate Share Actions */}
          <PromotionActions
            productId={product._id}
            referralCode={ref}
            enabled={Boolean(product.promotion?.enabled)}
          />

          {/* Safety & Direct Peer-to-Peer Advisory */}
          <div className="rounded-2xl border border-line bg-sunken/50 p-4 space-y-2 text-xs text-muted">
            <div className="flex items-center gap-2 font-bold text-ink">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              <span>PriceAm Safety Advisory</span>
            </div>
            <ul className="space-y-1 list-disc list-inside text-[11px] leading-relaxed">
              <li>Inspect items thoroughly upon delivery before confirming receipt.</li>
              <li>Keep all payment &amp; waybill receipts logged in the Transaction Chat.</li>
              <li>PriceAm Dispute Arbitration is available for all registered transactions.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* FULL WIDTH: Community Questions & Answers (Visible to All)        */}
      {/* ================================================================= */}
      <section className="pt-8 border-t border-line">
        <ProductQuestions
          productId={product._id}
          sellerId={product.seller}
          storeName={product.storeName}
          initialQuestions={questionResult.questions}
        />
      </section>

      {/* ================================================================= */}
      {/* FULL WIDTH: Customer Reviews & Seller Ratings                     */}
      {/* ================================================================= */}
      <div className="grid lg:grid-cols-2 gap-8 pt-4">
        {/* Item Reviews */}
        <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h2 className="text-base font-bold text-ink">Verified Buyer Reviews</h2>
              <p className="text-xs text-muted">Feedback from shoppers with completed orders.</p>
            </div>
            {product.ratingCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span>{product.ratingAverage.toFixed(1)} / 5.0</span>
                <span className="text-muted">({product.ratingCount})</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {reviewResult.reviews.map((review) => (
              <article key={review._id} className="rounded-2xl bg-sunken p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink">
                    {typeof review.buyer === "string" ? "Verified Buyer" : review.buyer.fullName}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-accent">
                    <Star className="h-3.5 w-3.5 fill-accent" />
                    {review.rating}/5
                  </span>
                </div>
                <p className="text-xs text-body leading-relaxed">{review.text}</p>
                <p className="text-[10px] text-muted">
                  Verified Purchase · {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </article>
            ))}
            {reviewResult.reviews.length === 0 && (
              <div className="rounded-2xl border border-dashed border-line p-8 text-center text-xs text-muted">
                No reviews recorded yet for this listing. Be the first to buy and review!
              </div>
            )}
          </div>
        </section>

        {/* Merchant Store Reputation */}
        <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h2 className="text-base font-bold text-ink">Merchant Reputation ({product.storeName})</h2>
              <p className="text-xs text-muted">Customer ratings for this store across all listings.</p>
            </div>
            {(product.sellerRatingCount ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Star className="h-4 w-4 fill-accent text-accent" />
                <span>{product.sellerRatingAverage?.toFixed(1)}</span>
                <span className="text-muted">({product.sellerRatingCount})</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {sellerReviewResult.reviews.map((review) => (
              <article key={review._id} className="rounded-2xl bg-sunken p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ink">Verified Customer</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-accent">
                    <Star className="h-3.5 w-3.5 fill-accent" />
                    {review.rating}/5
                  </span>
                </div>
                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {review.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-surface px-2 py-0.5 text-[10px] capitalize text-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {review.text && <p className="text-xs text-body leading-relaxed">{review.text}</p>}
              </article>
            ))}
            {sellerReviewResult.reviews.length === 0 && (
              <div className="rounded-2xl border border-dashed border-line p-8 text-center text-xs text-muted">
                This merchant does not have store ratings yet.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ================================================================= */}
      {/* RELATED LISTINGS IN THIS CATEGORY                                 */}
      {/* ================================================================= */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-line space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Discover More</span>
              <h2 className="text-xl sm:text-2xl font-black text-ink">Similar Listings You Might Like</h2>
            </div>
            <Link
              href={`/category/${product.category}`}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              View All {product.category} &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
