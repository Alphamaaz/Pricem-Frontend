"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Handshake, Heart, MessageCircle, Package, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { tokenStore } from "@/lib/api";
import { COMMERCE_CHANGED_EVENT } from "@/lib/commerce-events";
import { getNavigationSummary, type NavigationSummary } from "@/lib/notifications";
import { getRealtimeSocket } from "@/lib/realtime";

type IconLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  countKey?: "cart" | "wishlist" | "orders" | "messages" | "offers";
};

const ICON_LINKS: IconLink[] = [
  { href: "/conversations", label: "Messages", icon: MessageCircle, countKey: "messages" },
  { href: "/offers", label: "Offers", icon: Handshake, countKey: "offers" },
  { href: "/orders", label: "Orders", icon: Package, countKey: "orders" },
  { href: "/wishlist", label: "Wishlist", icon: Heart, countKey: "wishlist" },
  { href: "/cart", label: "Cart", icon: ShoppingCart, countKey: "cart" },
];

export function NavbarCommerceLinks() {
  const [counts, setCounts] = useState<NavigationSummary>({ cart: 0, wishlist: 0, orders: 0, messages: 0, offers: 0, offersBuyer: 0, offersSeller: 0 });

  const refreshCounts = useCallback(() => {
    if (!tokenStore.get()) return;

    getNavigationSummary().then(setCounts).catch(() => {});
  }, []);

  useEffect(() => {
    refreshCounts();
    const socket = getRealtimeSocket();
    socket?.on("badges:changed", refreshCounts);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") refreshCounts();
    }, 120000);
    window.addEventListener(COMMERCE_CHANGED_EVENT, refreshCounts);
    const onFocus = () => refreshCounts();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      socket?.off("badges:changed", refreshCounts);
      window.removeEventListener(COMMERCE_CHANGED_EVENT, refreshCounts);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshCounts]);

  return (
    <>
      {ICON_LINKS.map(({ href, label, icon: Icon, countKey }) => {
        const count = countKey ? counts[countKey] : 0;
        const destination = label === "Offers"
          ? `/offers?tab=${counts.offersSeller > 0 ? "seller" : "buyer"}`
          : href;
        return (
          <Link
            key={href}
            href={destination}
            title={label}
            className="relative hidden sm:flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-medium text-body hover:bg-sunken hover:text-primary transition-colors"
          >
            <span className="relative">
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {count > 0 && (
                <span className="absolute -right-2.5 -top-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </span>
            {label}
          </Link>
        );
      })}
    </>
  );
}
