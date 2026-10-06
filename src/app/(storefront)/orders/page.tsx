"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Handshake,
  MessageCircle,
  Package,
  PackageCheck,
  Search,
  ShoppingBag,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import { getMe } from "@/lib/auth";
import { listOrders } from "@/lib/orders";
import type { Order, OrderStatus } from "@/lib/orders";
import { assetUrl, tokenStore } from "@/lib/api";
import { Alert, Button } from "@/components/ui";
import type { User } from "@/lib/types";
import { getOrderConversation } from "@/lib/chat";

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "pending_payment":
      return {
        label: "Awaiting Settlement",
        className: "bg-warning/15 text-ink border-warning/30",
        icon: Clock,
      };
    case "paid":
    case "processing":
      return {
        label: "Processing / Logistics",
        className: "bg-primary-soft text-primary border-primary/20",
        icon: Package,
      };
    case "shipped":
      return {
        label: "In Transit / Shipped",
        className: "bg-accent/20 text-ink border-accent/30",
        icon: Truck,
      };
    case "delivered":
      return {
        label: "Delivered",
        className: "bg-success/15 text-success border-success/30",
        icon: PackageCheck,
      };
    case "completed":
      return {
        label: "Completed",
        className: "bg-success/20 text-success border-success/40",
        icon: CheckCircle2,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-danger/10 text-danger border-danger/20",
        icon: XCircle,
      };
    default:
      return {
        label: String(status).replace(/_/g, " "),
        className: "bg-sunken text-muted border-line",
        icon: Clock,
      };
  }
}

