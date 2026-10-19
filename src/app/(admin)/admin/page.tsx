"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  BadgeAlert,
  BadgeDollarSign,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleCheckBig,
  Clock,
  Download,
  ExternalLink,
  Handshake,
  HelpCircle,
  Inbox,
  LifeBuoy,
  MapPin,
  MessageSquareWarning,
  Baby,
  BookOpen,
  Edit2,
  Gamepad2,
  Headphones,
  Home as HomeIcon,
  Laptop,
  Package,
  Plus,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Truck,
  UserCheck,
  UserX,
  Users,
  Wallet,
  Wrench,
  XCircle,
} from "lucide-react";
import { getMe } from "@/lib/auth";
import { assetUrl, tokenStore } from "@/lib/api";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  type Category,
} from "@/lib/categories";
import {
  getAdminAnalytics,
  getAdminUsers,
  approveSeller,
  rejectSeller,
  toggleUserStatus,
  hideQuestion,
  answerQuestionAsAdmin,
  reviewOrderCompletion,
  type AdminAnalyticsData,
  type PendingCompletionOrder,
  type EligiblePayoutItem,
  type UnansweredQuestionItem,
} from "@/lib/admin";
import { approvePayout, confirmPayout } from "@/lib/payouts";
import type { User } from "@/lib/types";
import { Logo } from "@/components/Logo";
import { Button, Input } from "@/components/ui";

const CATEGORY_ICON_PRESETS = [
  { name: "Smartphone", label: "Phone", icon: Smartphone },
  { name: "Laptop", label: "Computer", icon: Laptop },
  { name: "Baby", label: "Kids & Toys", icon: Baby },
  { name: "Sparkles", label: "Beauty", icon: Sparkles },
  { name: "Wrench", label: "Tools", icon: Wrench },
  { name: "Headphones", label: "Electronics", icon: Headphones },
  { name: "Shirt", label: "Fashion", icon: Shirt },
  { name: "HomeIcon", label: "Home", icon: HomeIcon },
  { name: "Gamepad2", label: "Gaming", icon: Gamepad2 },
  { name: "BookOpen", label: "Books", icon: BookOpen },
  { name: "Package", label: "General", icon: Package },
  { name: "Tag", label: "Category", icon: Tag },
];

function CategoryIconView({ iconName, className = "h-5 w-5" }: { iconName: string; className?: string }) {
  const match = CATEGORY_ICON_PRESETS.find((p) => p.name === iconName);
  if (match) {
    const IconComp = match.icon;
    return <IconComp className={className} />;
  }
  if (iconName === "Home") return <HomeIcon className={className} />;
  return <Tag className={className} />;
}

