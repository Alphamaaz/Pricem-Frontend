import { api } from './api';

export interface Payment {
  _id: string;
  provider: 'paystack' | 'demo';
  reference: string;
  authorizationUrl?: string;
  expectedAmountKobo: number;
  currency: string;
  status: 'initialized' | 'pending' | 'paid' | 'failed' | 'partially_refunded' | 'refunded';
  orders: string[];
  paidAt?: string;
  refundStatus: 'none' | 'pending' | 'processing' | 'needs_attention' | 'failed' | 'processed';
  refundedAmountKobo: number;
}

export async function initializePayment(orderIds: string[]) {
  return api<{ message: string; payment: Payment }>('/payments/initialize', {
    method: 'POST',
    body: { orderIds },
  });
}

export async function verifyPayment(reference: string) {
  return api<{ message: string; payment: Payment }>(`/payments/${encodeURIComponent(reference)}/verify`);
}

export async function getPayment(reference: string) {
  return api<{ payment: Payment }>(`/payments/${encodeURIComponent(reference)}`);
}
