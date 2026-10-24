"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, ReceiptText, Store, UserRound } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/seller", label: "Switch to Sell", icon: Store, sell: true },
  { href: "/orders", label: "Orders", icon: ReceiptText },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-app-nav sm:hidden" aria-label="Primary navigation">
      {items.map(({ href, label, icon: Icon, sell }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`mobile-app-nav-item ${active ? "is-active" : ""}`}>
            <span className={sell ? "mobile-app-sell-icon" : "mobile-app-nav-icon"}>
              <Icon className="h-6 w-6" strokeWidth={2} />
              {sell && <span className="mobile-app-sell-arrow">→</span>}
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
