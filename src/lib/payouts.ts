import { api } from './api';
import type { Order } from './orders';
import type { SellerProfile } from './types';

export interface SellerPayout {
  _id: string;
  order: Order;
  seller: {
    _id: string;
    fullName: string;
    email: string;
    sellerProfile?: SellerProfile;
  };
  amountKobo: number;
  originalAmountKobo: number;
  currency: string;
  status: 'eligible' | 'held' | 'approved' | 'paid' | 'cancelled';
  holdReason?: string;
  transferReference?: string;
  transferMethod?: string;
  paidAt?: string;
  createdAt: string;
}
export function listPayouts(status?: SellerPayout['status']) {
  return api<{ payouts: SellerPayout[]; total: number }>(`/payouts${status ? `?status=${status}` : ''}`);
}
export function approvePayout(id: string) { return api<{ message: string; payout: SellerPayout }>(`/payouts/${id}/approve`, { method: 'PATCH' }); }
export function confirmPayout(id: string, input: { transferReference: string; transferMethod: string }) {
  return api<{ message: string; payout: SellerPayout }>(`/payouts/${id}/confirm`, { method: 'PATCH', body: input });
}
