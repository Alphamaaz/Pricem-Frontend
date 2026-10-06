"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ExternalLink,
  Eye,
  Handshake,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";
import { listMyProducts, removeProduct } from "@/lib/products";
import type { Product } from "@/lib/products";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { Alert, Button } from "@/components/ui";

function SellerProductsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justUpdated = searchParams.get("updated") === "1";
  const [products, setProducts] = useState<Product[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    listMyProducts()
      .then((res) => {
        setProducts(res.products);
        setReady(true);
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 403) {
          router.replace("/seller/onboarding");
        } else {
          router.replace("/login");
        }
      });
  }, [router]);

  async function onRemove(id: string, title: string) {
    if (!window.confirm(`Are you sure you want to remove "${title}"? Buyers will no longer be able to discover or Price Am this listing.`)) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await removeProduct(id);
      setProducts((p) => p.filter((x) => x._id !== id));
      setNotice(`"${title}" was removed from your store.`);
      setTimeout(() => setNotice(null), 3000);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Remove failed. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, statusFilter, searchQuery]);

  // Aggregate Stats
  const metrics = useMemo(() => {
    const total = products.length;
    const totalViews = products.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
    const totalSales = products.reduce((acc, p) => acc + (p.salesCount || 0), 0);
    const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    return { total, totalViews, totalSales, totalStock };
  }, [products]);

  if (!ready) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="h-10 w-48 rounded-2xl bg-sunken animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-sunken animate-pulse" />
          ))}
        </div>
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-3xl bg-sunken animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Store className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Merchant Inventory Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-0.5">
            Store Listings
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Manage product prices, Price Am limits, and inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/seller">
            <Button variant="outline" size="md" className="rounded-xl px-4 font-bold">
              <Store className="h-4 w-4 mr-1 text-primary" />
              Seller Dashboard
            </Button>
          </Link>
          <Link href="/seller/products/new">
            <Button size="md" className="rounded-xl px-5 font-bold shadow-soft">
              <Plus className="h-4 w-4 mr-1" />
              Add New Item
            </Button>
          </Link>
        </div>
      </div>

      {justUpdated && (
        <Alert kind="success">Listing was successfully updated.</Alert>
      )}
      {notice && <Alert kind="success">{notice}</Alert>}
      {error && <Alert kind="error">{error}</Alert>}

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
            Total Listings
          </span>
          <span className="text-2xl font-black text-ink mt-0.5 block">{metrics.total}</span>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
            Units In Stock
          </span>
          <span className="text-2xl font-black text-primary mt-0.5 block">{metrics.totalStock}</span>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
            Listing Views
          </span>
          <span className="text-2xl font-black text-ink mt-0.5 block">{metrics.totalViews}</span>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
            Items Sold
          </span>
          <span className="text-2xl font-black text-success mt-0.5 block">{metrics.totalSales}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by title..."
            className="w-full h-10 rounded-xl border border-line bg-surface pl-10 pr-4 text-xs sm:text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-shadow"
          />
        </div>

        <div className="inline-flex rounded-xl border border-line bg-surface p-1 shadow-soft self-start sm:self-auto">
          {(["all", "active", "draft"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                statusFilter === filter
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted hover:text-ink"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl bg-surface border border-line shadow-soft p-12 text-center space-y-3">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-sunken flex items-center justify-center text-muted">
            <Package className="h-8 w-8 opacity-60" />
          </div>
          <h3 className="text-base font-bold text-ink">
            {searchQuery ? "No matching products found" : "No listings in your store"}
          </h3>
          <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search query or status filter."
              : "Start adding products to enable Price Am and reach buyers nationwide."}
          </p>
          <div className="pt-2">
            <Link href="/seller/products/new">
              <Button size="md" className="rounded-xl px-6 font-bold">
                Create First Listing
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredProducts.map((p) => {
            const hasMinPrice = p.minPrice != null && p.minPrice < p.price;

            return (
              <li
                key={p._id}
                className="group rounded-3xl bg-surface border border-line shadow-soft p-4 sm:p-5 hover:border-primary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${p._id}`}
                    className="relative shrink-0 overflow-hidden rounded-2xl border border-line bg-sunken"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assetUrl(p.coverImage.url)}
                      alt={p.title}
                      className="h-16 w-16 sm:h-20 sm:w-20 object-cover group-hover:scale-105 transition-transform"
                    />
                  </Link>

                  {/* Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/products/${p._id}`}
                        className="font-bold text-sm sm:text-base text-ink hover:text-primary transition-colors truncate block"
                      >
                        {p.title}
                      </Link>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${
                          p.status === "active"
                            ? "bg-success-soft text-success border-success/30"
                            : "bg-sunken text-muted border-line"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-2 text-xs">
                      <span className="font-black text-ink text-sm sm:text-base">
                        ₦{p.price.toLocaleString()}
                      </span>
                      {hasMinPrice && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-ink border border-accent/30">
                          <Handshake className="h-3 w-3 text-primary" />
                          Price Am Floor: ₦{p.minPrice!.toLocaleString()}
                        </span>
                      )}
                      <span className="text-muted">· Stock: {p.stock} units</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-muted pt-0.5">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {p.viewsCount || 0} views
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        {p.salesCount || 0} sales
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link
                    href={`/products/${p._id}`}
                    target="_blank"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-line bg-surface hover:border-primary hover:text-primary transition-colors"
                    title="View live marketplace listing"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>

                  <Link href={`/seller/products/${p._id}/edit`}>
                    <Button variant="outline" size="sm" className="rounded-xl px-3 font-semibold">
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === p._id}
                    onClick={() => onRemove(p._id, p.title)}
                    className="rounded-xl px-3 font-semibold border-danger/30 text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

export default function SellerProductsPage() {
  return (
    <Suspense>
      <SellerProductsList />
    </Suspense>
  );
}
