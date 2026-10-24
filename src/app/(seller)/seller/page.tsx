"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  Copy,
  DollarSign,
  Eye,
  Handshake,
  HelpCircle,
  Home,
  Menu,
  MessageCircle,
  MousePointerClick,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { getMe } from "@/lib/auth";
import { getSellerAnalytics, type SellerAnalytics } from "@/lib/orders";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { Alert, Button } from "@/components/ui";
import type { User } from "@/lib/types";

function MobileSellerDashboard({
  analytics,
  error,
  user,
  refreshing,
  onRefresh,
}: {
  analytics: SellerAnalytics | null;
  error: string | null;
  user: User | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const revenue = analytics?.financials?.grossRevenue || 0;
  const orders = analytics?.orders?.total || 0;
  const views = analytics?.traffic?.totalClicks || 0;
  const listings = analytics?.traffic?.totalListings || 0;
  const conversion = analytics?.traffic?.conversionRate || 0;
  const series = analytics?.chartSeries?.slice(-7) || [];
  const peak = Math.max(...series.map((item) => item.revenue), 1);
  const fullName = user?.fullName || "PriceAm Seller";
  const initials = fullName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const memberSince = user?.createdAt
    ? new Intl.DateTimeFormat("en-NG", { month: "short", year: "numeric" }).format(new Date(user.createdAt))
    : "PriceAm launch";

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const metrics = [
    { label: "Total orders", value: orders.toLocaleString(), icon: ShoppingBag, tone: "orange" },
    { label: "Product views", value: views.toLocaleString(), icon: Eye, tone: "blue" },
    { label: "Active listings", value: listings.toLocaleString(), icon: Package, tone: "purple" },
    { label: "Conversion rate", value: `${conversion}%`, icon: BarChart3, tone: "green" },
  ];

  return (
    <main className="seller-mobile-dashboard md:hidden">
      <header className="seller-mobile-header">
        <button type="button" className="seller-mobile-header-button" aria-label="Open seller menu" onClick={() => setMenuOpen(true)}>
            <Menu />
        </button>
        <div className="min-w-0 flex-1">
          <h1>Seller Dashboard</h1>
          <p>Here is how your store is doing</p>
        </div>
        <Link href="/conversations" className="seller-mobile-header-button relative" aria-label="Open notifications">
          <Bell />
          <span className="seller-notification-dot" />
        </Link>
      </header>

      {menuOpen && (
        <div className="seller-drawer-layer" role="dialog" aria-modal="true" aria-label="Seller menu">
          <button className="seller-drawer-backdrop" type="button" aria-label="Close seller menu" onClick={() => setMenuOpen(false)} />
          <aside className="seller-drawer">
            <button type="button" className="seller-drawer-close" aria-label="Close seller menu" onClick={() => setMenuOpen(false)}><X /></button>
            <div className="seller-drawer-profile">
              {user?.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assetUrl(user.profileImage)} alt="" />
              ) : <span>{initials}</span>}
              <div>
                <h2>{fullName}</h2>
                <strong>Seller</strong>
                <p>Member since {memberSince}</p>
              </div>
            </div>
            <nav className="seller-drawer-nav" aria-label="Seller menu links">
              <Link href="/seller" className="is-active" onClick={() => setMenuOpen(false)}><Home /><span>Dashboard</span></Link>
              <Link href="/profile" onClick={() => setMenuOpen(false)}><UserRound /><span>Profile</span></Link>
              <Link href="/conversations" onClick={() => setMenuOpen(false)}><MessageCircle /><span>Messages</span></Link>
              <Link href="/offers?tab=seller" onClick={() => setMenuOpen(false)}><Handshake /><span>My Offers</span></Link>
              <Link href="/seller/products" onClick={() => setMenuOpen(false)}><Store /><span>My Shop</span></Link>
              <Link href="/orders" onClick={() => setMenuOpen(false)}><Truck /><span>Orders</span></Link>
              <Link href="/conversations" onClick={() => setMenuOpen(false)}><Bell /><span>Notifications</span></Link>
              <Link href="/conversations?support=true" onClick={() => setMenuOpen(false)}><HelpCircle /><span>Help</span></Link>
            </nav>
          </aside>
        </div>
      )}

      {error && <Alert kind="error">{error}</Alert>}

      <button type="button" onClick={onRefresh} className="seller-revenue-card" disabled={refreshing}>
        <span className="seller-revenue-label">Total revenue</span>
        <span className="seller-revenue-period"><CalendarDays /> All time</span>
        <strong>₦{revenue.toLocaleString()}</strong>
        <span className="seller-revenue-note"><TrendingUp /> {refreshing ? "Refreshing analytics…" : "Tap to refresh live analytics"}</span>
      </button>

      <section>
        <h2 className="seller-mobile-section-title">Performance overview</h2>
        <div className="seller-mobile-metrics">
          {metrics.map(({ label, value, icon: Icon, tone }) => (
            <article key={label} className="seller-mobile-metric">
              <span className={`seller-mobile-metric-icon is-${tone}`}><Icon /></span>
              <span className="seller-mobile-live">Live</span>
              <strong>{value}</strong>
              <p>{label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="seller-mobile-sales">
        <div className="seller-mobile-sales-heading">
          <h2>Sales overview</h2>
          <span>Last 7 days</span>
        </div>
        {series.length ? (
          <div className="seller-mobile-chart" aria-label="Revenue for the last seven days">
            {series.map((item) => (
              <div className="seller-mobile-chart-column" key={item.label}>
                <span style={{ height: `${Math.max(10, (item.revenue / peak) * 100)}%` }} />
                <small>{item.label.split(",")[0].slice(0, 3)}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="seller-mobile-chart-empty">
            <BarChart3 />
            <p>Your sales activity will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function SellerDashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<"revenue" | "clicks" | "orders">("revenue");
  const [orderRange, setOrderRange] = useState<"today" | "7days" | "30days" | "all">("today");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const loadData = useCallback((isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    setError(null);

    Promise.all([getMe(), getSellerAnalytics()])
      .then(([userRes, analyticsRes]) => {
        setUser(userRes.user);
        if (!userRes.user.roles.includes("seller")) {
          router.replace("/seller/onboarding");
          return;
        }
        setAnalytics(analyticsRes.analytics);
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 403) {
          router.replace("/seller/onboarding");
        } else {
          setError(err instanceof ApiRequestError ? err.message : "Could not load analytics.");
        }
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [router]);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    const timer = setTimeout(() => {
      loadData(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [router, loadData]);

  const storeSlug = user?.sellerProfile?.storeSlug || "store";
  const storeName = user?.sellerProfile?.storeName || "My Store";
  const storeUrl = `priceam.ng/store/${storeSlug}`;

  function copyStoreLink() {
    navigator.clipboard.writeText(`https://${storeUrl}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  // Chart Calculations
  const chartData = useMemo(() => {
    if (!analytics?.chartSeries || analytics.chartSeries.length === 0) return [];
    return analytics.chartSeries;
  }, [analytics]);

  const maxVal = useMemo(() => {
    if (chartData.length === 0) return 1;
    if (activeChartTab === "revenue") {
      return Math.max(...chartData.map((d) => d.revenue), 1000);
    }
    if (activeChartTab === "clicks") {
      return Math.max(...chartData.map((d) => d.clicks), 10);
    }
    return Math.max(...chartData.map((d) => d.orders), 5);
  }, [chartData, activeChartTab]);

  const visibleOrders = useMemo(() => {
    const orders = analytics?.recentOrders || [];
    if (orderRange === "all") return orders;
    const now = new Date();
    const start = new Date(now);
    if (orderRange === "today") start.setHours(0, 0, 0, 0);
    else start.setDate(start.getDate() - (orderRange === "7days" ? 7 : 30));
    return orders.filter((order) => new Date(order.createdAt).getTime() >= start.getTime());
  }, [analytics?.recentOrders, orderRange]);

  if (loading && !analytics) {
    return (
      <>
        <main className="seller-mobile-dashboard space-y-5 md:hidden" aria-label="Loading seller dashboard">
          <div className="flex items-center gap-3">
            <div className="h-[3.25rem] w-[3.25rem] animate-pulse rounded-2xl bg-sunken" />
            <div className="flex-1 space-y-2"><div className="h-6 w-48 animate-pulse rounded-lg bg-sunken" /><div className="h-4 w-40 animate-pulse rounded-lg bg-sunken" /></div>
          </div>
          <div className="h-44 animate-pulse rounded-[1.8rem] bg-primary-darker/80" />
          <div className="grid grid-cols-2 gap-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-surface" />)}</div>
        </main>
        <main className="mx-auto hidden max-w-7xl space-y-6 px-4 py-10 sm:px-6 md:block">
          <div className="h-12 w-64 animate-pulse rounded-2xl bg-sunken" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-sunken" />)}</div>
          <div className="grid gap-6 lg:grid-cols-3"><div className="h-96 animate-pulse rounded-3xl bg-sunken lg:col-span-2" /><div className="h-96 animate-pulse rounded-3xl bg-sunken" /></div>
        </main>
      </>
    );
  }

  const fin = analytics?.financials;
  const traf = analytics?.traffic;
  const ord = analytics?.orders;
  const barg = analytics?.bargaining;

  // Operational Action Count
  const pendingDispatch = ord?.statusCounts?.processing || 0;
  const pendingOffers = barg?.pendingOffers || 0;
  const outOfStock = traf?.outOfStockCount || 0;
  const hasUrgentActions = pendingDispatch > 0 || pendingOffers > 0 || outOfStock > 0;

  return (
    <>
      <MobileSellerDashboard analytics={analytics} error={error} user={user} refreshing={refreshing} onRefresh={() => loadData(false)} />
    <main className="hidden w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 md:block">
      {/* Top Header & Store Card */}
      <section className="rounded-3xl border border-line bg-gradient-to-r from-surface via-primary-soft/20 to-surface p-6 sm:p-8 shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-soft font-black text-2xl">
              <Store className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                  {storeName}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-success-soft text-success border border-success/30 px-3 py-0.5 text-xs font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Merchant
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="font-mono bg-surface border border-line px-2.5 py-1 rounded-xl text-body font-semibold">
                  {storeUrl}
                </span>
                <button
                  type="button"
                  onClick={copyStoreLink}
                  className="inline-flex items-center gap-1 font-bold text-primary hover:underline transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedLink ? "Copied Link!" : "Copy Store Link"}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-line bg-surface hover:bg-sunken px-4 py-2.5 text-xs font-bold text-ink shadow-soft transition-all"
              title="Refresh live analytics"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-primary ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing…" : "Sync Analytics"}
            </button>

            <Link href="/seller/products/new">
              <Button size="md" className="rounded-2xl px-5 font-bold shadow-soft">
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </Link>

            <Link href="/seller/products">
              <Button variant="outline" size="md" className="rounded-2xl px-4 font-bold">
                <Package className="h-4 w-4 mr-1 text-primary" />
                Manage Inventory
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {error && <Alert kind="error">{error}</Alert>}

      {/* Operational Priority Action Banner (TikTok Shop Seller Priority Hub) */}
      {hasUrgentActions && (
        <section className="rounded-3xl border border-warning/40 bg-gradient-to-r from-warning-soft/70 via-surface to-primary-soft/30 p-5 shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-warning/20 text-ink">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  Seller Action Items Pending
                  <span className="rounded-full bg-primary text-white text-[10px] font-black px-2 py-0.5">
                    {pendingDispatch + pendingOffers + outOfStock}
                  </span>
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-body mt-1">
                  {pendingDispatch > 0 && (
                    <span className="font-semibold text-primary">
                      • {pendingDispatch} order(s) awaiting courier fulfillment
                    </span>
                  )}
                  {pendingOffers > 0 && (
                    <span className="font-semibold text-ink">
                      • {pendingOffers} Price Am counter-offer(s) to respond
                    </span>
                  )}
                  {outOfStock > 0 && (
                    <span className="font-semibold text-danger">
                      • {outOfStock} item(s) currently out of stock
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pendingDispatch > 0 && (
                <Link href="/orders">
                  <Button size="sm" className="rounded-xl font-bold bg-primary text-white shadow-soft">
                    <Truck className="h-3.5 w-3.5 mr-1" />
                    Ship Orders
                  </Button>
                </Link>
              )}
              {pendingOffers > 0 && (
                <Link href="/offers?tab=seller">
                  <Button variant="outline" size="sm" className="rounded-xl font-bold border-line bg-surface">
                    <Handshake className="h-3.5 w-3.5 mr-1 text-primary" />
                    Review Offers
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TikTok Shop-Style KPI Metric Card Deck */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Metric 1: Gross Revenue */}
        <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6 shadow-soft hover:shadow-lifted transition-shadow space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Total Revenue (GMV)
            </span>
            <span className="rounded-full bg-success-soft text-success text-[10px] font-bold px-2 py-0.5 flex items-center">
              <ArrowUpRight className="h-3 w-3" /> +14.8%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
            ₦{(fin?.grossRevenue || 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-line/60">
            <span>Completed Deals: ₦{(fin?.completedRevenue || 0).toLocaleString()}</span>
            <span className="text-primary font-bold">AOV: ₦{(fin?.averageOrderValue || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Metric 2: Product Clicks & Traffic (How many clicks he has got!) */}
        <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6 shadow-soft hover:shadow-lifted transition-shadow space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5" />
              Product Clicks
            </span>
            <span className="rounded-full bg-primary-soft text-primary text-[10px] font-extrabold px-2 py-0.5">
              Direct Traffic
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight flex items-baseline gap-2">
            {(traf?.totalClicks || 0).toLocaleString()}
            <span className="text-xs font-normal text-muted">clicks</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-line/60">
            <span>Conversion Rate:</span>
            <span className="font-extrabold text-success">{traf?.conversionRate || 0}%</span>
          </div>
        </div>

        {/* Metric 3: Orders Completed */}
        <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6 shadow-soft hover:shadow-lifted transition-shadow space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5 text-primary" />
              Customer Orders
            </span>
            <span className="rounded-full bg-accent/20 text-ink text-[10px] font-bold px-2 py-0.5">
              {traf?.totalUnitsSold || 0} units
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
            {(ord?.total || 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-line/60">
            <span>Fulfillment:</span>
            <span className="font-semibold text-body">
              {ord?.statusCounts?.completed || 0} completed
            </span>
          </div>
        </div>

        {/* Metric 4: Price Am Bargaining Engine */}
        <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6 shadow-soft hover:shadow-lifted transition-shadow space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Handshake className="h-3.5 w-3.5 text-primary" />
              Price Am Offers
            </span>
            <span className="rounded-full bg-success-soft text-success text-[10px] font-bold px-2 py-0.5">
              {barg?.bargainWinRate || 0}% Win Rate
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight flex items-baseline gap-2">
            {barg?.acceptedOffers || 0}
            <span className="text-xs font-normal text-muted">/ {barg?.totalOffers || 0} deals</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-line/60">
            <span>Price Am Discount:</span>
            <span className="font-bold text-success">
              -₦{(barg?.totalBargainSavings || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Orders are the seller's primary daily task, so they precede analytics. */}
      <section className="rounded-3xl border border-line bg-surface p-5 sm:p-7 shadow-soft space-y-5">
        <div className="flex flex-col gap-4 border-b border-line pb-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-ink">Customer Orders</h2>
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-extrabold text-primary-darker">
                {visibleOrders.length} shown
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted">Review new deals first, then open an order to coordinate fulfilment.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-line bg-sunken/60 p-1" aria-label="Filter orders by date">
              {[
                { key: "today", label: "Today" },
                { key: "7days", label: "Last 7 days" },
                { key: "30days", label: "Last 30 days" },
                { key: "all", label: "All" },
              ].map((range) => (
                <button
                  key={range.key}
                  type="button"
                  onClick={() => setOrderRange(range.key as typeof orderRange)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${orderRange === range.key ? "bg-surface text-primary shadow-soft" : "text-muted hover:text-ink"}`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <Link href="/orders">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold">View all deals</Button>
            </Link>
          </div>
        </div>

        {visibleOrders.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl bg-sunken/40 px-5 text-center">
            <ShoppingBag className="h-7 w-7 text-primary/60" />
            <h3 className="mt-2 text-sm font-bold text-ink">No orders in this period</h3>
            <p className="mt-1 text-xs text-muted">Choose a wider date range, or share your store link to attract buyers.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleOrders.map((o) => (
              <Link key={o._id} href={`/orders/${o._id}`} className="group block rounded-2xl border border-line p-4 transition-all hover:border-primary/40 hover:shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold text-muted">#{o._id.slice(-6).toUpperCase()}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${o.orderStatus === "completed" ? "border-success/30 bg-success-soft text-success" : o.orderStatus === "shipped" || o.orderStatus === "delivered" ? "border-accent/30 bg-accent/20 text-ink" : "border-warning/30 bg-warning/15 text-ink"}`}>
                    {o.orderStatus === "pending_payment" ? "Awaiting fulfilment" : o.orderStatus.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {o.firstItemImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={assetUrl(o.firstItemImage)} alt={o.firstItemTitle} className="h-12 w-12 shrink-0 rounded-xl border border-line object-cover" />
                  ) : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sunken"><Package className="h-5 w-5 text-muted" /></span>}
                  <div className="min-w-0"><h3 className="truncate text-sm font-bold text-ink group-hover:text-primary">{o.firstItemTitle}</h3><p className="truncate text-[11px] text-muted">{o.recipientName} · {o.destinationCity}</p></div>
                </div>
                <div className="mt-3 flex items-end justify-between border-t border-line/60 pt-3">
                  <div><span className="block text-[10px] font-bold uppercase text-muted">Deal total</span><strong className="text-base text-ink">₦{o.total.toLocaleString()}</strong></div>
                  <span className="text-[11px] font-bold text-primary">Open order →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Main Interactive Charts & Traffic Breakdown */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-stretch">
        {/* Left: Interactive Revenue & Traffic Chart (8 cols) */}
        <section className="flex h-full flex-col rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-7 lg:col-span-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-ink">
                  Performance &amp; Revenue Trends
                </h2>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Visual daily breakdown of sales revenue, clicks/views, and order volume.
              </p>
            </div>

            {/* Chart Mode Switcher */}
            <div className="inline-flex rounded-2xl border border-line bg-sunken/60 p-1">
              {[
                { key: "revenue", label: "Revenue (₦)" },
                { key: "clicks", label: "Clicks & Views" },
                { key: "orders", label: "Orders" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveChartTab(tab.key as typeof activeChartTab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeChartTab === tab.key
                      ? "bg-primary text-white shadow-soft"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic SVG / HTML Bar Chart */}
          <div className="flex flex-1 flex-col pt-6">
            <div className="min-h-64 flex-1 sm:min-h-72 w-full flex items-end gap-2 sm:gap-4 px-2 pt-6 pb-2 border-b border-line/60 relative">
              {/* Background Guideline grids */}
              <div className="absolute inset-x-0 top-6 border-b border-dashed border-line/40 text-[10px] text-muted/60 pl-1 select-none">
                {activeChartTab === "revenue"
                  ? `₦${maxVal.toLocaleString()}`
                  : maxVal.toLocaleString()}
              </div>
              <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-line/30 text-[10px] text-muted/60 pl-1 select-none">
                {activeChartTab === "revenue"
                  ? `₦${Math.round(maxVal / 2).toLocaleString()}`
                  : Math.round(maxVal / 2).toLocaleString()}
              </div>

              {chartData.map((d, index) => {
                const val =
                  activeChartTab === "revenue"
                    ? d.revenue
                    : activeChartTab === "clicks"
                    ? d.clicks
                    : d.orders;
                const heightPercent = Math.max(8, Math.round((val / maxVal) * 100));
                const isHovered = hoveredIndex === index;

                return (
                  <div
                    key={d.date}
                    className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Hover Floating Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-12 z-20 rounded-xl bg-ink text-white px-3 py-1.5 text-center text-xs shadow-lifted whitespace-nowrap animate-fade-in-up">
                        <span className="font-bold block">
                          {activeChartTab === "revenue"
                            ? `₦${d.revenue.toLocaleString()}`
                            : activeChartTab === "clicks"
                            ? `${d.clicks} clicks`
                            : `${d.orders} orders`}
                        </span>
                        <span className="text-[10px] text-muted block">{d.label}</span>
                      </div>
                    )}

                    {/* Bar Pillar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                        activeChartTab === "revenue"
                          ? isHovered
                            ? "bg-primary shadow-glow scale-105"
                            : "bg-gradient-to-t from-primary/80 to-primary"
                          : activeChartTab === "clicks"
                          ? isHovered
                            ? "bg-accent shadow-glow scale-105"
                            : "bg-gradient-to-t from-accent/80 to-accent"
                          : isHovered
                          ? "bg-success shadow-glow scale-105"
                          : "bg-gradient-to-t from-success/80 to-success"
                      }`}
                    />

                    {/* Day label */}
                    <span className="text-[11px] font-semibold text-muted mt-2 truncate max-w-full">
                      {d.label.split(",")[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chart Summary Footnote */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs text-muted">
              <span className="flex items-center gap-1.5 font-medium">
                <TrendingUp className="h-4 w-4 text-success" />
                Peak traffic occurs during evening hours (5 PM - 9 PM West Africa Time).
              </span>
              <span className="font-semibold text-ink">
                Last 7 Days Rolling Window
              </span>
            </div>
          </div>
        </section>

        {/* Right: Store Operations & Direct Deals Hub (4 cols) */}
        <section className="h-full rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-7 lg:col-span-4 space-y-6">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <Store className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-ink">
              Store Operations
            </h2>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-primary-soft/60 via-surface to-accent/15 border border-primary/20 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                Trading Model
              </span>
              <span className="rounded-full bg-success-soft text-success text-[10px] font-black px-2.5 py-0.5">
                0% Commission
              </span>
            </div>
            <div className="text-lg font-black text-ink">
              Direct Buyer Settlement
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Buyers pay you directly upon item inspection (cash or instant bank transfer). Keep 100% of your selling price with zero platform deductions.
            </p>
          </div>

          {/* Store Info & Guidelines */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-line/60">
              <span className="text-muted">Store Name:</span>
              <strong className="text-ink">
                {user?.sellerProfile?.storeName || "My Store"}
              </strong>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-line/60">
              <span className="text-muted">Listing Fee:</span>
              <strong className="text-success font-black">₦0 (100% Free)</strong>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-line/60">
              <span className="text-muted">Payment Method:</span>
              <strong className="text-ink">Direct on Meetup / Inspection</strong>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-line/60">
              <span className="text-muted">Account Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active Merchant
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 space-y-2.5">
            <Link href="/seller/products/new" className="block">
              <Button full size="sm" className="rounded-xl font-bold">
                <Plus className="h-4 w-4 mr-1.5" />
                Post New Product
              </Button>
            </Link>
            <Link href="/seller/products" className="block">
              <Button variant="outline" full size="sm" className="rounded-xl font-bold">
                <Package className="h-4 w-4 mr-1.5" />
                Manage Inventory
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* Top Performing Products (with Clicks & Conversion) */}
      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-ink">
                Top Products by Traffic &amp; Revenue
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Track how many clicks and sales each item receives on the marketplace.
            </p>
          </div>

          <Link href="/seller/products">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold">
              View All {traf?.totalListings || 0} Listings →
            </Button>
          </Link>
        </div>

        {/* Table of Top Products */}
        {!analytics?.topProducts || analytics.topProducts.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">
            No products listed yet. Create your first listing to start tracking clicks!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-line text-muted uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-bold">Product</th>
                  <th className="pb-3 font-bold">Listed Price</th>
                  <th className="pb-3 font-bold">Total Clicks</th>
                  <th className="pb-3 font-bold">Units Sold</th>
                  <th className="pb-3 font-bold">Gross Revenue</th>
                  <th className="pb-3 font-bold">Stock Status</th>
                  <th className="pb-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {analytics.topProducts.map((p, idx) => (
                  <tr key={p._id} className="hover:bg-sunken/40 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sunken text-[10px] font-black text-muted shrink-0">
                          #{idx + 1}
                        </span>
                        {p.coverUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={assetUrl(p.coverUrl)}
                            alt={p.title}
                            className="h-11 w-11 rounded-xl border border-line object-cover shrink-0"
                          />
                        )}
                        <Link
                          href={`/products/${p._id}`}
                          target="_blank"
                          className="font-bold text-ink hover:text-primary transition-colors truncate max-w-xs block"
                        >
                          {p.title}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3.5 font-bold text-ink whitespace-nowrap">
                      ₦{p.price.toLocaleString()}
                    </td>
                    <td className="py-3.5 whitespace-nowrap">
                      <span className="font-extrabold text-primary flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {p.viewsCount.toLocaleString()} clicks
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-ink whitespace-nowrap">
                      {p.salesCount} sold
                    </td>
                    <td className="py-3.5 font-black text-ink whitespace-nowrap">
                      ₦{p.revenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${
                          p.stock <= 0
                            ? "bg-danger/10 text-danger border-danger/30"
                            : p.stock <= 2
                            ? "bg-warning/15 text-ink border-warning/30"
                            : "bg-success-soft text-success border-success/30"
                        }`}
                      >
                        {p.stock <= 0 ? "Out of Stock" : `${p.stock} in stock`}
                      </span>
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <Link href={`/seller/products/${p._id}/edit`}>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold h-8 px-3">
                          Edit
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent Orders Stream (TikTok Shop Fulfilment Feed) */}
      <section className="hidden" aria-hidden="true">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-ink">
                Recent Customer Orders
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Live incoming customer purchases and agreed Price Am deals.
            </p>
          </div>

          <Link href="/orders">
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold">
              View All Orders →
            </Button>
          </Link>
        </div>

        {!analytics?.recentOrders || analytics.recentOrders.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted">
            No orders received yet. Share your store link on WhatsApp or Instagram to attract buyers!
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {analytics.recentOrders.map((o) => {
              const isPriceAm = o.source === "offer";

              return (
                <Link
                  key={o._id}
                  href={`/orders/${o._id}`}
                  className="group rounded-2xl border border-line bg-surface p-4 shadow-xs hover:border-primary/40 hover:shadow-soft transition-all space-y-3 block"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-muted bg-sunken px-2 py-0.5 rounded-lg border border-line">
                      #{o._id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${
                        o.orderStatus === "completed"
                          ? "bg-success-soft text-success border-success/30"
                          : o.orderStatus === "shipped"
                          ? "bg-accent/20 text-ink border-accent/30"
                          : o.orderStatus === "delivered"
                          ? "bg-success/15 text-success border-success/30"
                          : "bg-warning/15 text-ink border-warning/30"
                      }`}
                    >
                      {o.orderStatus === "pending_payment" ? "Awaiting fulfilment" : o.orderStatus.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {o.firstItemImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={assetUrl(o.firstItemImage)}
                        alt={o.firstItemTitle}
                        className="h-12 w-12 rounded-xl border border-line object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-ink group-hover:text-primary transition-colors truncate">
                        {o.firstItemTitle}
                      </h4>
                      <p className="text-[11px] text-muted truncate">
                        To: {o.recipientName} ({o.destinationCity})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-line/60 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted block">Deal Total</span>
                      <strong className="text-sm font-black text-ink">
                        ₦{o.total.toLocaleString()}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-primary text-[11px] group-hover:translate-x-1 transition-transform">
                      {isPriceAm && (
                        <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] text-ink mr-1 font-extrabold">
                          Price Am
                        </span>
                      )}
                      View Order →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
    </>
  );
}

export default function SellerDashboardPage() {
  return (
    <Suspense>
      <SellerDashboardContent />
    </Suspense>
  );
}
