"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  DollarSign,
  Eye,
  ImagePlus,
  Info,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Store,
  Trash2,
  Truck,
  Video,
  X,
} from "lucide-react";
import { createProduct, CATEGORIES, NIGERIAN_STATES } from "@/lib/products";
import { ApiRequestError, tokenStore } from "@/lib/api";
import { Alert, Button, Input, Label } from "@/components/ui";

type LocalImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type VariantOptionDraft = {
  id: string;
  value: string;
  price: string;
  minPrice: string;
  stock: string;
  sku: string;
};

type VariantDraft = {
  id: string;
  name: string;
  options: VariantOptionDraft[];
};

const imageTypes = "image/jpeg,image/png,image/webp,image/gif";
const mediaTypes = `${imageTypes},video/mp4`;
const maxFileSize = 15 * 1024 * 1024;
const maxProductMedia = 8;
const maxGalleryMedia = maxProductMedia - 1;

const POPULAR_BRANDS = [
  "Apple", "Samsung", "Sony", "HP", "Dell", "Lenovo", "Nike", "Adidas", "Toyota", "Infinix", "Tecno", "Xiaomi", "Other"
];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function newOption(): VariantOptionDraft {
  return { id: createId(), value: "", price: "", minPrice: "", stock: "1", sku: "" };
}

function newVariant(): VariantDraft {
  return { id: createId(), name: "", options: [newOption()] };
}

