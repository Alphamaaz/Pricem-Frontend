"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Heart,
  Handshake,
  MapPin,
  MessageSquare,
  Package,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Star,
  Store,
  Truck,
  X,
} from "lucide-react";
import type { Product } from "@/lib/products";
import { assetUrl, tokenStore } from "@/lib/api";
import { addWishlistItem, removeWishlistItem } from "@/lib/wishlist";
import { notifyCommerceChanged } from "@/lib/commerce-events";
import { openListingConversation } from "@/lib/chat";
import { createOffer } from "@/lib/offers";

export function MobileProductDetail({ product, rating, ratingCount }: { product: Product; rating: number; ratingCount: number }) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});

  const images = useMemo(() => {
    const candidates = [product.coverImage, ...(product.images || [])];
    return candidates.filter((item, index, list) => item?.url && list.findIndex((other) => other.url === item.url) === index);
  }, [product.coverImage, product.images]);
  const location = product.location?.state
    ? [product.location.city, product.location.state].filter(Boolean).join(", ")
    : "Nigeria";
  const date = new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(product.createdAt));
  const sellerName = product.storeName || product.sellerFullName || "PriceAm Seller";
  const sellerImage = product.sellerStoreImage || product.sellerProfileImage;
  const allVariantsSelected = product.variants.length === 0 || product.variants.every((variant) => selected[variant.name]);

  function requireLogin() {
    if (tokenStore.get()) return true;
    router.push("/login");
    return false;
  }

  async function toggleWishlist() {
    if (!requireLogin()) return;
    setBusy(true);
    try {
      if (saved) await removeWishlistItem(product._id);
      else await addWishlistItem(product._id);
      setSaved(!saved);
      notifyCommerceChanged();
    } finally { setBusy(false); }
  }

  async function openChat() {
    if (!requireLogin()) return;
    setBusy(true);
    try {
      const response = await openListingConversation(product._id);
      router.push(`/conversations/${response.conversation._id}`);
    } catch { setError("Could not open the seller chat. Please try again."); }
    finally { setBusy(false); }
  }

  async function submitOffer(event: React.FormEvent) {
    event.preventDefault();
    if (!requireLogin()) return;
    if (!allVariantsSelected) { setError("Select each product option before making an offer."); return; }
    const price = Number(offerPrice);
    if (!price || price <= 0) { setError("Enter a valid offer amount."); return; }
    setBusy(true);
    try {
      await createOffer({
        productId: product._id,
        price,
        variantSelections: Object.entries(selected).map(([name, value]) => ({ name, value })),
      });
      router.push("/offers?tab=buyer");
    } catch { setError("Your offer could not be sent. Please try again."); }
    finally { setBusy(false); }
  }

  async function shareProduct() {
    const data = { title: product.title, text: `See ${product.title} on PriceAm`, url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else await navigator.clipboard.writeText(window.location.href);
  }

  return (
    <article className="mobile-product-detail md:hidden">
      <header className="mobile-product-header">
        <button type="button" onClick={() => router.back()} aria-label="Go back"><ArrowLeft /></button>
        <strong>PRICE AM</strong>
        <div><button type="button" onClick={shareProduct} aria-label="Share product"><Share2 /></button><button type="button" disabled={busy} onClick={toggleWishlist} aria-label="Save product"><Heart className={saved ? "fill-primary text-primary" : ""} /></button></div>
      </header>

      <section className="mobile-product-gallery">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetUrl(images[activeImage]?.url || product.coverImage.url)} alt={product.title} />
        {images.length > 1 && <div className="mobile-product-dots">{images.map((image, index) => <button type="button" key={image.url} aria-label={`View image ${index + 1}`} className={index === activeImage ? "is-active" : ""} onClick={() => setActiveImage(index)} />)}</div>}
        <span className="mobile-product-count">▧ {activeImage + 1}/{images.length || 1}</span>
      </section>

      <section className="mobile-product-summary">
        <div className="mobile-product-meta"><span>{product.condition}</span>{ratingCount > 0 && <strong><Star /> {rating.toFixed(1)} ({ratingCount})</strong>}</div>
        <h1>{product.title}</h1>
        <p>Posted {date} in {product.category.replaceAll("-", " ")}</p>
        <div className="mobile-product-price">₦{product.price.toLocaleString()}</div>
      </section>

      <section className="mobile-product-facts" aria-label="Listing details">
        <div><MapPin /><span>Location<strong>{location}</strong></span></div>
        <div><Package /><span>Availability<strong>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</strong></span></div>
        <div><Handshake /><span>Price<strong>{product.negotiable !== false ? "Negotiable" : "Fixed price"}</strong></span></div>
        <div><Truck /><span>Delivery<strong>{product.delivery?.mode === "seller_included" ? "Seller arranged" : "Buyer and seller arrange"}</strong></span></div>
        {product.brand && <div><Store /><span>Brand<strong>{product.brand}</strong></span></div>}
        {product.warranty && <div><ShieldCheck /><span>Warranty<strong>{product.warranty}</strong></span></div>}
      </section>

      {product.variants.length > 0 && <section className="mobile-product-options"><h2>Choose options</h2>{product.variants.map((variant) => <div key={variant.name}><strong>{variant.name}</strong><div>{variant.options.map((option) => <button type="button" disabled={option.stock <= 0} className={selected[variant.name] === option.value ? "is-active" : ""} key={option.value} onClick={() => setSelected((current) => ({ ...current, [variant.name]: option.value }))}>{option.value}</button>)}</div></div>)}</section>}

      <section className="mobile-product-description"><h2>Description</h2><p>{product.description}</p></section>
      <aside className="mobile-product-safety"><ShieldAlert /><p><strong>Stay safe:</strong> Never pay before inspecting the item. Meet in a public place and pay the seller directly only after you are satisfied.</p></aside>

      <section className="mobile-product-seller">
        {sellerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={assetUrl(sellerImage)} alt="" />
        ) : <span>{sellerName.charAt(0).toUpperCase()}</span>}
        <div><h2>{sellerName}</h2><p><CheckCircle2 /> Verified seller{ratingCount > 0 ? ` · ${rating.toFixed(1)} rating` : ""}</p></div>
        {product.storeSlug && <Link href={`/store/${product.storeSlug}`}>View Profile</Link>}
      </section>

      {error && <p className="mobile-product-error">{error}</p>}
      <div className="mobile-product-actions"><button type="button" onClick={() => { setError(null); setOfferOpen(true); }} disabled={product.stock <= 0}><Handshake /> Make Offer</button><button type="button" onClick={openChat} disabled={busy}><MessageSquare /> Chat with Seller</button></div>

      {offerOpen && <div className="mobile-offer-layer" role="dialog" aria-modal="true" aria-label="Make an offer"><button type="button" className="mobile-offer-backdrop" onClick={() => setOfferOpen(false)} aria-label="Close offer form" /><form onSubmit={submitOffer} className="mobile-offer-sheet"><button type="button" className="mobile-offer-close" onClick={() => setOfferOpen(false)} aria-label="Close"><X /></button><h2>Make your offer</h2><p>Listed at ₦{product.price.toLocaleString()}</p><label htmlFor="mobile-offer-price">Your price (₦)</label><input id="mobile-offer-price" type="number" min="1" inputMode="numeric" value={offerPrice} onChange={(event) => setOfferPrice(event.target.value)} placeholder={String(Math.round(product.price * .9))} />{error && <span>{error}</span>}<button type="submit" disabled={busy}>Send Offer</button></form></div>}
    </article>
  );
}