const NAV_SHORTCUTS = [
  { href: "/admin/sellers", title: "Seller Applications", countKey: "pendingSellersCount" as const, icon: Store, color: "text-amber-500", bg: "bg-amber-500/10" },
  { href: "/admin/disputes", title: "Dispute Arbitration", countKey: "openDisputesCount" as const, icon: MessageSquareWarning, color: "text-danger", bg: "bg-danger/10" },
  { href: "/admin/payouts", title: "Seller Payouts", countKey: "eligiblePayoutsCount" as const, icon: BadgeDollarSign, color: "text-primary", bg: "bg-primary/10" },
  { href: "/admin/completion-requests", title: "Delivery Proofs", countKey: "pendingCompletionCount" as const, icon: CircleCheckBig, color: "text-success", bg: "bg-success/10" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "support" | "users" | "categories" | "activity" | "settings">("overview");

  // Operational request sub-filter
  const [requestFilter, setRequestFilter] = useState<"all" | "sellers" | "completions" | "payouts">("all");

  // User directory state
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userLoading, setUserLoading] = useState(false);

  // Category management state
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryStatusFilter, setCategoryStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categorySaving, setCategorySaving] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    icon: "Tag",
    description: "",
    order: 10,
    isActive: true,
  });

  // Operational modals & actions
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  // Reject seller modal
  const [rejectingSellerId, setRejectingSellerId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Review completion modal
  const [reviewingOrder, setReviewingOrder] = useState<PendingCompletionOrder | null>(null);
  const [completionDecisionNote, setCompletionDecisionNote] = useState("");

  // Answer question modal
  const [answeringQuestion, setAnsweringQuestion] = useState<UnansweredQuestionItem | null>(null);
  const [adminAnswerText, setAdminAnswerText] = useState("");

  // Confirm payout modal
  const [confirmingPayout, setConfirmingPayout] = useState<EligiblePayoutItem | null>(null);
  const [transferReference, setTransferReference] = useState("");
  const [transferMethod, setTransferMethod] = useState("Bank Transfer (NIP)");

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4500);
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await getAdminAnalytics();
      setAnalytics(res.analytics);
    } catch (err) {
      console.error("Failed to load admin telemetry", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    getMe()
      .then(({ user }) => {
        if (!user.roles.includes("admin")) {
          router.replace("/");
        } else {
          setCurrentUser(user);
          setReady(true);
          fetchAnalytics();
        }
      })
      .catch(() => router.replace("/login"));
  }, [router, fetchAnalytics]);

  useEffect(() => {
    if (activeTab !== "users" || !ready) return;
    let active = true;
    getAdminUsers({
      page: 1,
      limit: 25,
      search: userSearch || undefined,
      role: userRoleFilter || undefined,
    })
      .then((res) => {
        if (!active) return;
        setUsers(res.users);
        setUsersTotal(res.total);
        setUserLoading(false);
      })
      .catch(() => {
        if (active) setUserLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab, ready, userSearch, userRoleFilter]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAnalytics();
    if (activeTab === "users") {
      try {
        const res = await getAdminUsers({
          page: 1,
          limit: 25,
          search: userSearch || undefined,
          role: userRoleFilter || undefined,
        });
        setUsers(res.users);
        setUsersTotal(res.total);
      } catch (err) {
        console.error(err);
      }
    }
    if (activeTab === "categories") {
      try {
        await loadCategories();
      } catch (err) {
        console.error(err);
      }
    }
  }

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const res = await getAdminCategories();
      setAdminCategories(res.categories || []);
    } catch (err) {
      console.error("Failed to load admin categories", err);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "categories" && ready) {
      loadCategories();
    }
  }, [activeTab, ready, loadCategories]);

  function openAddCategoryModal() {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      slug: "",
      icon: "Tag",
      description: "",
      order: adminCategories.length + 1,
      isActive: true,
    });
    setCategoryModalOpen(true);
  }

  function openEditCategoryModal(cat: Category) {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || "Tag",
      description: cat.description || "",
      order: cat.order ?? 10,
      isActive: cat.isActive !== false,
    });
    setCategoryModalOpen(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setCategorySaving(true);
    try {
      if (editingCategory && editingCategory._id) {
        await updateAdminCategory(editingCategory._id, {
          name: categoryForm.name.trim(),
          slug: categoryForm.slug.trim() || undefined,
          icon: categoryForm.icon,
          description: categoryForm.description.trim(),
          order: Number(categoryForm.order) || 1,
          isActive: categoryForm.isActive,
        });
        showNotice(`Category "${categoryForm.name}" updated successfully.`);
      } else {
        await createAdminCategory({
          name: categoryForm.name.trim(),
          slug: categoryForm.slug.trim() || undefined,
          icon: categoryForm.icon,
          description: categoryForm.description.trim(),
          order: Number(categoryForm.order) || 1,
          isActive: categoryForm.isActive,
        });
        showNotice(`New category "${categoryForm.name}" created and added to storefront!`);
      }
      setCategoryModalOpen(false);
      await loadCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save category";
      alert(msg);
    } finally {
      setCategorySaving(false);
    }
  }

  async function handleToggleCategoryStatus(cat: Category) {
    if (!cat._id) {
      showNotice("Default categories are active. Create or edit a category to override.");
      return;
    }
    setBusyActionId(cat._id);
    try {
      await updateAdminCategory(cat._id, { isActive: !cat.isActive });
      showNotice(`Category "${cat.name}" is now ${!cat.isActive ? "active" : "hidden"}.`);
      await loadCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      alert(msg);
    } finally {
      setBusyActionId(null);
    }
  }

  async function handleDeleteCategory(cat: Category) {
    if (!cat._id) {
      alert("Default seed category cannot be directly deleted without a database record. You can customize or add categories freely.");
      return;
    }
    const hasProducts = Boolean(cat.productCount && cat.productCount > 0);
    const confirmPrompt = hasProducts
      ? `"${cat.name}" has ${cat.productCount} active product(s). To protect seller listings, deleting it will automatically safely DEACTIVATE and hide it from the storefront. Continue?`
      : `Are you sure you want to permanently delete category "${cat.name}"?`;

    if (!confirm(confirmPrompt)) return;

    setBusyActionId(cat._id);
    try {
      const res = await deleteAdminCategory(cat._id);
      showNotice(res.message || `Category "${cat.name}" deleted.`);
      await loadCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete category";
      alert(msg);
    } finally {
      setBusyActionId(null);
    }
  }

  // Seller approvals
  async function handleApproveSeller(sellerId: string) {
    setBusyActionId(sellerId);
    try {
      await approveSeller(sellerId);
      showNotice("Merchant approved successfully! Store is now verified to sell.");
      await fetchAnalytics();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve seller");
    } finally {
      setBusyActionId(null);
    }
  }

  async function handleRejectSellerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingSellerId || !rejectReason.trim()) return;
    setBusyActionId(rejectingSellerId);
    try {
      await rejectSeller(rejectingSellerId, rejectReason.trim());
      showNotice("Merchant application rejected with feedback note.");
      setRejectingSellerId(null);
      setRejectReason("");
      await fetchAnalytics();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject seller");
    } finally {
      setBusyActionId(null);
    }
  }

  // Delivery completions
  async function handleCompletionDecision(decision: "approve" | "reject") {
    if (!reviewingOrder) return;
    setBusyActionId(reviewingOrder._id);
    try {
      await reviewOrderCompletion(
        reviewingOrder._id,
        decision,
        completionDecisionNote.trim() || `Admin ${decision === "approve" ? "approved" : "rejected"} delivery evidence.`
      );
      showNotice(`Order completion proof ${decision === "approve" ? "approved" : "rejected"}.`);
      setReviewingOrder(null);
      setCompletionDecisionNote("");
      await fetchAnalytics();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to review delivery proof");
    } finally {
      setBusyActionId(null);
    }
  }

  // Payout actions
  async function handleApprovePayout(payoutId: string) {
    setBusyActionId(payoutId);
    try {
      await approvePayout(payoutId);
      showNotice("Payout approved for manual settlement!");
      await fetchAnalytics();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve payout");
    } finally {
      setBusyActionId(null);
    }
  }

  async function handleConfirmPayoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmingPayout || !transferReference.trim()) return;
    setBusyActionId(confirmingPayout._id);
    try {
      await confirmPayout(confirmingPayout._id, {
        transferReference: transferReference.trim(),
        transferMethod: transferMethod.trim(),
      });
      showNotice("Seller payout confirmed as settled!");
      setConfirmingPayout(null);
      setTransferReference("");
      await fetchAnalytics();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to confirm payout");
    } finally {
      setBusyActionId(null);
    }
  }

  // Question moderation & answers
  async function handleAnswerQuestionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answeringQuestion || !adminAnswerText.trim()) return;
    setBusyActionId(answeringQuestion._id);
    try {
      await answerQuestionAsAdmin(answeringQuestion._id, adminAnswerText.trim());
      showNotice("Official administrator answer published to storefront listing!");
      setAnsweringQuestion(null);
      setAdminAnswerText("");
      await fetchAnalytics();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to post answer");
    } finally {
      setBusyActionId(null);
    }
  }

  async function handleHideQuestion(questionId: string) {
    if (!confirm("Are you sure you want to hide this question from the product page?")) return;
    setBusyActionId(questionId);
    try {
      await hideQuestion(questionId);
      showNotice("Question moderated and hidden from marketplace.");
      await fetchAnalytics();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to hide question");
    } finally {
      setBusyActionId(null);
    }
  }

  // User status toggle
  async function handleToggleUserStatus(userId: string) {
    setBusyActionId(userId);
    try {
      const res = await toggleUserStatus(userId);
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, isActive: res.user.isActive } : u)));
      showNotice(res.message);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not toggle user status");
    } finally {
      setBusyActionId(null);
    }
  }

  // CSV Exporters
  function exportUsersCsv() {
    if (!users.length) return alert("No user rows to export. Please open the Users tab.");
    const headers = ["ID", "Full Name", "Email", "Phone", "Roles", "Store Name", "Status", "Registered At"];
    const rows = users.map((u) => [
      u._id,
      `"${u.fullName.replace(/"/g, '""')}"`,
      u.email,
      u.contactNumber || "",
      u.roles.join(";"),
      u.sellerProfile?.storeName ? `"${u.sellerProfile.storeName.replace(/"/g, '""')}"` : "",
      u.isActive !== false ? "Active" : "Suspended",
      u.createdAt || "",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadBlob(csvContent, `priceam_users_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
  }

  function exportOrdersCsv() {
    const list = analytics?.orders.recent || [];
    if (!list.length) return alert("No order rows available to export.");
    const headers = ["Order ID", "Total (NGN)", "Status", "Source", "Date"];
    const rows = list.map((o) => [o._id, o.total, o.orderStatus, o.source || "offer", o.createdAt]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadBlob(csvContent, `priceam_orders_${new Date().toISOString().slice(0, 10)}.csv`, "text/csv");
  }

  function downloadBlob(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!ready || loading) {
    return (
      <main className="min-h-screen py-24 flex flex-col items-center justify-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary animate-pulse">
          <Shield className="h-8 w-8" />
        </div>
        <p className="text-sm font-semibold text-muted">Securing Super Admin Executive Center…</p>
      </main>
    );
  }

  const queues = analytics?.queues;
  const financials = analytics?.financials;
  const orders = analytics?.orders;
  const negotiations = analytics?.negotiations;
  const totalPendingAttention =
    (queues?.pendingSellersCount || 0) +
    (queues?.openDisputesCount || 0) +
    (queues?.pendingCompletionCount || 0) +
    (queues?.eligiblePayoutsCount || 0) +
    (queues?.unansweredQuestionsCount || 0);

  return (
    <main className="min-h-screen pb-20">
      {/* Executive Super Admin Header */}
      <header className="border-b border-line bg-surface/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="h-5 w-px bg-line" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-black text-primary uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" />
              Owner &amp; Super Admin{currentUser?.fullName ? ` · ${currentUser.fullName}` : ""}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-3 py-1 text-xs font-bold text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              {analytics?.system.paymentMode === "paystack" ? "Paystack Escrow Mode" : "Direct Settlement Mode"}
            </span>

            <Button
              variant="outline"
              size="sm"
              loading={refreshing}
              onClick={handleRefresh}
              className="rounded-xl text-xs"
              title="Refresh live metrics"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Link href="/">
              <Button variant="ghost" size="sm" className="rounded-xl text-xs font-semibold">
                Storefront <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Banner Notice */}
        {actionNotice && (
          <div className="rounded-2xl bg-success/15 border border-success/30 p-4 text-xs sm:text-sm text-success font-semibold flex items-center gap-2 shadow-soft animate-fade-in-up">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Dashboard Title & Hero */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
              <Shield className="h-3.5 w-3.5" />
              Marketplace Operations &amp; Intelligence Desk
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight flex items-center gap-2.5">
              Super Admin Executive Center
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Live telemetry, peer-to-peer Price Am offer volume, dispute arbitration, merchant vetting, and customer inquiries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab("settings")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-bold text-muted hover:text-ink hover:border-line-strong transition-all shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export Reports
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Clock className="h-3.5 w-3.5" />
              <span>Synced {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Action-Required Alert Tray */}
        {totalPendingAttention > 0 && (
          <section className="rounded-3xl border border-danger/30 bg-danger/5 p-5 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-danger text-white shadow-soft">
                  <BadgeAlert className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-ink">
                    {totalPendingAttention} Operational Items Require Super Admin Review
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Seller applications, open disputes, delivery proofs, or customer Q&amp;A inquiries awaiting action.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(queues?.openDisputesCount || 0) > 0 && (
                  <button
                    onClick={() => { setActiveTab("support"); }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-danger/10 border border-danger/30 px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/20 transition-colors"
                  >
                    <MessageSquareWarning className="h-3.5 w-3.5" />
                    {queues?.openDisputesCount} Disputes
                  </button>
                )}
                {(queues?.pendingSellersCount || 0) > 0 && (
                  <button
                    onClick={() => { setActiveTab("requests"); setRequestFilter("sellers"); }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-500/20 transition-colors"
                  >
                    <Store className="h-3.5 w-3.5" />
                    {queues?.pendingSellersCount} Seller Apps
                  </button>
                )}
                {(queues?.pendingCompletionCount || 0) > 0 && (
                  <button
                    onClick={() => { setActiveTab("requests"); setRequestFilter("completions"); }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <CircleCheckBig className="h-3.5 w-3.5" />
                    {queues?.pendingCompletionCount} Delivery Proofs
                  </button>
                )}
                {(queues?.eligiblePayoutsCount || 0) > 0 && (
                  <button
                    onClick={() => { setActiveTab("requests"); setRequestFilter("payouts"); }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-success/10 border border-success/30 px-3 py-1.5 text-xs font-bold text-success hover:bg-success/20 transition-colors"
                  >
                    <BadgeDollarSign className="h-3.5 w-3.5" />
                    {queues?.eligiblePayoutsCount} Eligible Payouts
                  </button>
                )}
                {(queues?.unansweredQuestionsCount || 0) > 0 && (
                  <button
                    onClick={() => { setActiveTab("support"); }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-accent/20 border border-accent/40 px-3 py-1.5 text-xs font-bold text-ink hover:bg-accent/30 transition-colors"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-primary" />
                    {queues?.unansweredQuestionsCount} Buyer Questions
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 6 Executive Metric Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Card 1: Gross Marketplace Volume */}
          <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft space-y-2">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-bold uppercase tracking-wider">Gross GMV</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BadgeDollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-ink">
              ₦{(financials?.totalGmv || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-muted truncate">
              Settled: <strong className="text-success font-bold">₦{(financials?.completedGmv || 0).toLocaleString()}</strong>
            </div>
          </div>

          {/* Card 2: Platform Projected Fee */}
          <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft space-y-2">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-bold uppercase tracking-wider">Avg Order Value</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-success/10 text-success">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-ink">
              ₦{(financials?.averageOrderValue || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-muted truncate">
              5% Comm.: <strong className="text-primary font-bold">₦{(financials?.potentialPlatformFee || 0).toLocaleString()}</strong>
            </div>
          </div>

          {/* Card 3: Price Am Bargain Engine */}
          <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft space-y-2">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-bold uppercase tracking-wider">Price Am Deals</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-ink">
              {negotiations?.accepted || 0}
            </div>
            <div className="text-[11px] text-muted truncate">
              Conv. Rate: <strong className="text-primary font-bold">{negotiations?.conversionRate || 0}%</strong> of {negotiations?.total || 0}
            </div>
          </div>

          {/* Card 4: Orders & Logistics */}
          <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft space-y-2">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/20 text-ink">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-ink">
              {(orders?.total || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-muted truncate">
              In-Transit: <strong className="text-ink font-bold">{((orders?.byStatus.processing || 0) + (orders?.byStatus.shipped || 0)).toLocaleString()}</strong>
            </div>
          </div>

          {/* Card 5: Verified Stores */}
          <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft space-y-2">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-bold uppercase tracking-wider">Merchants</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <Store className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-ink">
              {analytics?.users.sellers || 0}
            </div>
            <div className="text-[11px] text-muted truncate">
              Pending Apps: <strong className="text-amber-600 font-bold">{queues?.pendingSellersCount || 0}</strong>
            </div>
          </div>

          {/* Card 6: Registered Community */}
          <div className="rounded-3xl border border-line bg-surface p-5 shadow-soft space-y-2">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[11px] font-bold uppercase tracking-wider">Community</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sunken text-muted">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-ink">
              {(analytics?.users.total || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-muted truncate">
              Suspended: <strong className="text-danger font-bold">{analytics?.users.suspended || 0}</strong>
            </div>
          </div>
        </section>

        {/* Operational Shortcuts */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {NAV_SHORTCUTS.map((item) => {
            const count = queues ? (queues[item.countKey] as number) : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-2xl border border-line bg-surface p-4 shadow-soft transition-all hover:border-primary/40 hover:-translate-y-0.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink">{item.title}</h3>
                    <p className="text-[11px] text-muted">Dedicated Queue &rarr;</p>
                  </div>
                </div>
                {count > 0 ? (
                  <span className="rounded-full bg-danger text-white text-[10px] font-black px-2 py-0.5 shadow-soft">
                    {count}
                  </span>
                ) : (
                  <span className="text-xs text-muted group-hover:text-primary transition-colors">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                )}
              </Link>
            );
          })}
        </section>

        {/* Tab Navigation */}
        <div className="border-b border-line flex items-center gap-2 overflow-x-auto pb-px">
          {[
            { id: "overview", label: "Analytics & Intelligence", icon: BarChart3 },
            { id: "requests", label: "Operational Requests", count: (queues?.pendingSellersCount || 0) + (queues?.pendingCompletionCount || 0) + (queues?.eligiblePayoutsCount || 0), icon: Inbox },
            { id: "support", label: "Support & Disputes Desk", count: (queues?.openDisputesCount || 0) + (queues?.unansweredQuestionsCount || 0), icon: LifeBuoy },
            { id: "users", label: "User & Store Directory", icon: Users },
            { id: "categories", label: "Categories Manager", icon: Tag },
            { id: "activity", label: "Live Activity Stream", icon: Activity },
            { id: "settings", label: "Platform & Data Export", icon: Server },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-ink hover:border-line-strong"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {Boolean(tab.count) && (
                <span className="rounded-full bg-danger text-white text-[10px] font-black px-2 py-0.2">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: ANALYTICS & INTELLIGENCE                                           */}
        {/* ========================================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Order Fulfillment Status Breakdown */}
              <div className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <h3 className="text-base font-bold text-ink flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Order Pipeline &amp; Logistics
                  </h3>
                  <span className="text-xs text-muted font-bold">Total: {orders?.total || 0}</span>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm">
                  {[
                    { label: "Awaiting fulfilment", key: "pending_payment", count: orders?.byStatus.pending_payment || 0, color: "bg-warning", text: "text-warning" },
                    { label: "Confirmed / In Logistics", key: "processing", count: (orders?.byStatus.paid || 0) + (orders?.byStatus.processing || 0), color: "bg-primary", text: "text-primary" },
                    { label: "Dispatched / In Transit", key: "shipped", count: orders?.byStatus.shipped || 0, color: "bg-accent", text: "text-ink" },
                    { label: "Delivered & Settled", key: "delivered", count: orders?.byStatus.delivered || 0, color: "bg-success", text: "text-success" },
                    { label: "Completed Orders", key: "completed", count: orders?.byStatus.completed || 0, color: "bg-success", text: "text-success" },
                    { label: "Cancelled Orders", key: "cancelled", count: orders?.byStatus.cancelled || 0, color: "bg-danger", text: "text-danger" },
                  ].map((status) => {
                    const total = orders?.total || 1;
                    const pct = Math.round((status.count / total) * 100);
                    return (
                      <div key={status.key} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-ink">{status.label}</span>
                          <span className="font-bold text-muted">
                            {status.count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-sunken overflow-hidden">
                          <div className={`h-full rounded-full ${status.color}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Am Bargaining Funnel */}
              <div className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <h3 className="text-base font-bold text-ink flex items-center gap-2">
                    <Handshake className="h-5 w-5 text-primary" />
                    &quot;Price Am&quot; Offer Engine Funnel
                  </h3>
                  <span className="rounded-md bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5">
                    Peer-to-Peer
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-sunken/60 p-4 border border-line space-y-1">
                    <span className="text-[11px] text-muted font-bold uppercase">Proposals Sent</span>
                    <div className="text-xl font-black text-ink">{negotiations?.total || 0}</div>
                    <p className="text-[10px] text-muted">By Nigerian buyers</p>
                  </div>
                  <div className="rounded-2xl bg-success/10 p-4 border border-success/20 space-y-1">
                    <span className="text-[11px] text-success font-bold uppercase">Deals Agreed</span>
                    <div className="text-xl font-black text-success">{negotiations?.accepted || 0}</div>
                    <p className="text-[10px] text-muted">Directly accepted</p>
                  </div>
                  <div className="rounded-2xl bg-sunken/60 p-4 border border-line space-y-1">
                    <span className="text-[11px] text-muted font-bold uppercase">Counter-Offers</span>
                    <div className="text-xl font-black text-ink">{negotiations?.countered || 0}</div>
                    <p className="text-[10px] text-muted">Seller counter-proposals</p>
                  </div>
                  <div className="rounded-2xl bg-primary-soft/50 p-4 border border-primary/20 space-y-1">
                    <span className="text-[11px] text-primary font-bold uppercase">Conversion Rate</span>
                    <div className="text-xl font-black text-primary">{negotiations?.conversionRate || 0}%</div>
                    <p className="text-[10px] text-muted">Negotiation success rate</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-sunken/50 p-4 border border-line text-xs text-muted leading-relaxed flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    Price Am keeps negotiation on-platform with strict counter-limits. Once an agreed price is locked, the buyer initiates direct transaction chat for logistics &amp; delivery arrangements.
                  </span>
                </div>
              </div>
            </div>

            {/* Geographical & Category Telemetry */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Top Nigerian States */}
              <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft space-y-4">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Top Nigerian Trading Hubs
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(analytics?.products.byState ?? []).map((st) => (
                    <div key={st.state} className="rounded-2xl bg-sunken p-3 border border-line text-center">
                      <span className="text-xs font-bold text-ink block truncate">{st.state}</span>
                      <strong className="text-primary text-sm font-extrabold mt-0.5 block">{st.count} ads</strong>
                    </div>
                  ))}
                  {(analytics?.products.byState ?? []).length === 0 && (
                    <div className="col-span-4 text-xs text-muted text-center py-4">No location telemetry recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft space-y-4">
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Listings by Category
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(analytics?.products.byCategory ?? []).map((cat) => (
                    <span
                      key={cat.category}
                      className="rounded-full bg-sunken border border-line px-3 py-1.5 text-xs font-semibold text-ink flex items-center gap-1.5"
                    >
                      <span className="capitalize">{cat.category}:</span>
                      <strong className="text-primary">{cat.count}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Server Infrastructure Health */}
            <div className="rounded-3xl border border-line bg-sunken/60 p-6 shadow-soft space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-ink text-sm">
                <Server className="h-4 w-4 text-primary" />
                <span>Super Admin Infrastructure Health</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-muted pt-2 border-t border-line">
                <div>
                  <span className="block text-[10px] uppercase font-bold">MongoDB Cluster</span>
                  <strong className={analytics?.system.dbConnected ? "text-success font-bold" : "text-danger font-bold"}>
                    {analytics?.system.dbConnected ? "Connected (Healthy)" : "Disconnected"}
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold">Node Runtime</span>
                  <strong className="text-ink font-semibold">{analytics?.system.nodeVersion}</strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold">Server Uptime</span>
                  <strong className="text-ink font-semibold">
                    {Math.floor((analytics?.system.serverUptimeSeconds || 0) / 60)} minutes
                  </strong>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold">Payment Engine</span>
                  <strong className="text-primary font-bold">Peer-to-Peer Settlement</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: OPERATIONAL REQUESTS & APPROVALS                                  */}
        {/* ========================================================================= */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              {[
                { id: "all", label: "All Requests", count: (queues?.pendingApplications.length || 0) + (queues?.pendingCompletions?.length || 0) + (queues?.eligiblePayouts?.length || 0) },
                { id: "sellers", label: "Seller Onboarding", count: queues?.pendingApplications.length || 0, icon: Store },
                { id: "completions", label: "Delivery Proofs", count: queues?.pendingCompletions?.length || 0, icon: CircleCheckBig },
                { id: "payouts", label: "Payout Settlements", count: queues?.eligiblePayouts?.length || 0, icon: BadgeDollarSign },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setRequestFilter(filter.id as typeof requestFilter)}
                  className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all ${
                    requestFilter === filter.id
                      ? "bg-primary text-white shadow-soft"
                      : "bg-surface border border-line text-muted hover:text-ink"
                  }`}
                >
                  {filter.icon && <filter.icon className="h-3.5 w-3.5" />}
                  <span>{filter.label}</span>
                  {filter.count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${requestFilter === filter.id ? "bg-white/20 text-white" : "bg-danger text-white"}`}>
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* SECTION 1: SELLER APPLICATIONS */}
            {(requestFilter === "all" || requestFilter === "sellers") && (
              <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div>
                    <h3 className="text-base font-bold text-ink flex items-center gap-2">
                      <Store className="h-5 w-5 text-amber-500" />
                      Pending Merchant Applications ({queues?.pendingApplications.length || 0})
                    </h3>
                    <p className="text-xs text-muted">Review sellers requesting verification to publish on PriceAm.</p>
                  </div>
                  <Link href="/admin/sellers" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    View Registry &rarr;
                  </Link>
                </div>

                {(queues?.pendingApplications.length ?? 0) === 0 ? (
                  <div className="py-8 text-center text-xs text-muted">
                    <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-60" />
                    All merchant applications are up to date. Zero pending in queue.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {queues?.pendingApplications.map((seller) => (
                      <div key={seller._id} className="rounded-2xl border border-line bg-sunken/40 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-ink text-sm">{seller.sellerProfile?.storeName || seller.fullName}</h4>
                            <p className="text-xs text-muted">{seller.email} · {seller.contactNumber || "No phone"}</p>
                          </div>
                          <span className="rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5">
                            Pending
                          </span>
                        </div>

                        {seller.sellerProfile?.description && (
                          <p className="text-xs text-body line-clamp-2 bg-surface p-2.5 rounded-xl border border-line">
                            &quot;{seller.sellerProfile.description}&quot;
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t border-line">
                          <Button
                            size="sm"
                            loading={busyActionId === seller._id}
                            disabled={busyActionId !== null}
                            onClick={() => handleApproveSeller(seller._id)}
                            className="rounded-xl flex-1 text-xs bg-success hover:bg-success/90"
                          >
                            Approve Store
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyActionId !== null}
                            onClick={() => setRejectingSellerId(seller._id)}
                            className="rounded-xl text-xs border-danger/30 text-danger hover:bg-danger/10"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* SECTION 2: ORDER COMPLETION / DELIVERY PROOFS */}
            {(requestFilter === "all" || requestFilter === "completions") && (
              <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div>
                    <h3 className="text-base font-bold text-ink flex items-center gap-2">
                      <CircleCheckBig className="h-5 w-5 text-primary" />
                      Order Delivery Proofs Awaiting Review ({queues?.pendingCompletions?.length || 0})
                    </h3>
                    <p className="text-xs text-muted">Merchant-submitted waybills and buyer receipt photos for settlement.</p>
                  </div>
                  <Link href="/admin/completion-requests" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    Manage Queue &rarr;
                  </Link>
                </div>

                {(queues?.pendingCompletions?.length ?? 0) === 0 ? (
                  <div className="py-8 text-center text-xs text-muted">
                    <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-60" />
                    No delivery completion proofs awaiting review.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {queues?.pendingCompletions?.map((order) => (
                      <div key={order._id} className="rounded-2xl border border-line bg-sunken/40 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/orders/${order._id}`} className="font-bold text-ink text-sm hover:text-primary">
                              Order #{order._id.slice(-6).toUpperCase()}
                            </Link>
                            <p className="text-xs text-muted">
                              Seller: {order.seller?.sellerProfile?.storeName || order.seller?.fullName} &rarr; Buyer: {order.buyer?.fullName}
                            </p>
                          </div>
                          <span className="font-mono text-sm font-extrabold text-primary">₦{order.total.toLocaleString()}</span>
                        </div>

                        {order.completionRequest?.note && (
                          <div className="rounded-xl bg-surface p-2.5 border border-line text-xs text-muted">
                            <span className="font-bold text-ink">Seller Note:</span> {order.completionRequest.note}
                          </div>
                        )}

                        {order.completionRequest?.evidenceUrls && order.completionRequest.evidenceUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {order.completionRequest.evidenceUrls.map((url, idx) => (
                              <a key={url} href={assetUrl(url)} target="_blank" rel="noreferrer" className="block">
                                <img
                                  src={assetUrl(url)}
                                  alt={`Delivery Proof ${idx + 1}`}
                                  className="h-16 w-16 rounded-xl border border-line object-cover hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-2 border-t border-line">
                          <Button
                            size="sm"
                            onClick={() => setReviewingOrder(order)}
                            className="rounded-xl flex-1 text-xs font-bold"
                          >
                            Review &amp; Decide Proof
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* SECTION 3: SELLER PAYOUTS */}
            {(requestFilter === "all" || requestFilter === "payouts") && (
              <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div>
                    <h3 className="text-base font-bold text-ink flex items-center gap-2">
                      <BadgeDollarSign className="h-5 w-5 text-success" />
                      Seller Payouts &amp; Bank Settlements ({queues?.eligiblePayouts?.length || 0})
                    </h3>
                    <p className="text-xs text-muted">Disburse funds for completed, undisputed orders.</p>
                  </div>
                  <Link href="/admin/payouts" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    Payout Desk &rarr;
                  </Link>
                </div>

                {(queues?.eligiblePayouts?.length ?? 0) === 0 ? (
                  <div className="py-8 text-center text-xs text-muted">
                    <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-60" />
                    All merchant payouts are settled. Zero backlog.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queues?.eligiblePayouts?.map((payout) => {
                      const bank = payout.seller.sellerProfile?.payoutDetails;
                      const amountNaira = payout.amountKobo ? payout.amountKobo / 100 : (payout.order?.total || 0);
                      return (
                        <div key={payout._id} className="rounded-2xl border border-line bg-sunken/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-ink text-sm">{payout.seller.fullName}</span>
                              <span className="rounded-md bg-success/10 text-success text-[10px] font-bold px-2 py-0.5">
                                {payout.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted">
                              Bank: <strong className="text-ink">{bank?.bankName || "Unspecified"}</strong> · Acct: <strong className="text-ink">{bank?.accountNumber || "N/A"}</strong> · Name: <strong className="text-ink">{bank?.accountName || "N/A"}</strong>
                            </p>
                            <p className="text-[11px] text-muted">Order #{payout.order?._id?.slice(-6).toUpperCase()}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-xs text-muted block">Payout Sum</span>
                              <strong className="text-sm font-extrabold text-success">₦{amountNaira.toLocaleString()}</strong>
                            </div>

                            {payout.status === "eligible" && (
                              <Button
                                size="sm"
                                loading={busyActionId === payout._id}
                                disabled={busyActionId !== null}
                                onClick={() => handleApprovePayout(payout._id)}
                                className="rounded-xl text-xs bg-primary"
                              >
                                Approve Transfer
                              </Button>
                            )}

                            {payout.status === "approved" && (
                              <Button
                                size="sm"
                                onClick={() => setConfirmingPayout(payout)}
                                className="rounded-xl text-xs bg-success"
                              >
                                Confirm Transferred
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CUSTOMER SUPPORT & DISPUTES DESK                                   */}
        {/* ========================================================================= */}
        {activeTab === "support" && (
          <div className="space-y-8">
            {/* SUB-SECTION A: OPEN DISPUTES */}
            <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <h3 className="text-base font-bold text-ink flex items-center gap-2">
                    <MessageSquareWarning className="h-5 w-5 text-danger" />
                    Open Marketplace Disputes ({queues?.openDisputes.length || 0})
                  </h3>
                  <p className="text-xs text-muted">Customer or seller claims awaiting mediator review and arbitration.</p>
                </div>
                <Link href="/admin/disputes" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  Dispute Center &rarr;
                </Link>
              </div>

              {(queues?.openDisputes.length ?? 0) === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-60" />
                  No open disputes. Peer-to-peer transactions are flowing smoothly.
                </div>
              ) : (
                <div className="space-y-3">
                  {queues?.openDisputes.map((dispute) => (
                    <div
                      key={dispute._id}
                      className="rounded-2xl border border-line bg-sunken/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-danger">
                            {dispute.reason}
                          </span>
                          <span className="rounded-md bg-danger/10 text-danger text-[10px] font-bold px-2 py-0.5">
                            {dispute.status}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-body line-clamp-2">
                          {dispute.description}
                        </p>
                        <p className="text-[11px] text-muted">
                          Opened by {dispute.openedByRole} · {new Date(dispute.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <Link href={`/disputes/${dispute._id}`} className="shrink-0">
                        <Button size="sm" className="rounded-xl text-xs font-bold shadow-soft">
                          Arbitrate Case &rarr;
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* SUB-SECTION B: BUYER INQUIRIES & PRODUCT Q&A */}
            <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div>
                  <h3 className="text-base font-bold text-ink flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    Buyer Product Questions Requiring Attention ({queues?.unansweredQuestions?.length || 0})
                  </h3>
                  <p className="text-xs text-muted">
                    Questions posted by prospective buyers on storefront ads that have not yet been answered by sellers.
                  </p>
                </div>
                <span className="text-xs text-muted font-bold">
                  {queues?.totalQuestionsCount || 0} Total Q&amp;As
                </span>
              </div>

              {(queues?.unansweredQuestions?.length ?? 0) === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-60" />
                  All buyer questions have been answered. No inquiries pending moderation!
                </div>
              ) : (
                <div className="space-y-3">
                  {queues?.unansweredQuestions?.map((q) => (
                    <div key={q._id} className="rounded-2xl border border-line bg-sunken/40 p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {q.product?.coverImage?.url && (
                            <img
                              src={assetUrl(q.product.coverImage.url)}
                              alt={q.product.title}
                              className="h-10 w-10 rounded-xl border border-line object-cover"
                            />
                          )}
                          <div>
                            <span className="font-bold text-ink text-xs block">Listing: {q.product?.title || "Product"}</span>
                            <span className="text-[11px] text-muted">
                              Asked by <strong className="text-ink">{q.author?.fullName}</strong> ({q.author?.email}) · Seller: {q.seller?.sellerProfile?.storeName || q.seller?.fullName}
                            </span>
                          </div>
                        </div>

                        <span className="rounded-md bg-accent/30 text-ink text-[10px] font-bold px-2 py-0.5 shrink-0 self-start sm:self-auto">
                          Awaiting Answer
                        </span>
                      </div>

                      <div className="rounded-xl bg-surface p-3 border border-line text-xs text-ink font-medium">
                        &quot;{q.question}&quot;
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyActionId !== null}
                          onClick={() => handleHideQuestion(q._id)}
                          className="rounded-xl text-xs border-danger/30 text-danger hover:bg-danger/10"
                        >
                          Hide / Moderate
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setAnsweringQuestion(q)}
                          className="rounded-xl text-xs bg-primary font-bold"
                        >
                          Answer as Super Admin
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: USER & STORE DIRECTORY                                             */}
        {/* ========================================================================= */}
        {activeTab === "users" && (
          <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User &amp; Merchant Registry
                </h3>
                <p className="text-xs text-muted">
                  Search, review roles, toggle permissions, or inspect merchant stores ({usersTotal} total users).
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-muted" />
                  <Input
                    placeholder="Search name, email, phone..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-8 h-9 text-xs rounded-xl w-56 sm:w-64"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="h-9 rounded-xl border border-line bg-surface px-3 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">All Roles</option>
                  <option value="buyer">Buyers</option>
                  <option value="seller">Sellers</option>
                  <option value="admin">Admins</option>
                </select>
                <Button size="sm" variant="outline" onClick={exportUsersCsv} className="h-9 rounded-xl text-xs">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Export
                </Button>
              </div>
            </div>

            {userLoading ? (
              <div className="py-12 text-center text-xs text-muted">Loading user registry…</div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted">No users matched your search criteria.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line text-muted uppercase text-[10px] font-bold">
                    <tr>
                      <th className="pb-3 pr-4">User</th>
                      <th className="pb-3 px-4">Contact</th>
                      <th className="pb-3 px-4">Roles</th>
                      <th className="pb-3 px-4">Merchant Store</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-sunken/40 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="font-bold text-ink">{u.fullName}</div>
                          <div className="text-[11px] text-muted">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-muted">
                          {u.contactNumber || "None"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {u.roles.map((r) => (
                              <span
                                key={r}
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                                  r === "admin"
                                    ? "bg-primary text-white"
                                    : r === "seller"
                                    ? "bg-accent/30 text-ink"
                                    : "bg-sunken text-muted"
                                }`}
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.sellerProfile ? (
                            <div>
                              <span className="font-semibold text-ink block">{u.sellerProfile.storeName}</span>
                              <span className={`text-[10px] font-bold ${u.sellerProfile.approvalStatus === "approved" ? "text-success" : "text-amber-500"}`}>
                                {u.sellerProfile.approvalStatus}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${u.isActive !== false ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                            {u.isActive !== false ? "Active" : "Suspended"}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            loading={busyActionId === u._id}
                            disabled={busyActionId !== null}
                            onClick={() => handleToggleUserStatus(u._id)}
                            className="rounded-lg h-7 text-[11px] px-2.5"
                          >
                            {u.isActive !== false ? (
                              <span className="text-danger flex items-center gap-1"><UserX className="h-3 w-3" /> Suspend</span>
                            ) : (
                              <span className="text-success flex items-center gap-1"><UserCheck className="h-3 w-3" /> Activate</span>
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: LIVE ACTIVITY STREAM                                               */}
        {/* ========================================================================= */}
        {activeTab === "activity" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Live Order & Settlement Stream */}
            <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Live Order &amp; Settlement Stream
                </h3>
                <span className="text-xs text-muted">Recent transactions</span>
              </div>

              <div className="divide-y divide-line">
                {(orders?.recent ?? []).map((order) => (
                  <div key={order._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-ink">Order #{order._id.slice(-6).toUpperCase()}</span>
                        <span className="rounded-md bg-sunken px-2 py-0.5 text-[10px] font-bold uppercase text-muted">
                          {order.orderStatus === "pending_payment" ? "Awaiting fulfilment" : order.orderStatus.replaceAll("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        Store: <strong className="text-ink">{order.items?.[0]?.storeName || "Merchant"}</strong> · {order.items?.length || 1} item(s)
                      </p>
                      <p className="text-[10px] text-muted">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <strong className="text-sm font-extrabold text-primary">₦{order.total.toLocaleString()}</strong>
                      </div>

                      <Link href={`/orders/${order._id}`}>
                        <Button size="sm" variant="outline" className="rounded-xl text-xs h-8">
                          Inspect &rarr;
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {(orders?.recent ?? []).length === 0 && (
                  <div className="py-8 text-center text-xs text-muted">No orders processed yet.</div>
                )}
              </div>
            </section>

            {/* Live Price Am Bargain Stream */}
            <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Live &quot;Price Am&quot; Offer Stream
                </h3>
                <span className="text-xs text-muted">Negotiation flow</span>
              </div>

              <div className="divide-y divide-line">
                {(negotiations?.recent ?? []).map((offer) => (
                  <div key={offer._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-ink truncate max-w-xs">{offer.productTitle}</span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                          offer.status === "accepted"
                            ? "bg-success/15 text-success"
                            : offer.status === "countered"
                            ? "bg-primary/15 text-primary"
                            : "bg-sunken text-muted"
                        }`}>
                          {offer.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        Buyer: <strong className="text-ink">{offer.buyer?.fullName || "Buyer"}</strong> · Store: {offer.storeName}
                      </p>
                      <p className="text-[10px] text-muted">
                        Proposed by {offer.lastProposedBy} · {new Date(offer.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-muted line-through block">₦{offer.listedPrice.toLocaleString()}</span>
                      <strong className="text-sm font-extrabold text-primary">₦{offer.currentPrice.toLocaleString()}</strong>
                    </div>
                  </div>
                ))}
                {(negotiations?.recent ?? []).length === 0 && (
                  <div className="py-8 text-center text-xs text-muted">No negotiation offers recorded yet.</div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: PLATFORM CONTROLS & DATA EXPORT                                    */}
        {/* ========================================================================= */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-5">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Export Marketplace Datasets (CSV)
              </h3>
              <p className="text-xs text-muted">
                Download structured business records for accounting, merchant compliance, and executive reporting.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-sunken/40 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink">User &amp; Store Database</h4>
                      <p className="text-xs text-muted">Names, emails, phone numbers, merchant status, roles.</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={exportUsersCsv} className="w-full rounded-xl text-xs font-bold">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download Users CSV
                  </Button>
                </div>

                <div className="rounded-2xl border border-line bg-sunken/40 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-ink">Recent Orders &amp; Settlements</h4>
                      <p className="text-xs text-muted">Order IDs, total transaction value, fulfillment status, dates.</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={exportOrdersCsv} className="w-full rounded-xl text-xs font-bold bg-success hover:bg-success/90">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download Orders CSV
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-line bg-surface p-6 sm:p-7 shadow-soft space-y-4">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Operational Marketplace Settings
              </h3>
              <div className="grid gap-4 sm:grid-cols-3 text-xs">
                <div className="rounded-2xl bg-sunken/60 p-4 border border-line space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted">Settlement Engine</span>
                  <div className="font-extrabold text-ink text-sm">Direct Nigerian Settlement</div>
                  <p className="text-[11px] text-muted">Direct peer-to-peer Price Am &amp; inspection flow</p>
                </div>
                <div className="rounded-2xl bg-sunken/60 p-4 border border-line space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted">Standard Platform Commission</span>
                  <div className="font-extrabold text-ink text-sm">5.0% Standard</div>
                  <p className="text-[11px] text-muted">Calculated on gross settled transaction values</p>
                </div>
                <div className="rounded-2xl bg-sunken/60 p-4 border border-line space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted">Memory Heap Usage</span>
                  <div className="font-extrabold text-ink text-sm">{analytics?.system.memoryUsageMb || 64} MB</div>
                  <p className="text-[11px] text-muted">V8 engine memory consumption</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: CATEGORIES MANAGER                                                 */}
        {/* ========================================================================= */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-black text-ink flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Dynamic Category Architecture
                </h3>
                <p className="text-xs text-muted">
                  Add and manage dynamic categories displayed in customer browsing filters and seller product listing forms.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadCategories}
                  disabled={categoriesLoading}
                  className="rounded-2xl border-line text-xs font-bold"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${categoriesLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={openAddCategoryModal}
                  className="rounded-2xl bg-primary text-xs font-bold shadow-soft"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add New Category
                </Button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Total Categories</span>
                <div className="text-xl font-black text-ink mt-1">{adminCategories.length}</div>
                <span className="text-[10px] text-muted">Configured in platform</span>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Active on Storefront</span>
                <div className="text-xl font-black text-success mt-1">
                  {adminCategories.filter((c) => c.isActive).length}
                </div>
                <span className="text-[10px] text-muted">Browsing &amp; listings enabled</span>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Hidden / Disabled</span>
                <div className="text-xl font-black text-amber-500 mt-1">
                  {adminCategories.filter((c) => !c.isActive).length}
                </div>
                <span className="text-[10px] text-muted">Hidden from public</span>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted">With Live Listings</span>
                <div className="text-xl font-black text-primary mt-1">
                  {adminCategories.filter((c) => (c.productCount || 0) > 0).length}
                </div>
                <span className="text-[10px] text-muted">Have linked products</span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                <Input
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder="Search categories by name, slug or description..."
                  className="pl-9 text-xs rounded-xl"
                />
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                {(["all", "active", "inactive"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setCategoryStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                      categoryStatusFilter === filter
                        ? "bg-primary text-white shadow-soft"
                        : "bg-sunken text-muted hover:text-ink border border-line"
                    }`}
                  >
                    {filter === "all" ? "All" : filter === "active" ? "Active Only" : "Hidden Only"}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories Grid / List */}
            {categoriesLoading ? (
              <div className="p-12 text-center text-xs text-muted">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                Loading dynamic categories architecture...
              </div>
            ) : adminCategories.filter((cat) => {
                const matchesSearch =
                  !categorySearch.trim() ||
                  cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                  cat.slug.toLowerCase().includes(categorySearch.toLowerCase()) ||
                  (cat.description && cat.description.toLowerCase().includes(categorySearch.toLowerCase()));
                const matchesStatus =
                  categoryStatusFilter === "all" ||
                  (categoryStatusFilter === "active" && cat.isActive) ||
                  (categoryStatusFilter === "inactive" && !cat.isActive);
                return matchesSearch && matchesStatus;
              }).length === 0 ? (
              <div className="rounded-3xl border border-line bg-surface p-12 text-center space-y-3">
                <Tag className="h-10 w-10 text-muted mx-auto stroke-1" />
                <h4 className="text-sm font-bold text-ink">No Categories Matched</h4>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  No marketplace categories matched your query. Click below to add a new category.
                </p>
                <Button size="sm" onClick={openAddCategoryModal} className="rounded-xl font-bold bg-primary text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add New Category
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {adminCategories
                  .filter((cat) => {
                    const matchesSearch =
                      !categorySearch.trim() ||
                      cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
                      cat.slug.toLowerCase().includes(categorySearch.toLowerCase()) ||
                      (cat.description && cat.description.toLowerCase().includes(categorySearch.toLowerCase()));
                    const matchesStatus =
                      categoryStatusFilter === "all" ||
                      (categoryStatusFilter === "active" && cat.isActive) ||
                      (categoryStatusFilter === "inactive" && !cat.isActive);
                    return matchesSearch && matchesStatus;
                  })
                  .map((cat) => (
                    <div
                      key={cat._id || cat.slug}
                      className={`group relative rounded-3xl border p-5 transition-all shadow-soft space-y-3 flex flex-col justify-between ${
                        cat.isActive
                          ? "bg-surface border-line hover:border-primary/40"
                          : "bg-surface/50 border-line/60 opacity-80"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-soft">
                              <CategoryIconView iconName={cat.icon} className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-extrabold text-ink group-hover:text-primary transition-colors">
                                {cat.name}
                              </h4>
                              <span className="text-[10px] font-mono font-semibold text-muted bg-sunken px-2 py-0.5 rounded-md border border-line">
                                /{cat.slug}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                              cat.isActive
                                ? "bg-success/10 text-success border border-success/20"
                                : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}
                          >
                            {cat.isActive ? "Active" : "Hidden"}
                          </span>
                        </div>

                        {cat.description ? (
                          <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                            {cat.description}
                          </p>
                        ) : (
                          <p className="text-xs text-muted italic">No category description provided.</p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-line/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 text-[11px] text-muted">
                          <span>
                            Priority: <strong className="text-ink font-bold">#{cat.order ?? 10}</strong>
                          </span>
                          <span>·</span>
                          <span>
                            Products: <strong className="text-primary font-bold">{cat.productCount ?? 0}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryStatus(cat)}
                            disabled={busyActionId === cat._id}
                            title={cat.isActive ? "Hide from Storefront" : "Activate on Storefront"}
                            className="px-2 py-1 rounded-lg border border-line bg-sunken text-[10px] font-bold text-muted hover:text-ink transition-colors"
                          >
                            {cat.isActive ? "Hide" : "Show"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditCategoryModal(cat)}
                            title="Edit Category"
                            className="p-1.5 rounded-lg border border-line bg-sunken text-muted hover:text-primary transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            disabled={busyActionId === cat._id}
                            title="Delete or Deactivate Category"
                            className="p-1.5 rounded-lg border border-line bg-sunken text-muted hover:text-danger transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REJECT SELLER                                                    */}
      {/* ========================================================================= */}
      {rejectingSellerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-glow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <XCircle className="h-5 w-5 text-danger" />
                Reject Merchant Application
              </h3>
              <button
                type="button"
                onClick={() => setRejectingSellerId(null)}
                className="text-muted hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRejectSellerSubmit} className="space-y-4">
              <div>
                <label htmlFor="rejectReason" className="block text-xs font-bold text-ink mb-1.5">
                  Reason for Rejection *
                </label>
                <textarea
                  id="rejectReason"
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Incomplete business verification, store name requires adjustment..."
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-2.5 text-xs text-ink focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setRejectingSellerId(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={busyActionId === rejectingSellerId} className="rounded-xl bg-danger text-white">
                  Confirm Rejection
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REVIEW DELIVERY COMPLETION PROOF                                 */}
      {/* ========================================================================= */}
      {reviewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-glow space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <CircleCheckBig className="h-5 w-5 text-primary" />
                Review Delivery Proof · Order #{reviewingOrder._id.slice(-6).toUpperCase()}
              </h3>
              <button
                type="button"
                onClick={() => setReviewingOrder(null)}
                className="text-muted hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center rounded-xl bg-sunken p-3 border border-line">
                <div>
                  <span className="font-bold text-ink block">{reviewingOrder.items?.map((i) => i.title).join(", ")}</span>
                  <span className="text-muted">Total: ₦{reviewingOrder.total.toLocaleString()}</span>
                </div>
              </div>

              {reviewingOrder.completionRequest?.note && (
                <div className="rounded-xl bg-surface p-3 border border-line">
                  <span className="font-bold text-ink block mb-0.5">Seller Submission Note:</span>
                  <p className="text-muted">{reviewingOrder.completionRequest.note}</p>
                </div>
              )}

              {reviewingOrder.completionRequest?.evidenceUrls && reviewingOrder.completionRequest.evidenceUrls.length > 0 && (
                <div>
                  <span className="font-bold text-ink block mb-2">Uploaded Receipts / Waybills:</span>
                  <div className="flex flex-wrap gap-2">
                    {reviewingOrder.completionRequest.evidenceUrls.map((url, i) => (
                      <a key={url} href={assetUrl(url)} target="_blank" rel="noreferrer">
                        <img
                          src={assetUrl(url)}
                          alt={`Proof ${i + 1}`}
                          className="h-24 w-24 rounded-xl border border-line object-cover hover:opacity-90"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="decisionNote" className="block font-bold text-ink mb-1">
                  Super Admin Decision Note (Optional)
                </label>
                <textarea
                  id="decisionNote"
                  rows={2}
                  value={completionDecisionNote}
                  onChange={(e) => setCompletionDecisionNote(e.target.value)}
                  placeholder="e.g. Verified receipt match with buyer acknowledgement..."
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-2 text-xs text-ink focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReviewingOrder(null)}
                className="rounded-xl"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                loading={busyActionId === reviewingOrder._id}
                onClick={() => handleCompletionDecision("reject")}
                className="rounded-xl text-danger border-danger/30 hover:bg-danger/10"
              >
                Reject Proof
              </Button>
              <Button
                type="button"
                size="sm"
                loading={busyActionId === reviewingOrder._id}
                onClick={() => handleCompletionDecision("approve")}
                className="rounded-xl bg-success text-white"
              >
                Approve Delivery
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ANSWER BUYER QUESTION AS SUPER ADMIN                             */}
      {/* ========================================================================= */}
      {answeringQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-glow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Publish Official Marketplace Answer
              </h3>
              <button
                type="button"
                onClick={() => setAnsweringQuestion(null)}
                className="text-muted hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-sunken p-3 border border-line text-xs">
              <span className="font-bold text-muted block mb-1">Buyer&apos;s Inquiry:</span>
              <p className="font-semibold text-ink">&quot;{answeringQuestion.question}&quot;</p>
              <span className="text-[10px] text-muted block mt-1">Listing: {answeringQuestion.product?.title}</span>
            </div>

            <form onSubmit={handleAnswerQuestionSubmit} className="space-y-4">
              <div>
                <label htmlFor="adminAnswer" className="block text-xs font-bold text-ink mb-1.5">
                  Your Answer (Visible to All Marketplace Shoppers) *
                </label>
                <textarea
                  id="adminAnswer"
                  rows={4}
                  required
                  value={adminAnswerText}
                  onChange={(e) => setAdminAnswerText(e.target.value)}
                  placeholder="Provide authoritative clarification for this listing..."
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-2.5 text-xs text-ink focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setAnsweringQuestion(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={busyActionId === answeringQuestion._id} className="rounded-xl bg-primary font-bold">
                  Publish Answer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIRM PAYOUT SETTLEMENT                                        */}
      {/* ========================================================================= */}
      {confirmingPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-glow space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-success" />
                Record External Transfer Reference
              </h3>
              <button
                type="button"
                onClick={() => setConfirmingPayout(null)}
                className="text-muted hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-sunken p-3 border border-line text-xs space-y-1">
              <span className="font-bold text-ink">{confirmingPayout.seller.fullName}</span>
              <p className="text-muted">
                {confirmingPayout.seller.sellerProfile?.payoutDetails?.bankName} · {confirmingPayout.seller.sellerProfile?.payoutDetails?.accountNumber}
              </p>
              <strong className="text-success font-extrabold block text-sm">
                ₦{((confirmingPayout.amountKobo || (confirmingPayout.order?.total * 100)) / 100).toLocaleString()}
              </strong>
            </div>

            <form onSubmit={handleConfirmPayoutSubmit} className="space-y-4">
              <div>
                <label htmlFor="transferMethod" className="block text-xs font-bold text-ink mb-1">
                  Transfer Method *
                </label>
                <Input
                  id="transferMethod"
                  required
                  value={transferMethod}
                  onChange={(e) => setTransferMethod(e.target.value)}
                  placeholder="e.g. Zenith Bank NIP / Kuda Instant"
                  className="text-xs rounded-xl"
                />
              </div>

              <div>
                <label htmlFor="transferReference" className="block text-xs font-bold text-ink mb-1">
                  Bank / NIP Transfer Reference *
                </label>
                <Input
                  id="transferReference"
                  required
                  value={transferReference}
                  onChange={(e) => setTransferReference(e.target.value)}
                  placeholder="e.g. 090123456789012345"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingPayout(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={busyActionId === confirmingPayout._id} className="rounded-xl bg-success text-white font-bold">
                  Confirm Settled
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD / EDIT CATEGORY DYNAMICALLY                                  */}
      {/* ========================================================================= */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-glow space-y-5 my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">
                    {editingCategory ? `Edit Category · ${editingCategory.name}` : "Create Dynamic Marketplace Category"}
                  </h3>
                  <p className="text-xs text-muted">
                    {editingCategory
                      ? "Update category settings, storefront display order, or icon."
                      : "Add a new department instantly to storefront filters and product forms."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="text-muted hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label htmlFor="catName" className="block text-xs font-bold text-ink mb-1.5">
                  Category Name *
                </label>
                <Input
                  id="catName"
                  required
                  value={categoryForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const autoSlug = val
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-+|-+$/g, "");
                    setCategoryForm((prev) => ({
                      ...prev,
                      name: val,
                      slug: editingCategory ? prev.slug : autoSlug,
                    }));
                  }}
                  placeholder="e.g. Mobile Phones, Equipment & Tools"
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="catSlug" className="block text-xs font-bold text-ink mb-1.5">
                    URL Slug
                  </label>
                  <Input
                    id="catSlug"
                    value={categoryForm.slug}
                    onChange={(e) =>
                      setCategoryForm((prev) => ({
                        ...prev,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-+|-+$/g, ""),
                      }))
                    }
                    placeholder="e.g. mobile-phones"
                    className="text-xs rounded-xl font-mono"
                  />
                  <span className="text-[10px] text-muted mt-1 block">Used in filters &amp; URLs</span>
                </div>

                <div>
                  <label htmlFor="catOrder" className="block text-xs font-bold text-ink mb-1.5">
                    Display Priority / Order
                  </label>
                  <Input
                    id="catOrder"
                    type="number"
                    min={1}
                    max={999}
                    value={categoryForm.order}
                    onChange={(e) =>
                      setCategoryForm((prev) => ({
                        ...prev,
                        order: parseInt(e.target.value, 10) || 1,
                      }))
                    }
                    className="text-xs rounded-xl"
                  />
                  <span className="text-[10px] text-muted mt-1 block">Lower numbers appear first</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-2">
                  Choose Category Icon Preset
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {CATEGORY_ICON_PRESETS.map((preset) => {
                    const isSelected = categoryForm.icon === preset.name;
                    const IconC = preset.icon;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setCategoryForm((prev) => ({ ...prev, icon: preset.name }))}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-soft"
                            : "border-line bg-sunken/40 text-muted hover:text-ink hover:border-line-strong"
                        }`}
                      >
                        <IconC className="h-5 w-5 mb-1" />
                        <span className="text-[9px] font-bold truncate w-full">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="catDesc" className="block text-xs font-bold text-ink mb-1.5">
                  Category Description (Optional)
                </label>
                <textarea
                  id="catDesc"
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of products belonging to this category..."
                  className="w-full rounded-2xl border border-line bg-surface px-4 py-2 text-xs text-ink focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
              </div>

              <div className="flex items-center gap-2.5 rounded-xl bg-sunken p-3 border border-line">
                <input
                  id="catActive"
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 rounded text-primary focus:ring-primary border-line"
                />
                <label htmlFor="catActive" className="text-xs font-bold text-ink cursor-pointer">
                  Publish to Storefront immediately
                  <span className="block text-[10px] font-normal text-muted">
                    When active, this category appears in homepage filters and product listing forms.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={categorySaving}
                  className="rounded-xl bg-primary text-white font-bold"
                >
                  {editingCategory ? "Save Changes" : "Create Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