export default function NewProductPage() {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const previewUrls = useRef(new Set<string>());

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Form states for Live Preview & submission
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0] || "electronics");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState<"new" | "used">("used");
  const [conditionDetail, setConditionDetail] = useState("Foreign Used (Clean)");
  const [warranty, setWarranty] = useState("7 Days Return / Inspection");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [allowPriceAm, setAllowPriceAm] = useState(true);

  // Location & Contact
  const [state, setState] = useState("Lagos");
  const [city, setCity] = useState("");
  const [addressNote, setAddressNote] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Delivery
  const [deliveryMode, setDeliveryMode] = useState<"buyer_pays_externally" | "seller_included">("buyer_pays_externally");
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState("1 - 3 Business Days");
  const [deliveryDetails, setDeliveryDetails] = useState("");

  // Media
  const [cover, setCover] = useState<LocalImage | null>(null);
  const [gallery, setGallery] = useState<LocalImage[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);

  useEffect(() => {
    if (!tokenStore.get()) router.replace("/login");
  }, [router]);

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function makeLocalImage(file: File): LocalImage {
    const previewUrl = URL.createObjectURL(file);
    previewUrls.current.add(previewUrl);
    return { id: createId(), file, previewUrl };
  }

  function releaseImage(image: LocalImage) {
    URL.revokeObjectURL(image.previewUrl);
    previewUrls.current.delete(image.previewUrl);
  }

  function onCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > maxFileSize) {
      setError("The cover photo must be 15 MB or smaller.");
      event.target.value = "";
      return;
    }
    setCover((current) => {
      if (current) releaseImage(current);
      return makeLocalImage(file);
    });
    setFieldErrors((current) => ({ ...current, coverImage: "" }));
    event.target.value = "";
  }

  async function onGalleryChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFiles.length) return;
    const remainingSlots = maxGalleryMedia - gallery.length;
    if (remainingSlots <= 0) {
      setError(`A listing can have at most ${maxProductMedia} media files including the cover.`);
      event.target.value = "";
      return;
    }
    const accepted: File[] = [];
    for (const file of selectedFiles) {
      if (file.size > maxFileSize) {
        setError(`'${file.name}' is larger than 15 MB.`);
        continue;
      }
      if (file.type === "video/mp4") {
        const duration = await new Promise<number>((resolve) => {
          const video = document.createElement("video");
          const url = URL.createObjectURL(file);
          video.preload = "metadata";
          video.onloadedmetadata = () => { resolve(video.duration); URL.revokeObjectURL(url); };
          video.onerror = () => { resolve(Number.POSITIVE_INFINITY); URL.revokeObjectURL(url); };
          video.src = url;
        });
        if (!Number.isFinite(duration) || duration > 20.05) {
          setError(`'${file.name}' must be a valid MP4 video no longer than 20 seconds.`);
          continue;
        }
      }
      if (accepted.length < remainingSlots) accepted.push(file);
    }
    if (selectedFiles.length > remainingSlots) setError(`Only ${remainingSlots} more file${remainingSlots === 1 ? "" : "s"} can be added. The maximum is ${maxProductMedia} including the cover.`);
    setGallery((current) => [...current, ...accepted.map(makeLocalImage)]);
    event.target.value = "";
  }

  function removeGalleryImage(id: string) {
    setGallery((current) => {
      const image = current.find((item) => item.id === id);
      if (image) releaseImage(image);
      return current.filter((item) => item.id !== id);
    });
  }

  function updateVariant(variantId: string, patch: Partial<VariantDraft>) {
    setVariants((current) => current.map((variant) => (
      variant.id === variantId ? { ...variant, ...patch } : variant
    )));
  }

  function updateOption(variantId: string, optionId: string, patch: Partial<VariantOptionDraft>) {
    setVariants((current) => current.map((variant) => (
      variant.id !== variantId
        ? variant
        : {
            ...variant,
            options: variant.options.map((option) => (
              option.id === optionId ? { ...option, ...patch } : option
            )),
          }
    )));
  }

  function addOption(variantId: string) {
    setVariants((current) => current.map((variant) => (
      variant.id === variantId
        ? { ...variant, options: [...variant.options, newOption()] }
        : variant
    )));
  }

  function removeOption(variantId: string, optionId: string) {
    setVariants((current) => current.map((variant) => (
      variant.id === variantId
        ? { ...variant, options: variant.options.filter((option) => option.id !== optionId) }
        : variant
    )));
  }

  function serializeVariants() {
    return variants.map((variant) => ({
      name: variant.name.trim(),
      options: variant.options.map((option) => ({
        value: option.value.trim(),
        price: Number(option.price),
        ...(option.minPrice ? { minPrice: Number(option.minPrice) } : {}),
        stock: Number(option.stock),
        ...(option.sku.trim() ? { sku: option.sku.trim() } : {}),
      })),
    }));
  }

  function validateVariants() {
    if (!variants.length) return null;
    if (variants.some((variant) => !variant.name.trim() || !variant.options.length)) {
      return "Every variant needs a name and at least one option.";
    }
    if (variants.some((variant) => variant.options.some((option) => (
      !option.value.trim() || option.price === "" || option.stock === ""
    )))) {
      return "Every variant option needs a value, price, and stock.";
    }
    if (variants.some((variant) => variant.options.some((option) => (
      option.minPrice !== "" && Number(option.minPrice) > Number(option.price)
    )))) {
      return "A variant minimum offer price cannot be greater than its price.";
    }
    return null;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!cover) {
      setFieldErrors({ coverImage: "A cover photo is required." });
      setError("Please add a cover photo before publishing.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const variantError = validateVariants();
    if (variantError) {
      setError(variantError);
      return;
    }

    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    form.append("coverImage", cover.file);
    gallery.forEach((item) => form.append("media", item.file));

    // Append extra Nigerian marketplace metadata
    form.set("brand", brand);
    form.set("warranty", warranty);
    form.set("negotiable", String(allowPriceAm));
    form.set("contactPhone", contactPhone);
    form.set("state", state);
    form.set("city", city);
    form.set("addressNote", addressNote);

    // Merge condition detail into description if provided
    if (conditionDetail) {
      const fullDesc = `[Condition: ${conditionDetail}]\n\n${description}`;
      form.set("description", fullDesc);
    }

    if (variants.length) {
      form.delete("price");
      form.delete("minPrice");
      form.delete("stock");
      form.set("variants", JSON.stringify(serializeVariants()));
    } else {
      form.delete("variants");
      if (!minPrice) form.delete("minPrice");
    }

    try {
      const response = await createProduct(form);
      router.push(`/products/${response.product._id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.errors?.length) {
          setFieldErrors(Object.fromEntries(err.errors.map((item) => [item.field, item.message])));
          setError("Please fix the highlighted fields.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please check your connection and try again.");
      }
      setSubmitting(false);
    }
  }

  const hasVariants = variants.length > 0;
  const numericPrice = parseFloat(price) || 0;

  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header with Breadcrumb */}
      <div className="mb-8">
        <Link
          href="/seller/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Listings
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-0.5 text-xs font-bold text-primary uppercase tracking-wider">
              <Store className="h-3.5 w-3.5" />
              Seller Center · Nigeria
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Post a New Listing
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Add photos, set your asking price, and enable &quot;Price Am&quot; to attract serious buyers across Nigeria.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Need help?</span>
            <span className="rounded-lg bg-sunken px-2.5 py-1 text-xs font-semibold text-ink border border-line">
              Jiji-Style Direct Settlement
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px] items-start">
        {/* Left Column: Form Sections */}
        <div className="space-y-8">
          {error && (
            <Alert kind="error" className="rounded-2xl shadow-soft">
              {error}
            </Alert>
          )}

          {/* Section 1: Photos & Media Studio */}
          <section className="rounded-3xl bg-surface border border-line shadow-soft p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink">Photos &amp; Video Showcase</h2>
                  <p className="text-xs text-muted">
                    First image is your hero cover. Add up to {maxProductMedia} media files (up to 15 MB each; MP4 videos up to 20s).
                  </p>
                </div>
              </div>
            </div>

            <input ref={coverInputRef} type="file" accept={imageTypes} className="sr-only" onChange={onCoverChange} />
            <input ref={galleryInputRef} type="file" accept={mediaTypes} multiple className="sr-only" onChange={onGalleryChange} />

            <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Cover Photo Slot */}
              <div className="relative aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 bg-primary-soft/20 flex flex-col items-center justify-center">
                {cover ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover.previewUrl} alt="Selected cover" className="h-full w-full object-cover" />
                    <span className="absolute left-2.5 top-2.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-soft">
                      Cover
                    </span>
                    <button
                      type="button"
                      onClick={() => { releaseImage(cover); setCover(null); }}
                      className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-soft hover:text-danger hover:bg-white transition-colors"
                      aria-label="Remove cover photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-primary hover:bg-primary-soft/40 transition-colors"
                  >
                    <ImagePlus className="h-7 w-7" />
                    <span className="text-xs font-bold text-center leading-tight">Add Cover Photo</span>
                    <span className="text-[10px] text-muted">Primary display</span>
                  </button>
                )}
              </div>

              {/* Gallery Items */}
              {gallery.map((item) => (
                <div key={item.id} className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-sunken">
                  {item.file.type === "video/mp4" ? (
                    <>
                      <video src={item.previewUrl} className="h-full w-full object-cover" muted playsInline />
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                        <Video className="h-3 w-3" /> Video
                      </span>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.previewUrl} alt="Gallery preview" className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(item.id)}
                    className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-soft hover:text-danger hover:bg-white transition-colors"
                    aria-label="Remove gallery media"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {/* Add More Media Button */}
              {gallery.length < maxGalleryMedia && (
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-dashed border-line-strong bg-sunken text-muted hover:border-primary hover:bg-primary-soft/30 hover:text-primary transition-all flex flex-col items-center justify-center gap-1.5 p-3"
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-xs font-semibold">Add Media</span>
                  <span className="text-[10px] text-muted">{gallery.length}/{maxGalleryMedia} added</span>
                </button>
              )}
            </div>

            {fieldErrors.coverImage && (
              <p className="mt-2 text-xs font-semibold text-danger flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                {fieldErrors.coverImage}
              </p>
            )}

            <div className="rounded-2xl bg-sunken/60 p-3.5 border border-line text-xs text-muted flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Seller Advice:</strong> Listings with at least 4 clear photos showing the product from different sides, active screen (for electronics), and tags/receipts sell much faster!
              </span>
            </div>
          </section>

          {/* Section 2: Listing Information & Specifications */}
          <section className="rounded-3xl bg-surface border border-line shadow-soft p-6 sm:p-7 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Item Details &amp; Specifications</h2>
                <p className="text-xs text-muted">Provide accurate title, category, and specifications.</p>
              </div>
            </div>

            {/* Listing Title */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="title">Listing Title *</Label>
                <span className="text-[11px] text-muted">{title.length}/120 characters</span>
              </div>
              <Input
                id="title"
                name="title"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Apple iPhone 14 Pro Max 256GB Deep Purple (Battery 94%)"
                className="h-11 rounded-xl"
              />
              {fieldErrors.title && <p className="mt-1 text-xs text-danger">{fieldErrors.title}</p>}
            </div>

            {/* Category & Brand Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  name="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 rounded-xl border border-line bg-surface px-4 text-sm text-ink capitalize focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="capitalize">{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="brand">Brand / Manufacturer</Label>
                <Input
                  id="brand"
                  name="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Apple, Samsung, Nike, Sony"
                  className="h-11 rounded-xl"
                />
                <div className="mt-1 flex flex-wrap gap-1">
                  {POPULAR_BRANDS.slice(0, 5).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrand(b)}
                      className="text-[10px] font-semibold text-muted hover:text-primary rounded-md bg-sunken px-1.5 py-0.5 border border-line"
                    >
                      +{b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Condition Selection */}
            <div>
              <Label>Condition *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1.5">
                {[
                  { value: "used", detail: "Foreign Used (Clean)", label: "✈️ Foreign Used", desc: "UK/US/Dubai clean" },
                  { value: "new", detail: "Brand New (Sealed)", label: "🌟 Brand New", desc: "Factory sealed box" },
                  { value: "used", detail: "Nigerian Used", label: "🇳🇬 Nigerian Used", desc: "Locally inspected" },
                  { value: "new", detail: "Open Box", label: "📦 Open Box", desc: "Like new, opened pack" },
                ].map((item) => {
                  const isSelected = conditionDetail === item.detail;
                  return (
                    <button
                      key={item.detail}
                      type="button"
                      onClick={() => {
                        setCondition(item.value as "new" | "used");
                        setConditionDetail(item.detail);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary-soft/40 shadow-soft"
                          : "border-line bg-surface hover:border-line-strong"
                      }`}
                    >
                      <div className="text-xs font-bold text-ink">{item.label}</div>
                      <div className="text-[10px] text-muted mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="condition" value={condition} />
            </div>

            {/* Warranty / Guarantee */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="warranty">Warranty / Return Policy</Label>
                <select
                  id="warranty"
                  name="warranty"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  className="w-full h-11 rounded-xl border border-line bg-surface px-4 text-sm text-ink focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary"
                >
                  <option value="No Warranty (Sold as inspected)">No Warranty (Sold as inspected)</option>
                  <option value="7 Days Return / Inspection">7 Days Return / Inspection</option>
                  <option value="1 Month Store Warranty">1 Month Store Warranty</option>
                  <option value="3 Months Warranty">3 Months Warranty</option>
                  <option value="6 Months Warranty">6 Months Warranty</option>
                  <option value="1 Year Manufacturer Warranty">1 Year Manufacturer Warranty</option>
                </select>
              </div>

              <div>
                <Label htmlFor="contactPhone">Direct Phone / WhatsApp *</Label>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. 08012345678 or +234..."
                  className="h-11 rounded-xl"
                />
                <p className="mt-1 text-[11px] text-muted">
                  Allowed so serious buyers can call or chat to confirm inspection.
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="description">Detailed Description *</Label>
                <span className="text-[11px] text-muted">Be clear and honest</span>
              </div>
              <textarea
                id="description"
                name="description"
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention all features, accessories included (e.g. original charger, box), physical condition, battery health, and reasons for selling..."
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary leading-relaxed"
              />
              {fieldErrors.description && <p className="mt-1 text-xs text-danger">{fieldErrors.description}</p>}
            </div>
          </section>

          {/* Section 3: Location & Inspection Hub (Jiji-style) */}
          <section className="rounded-3xl bg-surface border border-line shadow-soft p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Item Location &amp; Meetup Place</h2>
                <p className="text-xs text-muted">Buyers prefer to know where they can inspect or pick up the item.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State (Nigeria) *</Label>
                <select
                  id="state"
                  name="state"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-11 rounded-xl border border-line bg-surface px-4 text-sm text-ink focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary"
                >
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="city">City / Area / LGA *</Label>
                <Input
                  id="city"
                  name="city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Ikeja, Lekki Phase 1, Wuse 2"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="addressNote">Store / Inspection Landmark (Optional)</Label>
              <Input
                id="addressNote"
                name="addressNote"
                value={addressNote}
                onChange={(e) => setAddressNote(e.target.value)}
                placeholder="e.g. Suite 24 Computer Village Plaza, or public meeting at mall"
                className="h-11 rounded-xl"
              />
              <p className="mt-1 text-[11px] text-muted">
                Keep exact home addresses private until you agree with the buyer in Transaction Chat.
              </p>
            </div>
          </section>

          {/* Section 4: Pricing & "Price Am" Bargaining Engine */}
          <section className="rounded-3xl bg-surface border border-line shadow-soft p-6 sm:p-7 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink">Pricing &amp; &quot;Price Am&quot; Bargaining</h2>
                  <p className="text-xs text-muted">Set your asking price and enable on-platform negotiation.</p>
                </div>
              </div>

              {!hasVariants ? (
                <Button type="button" variant="outline" size="sm" onClick={() => setVariants([newVariant()])} className="rounded-xl">
                  <Plus className="h-4 w-4" /> Add Variants (Sizes / Colors)
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setVariants([])} className="rounded-xl">
                  <X className="h-4 w-4" /> Use Standard Pricing
                </Button>
              )}
            </div>

            {!hasVariants ? (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="price">Asking Price (₦) *</Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-sm font-bold text-muted">₦</span>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="100"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0"
                        className="pl-8 h-11 rounded-xl text-base font-bold"
                      />
                    </div>
                    {fieldErrors.price && <p className="mt-1 text-xs text-danger">{fieldErrors.price}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label htmlFor="minPrice">Minimum Offer (₦)</Label>
                      <span className="text-[10px] rounded bg-sunken px-1.5 py-0.5 text-muted">Hidden</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-sm font-bold text-muted">₦</span>
                      <Input
                        id="minPrice"
                        name="minPrice"
                        type="number"
                        min="0"
                        step="100"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="Optional bottom price"
                        className="pl-8 h-11 rounded-xl"
                      />
                    </div>
                    {fieldErrors.minPrice && <p className="mt-1 text-xs text-danger">{fieldErrors.minPrice}</p>}
                  </div>

                  <div>
                    <Label htmlFor="stock">Quantity in Stock *</Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                {/* Price Am Feature Card */}
                <div className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-ink text-sm">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <span>&quot;Price Am&quot; Bargaining Enabled</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowPriceAm}
                        onChange={(e) => setAllowPriceAm(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Buyers will see a prominent &quot;Price Am&quot; button to send numeric counter-offers. You can accept or counter in 1-click. Once agreed, the buyer clicks &quot;Buy&quot; and your Transaction Chat opens for settlement!
                  </p>
                </div>
              </div>
            ) : (
              /* Variant groups builder */
              <div className="space-y-4">
                {variants.map((variant, variantIndex) => (
                  <div key={variant.id} className="rounded-2xl border border-line bg-sunken/50 p-4 space-y-3">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label htmlFor={`variant-${variant.id}`}>Variant Group {variantIndex + 1} Name</Label>
                        <Input
                          id={`variant-${variant.id}`}
                          value={variant.name}
                          onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                          required
                          placeholder="e.g. Storage Capacity, Color, or Size"
                          className="h-10 rounded-xl"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setVariants((current) => current.filter((item) => item.id !== variant.id))}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:border-danger hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {variant.options.map((option) => (
                        <div key={option.id} className="grid grid-cols-2 sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-2.5 rounded-xl bg-surface p-3 border border-line text-xs">
                          <div>
                            <Label htmlFor={`value-${option.id}`}>Option Value</Label>
                            <Input
                              id={`value-${option.id}`}
                              value={option.value}
                              onChange={(e) => updateOption(variant.id, option.id, { value: e.target.value })}
                              required
                              placeholder="e.g. 256GB"
                              className="h-9 text-xs rounded-lg"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`price-${option.id}`}>Price (₦)</Label>
                            <Input
                              id={`price-${option.id}`}
                              value={option.price}
                              onChange={(e) => updateOption(variant.id, option.id, { price: e.target.value })}
                              type="number"
                              min="0"
                              step="100"
                              required
                              placeholder="0"
                              className="h-9 text-xs rounded-lg"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`minimum-${option.id}`}>Min. Offer (₦)</Label>
                            <Input
                              id={`minimum-${option.id}`}
                              value={option.minPrice}
                              onChange={(e) => updateOption(variant.id, option.id, { minPrice: e.target.value })}
                              type="number"
                              min="0"
                              step="100"
                              placeholder="Optional"
                              className="h-9 text-xs rounded-lg"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`stock-${option.id}`}>Stock</Label>
                            <Input
                              id={`stock-${option.id}`}
                              value={option.stock}
                              onChange={(e) => updateOption(variant.id, option.id, { stock: e.target.value })}
                              type="number"
                              min="0"
                              step="1"
                              required
                              className="h-9 text-xs rounded-lg"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={variant.options.length === 1}
                            onClick={() => removeOption(variant.id, option.id)}
                            className="self-end flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted hover:border-danger hover:text-danger disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <Button type="button" variant="ghost" size="sm" className="text-primary hover:text-primary-dark" onClick={() => addOption(variant.id)}>
                      <Plus className="h-3.5 w-3.5" /> Add Another Option
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Section 5: Shipping, Dispatch & Delivery */}
          <section className="rounded-3xl bg-surface border border-line shadow-soft p-6 sm:p-7 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">Shipping &amp; Delivery Arrangement</h2>
                <p className="text-xs text-muted">Clarify who handles dispatch fees and delivery timing.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryMode">Delivery Responsibility *</Label>
                <select
                  id="deliveryMode"
                  name="deliveryMode"
                  required
                  value={deliveryMode}
                  onChange={(e) => setDeliveryMode(e.target.value as "buyer_pays_externally" | "seller_included")}
                  className="w-full h-11 rounded-xl border border-line bg-surface px-4 text-sm text-ink focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary"
                >
                  <option value="buyer_pays_externally">Buyer pays courier separately (Jiji style)</option>
                  <option value="seller_included">Seller includes delivery in listing price</option>
                </select>
              </div>

              <div>
                <Label htmlFor="estimatedDeliveryDays">Estimated Delivery Timeline</Label>
                <Input
                  id="estimatedDeliveryDays"
                  name="estimatedDeliveryDays"
                  value={estimatedDeliveryDays}
                  onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
                  placeholder="e.g. Same Day in Lagos, 2-3 Days Nationwide"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="deliveryDetails">Logistics &amp; Courier Details</Label>
              <textarea
                id="deliveryDetails"
                name="deliveryDetails"
                rows={3}
                maxLength={500}
                value={deliveryDetails}
                onChange={(e) => setDeliveryDetails(e.target.value)}
                placeholder="Mention courier options (e.g. GIG Logistics, Kwik rider, or free pickup at store)..."
                className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary"
              />
            </div>
          </section>

          {/* Submit Action */}
          <div className="pt-2">
            <Button type="submit" full size="lg" loading={submitting} className="rounded-2xl py-4 font-black text-base shadow-soft">
              {submitting ? "Publishing Listing..." : "Post Listing on Pricem →"}
            </Button>
            <p className="mt-2 text-center text-xs text-muted">
              By posting, you confirm this item is genuine, complies with Nigerian regulations, and is available for inspection.
            </p>
          </div>
        </div>

        {/* Right Column: Live Marketplace Preview (Sticky) */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-primary" />
                Live Buyer Preview
              </span>
              <span className="rounded-full bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 border border-success/20">
                Pricem Card
              </span>
            </div>

            {/* Simulated Product Card */}
            <div className="rounded-2xl border border-line overflow-hidden bg-surface shadow-soft">
              <div className="relative aspect-[4/3] bg-sunken flex items-center justify-center overflow-hidden">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover.previewUrl} alt="Cover preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted text-xs">
                    <Camera className="h-8 w-8 text-line-strong" />
                    <span>Photo Preview</span>
                  </div>
                )}
                {allowPriceAm && (
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-primary text-white text-[10px] font-extrabold px-2.5 py-0.5 shadow-soft flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Price Am
                  </span>
                )}
                <span className="absolute right-2.5 top-2.5 rounded-full bg-ink/80 text-white text-[10px] font-semibold px-2 py-0.5">
                  {conditionDetail}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted">
                  <MapPin className="h-3 w-3 text-primary" />
                  <span>{city ? `${city}, ${state}` : `${state}, Nigeria`}</span>
                </div>

                <h3 className="font-bold text-ink text-sm line-clamp-2 leading-snug">
                  {title || "Your listing title will appear here..."}
                </h3>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-lg font-black text-primary">
                    ₦{numericPrice > 0 ? numericPrice.toLocaleString() : "0"}
                  </span>
                  <span className="text-[10px] text-muted capitalize">
                    {category}
                  </span>
                </div>

                {brand && (
                  <div className="pt-1 text-[11px] text-muted">
                    Brand: <strong className="text-ink">{brand}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="rounded-2xl bg-sunken/60 p-4 border border-line space-y-2.5 text-xs text-muted">
              <div className="flex items-center gap-1.5 font-bold text-ink">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Fast Sale Checklist</span>
              </div>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <span className={cover ? "text-success font-bold" : "text-muted"}>✓</span>
                  <span>Cover photo added</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className={title.length >= 10 ? "text-success font-bold" : "text-muted"}>✓</span>
                  <span>Descriptive title</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className={numericPrice > 0 ? "text-success font-bold" : "text-muted"}>✓</span>
                  <span>Realistic market price</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className={city ? "text-success font-bold" : "text-muted"}>✓</span>
                  <span>Location specified</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
