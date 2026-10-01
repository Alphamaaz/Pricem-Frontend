"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  Filter,
  Gamepad2,
  Handshake,
  Headphones,
  Home as HomeIcon,
  LayoutGrid,
  List,
  MapPin,
  Package,
  PackageOpen,
  RotateCcw,
  Search,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { listProducts, type Product, type ProductSort } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { Button, Input } from "@/components/ui";

const CATEGORY_ITEMS = [
  { id: "", label: "All Categories", icon: Package },
  { id: "electronics", label: "Electronics & Tech", icon: Headphones },
  { id: "fashion", label: "Fashion & Apparel", icon: Shirt },
  { id: "home", label: "Home & Furniture", icon: HomeIcon },
  { id: "gaming", label: "Gaming & Consoles", icon: Gamepad2 },
  { id: "books", label: "Books & Education", icon: BookOpen },
  { id: "other", label: "General Goods", icon: Sparkles },
];

const NIGERIAN_STATES = [
  "All Nigeria",
  "Lagos",
  "Abuja FCT",
  "Rivers",
  "Oyo",
  "Kano",
  "Ogun",
  "Enugu",
  "Delta",
  "Anambra",
  "Kaduna",
  "Edo",
  "Imo",
  "Akwa Ibom",
];

const PRICE_PRESETS = [
  { label: "Any Price", min: undefined, max: undefined },
  { label: "Under ₦20,000", min: undefined, max: 20000 },
  { label: "₦20,000 - ₦50,000", min: 20000, max: 50000 },
  { label: "₦50,000 - ₦150,000", min: 50000, max: 150000 },
  { label: "₦150,000 - ₦500,000", min: 150000, max: 500000 },
  { label: "₦500,000+", min: 500000, max: undefined },
];

interface MarketplaceCatalogProps {
  initialProducts?: Product[];
  initialTotal?: number;
  initialSearch?: string;
  initialCategory?: string;
}

