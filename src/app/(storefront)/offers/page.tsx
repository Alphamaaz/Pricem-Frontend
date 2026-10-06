"use client";

/*
  Offers dashboard — the negotiation surface (no chat, numeric only).
  Rules mirrored from the backend:
  - Only the party who did NOT make the latest proposal can Accept or Counter.
  - Either party can Reject while the offer is open.
*/

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Handshake,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  TrendingDown,
  XCircle,
} from "lucide-react";
import { getMe } from "@/lib/auth";
import {
  acceptOffer,
  counterOffer,
  listOffers,
  markOffersRead,
  rejectOffer,
} from "@/lib/offers";
import type { Offer } from "@/lib/offers";
import { ApiRequestError, assetUrl, tokenStore } from "@/lib/api";
import { Alert, Button, Input } from "@/components/ui";
import type { User } from "@/lib/types";
import type { Order } from "@/lib/orders";
import { getRealtimeSocket } from "@/lib/realtime";
import { getOrderConversation } from "@/lib/chat";

const OPEN_STATUSES = ["pending", "countered"];

function getOfferStatusBadge(status: Offer["status"]) {
  switch (status) {
    case "pending":
      return {
        label: "Offer Pending",
        className: "bg-warning/15 text-ink border-warning/30",
        icon: Clock,
      };
    case "countered":
      return {
        label: "Counter Offer",
        className: "bg-primary-soft text-primary border-primary/20",
        icon: Handshake,
      };
    case "accepted":
      return {
        label: "Deal Agreed 🎉",
        className: "bg-success/15 text-success border-success/30",
        icon: CheckCircle2,
      };
    case "rejected":
      return {
        label: "Declined",
        className: "bg-danger/10 text-danger border-danger/20",
        icon: XCircle,
      };
    case "expired":
      return {
        label: "Expired",
        className: "bg-sunken text-muted border-line",
        icon: Clock,
      };
    default:
      return {
        label: String(status),
        className: "bg-sunken text-muted border-line",
        icon: Clock,
      };
  }
}

type AcceptedNotice = { offer: Offer; orderId: string; viewerRole: "buyer" | "seller" };

function OffersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<"buyer" | "seller">("buyer");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [counterId, setCounterId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [acceptedNotice, setAcceptedNotice] = useState<AcceptedNotice | null>(null);
  const [navigatingOrder, setNavigatingOrder] = useState<string | null>(null);

  async function onOpenTransactionChat(orderId: string) {
    setNavigatingOrder(orderId);
    try {
      const res = await getOrderConversation(orderId);
      router.push(`/conversations/${res.conversation._id}`);
    } catch {
      router.push(`/orders/${orderId}`);
    } finally {
      setNavigatingOrder(null);
    }
  }

  const load = useCallback((role: "buyer" | "seller") => {
    setReady(false);
    listOffers({ role })
      .then(async (res) => {
        setOffers(res.offers);
        setReady(true);
        const newlyAccepted = res.offers.find((offer) => (
          offer.status === "accepted" &&
          offer.order &&
          (role === "buyer" ? offer.buyerUnread : offer.sellerUnread)
        ));
        if (newlyAccepted?.order) {
          setAcceptedNotice({
            offer: newlyAccepted,
            orderId: newlyAccepted.order,
            viewerRole: role,
          });
        }
        await markOffersRead(role).catch(() => {});
      })
      .catch(() => setError("Could not load offers."));
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    getMe()
      .then((res) => {
        setUser(res.user);
        const initialTab =
          requestedTab === "seller" && res.user.roles.includes("seller")
            ? "seller"
            : "buyer";
        setTab(initialTab);
        load(initialTab);
      })
      .catch(() => router.replace("/login"));
  }, [router, load, requestedTab]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const refreshOffers = () => load(tab);
    socket?.on("offer:changed", refreshOffers);
    return () => {
      socket?.off("offer:changed", refreshOffers);
    };
  }, [load, tab]);

  function switchTab(next: "buyer" | "seller") {
    setTab(next);
    setError(null);
    setInfo(null);
    setCounterId(null);
    router.replace(`/offers?tab=${next}`, { scroll: false });
    load(next);
  }

  async function act(
    id: string,
    fn: () => Promise<{ message: string; offer: Offer; order?: Order }>,
  ) {
    setBusyId(id);
    setError(null);
    setInfo(null);
    try {
      const res = await fn();
      setInfo(res.message);
      setOffers((prev) => prev.map((o) => (o._id === id ? res.offer : o)));
      setCounterId(null);
      setCounterPrice("");
      if (res.order) {
        setAcceptedNotice({ offer: res.offer, orderId: res.order._id, viewerRole: tab });
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  }

  function applyPresetDiscount(targetOffer: Offer, percentage: number) {
    const base = targetOffer.currentPrice || targetOffer.listedPrice;
    const discounted = Math.round(base * (1 - percentage / 100));
    setCounterPrice(String(discounted));
  }

  if (!ready && !error) {
    return (
      <div className="max-w-4xl mx-auto py-16 space-y-4">
        <div className="h-10 w-48 rounded-2xl bg-sunken animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-3xl bg-sunken animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const isSeller = user?.roles.includes("seller");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Price Am Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-0.5">
            Negotiations & Offers
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time peer-to-peer price proposals. Counter, accept, or decline with one click.
          </p>
        </div>

        {/* Role Tabs */}
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
              Offers I Made
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
              Offers Received
            </button>
          </div>
        )}
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {info && <Alert kind="success">{info}</Alert>}

      {/* Offers List */}
      {offers.length === 0 ? (
        <div className="rounded-3xl bg-surface border border-line shadow-soft p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sunken mx-auto mb-3 text-muted">
            <Tag className="h-8 w-8 opacity-60" />
          </div>
          <h3 className="text-base font-bold text-ink">No negotiations active</h3>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-sm mx-auto">
            {tab === "buyer"
              ? "You haven't made any offers yet. Click 'Price Am' on any negotiable item to make an offer!"
              : "No incoming Price Am proposals received yet for your store products."}
          </p>
          <div className="mt-5">
            <Link href="/">
              <Button size="md" className="rounded-xl px-6">
                Discover Price Am Items
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-4">
          {offers.map((o) => {
            const open = OPEN_STATUSES.includes(o.status);
            const myTurn = open && o.lastProposedBy !== tab;
            const unread = tab === "buyer" ? o.buyerUnread : o.sellerUnread;
            const badge = getOfferStatusBadge(o.status);
            const BadgeIcon = badge.icon;
            const savings = Math.max(0, o.listedPrice - o.currentPrice);
            const percentOff = Math.round((savings / o.listedPrice) * 100);

            return (
              <li
                key={o._id}
                className={`rounded-3xl bg-surface border shadow-soft p-5 sm:p-6 transition-all ${
                  unread
                    ? "border-primary ring-4 ring-primary/10 shadow-lifted"
                    : "border-line hover:border-line-strong"
                }`}
              >
                {/* Top Status & Store Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-body bg-sunken px-2.5 py-1 rounded-lg border border-line">
                      #{o._id.slice(-8).toUpperCase()}
                    </span>
                    <span className="text-xs font-semibold text-muted flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      {o.storeName}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold border ${badge.className}`}
                  >
                    <BadgeIcon className="h-3.5 w-3.5" />
                    {badge.label}
                  </span>
                </div>

                {/* Main Offer Body */}
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${o.product}`}
                    className="relative shrink-0 overflow-hidden rounded-2xl border border-line bg-sunken group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assetUrl(o.coverImage.url)}
                      alt={o.coverImage.alt ?? o.productTitle}
                      className="h-20 w-20 sm:h-24 sm:w-24 object-cover group-hover:scale-105 transition-transform"
                    />
                  </Link>

                  {/* Negotiation Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <Link
                      href={`/products/${o.product}`}
                      className="font-bold text-base text-ink hover:text-primary transition-colors truncate block"
                    >
                      {o.productTitle}
                    </Link>

                    {o.variantSelections.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {o.variantSelections.map((v) => (
                          <span
                            key={v.name}
                            className="rounded-md bg-sunken px-2 py-0.5 text-[11px] font-medium text-body border border-line"
                          >
                            {v.name}: <strong className="text-ink">{v.value}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price Comparison Block */}
                    <div className="flex flex-wrap items-baseline gap-3 pt-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-muted block">
                          Original Price
                        </span>
                        <span className="text-xs text-muted line-through">
                          ₦{o.listedPrice.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-primary block">
                          Current Price Am Offer
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-ink">
                          ₦{o.currentPrice.toLocaleString()}
                        </span>
                      </div>

                      {savings > 0 && (
                        <div className="rounded-xl bg-success-soft border border-success/30 px-2.5 py-1 text-xs font-bold text-success flex items-center gap-1">
                          <TrendingDown className="h-3.5 w-3.5" />
                          <span>-₦{savings.toLocaleString()} ({percentOff}% off)</span>
                        </div>
                      )}
                    </div>

                    {/* Negotiation History Trail */}
                    <div className="mt-3 rounded-2xl bg-sunken/60 border border-line p-3 text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted block mb-1">
                        Negotiation Timeline
                      </span>
                      {o.history.map((h, i) => {
                        const action =
                          h.action ?? (i === 0 ? "submitted" : "countered");
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between text-body"
                          >
                            <span className="capitalize font-medium flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {h.proposedBy === tab ? "You" : h.proposedBy}:{" "}
                              {action === "submitted"
                                ? "Offered"
                                : action === "accepted"
                                ? "Accepted"
                                : action === "rejected"
                                ? "Declined"
                                : "Countered"}
                            </span>
                            <span className="font-bold text-ink">
                              ₦{h.price.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Counter Offer Input Box */}
                {counterId === o._id && myTurn && (
                  <div className="mt-4 pt-4 border-t border-line bg-primary-soft/30 -mx-5 -mb-5 p-5 sm:-mx-6 sm:-mb-6 rounded-b-3xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink flex items-center gap-1">
                        <Handshake className="h-4 w-4 text-primary" />
                        Enter Your Counter Proposal
                      </span>
                      <button
                        type="button"
                        onClick={() => setCounterId(null)}
                        className="text-xs text-muted hover:text-ink font-semibold"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Fast Presets */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-muted font-medium">Quick presets:</span>
                      {[5, 10, 15].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => applyPresetDiscount(o, pct)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-surface border border-line hover:border-primary text-ink transition-colors"
                        >
                          -{pct}%
                        </button>
                      ))}
                    </div>

                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        act(o._id, () => counterOffer(o._id, Number(counterPrice)));
                      }}
                    >
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
                          ₦
                        </span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          step="100"
                          required
                          autoFocus
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                          placeholder="Your counter price"
                          className="pl-8 h-11 rounded-xl text-sm font-bold"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={busyId === o._id || !counterPrice}
                        className="rounded-xl px-5 font-bold"
                      >
                        Send Counter
                      </Button>
                    </form>
                  </div>
                )}

                {/* Deal Agreed Direct Chat & Checkout Callout */}
                {o.status === "accepted" && o.order && (
                  <div className="mt-4 pt-4 border-t border-line">
                    <div className="rounded-2xl border border-success/30 bg-gradient-to-r from-success-soft/70 via-surface to-primary-soft/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft">
                      <div>
                        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-success">
                          <CheckCircle2 className="h-4 w-4" /> Deal Locked at ₦
                          {o.currentPrice.toLocaleString()}
                        </span>
                        <p className="text-xs text-body mt-0.5">
                          Order created! Connect in Transaction Chat to arrange courier logistics and direct settlement.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {tab === "buyer" && (
                          <Link href={`/checkout?order=${o.order}`}>
                            <Button
                              size="sm"
                              className="rounded-xl font-bold bg-primary text-white shadow-soft"
                            >
                              Checkout ₦{o.currentPrice.toLocaleString()}
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={navigatingOrder === o.order}
                          loading={navigatingOrder === o.order}
                          onClick={() => onOpenTransactionChat(o.order!)}
                          className="rounded-xl font-bold border-success text-success hover:bg-success-soft"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Transaction Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active Bargaining Buttons */}
                {open && (
                  <div className="mt-4 pt-3 border-t border-line/60 flex flex-wrap items-center justify-between gap-2">
                    {myTurn ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          className="rounded-xl font-bold bg-success hover:bg-success/90 text-white shadow-soft"
                          disabled={busyId === o._id}
                          onClick={() => act(o._id, () => acceptOffer(o._id))}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Accept ₦{o.currentPrice.toLocaleString()}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl font-bold border-primary text-primary hover:bg-primary-soft"
                          disabled={busyId === o._id}
                          onClick={() => {
                            setCounterId(counterId === o._id ? null : o._id);
                            setCounterPrice("");
                          }}
                        >
                          <Handshake className="h-3.5 w-3.5" />
                          Counter Offer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl font-semibold border-danger/40 text-danger hover:bg-danger/10"
                          disabled={busyId === o._id}
                          onClick={() => act(o._id, () => rejectOffer(o._id))}
                        >
                          Decline
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted italic flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Waiting for the {tab === "buyer" ? "seller" : "buyer"} to respond to proposal…
                      </span>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-semibold text-xs border-line text-muted hover:text-danger hover:border-danger/30"
                      disabled={busyId === o._id}
                      onClick={() => act(o._id, () => rejectOffer(o._id))}
                    >
                      Cancel Offer
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Acceptance Modal Dialog */}
      {acceptedNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 backdrop-blur-xs p-4"
          role="presentation"
          onMouseDown={() => setAcceptedNotice(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 sm:p-8 text-center shadow-lifted"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-success-soft text-success mb-3 shadow-soft">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-black text-ink">Price Am Deal Agreed! 🎉</h2>
            <p className="mt-2 text-sm text-body leading-relaxed">
              Mutually accepted price for <strong>{acceptedNotice.offer.productTitle}</strong>:
            </p>
            <div className="my-3 text-3xl font-black text-success">
              ₦{acceptedNotice.offer.currentPrice.toLocaleString()}
            </div>

            <div className="rounded-2xl bg-sunken/60 border border-line p-4 text-left text-xs space-y-1 mb-5">
              <p className="font-bold text-ink">
                Order #{acceptedNotice.orderId.slice(-8).toUpperCase()} Created
              </p>
              <p className="text-muted leading-relaxed">
                {acceptedNotice.viewerRole === "buyer"
                  ? "Open the Transaction Chat to coordinate pickup or doorstep dispatch rider delivery with the seller."
                  : "The buyer has received the deal notification. Coordinate dispatch details in Transaction Chat."}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                href={
                  acceptedNotice.viewerRole === "buyer"
                    ? `/checkout?order=${acceptedNotice.orderId}`
                    : `/orders/${acceptedNotice.orderId}`
                }
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-xs sm:text-sm font-bold text-white shadow-soft hover:bg-primary-dark"
              >
                {acceptedNotice.viewerRole === "buyer" ? "Complete Logistics" : "View Order"}
              </Link>
              <button
                type="button"
                onClick={() => setAcceptedNotice(null)}
                className="h-11 rounded-2xl border border-line bg-surface px-4 text-xs sm:text-sm font-semibold text-ink hover:bg-sunken"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OffersPage() {
  return (
    <Suspense>
      <OffersContent />
    </Suspense>
  );
}
