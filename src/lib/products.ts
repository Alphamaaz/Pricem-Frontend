/* Products API — mirrors Backend/src/modules/products */

import { api, apiForm, API_URL } from "./api";

export interface ProductImage {
  url: string;
  publicId?: string;
  alt?: string;
}

export interface ProductMedia extends ProductImage {
  type: "image" | "video";
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
}

export interface VariantOption {
  value: string;
  price: number;
  minPrice?: number;
  stock: number;
  sku?: string;
}

export interface Variant {
  name: string;
  options: VariantOption[];
}

export interface Product {
  _id: string;
  seller: string;
  storeName: string;
  storeSlug: string;
  title: string;
  category: string;
  price: number;
  /** Only present on seller-own endpoints */
  minPrice?: number;
  stock: number;
  condition: "new" | "used";
  brand?: string;
  warranty?: string;
  negotiable?: boolean;
  contactPhone?: string;
  location?: {
    state?: string;
    city?: string;
    addressNote?: string;
  };
  description: string;
  variants: Variant[];
  coverImage: ProductImage;
  images: ProductImage[];
  media: ProductMedia[];
  delivery: {
    mode: "seller_included" | "buyer_pays_externally";
    estimatedDays?: string;
    details?: string;
  };
  status: "active" | "inactive" | "sold";
  isFeatured: boolean;
  viewsCount: number;
  salesCount: number;
  ratingAverage: number;
  ratingCount: number;
  sellerRatingAverage?: number;
  sellerRatingCount?: number;
  sellerPhone?: string;
  sellerJoinedAt?: string;
  promotion?: { enabled: boolean; commissionPercent?: number; startsAt?: string; endsAt?: string };
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  pages: number;
}

export type ProductSort =
  | "featured"
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular"
  | "rating";

export interface ListProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  condition?: "new" | "used";
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  storeSlug?: string;
  inStock?: boolean;
  state?: string;
  negotiable?: boolean;
  sort?: ProductSort;
}

function toQuery(params: ListProductsParams): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Client-side list (browsing with filters). */
export async function listProducts(params: ListProductsParams = {}) {
  return api<ProductListResponse>(`/products${toQuery(params)}`);
}

/**
 * Server-side list for RSC pages — plain fetch, no auth needed.
 * Never throws: storefront pages should render even if the API is down.
 */
export async function listProductsServer(
  params: ListProductsParams = {},
): Promise<ProductListResponse> {
  try {
    const res = await fetch(`${API_URL}/products${toQuery(params)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as ProductListResponse;
  } catch {
    return { products: [], total: 0, page: 1, pages: 0 };
  }
}

/** Server-side detail for RSC pages. Returns null when missing/unavailable. */
export async function getProductServer(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { product: Product };
    return data.product;
  } catch {
    return null;
  }
}

/** Seller: own products (includes minPrice). */
export async function listMyProducts(page = 1, limit = 20) {
  return api<ProductListResponse>(`/products/mine?page=${page}&limit=${limit}`);
}

/**
 * Seller: fetch one of your own products for editing.
 * Pages through /products/mine — the only endpoint that includes minPrice
 * and inactive listings (the public GET also bumps viewsCount).
 */
export async function getMyProduct(id: string): Promise<Product | null> {
  let page = 1;
  // Cap the walk defensively; sellers rarely exceed a few pages.
  for (let i = 0; i < 20; i++) {
    const res = await listMyProducts(page, 50);
    const found = res.products.find((p) => p._id === id);
    if (found) return found;
    if (page >= res.pages) return null;
    page += 1;
  }
  return null;
}

/** Seller: create listing (multipart — cover image file required). */
export async function createProduct(form: FormData) {
  return apiForm<{ message: string; product: Product }>("/products", form);
}

/** Seller: update listing. */
export async function updateProduct(id: string, form: FormData) {
  return apiForm<{ message: string; product: Product }>(
    `/products/${id}`,
    form,
    "PATCH",
  );
}

/** Seller: soft-delete (status → inactive). */
export async function removeProduct(id: string) {
  return api<{ message: string }>(`/products/${id}`, { method: "DELETE" });
}

/** Category options shown in UI (API accepts any string). */
export const CATEGORIES = [
  "electronics",
  "fashion",
  "home",
  "gaming",
  "books",
  "other",
] as const;

export const NIGERIAN_STATES = [
  "Lagos", "Abuja FCT", "Rivers", "Oyo", "Kano", "Ogun", "Anambra", "Edo", "Delta",
  "Enugu", "Kaduna", "Kwara", "Imo", "Plateau", "Osun", "Akwa Ibom", "Abia", "Ondo",
  "Cross River", "Benue", "Bayelsa", "Ekiti", "Bauchi", "Gombe", "Kogi", "Katsina",
  "Kebbi", "Nasarawa", "Niger", "Sokoto", "Taraba", "Yobe", "Zamfara", "Adamawa", "Borno", "Jigawa", "Ebonyi"
] as const;
