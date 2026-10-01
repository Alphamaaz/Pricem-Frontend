import { api, apiForm } from './api';
import type { Order } from './orders';

export type DisputeStatus = 'open' | 'under_review' | 'resolved';
export type DisputeOutcome =
  | 'amicable_agreement'
  | 'seller_penalized_strike'
  | 'seller_banned_blacklisted'
  | 'claim_dismissed'
  | 'full_refund'
  | 'partial_refund'
  | 'release_seller_payment'
  | 'cancel_order';
export interface Dispute {
  _id: string; order: string; buyer: string | { _id: string; fullName: string; email: string };
  seller: string | { _id: string; fullName: string; email: string }; openedByRole: 'buyer' | 'seller' | 'admin';
  reason: string; description: string; evidenceUrls: string[]; status: DisputeStatus;
  messages: Array<{ _id: string; authorRole: 'buyer' | 'seller' | 'admin'; message: string; evidenceUrls: string[]; createdAt: string }>;
  resolution?: { outcome?: DisputeOutcome; amountKobo?: number; decision?: string; resolvedAt?: string };
  createdAt: string; updatedAt: string;
}

export function openDispute(orderId: string, input: { reason: string; description: string; evidence?: File[] }) {
  const form = new FormData(); form.set('reason', input.reason); form.set('description', input.description);
  input.evidence?.forEach((file) => form.append('evidence', file));
  return apiForm<{ message: string; dispute: Dispute; order: Order }>(`/disputes/orders/${orderId}`, form);
}
export function listDisputes(status?: DisputeStatus) {
  return api<{ disputes: Dispute[]; total: number }>(`/disputes${status ? `?status=${status}` : ''}`);
}
export function getDispute(id: string) { return api<{ dispute: Dispute }>(`/disputes/${id}`); }
export function addDisputeMessage(id: string, input: { message: string; evidence?: File[] }) {
  const form = new FormData(); form.set('message', input.message); input.evidence?.forEach((file) => form.append('evidence', file));
  return apiForm<{ message: string; dispute: Dispute }>(`/disputes/${id}/messages`, form);
}
export function resolveDispute(id: string, input: { outcome: DisputeOutcome; amount?: number; decision: string }) {
  return api<{ message: string; dispute: Dispute; order: Order }>(`/disputes/${id}/resolve`, { method: 'PATCH', body: input });
}
