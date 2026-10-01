/* Orders API — mirrors Backend/src/modules/orders */

import { api, apiForm } from "./api";
import type { VariantSelection } from "./offers";

export interface OrderItem {
  product: string;
  seller: string;
  storeName: string;
  storeSlug: string;
  title: string;
  coverImage: { url: string; alt?: string };
  variantSelections: VariantSelection[];
  variantKey: string;
  originalPrice: number;
  finalPrice: number;
  quantity: number;
  lineTotal: number;
}

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

export interface ShippingAddress {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface Order {
  _id: string;
  buyer: string;
  seller: string;
  source: "cart" | "offer";
  offer?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryTotal: number;
  total: number;
  deliveryPolicy: {
    mode: "seller_included" | "buyer_pays_externally";
    estimatedDays?: string;
    details?: string;
    externalPaymentNotice: boolean;
  };
  deliveryArrangement?: {
    status: "pending" | "proposed" | "acknowledged";
    courierName?: string;
    externalCost?: number;
    notes?: string;
    proposedAt?: string;
    acknowledgedAt?: string;
  };
  shipment?: {
    courierName?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDeliveryAt?: string;
    proofUrl?: string;
    shippedAt?: string;
    markedDeliveredAt?: string;
  };
  timeline: Array<{
    _id: string;
    type: string;
    actor?: string;
    actorRole: "buyer" | "seller" | "admin" | "system";
    message: string;
    createdAt: string;
  }>;
  paymentStatus: "pending" | "paid" | "failed" | "partially_refunded" | "refunded";
  payment?: string;
  paymentReference?: string;
  paidAt?: string;
  financials?: {
    grossAmountKobo: number;
    platformFeeKobo: number;
    processorFeeKobo: number;
    sellerPayableKobo: number;
    refundedAmountKobo: number;
  };
  orderStatus: OrderStatus;
  inventoryReservation?: {
    status: "none" | "reserved" | "committed" | "released";
    expiresAt?: string;
    committedAt?: string;
    releasedAt?: string;
  };
  completionRequest?: {
    status: "none" | "pending" | "approved" | "rejected";
    note?: string;
    evidenceUrls: string[];
    requestedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    adminNote?: string;
  };
  disputeStatus: "none" | "open" | "under_review" | "resolved";
  activeDispute?: string;
  payoutStatus: "not_eligible" | "eligible" | "held" | "approved" | "paid" | "cancelled";
  payout?: string;
  shippingAddress?: ShippingAddress;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  pages: number;
}

export async function checkoutCart(shippingAddress: ShippingAddress) {
  return api<{ message: string; orders: Order[] }>("/orders/checkout/cart", {
    method: "POST",
    body: { shippingAddress },
  });
}

export async function checkoutOfferOrder(id: string, shippingAddress: ShippingAddress) {
  return api<{ message: string; order: Order }>(`/orders/${id}/checkout-offer`, {
    method: "PATCH",
    body: { shippingAddress },
  });
}

export async function listOrders(params: {
  role?: "buyer" | "seller";
  status?: OrderStatus;
  page?: number;
  limit?: number;
} = {}) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) q.set(k, String(v));
  }
  const s = q.toString();
  return api<OrderListResponse>(`/orders${s ? `?${s}` : ""}`);
}

export async function getActiveOrderCount() {
  return api<{ count: number }>("/orders/active-count");
}

export async function getOrder(id: string) {
  return api<{ order: Order }>(`/orders/${id}`);
}

export async function confirmOrderDelivery(id: string) {
  return api<{ message: string; order: Order }>(`/orders/${id}/confirm-delivery`, {
    method: "PATCH",
  });
}

export async function proposeDeliveryArrangement(id: string, input: {
  courierName: string;
  externalCost?: number;
  notes?: string;
}) {
  return api<{ message: string; order: Order }>(`/orders/${id}/delivery-arrangement`, { method: "PATCH", body: input });
}

export async function acknowledgeDeliveryArrangement(id: string) {
  return api<{ message: string; order: Order }>(`/orders/${id}/delivery-arrangement/acknowledge`, { method: "PATCH" });
}

export async function startOrderProcessing(id: string) {
  return api<{ message: string; order: Order }>(`/orders/${id}/processing`, { method: "PATCH" });
}

export async function recordOrderShipment(id: string, input: {
  courierName: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryAt?: string;
  proofUrl?: string;
}) {
  return api<{ message: string; order: Order }>(`/orders/${id}/shipment`, { method: "PATCH", body: input });
}

export async function markOrderDelivered(id: string) {
  return api<{ message: string; order: Order }>(`/orders/${id}/mark-delivered`, { method: "PATCH" });
}

export function requestOrderCompletion(id: string, note: string, files: File[]) {
  const form = new FormData();
  form.set("note", note);
  files.forEach((file) => form.append("evidence", file));
  return apiForm<{ message: string; order: Order }>(`/orders/${id}/completion-request`, form);
}

export function listCompletionRequests() {
  return api<{ orders: Order[] }>("/orders/completion-requests");
}

export function reviewCompletionRequest(id: string, decision: "approve" | "reject", note: string) {
  return api<{ message: string; order: Order }>(`/orders/${id}/completion-request/review`, { method: "PATCH", body: { decision, note } });
}

export interface SellerAnalytics {
  financials: {
    grossRevenue: number;
    completedRevenue: number;
    pendingSettlementRevenue: number;
    averageOrderValue: number;
  };
  traffic: {
    totalClicks: number;
    totalUnitsSold: number;
    conversionRate: number;
    totalListings: number;
    activeProductsCount: number;
    outOfStockCount: number;
  };
  orders: {
    total: number;
    statusCounts: Record<string, number>;
  };
  bargaining: {
    totalOffers: number;
    acceptedOffers: number;
    counteredOffers: number;
    pendingOffers: number;
    bargainWinRate: number;
    totalBargainSavings: number;
  };
  chartSeries: Array<{
    date: string;
    label: string;
    revenue: number;
    orders: number;
    clicks: number;
  }>;
  topProducts: Array<{
    _id: string;
    title: string;
    coverUrl?: string;
    price: number;
    minPrice?: number;
    stock: number;
    status: string;
    viewsCount: number;
    salesCount: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    _id: string;
    itemsCount: number;
    firstItemTitle: string;
    firstItemImage?: string;
    total: number;
    orderStatus: OrderStatus;
    source: string;
    recipientName: string;
    destinationCity: string;
    createdAt: string;
  }>;
}

export function getSellerAnalytics() {
  return api<{ success: boolean; analytics: SellerAnalytics }>("/orders/seller/analytics");
}

