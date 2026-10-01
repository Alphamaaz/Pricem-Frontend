"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  MessageCircle,
  Package,
  Store,
} from "lucide-react";
import { listConversations, type Conversation } from "@/lib/chat";
import { assetUrl, tokenStore } from "@/lib/api";
import { getRealtimeSocket } from "@/lib/realtime";

function ConversationImage({ url, alt }: { url: string; alt?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary shrink-0">
        <MessageCircle className="h-6 w-6" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={assetUrl(url)}
      alt={alt || "Product"}
      onError={() => setFailed(true)}
      className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover border border-line shrink-0 shadow-xs"
    />
  );
}

export default function ConversationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Conversation[] | null>(null);
  const [filter, setFilter] = useState<"all" | "order" | "inquiry">("all");

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    const load = () =>
      listConversations()
        .then((result) => setItems(result.conversations))
        .catch(() => setItems([]));

    void load();
    const socket = getRealtimeSocket();
    socket?.on("conversation:changed", load);
    return () => {
      socket?.off("conversation:changed", load);
    };
  }, [router]);

  if (!items) {
    return (
      <div className="mx-auto max-w-4xl py-16 space-y-4">
        <div className="h-10 w-48 rounded-2xl bg-sunken animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-3xl bg-sunken animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const filteredItems = items.filter((c) => {
    if (filter === "order" && c.scope !== "order") return false;
    if (filter === "inquiry" && c.scope !== "listing") return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <MessageCircle className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Direct Transaction Chats
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-0.5">
            Messages & Logistics
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Coordinate courier deliveries, exchange meetup locations, and confirm settlements.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex rounded-xl border border-line bg-surface p-1 shadow-soft self-start sm:self-auto">
          {[
            { key: "all", label: "All Chats" },
            { key: "order", label: "Orders & Delivery" },
            { key: "inquiry", label: "Product Inquiries" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === tab.key
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="rounded-3xl border border-line bg-surface shadow-soft divide-y divide-line overflow-hidden">
        {filteredItems.map((conversation) => {
          const product =
            typeof conversation.product === "string" ? null : conversation.product;
          const isOrder = conversation.scope === "order";

          return (
            <Link
              key={conversation._id}
              href={`/conversations/${conversation._id}`}
              className="group flex items-center gap-4 p-4 sm:p-5 hover:bg-sunken/40 transition-colors"
            >
              {product?.coverImage?.url ? (
                <ConversationImage
                  url={product.coverImage.url}
                  alt={product.title}
                />
              ) : (
                <span className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary shrink-0">
                  <Package className="h-7 w-7" />
                </span>
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-bold text-sm sm:text-base text-ink group-hover:text-primary transition-colors">
                    {product?.title ?? "Order & Delivery Conversation"}
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
                    {Boolean(conversation.unreadCount) && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-extrabold text-white">
                        {conversation.unreadCount! > 99
                          ? "99+"
                          : conversation.unreadCount}
                      </span>
                    )}
                    <time className="text-xs text-muted font-medium">
                      {new Date(conversation.lastMessageAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                </div>

                <p
                  className={`truncate text-xs sm:text-sm ${
                    conversation.unreadCount
                      ? "font-bold text-ink"
                      : "text-muted"
                  }`}
                >
                  {conversation.lastMessagePreview || "Conversation started"}
                </p>

                <div className="flex items-center gap-2 pt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isOrder
                        ? "bg-accent/20 text-ink border border-accent/30"
                        : "bg-sunken text-muted border border-line"
                    }`}
                  >
                    {isOrder ? (
                      <Package className="h-3 w-3 text-primary" />
                    ) : (
                      <Store className="h-3 w-3" />
                    )}
                    {conversation.scope}
                  </span>
                  <span className="text-[11px] text-muted capitalize">
                    Status: {conversation.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl bg-sunken text-muted group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="p-12 sm:p-16 text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sunken mx-auto text-muted">
              <MessageCircle className="h-8 w-8 opacity-60" />
            </div>
            <h3 className="text-base font-bold text-ink">No conversations found</h3>
            <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto">
              {filter !== "all"
                ? "No chats in this category. Switch to All Chats."
                : "You don't have any open chats yet. Make an offer or open an item to chat directly with merchants."}
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-primary text-white px-5 py-2.5 text-xs font-bold shadow-soft hover:bg-primary-dark transition-colors"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
