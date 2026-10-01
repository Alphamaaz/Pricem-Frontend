import type { OrderStatus } from "@/lib/orders";

export const STATUS_BADGES: Record<OrderStatus, string> = {
  pending_payment: "bg-warning/15 text-ink",
  paid: "bg-primary-soft text-primary",
  processing: "bg-primary-soft text-primary",
  shipped: "bg-accent/20 text-ink",
  delivered: "bg-success/10 text-success",
  completed: "bg-success-soft text-success",
  cancelled: "bg-danger/10 text-danger",
};
