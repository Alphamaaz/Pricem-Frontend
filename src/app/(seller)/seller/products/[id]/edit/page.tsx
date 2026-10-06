"use client";

/*
  Edit listing — partial multipart PATCH to /products/:id.
  Only changed/filled fields are sent; new images replace the old ones
  only when a file is picked. Products with variants must manage price
  and stock inside their variant options (backend enforces this).
*/

import Link from "next/link";
import { X } from "lucide-react";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyProduct, updateProduct, CATEGORIES, NIGERIAN_STATES } from "@/lib/products";
import type { Product } from "@/lib/products";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { Alert, Button, Input, Label } from "@/components/ui";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [newMediaCount, setNewMediaCount] = useState(0);
  const [retainedMediaUrls, setRetainedMediaUrls] = useState<string[]>([]);
  const [retainedImageUrls, setRetainedImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    getMyProduct(id)
      .then((p) => {
        if (!p) {
          setNotFound(true);
          return;
        }
        setProduct(p);
        setRetainedMediaUrls((p.media ?? []).map((item) => item.url));
        setRetainedImageUrls((p.images ?? []).map((item) => item.url));
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 403) {
          router.replace("/seller/onboarding");
        } else {
          router.replace("/login");
        }
      });
  }, [id, router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!product) return;
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    form.set("retainedMediaUrls", JSON.stringify(retainedMediaUrls));
    form.set("retainedImageUrls", JSON.stringify(retainedImageUrls));

    // Send only filled fields — empty optional inputs must not hit the API.
    for (const key of ["minPrice", "brand", "warranty", "contactPhone", "state", "city", "addressNote"]) {
      if (!String(form.get(key) ?? "").trim()) form.delete(key);
    }
    // Drop untouched file inputs so existing images are kept.
    const cover = form.get("coverImage") as File | null;
    if (!cover || cover.size === 0) form.delete("coverImage");
    const media = form.getAll("media") as File[];
    if (media.every((f) => f.size === 0)) form.delete("media");
    // Variant products manage price/stock inside options — never send them.
    if (product.variants.length > 0) {
      form.delete("price");
      form.delete("minPrice");
      form.delete("stock");
    }

    try {
      await updateProduct(product._id, form);
      router.push("/seller/products?updated=1");
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.errors?.length) {
          setFieldErrors(
            Object.fromEntries(err.errors.map((e) => [e.field, e.message])),
          );
          setError("Please fix the highlighted fields.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  }

  if (notFound) {
    return (
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="rounded-3xl bg-surface border border-line shadow-soft p-10 text-center max-w-md w-full">
          <h1 className="text-xl font-bold text-ink">Listing not found</h1>
          <p className="mt-2 text-sm text-muted">
            This product doesn&apos;t exist or belongs to another store.
          </p>
          <Link href="/seller/products" className="mt-6 inline-block">
            <Button variant="outline">Back to my products</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex-1 flex items-center justify-center py-24">
        <div className="h-8 w-40 rounded-full bg-sunken animate-pulse" />
      </main>
    );
  }

  const hasVariants = product.variants.length > 0;
  const existingMediaCount = retainedMediaUrls.length + retainedImageUrls.length;
  const remainingMediaSlots = Math.max(0, 7 - existingMediaCount);
  const visibleMedia = [
    ...(product.media ?? [])
      .filter((item) => retainedMediaUrls.includes(item.url))
      .map((item) => ({ ...item, source: "media" as const })),
    ...(product.images ?? [])
      .filter((item) => retainedImageUrls.includes(item.url))
      .map((item) => ({ ...item, type: "image" as const, source: "images" as const })),
  ];

  return (
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/seller/products"
        className="text-sm text-muted hover:text-primary"
      >
        ← My products
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-ink mb-6">Edit listing</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && <Alert kind="error">{error}</Alert>}

        {/* Photos */}
        <section className="rounded-3xl bg-surface border border-line shadow-soft p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink">Photos &amp; Media</h2>
          <div>
            <Label htmlFor="coverImage">Cover photo</Label>
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverPreview ?? assetUrl(product.coverImage.url)}
                alt="Cover"
                className="h-20 w-20 rounded-xl border border-line object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <input
                  id="coverImage"
                  name="coverImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setCoverPreview(f ? URL.createObjectURL(f) : null);
                  }}
                  className="block w-full text-sm text-body file:mr-3 file:rounded-full file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
                <p className="text-xs text-muted mt-1">
                  Leave empty to keep the current photo.
                </p>
              </div>
            </div>
            {fieldErrors.coverImage && (
              <p className="text-xs text-danger mt-1">{fieldErrors.coverImage}</p>
            )}
          </div>
          <div>
            <Label htmlFor="media">
              Add gallery photos or videos
            </Label>
            <input
              id="media"
              name="media"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
              multiple
              disabled={remainingMediaSlots === 0}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length > remainingMediaSlots) {
                  event.target.value = "";
                  setNewMediaCount(0);
                  setError(`You can add only ${remainingMediaSlots} more media file${remainingMediaSlots === 1 ? "" : "s"}. The cover counts toward the maximum of 8.`);
                  return;
                }
                setNewMediaCount(files.length);
              }}
              className="block w-full text-sm text-body file:mr-3 file:rounded-full file:border-0 file:bg-sunken file:px-4 file:py-2 file:text-sm file:font-semibold file:text-body"
            />
            {visibleMedia.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {visibleMedia.map((item) => (
                  <div key={`${item.source}-${item.url}`} className="relative aspect-square overflow-hidden rounded-xl border border-line bg-sunken">
                    {item.type === "video" ? (
                      <video src={assetUrl(item.url)} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={assetUrl(item.url)} alt={item.alt ?? product.title} className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${item.type}`}
                      title={`Remove ${item.type}`}
                      onClick={() => {
                        if (item.source === "media") {
                          setRetainedMediaUrls((urls) => urls.filter((url) => url !== item.url));
                        } else {
                          setRetainedImageUrls((urls) => urls.filter((url) => url !== item.url));
                        }
                      }}
                      className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/75 text-white shadow-sm transition hover:bg-danger focus:outline-none focus:ring-2 focus:ring-white"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {item.type === "video" && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">Video</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-muted">Removed media is deleted from the listing when you save changes.</p>
            <p className="text-xs text-muted mt-1">
              Maximum 8 files including the cover. {remainingMediaSlots} gallery slot{remainingMediaSlots === 1 ? "" : "s"} remaining{newMediaCount ? ` (${newMediaCount} selected)` : ""}. Each file can be up to 15 MB; MP4 videos must be 20 seconds or shorter.
            </p>
          </div>
        </section>

        {/* Details */}
        <section className="rounded-3xl bg-surface border border-line shadow-soft p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink">Listing details</h2>

          <div>
            <Label htmlFor="title">Listing title</Label>
            <Input id="title" name="title" required defaultValue={product.title} />
            {fieldErrors.title && (
              <p className="text-xs text-danger mt-1">{fieldErrors.title}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                required
                defaultValue={product.category}
                className="w-full h-11 rounded-xl border border-line bg-surface px-4 text-sm text-ink capitalize focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {(CATEGORIES.includes(
                  product.category as (typeof CATEGORIES)[number],
                )
                  ? CATEGORIES
                  : [product.category, ...CATEGORIES]
                ).map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <select
                id="condition"
                name="condition"
                required
                defaultValue={product.condition}
                className="w-full h-11 rounded-xl border border-line bg-surface px-4 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="new">New</option>
                <option value="used">Used</option>
              </select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                required
                defaultValue={product.status}
                className="w-full h-11 rounded-xl border border-line bg-surface px-4 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive (hidden)</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          {/* Brand & Warranty */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand / Manufacturer</Label>
              <Input
                id="brand"
                name="brand"
                defaultValue={product.brand ?? ""}
                placeholder="e.g. Apple, Samsung, Nike"
              />
            </div>
            <div>
              <Label htmlFor="warranty">Warranty / Return Policy</Label>
              <Input
                id="warranty"
                name="warranty"
                defaultValue={product.warranty ?? "7 Days Return / Inspection"}
                placeholder="e.g. 1 Month Store Warranty"
              />
            </div>
          </div>

          {/* Location & Contact */}
          <div className="pt-2 border-t border-line space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Item Location &amp; Contact</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="state">State (Nigeria)</Label>
                <select
                  id="state"
                  name="state"
                  defaultValue={product.location?.state ?? "Lagos"}
                  className="w-full h-11 rounded-xl border border-line bg-surface px-4 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="city">City / Area / LGA</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={product.location?.city ?? ""}
                  placeholder="e.g. Ikeja, Wuse 2"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Direct Phone / WhatsApp</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  defaultValue={product.contactPhone ?? ""}
                  placeholder="08012345678"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="addressNote">Meetup Landmark / Store Address</Label>
              <Input
                id="addressNote"
                name="addressNote"
                defaultValue={product.location?.addressNote ?? ""}
                placeholder="e.g. Computer Village Plaza or Mall"
              />
            </div>
          </div>

          {hasVariants ? (
            <Alert kind="success">
              This product uses variants — its price and stock come from the
              variant options, so they can&apos;t be edited here.
            </Alert>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price (₦)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  defaultValue={product.price}
                />
                {fieldErrors.price && (
                  <p className="text-xs text-danger mt-1">{fieldErrors.price}</p>
                )}
              </div>
              <div>
                <Label htmlFor="minPrice">Min. offer price (hidden)</Label>
                <Input
                  id="minPrice"
                  name="minPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Optional"
                  defaultValue={product.minPrice ?? ""}
                />
                {fieldErrors.minPrice && (
                  <p className="text-xs text-danger mt-1">
                    {fieldErrors.minPrice}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  required
                  defaultValue={product.stock}
                />
                {fieldErrors.stock && (
                  <p className="text-xs text-danger mt-1">{fieldErrors.stock}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              required
              defaultValue={product.description}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {fieldErrors.description && (
              <p className="text-xs text-danger mt-1">
                {fieldErrors.description}
              </p>
            )}
          </div>
        </section>

        {/* Shipping */}
        <section className="rounded-3xl bg-surface border border-line shadow-soft p-6 space-y-4">
          <h2 className="text-sm font-semibold text-ink">
            Shipping &amp; Delivery
          </h2>
          <p className="text-sm text-muted">PriceAm facilitates direct buyer-seller agreements. Settle delivery and payment arrangements directly upon inspection.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deliveryMode">Delivery responsibility</Label>
              <select
                id="deliveryMode"
                name="deliveryMode"
                required
                defaultValue={product.delivery.mode ?? "buyer_pays_externally"}
                className="w-full h-11 rounded-xl border border-line bg-surface px-4 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="seller_included">Seller pays — included in item price</option>
                <option value="buyer_pays_externally">Buyer pays courier separately</option>
              </select>
            </div>
            <div>
              <Label htmlFor="estimatedDeliveryDays">Estimated days</Label>
              <Input
                id="estimatedDeliveryDays"
                name="estimatedDeliveryDays"
                defaultValue={product.delivery.estimatedDays ?? ""}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="deliveryDetails">Delivery details</Label>
            <textarea id="deliveryDetails" name="deliveryDetails" rows={3} maxLength={500} defaultValue={product.delivery.details ?? ""} className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </section>

        <div className="flex gap-3">
          <Button type="submit" full loading={submitting}>
            Save changes
          </Button>
          <Link href="/seller/products" className="shrink-0">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </main>
  );
}
