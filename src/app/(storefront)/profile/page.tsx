"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  Bell,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  KeyRound,
  Landmark,
  Lock,
  LogOut,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
  User as UserIcon,
} from "lucide-react";
import { changePassword, getMe } from "@/lib/auth";
import { switchRole, updateProfile } from "@/lib/users";
import { ApiRequestError, tokenStore } from "@/lib/api";
import { Button } from "@/components/ui";
import type { Role, User } from "@/lib/types";

type SettingsTab = "profile" | "security" | "address" | "seller" | "notifications";

const NIGERIAN_BANKS = [
  "Access Bank",
  "Guaranty Trust Bank (GTBank)",
  "Zenith Bank",
  "First Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Kuda Bank",
  "OPay",
  "PalmPay",
  "Stanbic IBTC",
  "Fidelity Bank",
  "Sterling Bank",
  "Moniepoint MFB",
];

const NIGERIAN_STATES = [
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
  "Other",
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Mode switching state
  const [switchingRole, setSwitchingRole] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Delivery Address State (saved in localStorage for peer-to-peer delivery)
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("Lagos");
  const [addressLandmark, setAddressLandmark] = useState("");
  const [addressNotes, setAddressNotes] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  // Seller / Payout Form State
  const [sellerBio, setSellerBio] = useState("");
  const [payoutBank, setPayoutBank] = useState("Access Bank");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutAccountName, setPayoutAccountName] = useState("");
  const [savingSeller, setSavingSeller] = useState(false);

  // Notification Toggles
  const [notifyOffers, setNotifyOffers] = useState(true);
  const [notifyCounters, setNotifyCounters] = useState(true);
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }

    getMe()
      .then((res) => {
        const u = res.user;
        setUser(u);
        setFullName(u.fullName || "");
        setContactNumber(u.contactNumber || "");
        if (u.sellerProfile) {
          setSellerBio(u.sellerProfile.description || "");
          if (u.sellerProfile.payoutDetails) {
            setPayoutBank(u.sellerProfile.payoutDetails.bankName || "Access Bank");
            setPayoutAccountNumber(u.sellerProfile.payoutDetails.accountNumber || "");
            setPayoutAccountName(u.sellerProfile.payoutDetails.accountName || "");
          }
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));

    // Load saved local address if exists
    const t = setTimeout(() => {
      try {
        const saved = localStorage.getItem("pricem_user_address");
        if (saved) {
          const parsed = JSON.parse(saved);
          setAddressStreet(parsed.street || "");
          setAddressCity(parsed.city || "");
          setAddressState(parsed.state || "Lagos");
          setAddressLandmark(parsed.landmark || "");
          setAddressNotes(parsed.notes || "");
        }
      } catch {
        // ignore
      }
    }, 0);

    return () => clearTimeout(t);
  }, [router]);

  async function handleSwitchRole(role: Exclude<Role, "admin">) {
    if (!user || user.activeRole === role || switchingRole) return;
    setGlobalError(null);
    setGlobalSuccess(null);
    setSwitchingRole(true);
    try {
      const res = await switchRole(role);
      setUser({ ...user, activeRole: res.activeRole });
      setGlobalSuccess(`Switched to ${role} mode`);
      setTimeout(() => setGlobalSuccess(null), 3000);
    } catch (err) {
      setGlobalError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not switch mode. Please try again.",
      );
    } finally {
      setSwitchingRole(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setGlobalError("Full name is required.");
      return;
    }
    setGlobalError(null);
    setGlobalSuccess(null);
    setSavingProfile(true);

    try {
      const res = await updateProfile({
        fullName: fullName.trim(),
        contactNumber: contactNumber.trim(),
      });
      setUser(res.user);
      setGlobalSuccess("Profile details updated successfully!");
      setTimeout(() => setGlobalSuccess(null), 4000);
    } catch (err) {
      setGlobalError(
        err instanceof ApiRequestError ? err.message : "Failed to update profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setGlobalSuccess(null);

    if (!currentPassword) {
      setGlobalError("Current password is required.");
      return;
    }
    if (newPassword.length < 6) {
      setGlobalError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setGlobalError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setGlobalSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setGlobalSuccess(null), 4000);
    } catch (err) {
      setGlobalError(
        err instanceof ApiRequestError ? err.message : "Failed to change password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setSavingAddress(true);

    try {
      const addressData = {
        street: addressStreet,
        city: addressCity,
        state: addressState,
        landmark: addressLandmark,
        notes: addressNotes,
      };
      localStorage.setItem("pricem_user_address", JSON.stringify(addressData));
      setGlobalSuccess("Default delivery address saved!");
      setTimeout(() => setGlobalSuccess(null), 4000);
    } catch {
      setGlobalError("Could not save address to local storage.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleSaveSeller(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setGlobalSuccess(null);
    setSavingSeller(true);

    try {
      const res = await updateProfile({
        description: sellerBio.trim(),
        bankName: payoutBank,
        accountNumber: payoutAccountNumber.trim(),
        accountName: payoutAccountName.trim(),
      });
      setUser(res.user);
      setGlobalSuccess("Store and payout details updated!");
      setTimeout(() => setGlobalSuccess(null), 4000);
    } catch (err) {
      setGlobalError(
        err instanceof ApiRequestError ? err.message : "Failed to update payout settings.",
      );
    } finally {
      setSavingSeller(false);
    }
  }

  function handleSignOut() {
    tokenStore.clear();
    router.replace("/login");
  }

  if (loading || !user) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-muted font-bold tracking-wide uppercase">
          Loading your account settings…
        </p>
      </div>
    );
  }

  const isSeller = user.roles.includes("seller");
  const initials = user.fullName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* =================================================================== */}
      {/* 1. TOP HERO & IDENTITY PROFILE BANNER                              */}
      {/* =================================================================== */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-r from-white via-surface to-primary-soft/30 p-6 sm:p-8 shadow-soft">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-accent/20 blur-3xl"
        />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar, Name & Metadata */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative">
              <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-primary via-primary-dark to-accent flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-glow shrink-0">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-white flex items-center justify-center" title="Active Account">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
                  {user.fullName}
                </h1>
                {isSeller && user.sellerProfile?.approvalStatus === "approved" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-soft border border-success/20 px-2.5 py-0.5 text-[11px] font-bold text-success">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Merchant
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-muted" />
                  {user.email}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-muted" />
                  {user.contactNumber || "No phone linked"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Active Role Switcher Pill (Buyer vs Seller) */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            {isSeller ? (
              <div className="inline-flex items-center rounded-2xl border border-line bg-sunken/80 p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleSwitchRole("buyer")}
                  disabled={switchingRole}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    user.activeRole === "buyer"
                      ? "bg-surface text-primary shadow-soft"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  🛒 Buyer Mode
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchRole("seller")}
                  disabled={switchingRole}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    user.activeRole === "seller"
                      ? "bg-primary text-white shadow-soft"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  🏪 Seller Mode
                </button>
              </div>
            ) : (
              <Link
                href="/seller/onboarding"
                className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-xs font-bold text-white shadow-glow hover:brightness-105 active:scale-95 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Become a Seller
              </Link>
            )}

            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:underline ml-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </section>

      {/* Global Status Feedback Banners */}
      {globalSuccess && (
        <div className="rounded-2xl border border-success/30 bg-success-soft p-4 flex items-center gap-3 text-xs sm:text-sm font-bold text-success animate-fade-in-up">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{globalSuccess}</span>
        </div>
      )}
      {globalError && (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft p-4 flex items-center gap-3 text-xs sm:text-sm font-bold text-danger animate-fade-in-up">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. SETTINGS 2-COLUMN LAYOUT (SIDEBAR TABS + CONTENT PANELS)         */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-[16rem_1fr] items-start gap-6">
        {/* Navigation Sidebar */}
        <nav className="rounded-3xl border border-line bg-surface p-3 sm:p-4 shadow-soft space-y-1.5">
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left ${
              activeTab === "profile"
                ? "bg-primary text-white shadow-soft"
                : "text-ink hover:bg-sunken/60"
            }`}
          >
            <UserIcon className="h-4 w-4 shrink-0" />
            <span>Profile &amp; Details</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left ${
              activeTab === "security"
                ? "bg-primary text-white shadow-soft"
                : "text-ink hover:bg-sunken/60"
            }`}
          >
            <Lock className="h-4 w-4 shrink-0" />
            <span>Security &amp; Password</span>
          </button>

          <button
            onClick={() => setActiveTab("address")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left ${
              activeTab === "address"
                ? "bg-primary text-white shadow-soft"
                : "text-ink hover:bg-sunken/60"
            }`}
          >
            <Truck className="h-4 w-4 shrink-0" />
            <span>Delivery Addresses</span>
          </button>

          {isSeller && (
            <button
              onClick={() => setActiveTab("seller")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left ${
                activeTab === "seller"
                  ? "bg-primary text-white shadow-soft"
                  : "text-ink hover:bg-sunken/60"
              }`}
            >
              <Landmark className="h-4 w-4 shrink-0" />
              <span>Merchant &amp; Payouts</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left ${
              activeTab === "notifications"
                ? "bg-primary text-white shadow-soft"
                : "text-ink hover:bg-sunken/60"
            }`}
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span>Notifications</span>
          </button>

          {/* Quick External Links */}
          <div className="pt-3 border-t border-line mt-3 space-y-1">
            <Link
              href="/orders"
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-muted hover:text-ink hover:bg-sunken/50 transition-colors"
            >
              <span>My Orders &amp; Price Am Deals</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
            {isSeller && (
              <Link
                href="/seller/products"
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-primary hover:bg-primary-soft/50 transition-colors"
              >
                <span>Manage Store Listings</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </nav>

        {/* Content Panels */}
        <main className="space-y-6">
          {/* =============================================================== */}
          {/* TAB 1: PROFILE & PERSONAL DETAILS                               */}
          {/* =============================================================== */}
          {activeTab === "profile" && (
            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-soft space-y-6">
              <div className="border-b border-line pb-4">
                <h2 className="text-lg font-bold text-ink">Personal Information</h2>
                <p className="text-xs text-muted mt-0.5">
                  Update your contact identity used for seller negotiations and delivery coordination.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="e.g. Chukwuma Obi"
                      className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-4 text-xs sm:text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      Phone Number (WhatsApp / Calls)
                    </label>
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="e.g. 08012345678"
                      className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-4 text-xs sm:text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                    <p className="text-[11px] text-muted">
                      Shared with counterparties only after an offer price is agreed.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full h-11 rounded-2xl border border-line bg-sunken/30 px-4 text-xs sm:text-sm text-muted cursor-not-allowed"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-bold text-success">
                      ✓ Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-muted">
                    Email address cannot be changed directly for security reasons.
                  </p>
                </div>

                <div className="pt-4 border-t border-line flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 h-11 text-xs sm:text-sm font-bold text-white shadow-soft hover:bg-primary-dark active:scale-95"
                  >
                    <Save className="h-4 w-4" />
                    {savingProfile ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: SECURITY & PASSWORD                                      */}
          {/* =============================================================== */}
          {activeTab === "security" && (
            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-soft space-y-6">
              <div className="border-b border-line pb-4">
                <h2 className="text-lg font-bold text-ink">Security &amp; Authentication</h2>
                <p className="text-xs text-muted mt-0.5">
                  Manage your account credentials and password protection.
                </p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-4 text-xs sm:text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Minimum 6 characters"
                    className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-4 text-xs sm:text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-type new password"
                    className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-4 text-xs sm:text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 h-11 text-xs sm:text-sm font-bold text-white shadow-soft hover:bg-primary-dark active:scale-95"
                  >
                    <KeyRound className="h-4 w-4" />
                    {savingPassword ? "Updating…" : "Update Password"}
                  </Button>
                </div>
              </form>

              {/* Active Session Info Card */}
              <div className="pt-6 border-t border-line space-y-3">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
                  Active Login Session
                </h3>
                <div className="rounded-2xl border border-line bg-sunken/40 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Smartphone className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-ink">Current Web Browser</p>
                      <p className="text-[11px] text-muted">Signed in with active JWT token · Nigeria</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Online
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: DELIVERY ADDRESSES                                       */}
          {/* =============================================================== */}
          {activeTab === "address" && (
            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-soft space-y-6">
              <div className="border-b border-line pb-4">
                <h2 className="text-lg font-bold text-ink">Default Delivery Address</h2>
                <p className="text-xs text-muted mt-0.5">
                  Pre-filled automatically when closing accepted Price Am deals and scheduling direct logistics.
                </p>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      Nigerian State / Trading Hub
                    </label>
                    <select
                      value={addressState}
                      onChange={(e) => setAddressState(e.target.value)}
                      className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-3.5 text-xs sm:text-sm font-semibold text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
                    >
                      {NIGERIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      City / Area / LGA
                    </label>
                    <input
                      type="text"
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      placeholder="e.g. Ikeja, Lekki Phase 1, Wuse 2"
                      className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-4 text-xs sm:text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">
                    Street Address / House Number
                  </label>
                  <input
                    type="text"
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    placeholder="e.g. 14 Admiralty Way, Block B"
                    className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-4 text-xs sm:text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      Nearest Landmark (For Dispatch Rider)
                    </label>
                    <input
                      type="text"
                      value={addressLandmark}
                      onChange={(e) => setAddressLandmark(e.target.value)}
                      placeholder="e.g. Opposite Total Filling Station"
                      className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-4 text-xs sm:text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      Special Delivery Instructions
                    </label>
                    <input
                      type="text"
                      value={addressNotes}
                      onChange={(e) => setAddressNotes(e.target.value)}
                      placeholder="e.g. Ring the bell at the gate"
                      className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-4 text-xs sm:text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-line flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingAddress}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 h-11 text-xs sm:text-sm font-bold text-white shadow-soft hover:bg-primary-dark active:scale-95"
                  >
                    <Save className="h-4 w-4" />
                    {savingAddress ? "Saving…" : "Save Delivery Address"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 4: MERCHANT & PAYOUT SETTINGS                               */}
          {/* =============================================================== */}
          {activeTab === "seller" && isSeller && (
            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-soft space-y-6">
              <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-ink">Merchant Profile &amp; Bank Settlement</h2>
                  <p className="text-xs text-muted mt-0.5">
                    Payout funds from accepted Price Am deals are transferred directly to this Nigerian bank account.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 border border-success/30 px-3 py-1 text-xs font-bold text-success shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Store: {user.sellerProfile?.storeName || "My Store"}
                </span>
              </div>

              <form onSubmit={handleSaveSeller} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider">
                    Store Bio / Tagline
                  </label>
                  <textarea
                    rows={3}
                    value={sellerBio}
                    onChange={(e) => setSellerBio(e.target.value)}
                    placeholder="Tell buyers about your products, dispatch speed, and warranties…"
                    className="w-full rounded-2xl border border-line bg-sunken/60 p-4 text-xs sm:text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="border-t border-line pt-5 space-y-4">
                  <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-primary" />
                    Settlement Bank Account (Nigeria)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted">Bank Name</label>
                      <select
                        value={payoutBank}
                        onChange={(e) => setPayoutBank(e.target.value)}
                        className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-3 text-xs sm:text-sm font-semibold text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
                      >
                        {NIGERIAN_BANKS.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted">Account Number (10 digits)</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={payoutAccountNumber}
                        onChange={(e) => setPayoutAccountNumber(e.target.value)}
                        placeholder="e.g. 0123456789"
                        className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-4 text-xs sm:text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted">Account Name</label>
                      <input
                        type="text"
                        value={payoutAccountName}
                        onChange={(e) => setPayoutAccountName(e.target.value)}
                        placeholder="e.g. John Doe Enterprises"
                        className="w-full h-11 rounded-2xl border border-line bg-sunken/60 px-4 text-xs sm:text-sm text-ink focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-line flex justify-end">
                  <Button
                    type="submit"
                    disabled={savingSeller}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 h-11 text-xs sm:text-sm font-bold text-white shadow-soft hover:bg-primary-dark active:scale-95"
                  >
                    <Save className="h-4 w-4" />
                    {savingSeller ? "Saving…" : "Save Settlement Details"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 5: NOTIFICATIONS & PREFERENCES                              */}
          {/* =============================================================== */}
          {activeTab === "notifications" && (
            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-soft space-y-6">
              <div className="border-b border-line pb-4">
                <h2 className="text-lg font-bold text-ink">Price Am &amp; Deal Notifications</h2>
                <p className="text-xs text-muted mt-0.5">
                  Control how you receive real-time notifications about numeric offers and delivery milestones.
                </p>
              </div>

              <div className="space-y-4 divide-y divide-line">
                <label className="flex items-center justify-between pt-3 cursor-pointer">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-ink">New Price Am Offers</p>
                    <p className="text-xs text-muted">Get notified immediately when a buyer submits a numeric offer on your item.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOffers}
                    onChange={(e) => setNotifyOffers(e.target.checked)}
                    className="h-5 w-5 rounded accent-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between pt-4 cursor-pointer">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-ink">Seller Counter-Offers &amp; Approvals</p>
                    <p className="text-xs text-muted">Receive alerts when a seller counters or agrees to your price.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyCounters}
                    onChange={(e) => setNotifyCounters(e.target.checked)}
                    className="h-5 w-5 rounded accent-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between pt-4 cursor-pointer">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-ink">Direct Logistics &amp; Delivery Updates</p>
                    <p className="text-xs text-muted">Receive tracking milestones (in transit, out for delivery, and completed).</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyOrders}
                    onChange={(e) => setNotifyOrders(e.target.checked)}
                    className="h-5 w-5 rounded accent-primary cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between pt-4 cursor-pointer">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-ink">WhatsApp &amp; SMS Instant Deal Alerts</p>
                    <p className="text-xs text-muted">Send urgent counter-offer updates straight to your mobile phone number.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyWhatsapp}
                    onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                    className="h-5 w-5 rounded accent-primary cursor-pointer"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-line flex justify-end">
                <Button
                  onClick={() => {
                    setGlobalSuccess("Notification preferences updated!");
                    setTimeout(() => setGlobalSuccess(null), 3000);
                  }}
                  className="rounded-2xl bg-primary px-6 h-11 text-xs sm:text-sm font-bold text-white shadow-soft hover:bg-primary-dark active:scale-95"
                >
                  Save Notification Settings
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
