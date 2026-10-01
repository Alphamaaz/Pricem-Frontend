import { api, API_URL } from "./api";

export type Review = {
  _id: string;
  type: "item" | "seller";
  order: string;
  buyer: string | { _id: string; fullName: string };
  seller: string;
  product?: string;
  rating: number;
  text?: string;
  tags: string[];
  createdAt: string;
};

export type ReviewList = { reviews: Review[]; total: number; page: number; pages: number };
export type ReviewEligibility = { eligible: boolean; itemReviews: Review[]; sellerReview: Review | null; tags: string[] };

export function getReviewEligibility(orderId: string) { return api<ReviewEligibility>(`/reviews/orders/${orderId}/eligibility`); }
export function createItemReview(orderId: string, productId: string, rating: number, text: string) { return api<{ message: string; review: Review }>(`/reviews/orders/${orderId}/items/${productId}`, { method: "POST", body: { rating, text } }); }
export function createSellerReview(orderId: string, rating: number, tags: string[], text: string) { return api<{ message: string; review: Review }>(`/reviews/orders/${orderId}/seller`, { method: "POST", body: { rating, tags, text } }); }

export async function listProductReviewsServer(productId: string): Promise<ReviewList> {
  try { const response = await fetch(`${API_URL}/reviews/products/${productId}?limit=10`, { cache: "no-store" }); if (!response.ok) throw new Error(); return response.json() as Promise<ReviewList>; }
  catch { return { reviews: [], total: 0, page: 1, pages: 0 }; }
}

export async function listSellerReviewsServer(sellerId: string): Promise<ReviewList> {
  try { const response = await fetch(`${API_URL}/reviews/sellers/${sellerId}?limit=5`, { cache: "no-store" }); if (!response.ok) throw new Error(); return response.json() as Promise<ReviewList>; }
  catch { return { reviews: [], total: 0, page: 1, pages: 0 }; }
}
