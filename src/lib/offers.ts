/* Offers API — mirrors Backend/src/modules/offers */

import { api } from "./api";
import type { Order } from "./orders";

export interface VariantSelection {
  name: string;
  value: string;
}

export interface OfferHistoryEntry {
  action?: "submitted" | "countered" | "accepted" | "rejected" | "expired";
  proposedBy: "buyer" | "seller";
  user: string;
  price: number;
  createdAt: string;
}

export type OfferStatus =
  | "pending"
  | "countered"
  | "accepted"
  | "rejected"
  | "expired";

export interface Offer {
  _id: string;
  product: string;
  buyer: string;
  seller: string;
  productTitle: string;
  storeName: string;
  storeSlug: string;
  coverImage: { url: string; alt?: string };
  variantSelections: VariantSelection[];
  variantKey: string;
  listedPrice: number;
  currentPrice: number;
  status: OfferStatus;
  lastProposedBy: "buyer" | "seller";
  buyerUnread: boolean;
  sellerUnread: boolean;
  order?: string;
  history: OfferHistoryEntry[];
  acceptedAt?: string;
  rejectedAt?: string;
  expiredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferListResponse {
  offers: Offer[];
  total: number;
  page: number;
  pages: number;
}

export async function createOffer(input: {
  productId: string;
  price: number;
  variantSelections?: VariantSelection[];
}) {
  return api<{ message: string; offer: Offer }>("/offers", {
    method: "POST",
    body: input,
  });
}

export async function listOffers(params: {
  role?: "buyer" | "seller";
  status?: OfferStatus;
  page?: number;
  limit?: number;
} = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) q.set(k, String(v));
  }
  const s = q.toString();
  return api<OfferListResponse>(`/offers${s ? `?${s}` : ""}`);
}

export async function markOffersRead(role: "buyer" | "seller") {
  return api<{ message: string; updated: number }>("/offers/read", {
    method: "PATCH",
    body: { role },
  });
}

export async function counterOffer(id: string, price: number) {
  return api<{ message: string; offer: Offer }>(`/offers/${id}/counter`, {
    method: "PATCH",
    body: { price },
  });
}

export async function acceptOffer(id: string) {
  return api<{ message: string; offer: Offer; order: Order }>(
    `/offers/${id}/accept`,
    { method: "PATCH" },
  );
}

export async function rejectOffer(id: string) {
  return api<{ message: string; offer: Offer }>(`/offers/${id}/reject`, {
    method: "PATCH",
  });
}