export function MarketplaceCatalog({
  initialProducts = [],
  initialTotal = 0,
  initialSearch = "",
  initialCategory = "",
}: MarketplaceCatalogProps) {
  const [, startTransition] = useTransition();

  // Filters State
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedState, setSelectedState] = useState("All Nigeria");
  const [condition, setCondition] = useState<"" | "new" | "used">("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [negotiableOnly, setNegotiableOnly] = useState(false);
  const [sort, setSort] = useState<ProductSort>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Custom price range
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");
  const [appliedMin, setAppliedMin] = useState<number | undefined>(undefined);
  const [appliedMax, setAppliedMax] = useState<number | undefined>(undefined);

  // Results State
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Fetch products based on active filters
  const fetchFilteredProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listProducts({
        limit: 36,
        search: search.trim() || undefined,
        category: selectedCategory || undefined,
        condition: condition || undefined,
        inStock: inStockOnly || undefined,
        state: selectedState !== "All Nigeria" ? selectedState : undefined,
        negotiable: negotiableOnly ? true : undefined,
        minPrice: appliedMin,
        maxPrice: appliedMax,
        sort,
      });

      startTransition(() => {
        setProducts(res.products);
        setTotal(res.total);
      });
    } catch (err) {
      console.error("Failed to filter products", err);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    selectedCategory,
    condition,
    inStockOnly,
    selectedState,
    negotiableOnly,
    appliedMin,
    appliedMax,
    sort,
  ]);

  // Trigger search on filter changes (with slight debounce for search text)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilteredProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchFilteredProducts]);

  // Handle Preset Price click
  function handlePresetSelect(index: number) {
    setSelectedPresetIndex(index);
    const preset = PRICE_PRESETS[index];
    setAppliedMin(preset.min);
    setAppliedMax(preset.max);
    setCustomMin(preset.min ? String(preset.min) : "");
    setCustomMax(preset.max ? String(preset.max) : "");
  }

  // Handle Custom Price Submit
  function handleCustomPriceApply(e: React.FormEvent) {
    e.preventDefault();
    const min = customMin ? Number(customMin) : undefined;
    const max = customMax ? Number(customMax) : undefined;
    setAppliedMin(min);
    setAppliedMax(max);
    setSelectedPresetIndex(-1); // Deselect presets
  }

  // Reset all filters
  function resetAllFilters() {
    setSearch("");
    setSelectedCategory("");
    setSelectedState("All Nigeria");
    setCondition("");
    setInStockOnly(false);
    setNegotiableOnly(false);
    setSelectedPresetIndex(0);
    setCustomMin("");
    setCustomMax("");
    setAppliedMin(undefined);
    setAppliedMax(undefined);
    setSort("featured");
  }

  // Count active filter tags
  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    (selectedState !== "All Nigeria" ? 1 : 0) +
    (condition ? 1 : 0) +
    (appliedMin !== undefined || appliedMax !== undefined ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (negotiableOnly ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <div className="space-y-3 sm:space-y-3.5" id="catalog-section">
      {/* Category Quick Pills Strip (Directly at top of marketplace) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_ITEMS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                isSelected
                  ? "bg-primary text-white shadow-soft"
                  : "bg-surface border border-line text-ink hover:border-primary hover:text-primary"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* High-Efficiency Catalog Action Bar */}
      <div className="rounded-2xl border border-line bg-surface p-2 sm:p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Search within catalog */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search within listings…"
            className="w-full h-9 rounded-xl border border-line bg-sunken/60 pl-9 pr-7 text-xs text-ink placeholder:text-muted focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* View Mode & Mobile Trigger */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile Filter Drawer Button */}
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-bold text-ink shadow-xs hover:border-primary transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-primary text-white text-[10px] font-black px-1.5 py-0.2">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ProductSort)}
              className="h-9 appearance-none rounded-xl border border-line bg-surface pl-3 pr-7 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary/25 shadow-xs cursor-pointer"
            >
              <option value="featured">Featured Deals</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Top Rated</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          </div>

          {/* Grid vs List View Toggle */}
          <div className="hidden sm:flex items-center rounded-xl border border-line bg-sunken/60 p-0.5 shadow-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-surface text-primary shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[17rem_1fr] items-start gap-4 sm:gap-5">
        {/* =================================================================== */}
        {/* LEFT COLUMN: FILTER SIDEBAR (DESKTOP)                               */}
        {/* =================================================================== */}
        <aside className="hidden lg:block sticky top-20 rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-xs space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-2 font-bold text-ink text-sm">
              <Filter className="h-4 w-4 text-primary" />
              <span>Refine Listings</span>
              {activeFiltersCount > 0 && (
                <span className="rounded-full bg-primary/10 text-primary text-[11px] font-black px-2 py-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-muted hover:text-primary transition-colors flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>

          {/* 1. Location / State Filter */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Nigerian Trading Hub
            </label>
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full h-10 appearance-none rounded-2xl border border-line bg-sunken/60 pl-3.5 pr-8 text-xs font-semibold text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {NIGERIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            </div>
          </div>

          {/* 2. Category Filter */}
          <div className="space-y-2.5 pt-4 border-t border-line">
            <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Category
            </label>
            <div className="space-y-1">
              {CATEGORY_ITEMS.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-primary text-white shadow-soft"
                        : "text-muted hover:text-ink hover:bg-sunken"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-primary"}`} />
                      {cat.label}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Price Filter */}
          <div className="space-y-3 pt-4 border-t border-line">
            <label className="text-xs font-bold text-ink uppercase tracking-wider">
              Price Range (₦)
            </label>

            {/* Presets */}
            <div className="space-y-1">
              {PRICE_PRESETS.map((preset, idx) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetSelect(idx)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedPresetIndex === idx
                      ? "bg-primary-soft text-primary-darker font-bold border border-primary/20"
                      : "text-muted hover:text-ink hover:bg-sunken"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Min / Max inputs */}
            <form onSubmit={handleCustomPriceApply} className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-muted font-bold block mb-1">Min (₦)</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={customMin}
                    onChange={(e) => setCustomMin(e.target.value)}
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-muted font-bold block mb-1">Max (₦)</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={customMax}
                    onChange={(e) => setCustomMax(e.target.value)}
                    className="h-8 text-xs rounded-xl"
                  />
                </div>
              </div>
              <Button type="submit" variant="outline" size="sm" className="w-full h-8 rounded-xl text-xs font-bold">
                Apply Price
              </Button>
            </form>
          </div>

          {/* 4. Condition Filter */}
          <div className="space-y-2.5 pt-4 border-t border-line">
            <label className="text-xs font-bold text-ink uppercase tracking-wider">
              Item Condition
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "", label: "All" },
                { id: "new", label: "Brand New" },
                { id: "used", label: "Used" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCondition(c.id as typeof condition)}
                  className={`py-1.5 text-center rounded-xl text-xs font-semibold transition-all border ${
                    condition === c.id
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-surface border-line text-muted hover:text-ink"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Toggles (Negotiable & In Stock) */}
          <div className="space-y-3 pt-4 border-t border-line">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs font-semibold text-ink group-hover:text-primary transition-colors flex items-center gap-1.5">
                <Handshake className="h-3.5 w-3.5 text-primary" />
                Price Am Bargains Only
              </span>
              <input
                type="checkbox"
                checked={negotiableOnly}
                onChange={(e) => setNegotiableOnly(e.target.checked)}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-xs font-semibold text-ink group-hover:text-primary transition-colors flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-muted" />
                In Stock Only
              </span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
            </label>
          </div>
        </aside>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: ACTIVE FILTER CHIPS & PRODUCT GRID                    */}
        {/* =================================================================== */}
        <main className="space-y-3.5">
          {/* Active Filter Chips & Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-ink">
                {selectedCategory
                  ? CATEGORY_ITEMS.find((c) => c.id === selectedCategory)?.label || "Listings"
                  : "All Marketplace Listings"}
              </h2>
              <span className="text-[11px] font-bold text-muted bg-sunken border border-line px-2 py-0.5 rounded-full">
                {loading ? "Searching…" : `${total} items`}
              </span>
              {selectedState !== "All Nigeria" && (
                <span className="text-xs text-muted hidden sm:inline">
                  in <strong className="text-ink">{selectedState}</strong>
                </span>
              )}
            </div>

            {/* Active Chips Strip */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                    <span className="capitalize">{selectedCategory}</span>
                    <button onClick={() => setSelectedCategory("")} className="hover:opacity-75">✕</button>
                  </span>
                )}
                {selectedState !== "All Nigeria" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sunken border border-line px-3 py-1 text-xs font-semibold text-ink">
                    <span>{selectedState}</span>
                    <button onClick={() => setSelectedState("All Nigeria")} className="hover:opacity-75">✕</button>
                  </span>
                )}
                {condition && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sunken border border-line px-3 py-1 text-xs font-semibold text-ink">
                    <span className="capitalize">{condition === "new" ? "Brand New" : "Pre-Owned"}</span>
                    <button onClick={() => setCondition("")} className="hover:opacity-75">✕</button>
                  </span>
                )}
                {(appliedMin !== undefined || appliedMax !== undefined) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sunken border border-line px-3 py-1 text-xs font-semibold text-ink">
                    <span>
                      {appliedMin ? `₦${appliedMin.toLocaleString()}` : "₦0"} - {appliedMax ? `₦${appliedMax.toLocaleString()}` : "Any"}
                    </span>
                    <button onClick={() => { setAppliedMin(undefined); setAppliedMax(undefined); setSelectedPresetIndex(0); }} className="hover:opacity-75">✕</button>
                  </span>
                )}
                {negotiableOnly && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                    <span>Price Am Only</span>
                    <button onClick={() => setNegotiableOnly(false)} className="hover:opacity-75">✕</button>
                  </span>
                )}
                <button
                  onClick={resetAllFilters}
                  className="text-xs font-bold text-danger hover:underline ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Loading Shimmer State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-3xl border border-line bg-surface p-4 space-y-4 animate-pulse">
                  <div className="aspect-[4/3] rounded-2xl bg-sunken" />
                  <div className="space-y-2">
                    <div className="h-4 bg-sunken rounded-md w-3/4" />
                    <div className="h-3 bg-sunken rounded-md w-1/2" />
                  </div>
                  <div className="pt-2 border-t border-line flex justify-between items-center">
                    <div className="h-5 bg-sunken rounded-md w-20" />
                    <div className="h-8 bg-sunken rounded-xl w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="rounded-3xl border border-line bg-surface p-12 sm:p-16 text-center space-y-4 shadow-soft">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary mx-auto">
                <PackageOpen className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-ink">No listings found matching your filters</h3>
                <p className="text-xs text-muted max-w-md mx-auto">
                  Try broadening your price range, choosing another Nigerian state, or searching with general terms.
                </p>
              </div>
              <Button onClick={resetAllFilters} variant="outline" size="sm" className="rounded-xl">
                Reset All Filters
              </Button>
            </div>
          ) : (
            /* Product List or Grid */
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                  : "flex flex-col gap-4"
              }
            >
              {products.map((p) => (
                <ProductCard key={p._id} product={p} viewMode={viewMode} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* =================================================================== */}
      {/* MOBILE FILTER SLIDE-OVER DRAWER                                     */}
      {/* =================================================================== */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs lg:hidden">
          <div className="w-full max-w-sm bg-surface h-full shadow-glow p-6 flex flex-col justify-between overflow-y-auto space-y-6 animate-fade-in-up">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2 font-bold text-ink">
                  <Filter className="h-4 w-4 text-primary" />
                  <span>Filters ({activeFiltersCount})</span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="text-muted hover:text-ink text-sm font-bold p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* State Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Nigerian Trading Hub
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full h-10 rounded-2xl border border-line bg-sunken px-3 text-xs font-semibold text-ink"
                >
                  {NIGERIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  Category
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORY_ITEMS.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold text-left truncate transition-colors border ${
                        selectedCategory === cat.id
                          ? "bg-primary text-white border-primary"
                          : "bg-surface border-line text-muted"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">
                  Price Presets
                </label>
                <div className="space-y-1">
                  {PRICE_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetSelect(idx)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium ${
                        selectedPresetIndex === idx
                          ? "bg-primary-soft text-primary font-bold"
                          : "text-muted hover:bg-sunken"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-ink uppercase tracking-wider">
                  Condition
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "", label: "All" },
                    { id: "new", label: "Brand New" },
                    { id: "used", label: "Used" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCondition(c.id as typeof condition)}
                      className={`py-2 text-center rounded-xl text-xs font-semibold border ${
                        condition === c.id
                          ? "bg-primary text-white border-primary"
                          : "bg-surface border-line text-muted"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-line">
                <label className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span>Price Am Bargains Only</span>
                  <input
                    type="checkbox"
                    checked={negotiableOnly}
                    onChange={(e) => setNegotiableOnly(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                </label>
                <label className="flex items-center justify-between text-xs font-semibold text-ink">
                  <span>In Stock Only</span>
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                </label>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-line flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="rounded-xl flex-1 text-xs"
              >
                Reset All
              </Button>
              <Button
                size="sm"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-xl flex-1 text-xs font-bold"
              >
                Show {total} Deals
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
