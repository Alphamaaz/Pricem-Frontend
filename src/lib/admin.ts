/* Admin API — mirrors Backend/src/modules/admin */

import { api } from "./api";
import type { User } from "./types";
import type { Order } from "./orders";
import type { Dispute } from "./disputes";

export interface PendingCompletionOrder {
  _id: string;
  buyer: { _id?: string; fullName: string; email: string; contactNumber?: string };
  seller: { _id?: string; fullName: string; email: string; sellerProfile?: { storeName?: string } };
  items: Array<{ title: string; coverImage?: { url: string }; lineTotal: number; quantity: number }>;
  total: number;
  completionRequest?: {
    status: string;
    note: string;
    evidenceUrls: string[];
    requestedAt?: string;
  };
}

export interface EligiblePayoutItem {
  _id: string;
  seller: {
    _id?: string;
    fullName: string;
    email: string;
    contactNumber?: string;
    sellerProfile?: {
      storeName?: string;
      payoutDetails?: {
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
      };
    };
  };
  order: { _id: string; total: number; orderStatus: string; createdAt: string };
  amountKobo: number;
  status: string;
  createdAt: string;
}

export interface UnansweredQuestionItem {
  _id: string;
  product: { _id?: string; title: string; price: number; coverImage?: { url: string } };
  author: { _id?: string; fullName: string; email: string };
  seller: { _id?: string; fullName: string; sellerProfile?: { storeName?: string } };
  question: string;
  status: string;
  createdAt: string;
}

export interface RecentOfferItem {
  _id: string;
  productTitle: string;
  storeName: string;
  coverImage?: { url: string };
  listedPrice: number;
  currentPrice: number;
  status: string;
  lastProposedBy: string;
  buyer?: { fullName: string; email?: string };
  seller?: { fullName: string; sellerProfile?: { storeName?: string } };
  createdAt: string;
}

export interface AdminAnalyticsData {
  financials: {
    totalGmv: number;
    completedGmv: number;
    escrowGmv?: number;
    potentialPlatformFee: number;
    averageOrderValue?: number;
  };
  users: {
    total: number;
    sellers: number;
    pendingSellers: number;
    suspended?: number;
    recent: Array<{
      _id: string;
      fullName: string;
      email: string;
      contactNumber?: string;
      roles: string[];
      activeRole: string;
      isActive: boolean;
      createdAt: string;
    }>;
  };
  products: {
    total: number;
    active: number;
    byCategory: Array<{ category: string; count: number }>;
    byState: Array<{ state: string; count: number }>;
  };
  orders: {
    total: number;
    byStatus: {
      pending_payment: number;
      paid: number;
      processing: number;
      shipped: number;
      delivered: number;
      completed: number;
      cancelled: number;
    };
    recent: Order[];
  };
  negotiations: {
    total: number;
    accepted: number;
    countered: number;
    pending: number;
    rejected?: number;
    conversionRate: number;
    recent?: RecentOfferItem[];
  };
  queues: {
    pendingSellersCount: number;
    openDisputesCount: number;
    pendingCompletionCount: number;
    eligiblePayoutsCount: number;
    unansweredQuestionsCount: number;
    totalQuestionsCount?: number;
    pendingApplications: User[];
    openDisputes: Dispute[];
    pendingCompletions?: PendingCompletionOrder[];
    eligiblePayouts?: EligiblePayoutItem[];
    unansweredQuestions?: UnansweredQuestionItem[];
  };
  system: {
    paymentMode: string;
    dbConnected: boolean;
    serverUptimeSeconds: number;
    nodeVersion: string;
    memoryUsageMb?: number;
    timestamp: string;
  };
}

export async function getAdminAnalytics() {
  return api<{ analytics: AdminAnalyticsData }>("/admin/analytics");
}

export async function getAdminUsers(params?: { page?: number; limit?: number; search?: string; role?: string }) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.role) query.set("role", params.role);
  const qStr = query.toString();
  return api<{ users: User[]; total: number; page: number; pages: number }>(`/admin/users${qStr ? `?${qStr}` : ""}`);
}

export async function toggleUserStatus(userId: string) {
  return api<{ message: string; user: User }>(`/admin/users/${userId}/toggle-status`, {
    method: "PATCH",
  });
}

export type PendingSeller = Pick<
  User,
  "_id" | "fullName" | "email" | "contactNumber" | "sellerProfile" | "createdAt"
>;

export async function getPendingSellers() {
  return api<{ applicants: PendingSeller[] }>("/admin/sellers/pending");
}

export const getPendingSellerApplications = getPendingSellers;

export async function approveSeller(userId: string) {
  return api<{ message: string; user: User }>(`/admin/sellers/${userId}/approve`, {
    method: "PATCH",
  });
}

export async function rejectSeller(userId: string, reason: string) {
  return api<{ message: string }>(`/admin/sellers/${userId}/reject`, {
    method: "PATCH",
    body: { reason },
  });
}

export async function hideQuestion(questionId: string) {
  return api<{ message: string }>(`/admin/questions/${questionId}/hide`, {
    method: "PATCH",
  });
}

export async function answerQuestionAsAdmin(questionId: string, answer: string) {
  return api<{ message: string }>(`/questions/${questionId}/answer`, {
    method: "POST",
    body: { answer },
  });
}

export async function reviewOrderCompletion(
  orderId: string,
  decision: "approve" | "reject",
  note: string
) {
  return api<{ message: string }>(`/orders/${orderId}/completion-request/review`, {
    method: "PATCH",
    body: { decision, note },
  });
}

