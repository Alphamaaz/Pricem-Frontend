"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Copy,
  DollarSign,
  Eye,
  Handshake,
  MousePointerClick,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
} from "lucide-react";
import { getMe } from "@/lib/auth";
import { getSellerAnalytics, type SellerAnalytics } from "@/lib/orders";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { Alert, Button } from "@/components/ui";
import type { User } from "@/lib/types";

function SellerDashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<"revenue" | "clicks" | "orders">("revenue");
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

  if (loading && !analytics) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="h-12 w-64 rounded-2xl bg-sunken animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-sunken animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 rounded-3xl bg-sunken animate-pulse" />
          <div className="h-96 rounded-3xl bg-sunken animate-pulse" />
        </div>
      </main>
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
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
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
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 text-ink border border-accent/30 px-3 py-0.5 text-xs font-extrabold">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Price Am Offers Enabled
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
            <span>Settled: ₦{(fin?.completedRevenue || 0).toLocaleString()}</span>
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

      {/* Main Interactive Charts & Traffic Breakdown (TikTok Shop Visual Analytics) */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left: Interactive Revenue & Traffic Chart (8 cols) */}
        <section className="lg:col-span-8 rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-6">
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
          <div className="pt-2">
            <div className="h-64 sm:h-72 w-full flex items-end gap-2 sm:gap-4 px-2 pt-6 pb-2 border-b border-line/60 relative">
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

        {/* Right: Settlement & Nigerian Bank Payouts Hub (4 cols) */}
        <section className="lg:col-span-4 rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-6">
          <div className="flex items-center gap-2 border-b border-line pb-4">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-ink">
              Settlement Payouts
            </h2>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-primary-soft/60 via-surface to-accent/15 border border-primary/20 p-5 space-y-3">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted block">
              Available Escrow Balance
            </span>
            <div className="text-2xl font-black text-ink">
              ₦{(fin?.completedRevenue || 0).toLocaleString()}
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              Funds from delivered and confirmed buyer deals are settled automatically to your registered Nigerian bank account.
            </p>
          </div>

          {/* Registered Bank Account Info */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-line/60">
              <span className="text-muted">Settlement Bank:</span>
              <strong className="text-ink">
                {user?.sellerProfile?.payoutDetails?.bankName || "Commercial Bank"}
              </strong>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-line/60">
              <span className="text-muted">Account Number:</span>
              <strong className="text-ink font-mono">
                {user?.sellerProfile?.payoutDetails?.accountNumber
                  ? `•••• ${user.sellerProfile.payoutDetails.accountNumber.slice(-4)}`
                  : "•••• 4821"}
              </strong>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-line/60">
              <span className="text-muted">Account Name:</span>
              <strong className="text-ink">
                {user?.sellerProfile?.payoutDetails?.accountName || user?.fullName}
              </strong>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-line/60">
              <span className="text-muted">Listing Fee Rate:</span>
              <strong className="text-success font-black">0% (Zero Listing Fees)</strong>
            </div>
          </div>

          <Link href="/profile" className="block pt-2">
            <Button variant="outline" full size="sm" className="rounded-xl font-bold">
              Update Bank Payout Details
            </Button>
          </Link>
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
      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-ink">
                Recent Customer Orders &amp; Logistics
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Live incoming customer purchases, courier dispatches, and agreed Price Am deals.
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
                      {o.orderStatus.replace("_", " ")}
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
                      Logistics →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default function SellerDashboardPage() {
  return (
    <Suspense>
      <SellerDashboardContent />
    </Suspense>
  );
}
