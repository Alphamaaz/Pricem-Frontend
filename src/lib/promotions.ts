import { api } from "./api";
export type ReferralLink = { _id: string; code: string; product: string; status: "active" | "disabled"; clicks: number };
export function captureReferral(code: string, productId: string, visitorKey: string) { return api<{ token: string; expiresAt: string }>("/promotions/capture", { method: "POST", body: { code, productId, visitorKey } }); }
export function generateReferralLink(productId: string) { return api<{ referral: ReferralLink; url: string }>(`/promotions/products/${productId}/links`, { method: "POST" }); }
export function updatePromotion(productId: string, input: { enabled: boolean; commissionPercent?: number; startsAt?: string; endsAt?: string }) { return api<{ message: string }>(`/promotions/products/${productId}`, { method: "PATCH", body: input }); }
