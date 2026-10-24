import { notFound } from "next/navigation";
import { CheckCircle2, MapPin, ShieldAlert, Star, Store } from "lucide-react";
import { listProductsServer } from "@/lib/products";
import { listSellerReviewsServer } from "@/lib/reviews";
import { assetUrl } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";
import { StoreProfileActions } from "@/components/StoreProfileActions";

export default async function PublicStorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await listProductsServer({ storeSlug: slug, limit: 24, sort: "newest" });
  const products = result.products;
  if (!products.length) notFound();

  const seller = products[0];
  const reviewResult = await listSellerReviewsServer(seller.seller);
  const reviews = reviewResult.reviews;
  const rating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : (seller.sellerRatingAverage || 0);
  const ratingCount = seller.sellerRatingCount || reviewResult.total;
  const storeName = seller.storeName || seller.sellerFullName || "PriceAm Store";
  const storeImage = seller.sellerStoreImage || seller.sellerProfileImage;
  const joined = seller.sellerJoinedAt || seller.createdAt;
  const memberSince = new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(new Date(joined));
  const locations = Array.from(new Set(products.map((product) => product.location?.state).filter(Boolean)));

  return (
    <div className="public-store-page">
      <section className="public-store-hero">
        <div className="public-store-avatar">
          {storeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(storeImage)} alt={`${storeName} store`} />
          ) : <span>{storeName.charAt(0).toUpperCase()}</span>}
        </div>
        <div className="public-store-identity">
          <div><h1>{storeName}</h1><span><CheckCircle2 /> Verified seller</span></div>
          <p>Member since {memberSince}</p>
          <div className="public-store-trust">
            <span><Star /> {ratingCount ? `${rating.toFixed(1)} (${ratingCount} reviews)` : "New seller"}</span>
            <span><Store /> {products.length} active {products.length === 1 ? "listing" : "listings"}</span>
            <span><MapPin /> {locations.length ? locations.join(", ") : "Nigeria"}</span>
          </div>
        </div>
        <StoreProfileActions productId={products[0]?._id} />
      </section>

      <section className="public-store-about">
        <div><h2>About this store</h2><p>Browse active listings from {storeName}. Use PriceAm chat to ask questions, agree on inspection or delivery, and keep the arrangement documented.</p></div>
        <aside><ShieldAlert /><p><strong>Trade safely.</strong> PriceAm does not currently collect payment. Inspect the item first and pay the seller directly only when satisfied.</p></aside>
      </section>

      <section className="public-store-listings">
        <div><h2>Store listings</h2><span>{products.length} available</span></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>
      </section>

      <section className="public-store-reviews">
        <div><h2>Buyer reviews</h2><span>{ratingCount ? `${rating.toFixed(1)} out of 5` : "No reviews yet"}</span></div>
        {reviews.length ? <div>{reviews.map((review) => <article key={review._id}><div><strong>{typeof review.buyer === "string" ? "Verified buyer" : review.buyer.fullName}</strong><span><Star /> {review.rating}/5</span></div>{review.text && <p>{review.text}</p>}<small>Verified completed deal · {new Date(review.createdAt).toLocaleDateString("en-NG")}</small></article>)}</div> : <p className="public-store-empty">This seller has not received a review from a completed PriceAm deal yet.</p>}
      </section>
    </div>
  );
}
