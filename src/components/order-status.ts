import type { OrderStatus } from "@/lib/orders";

export const STATUS_BADGES: Record<OrderStatus, string> = {
  pending_payment: "bg-primary-soft text-primary",
  paid: "bg-primary-soft text-primary",
  processing: "bg-primary-soft text-primary",
  shipped: "bg-primary-soft text-primary",
  delivered: "bg-primary-soft text-primary",
  completed: "bg-success-soft text-success",
  cancelled: "bg-danger/10 text-danger",
};