function OrdersList() {
  const router = useRouter();
  const params = useSearchParams();
  const justPlaced = params.get("placed") === "1";

  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<"buyer" | "seller">("buyer");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "negotiated">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [navigatingChatId, setNavigatingChatId] = useState<string | null>(null);

  const load = useCallback((role: "buyer" | "seller") => {
    setReady(false);
    listOrders({ role })
      .then((res) => {
        setOrders(res.orders);
        setReady(true);
      })
      .catch(() => setError("Could not load orders."));
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    getMe()
      .then((res) => {
        setUser(res.user);
        load("buyer");
      })
      .catch(() => router.replace("/login"));
  }, [router, load]);

  function switchTab(next: "buyer" | "seller") {
    setTab(next);
    setError(null);
    setFilter("all");
    load(next);
  }

  async function openChat(orderId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setNavigatingChatId(orderId);
    try {
      const res = await getOrderConversation(orderId);
      router.push(`/conversations/${res.conversation._id}`);
    } catch {
      router.push(`/orders/${orderId}`);
    } finally {
      setNavigatingChatId(null);
    }
  }

  const isSeller = user?.roles.includes("seller");

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status filter
      if (filter === "active") {
        if (["completed", "cancelled"].includes(o.orderStatus)) return false;
      } else if (filter === "completed") {
        if (o.orderStatus !== "completed") return false;
      } else if (filter === "negotiated") {
        if (o.source !== "offer") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = o._id.toLowerCase().includes(q);
        const matchesTitle = o.items.some((i) => i.title.toLowerCase().includes(q));
        const matchesStore = o.items.some((i) => i.storeName.toLowerCase().includes(q));
        if (!matchesId && !matchesTitle && !matchesStore) return false;
      }

      return true;
    });
  }, [orders, filter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) => !["completed", "cancelled"].includes(o.orderStatus)).length;
    const completed = orders.filter((o) => o.orderStatus === "completed").length;
    const negotiated = orders.filter((o) => o.source === "offer").length;
    return { total, active, completed, negotiated };
  }, [orders]);

  if (!ready && !error) {
    return (
      <div className="max-w-4xl mx-auto py-16 space-y-4">
        <div className="h-10 w-48 rounded-2xl bg-sunken animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-sunken animate-pulse" />
          ))}
        </div>
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-sunken animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Orders & Deals
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {tab === "buyer"
              ? "Track your purchases, courier delivery, and agreed deals"
              : "Manage incoming customer orders and logistics for your store"}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        {isSeller && (
          <div className="inline-flex rounded-2xl border border-line bg-surface p-1 shadow-soft self-start sm:self-center">
            <button
              type="button"
              onClick={() => switchTab("buyer")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === "buyer"
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted hover:text-ink hover:bg-sunken"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              My Purchases
            </button>
            <button
              type="button"
              onClick={() => switchTab("seller")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === "seller"
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted hover:text-ink hover:bg-sunken"
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              Store Orders
            </button>
          </div>
        )}
      </div>

      {justPlaced && (
        <Alert kind="success">
          🎉 Deal confirmed! Use the Transaction Chat on the order details to arrange pickup/delivery and direct payment.
        </Alert>
      )}
      {error && <Alert kind="error">{error}</Alert>}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filter === "all"
              ? "border-primary bg-primary-soft/50 ring-2 ring-primary/20 shadow-soft"
              : "border-line bg-surface hover:border-line-strong shadow-xs"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">All Orders</span>
          <span className="text-2xl font-black text-ink mt-0.5 block">{stats.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filter === "active"
              ? "border-warning bg-warning-soft/50 ring-2 ring-warning/20 shadow-soft"
              : "border-line bg-surface hover:border-line-strong shadow-xs"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">In Progress</span>
          <span className="text-2xl font-black text-ink mt-0.5 block">{stats.active}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("completed")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filter === "completed"
              ? "border-success bg-success-soft/50 ring-2 ring-success/20 shadow-soft"
              : "border-line bg-surface hover:border-line-strong shadow-xs"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">Completed</span>
          <span className="text-2xl font-black text-success mt-0.5 block">{stats.completed}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("negotiated")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            filter === "negotiated"
              ? "border-accent bg-accent/20 ring-2 ring-accent/30 shadow-soft"
              : "border-line bg-surface hover:border-line-strong shadow-xs"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">Price Am Deals</span>
          <span className="text-2xl font-black text-primary mt-0.5 block">{stats.negotiated}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order ID, item name, or store..."
          className="w-full h-11 rounded-2xl border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-shadow"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted hover:text-ink"
          >
            Clear
          </button>
        )}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl bg-surface border border-line shadow-soft p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sunken mx-auto mb-3 text-muted">
            <Package className="h-8 w-8 opacity-60" />
          </div>
          <h3 className="text-base font-bold text-ink">No orders found</h3>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-sm mx-auto">
            {searchQuery || filter !== "all"
              ? "No orders match your active filter. Try resetting your search or filters."
              : tab === "buyer"
                ? "You haven't placed any orders yet. Discover items and use Price Am to negotiate great deals!"
                : "No orders received yet for your store."}
          </p>
          <div className="mt-5">
            <Link href="/">
              <Button variant="primary" className="rounded-xl px-6">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredOrders.map((o) => {
            const badge = getStatusBadge(o.orderStatus);
            const BadgeIcon = badge.icon;
            const isNegotiated = o.source === "offer";
            const originalSum = o.items.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);
            const savings = isNegotiated ? Math.max(0, originalSum - o.total) : 0;

            return (
              <li key={o._id}>
                <Link
                  href={`/orders/${o._id}`}
                  className="group block rounded-3xl bg-surface border border-line shadow-soft p-5 sm:p-6 hover:shadow-lifted hover:border-primary/40 transition-all relative overflow-hidden"
                >
                  {/* Top Bar: ID, Date, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-body bg-sunken px-2.5 py-1 rounded-lg border border-line">
                        #{o._id.slice(-8).toUpperCase()}
                      </span>
                      {isNegotiated && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-extrabold text-ink border border-accent/30">
                          <Handshake className="h-3 w-3 text-primary" />
                          Price Am Deal
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold border ${badge.className}`}
                      >
                        <BadgeIcon className="h-3.5 w-3.5" />
                        {badge.label}
                      </span>
                      <time className="text-xs text-muted font-medium">
                        {new Date(o.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Image Thumbnail Stack */}
                      <div className="relative shrink-0">
                        {o.items[0]?.coverImage?.url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={assetUrl(o.items[0].coverImage.url)}
                            alt={o.items[0].title}
                            className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border border-line object-cover shadow-xs"
                          />
                        )}
                        {o.items.length > 1 && (
                          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-extrabold text-white shadow-xs">
                            +{o.items.length - 1}
                          </span>
                        )}
                      </div>

                      {/* Product details */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-bold text-ink group-hover:text-primary transition-colors truncate">
                          {o.items.map((i) => i.title).join(", ")}
                        </h4>
                        <p className="text-xs text-muted mt-0.5 flex items-center gap-1.5">
                          <Store className="h-3 w-3" />
                          <span className="font-semibold text-body">
                            {tab === "buyer" ? o.items[0]?.storeName : "Customer Order"}
                          </span>
                          <span>·</span>
                          <span>{o.items.reduce((sum, item) => sum + item.quantity, 0)} unit(s)</span>
                        </p>
                        {o.items[0]?.variantSelections?.length > 0 && (
                          <p className="text-[11px] text-muted mt-1 truncate">
                            {o.items[0].variantSelections.map((v) => `${v.name}: ${v.value}`).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price & Quick Actions */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-line/60 pt-3 sm:pt-0 shrink-0">
                      <div className="sm:text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted block">Total Deal</span>
                        <span className="text-lg sm:text-xl font-extrabold text-ink">
                          ₦{o.total.toLocaleString()}
                        </span>
                      </div>

                      {/* Quick Chat Link */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={(e) => openChat(o._id, e)}
                          disabled={navigatingChatId === o._id}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface hover:border-primary hover:text-primary px-3 py-1.5 text-xs font-semibold text-body transition-colors"
                          title="Open Transaction Chat for this order"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-primary" />
                          Chat
                        </button>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sunken group-hover:bg-primary group-hover:text-white transition-colors">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price Am Deal Savings Ribbon */}
                  {isNegotiated && savings > 0 && (
                    <div className="mt-4 rounded-xl bg-gradient-to-r from-success-soft/80 to-primary-soft/40 border border-success/30 px-3.5 py-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-success flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Price Am Savings
                      </span>
                      <span className="text-body font-medium">
                        Original: <span className="line-through">₦{originalSum.toLocaleString()}</span> · You saved <strong className="text-success font-extrabold">₦{savings.toLocaleString()}</strong>
                      </span>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersList />
    </Suspense>
  );
}
