"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  Handshake,
  LayoutDashboard,
  MessageCircle,
  Package,
  Plus,
  Settings,
  Store,
} from "lucide-react";

const links = [
  { href: "/seller", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/seller/products", label: "Listings", icon: Package },
  { href: "/offers?tab=seller", label: "Price Am offers", icon: Handshake },
  { href: "/orders", label: "Agreed deals", icon: BarChart3 },
  { href: "/conversations", label: "Messages", icon: MessageCircle },
];

export function SellerWorkspaceNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="seller-rail hidden lg:flex">
        <div className="px-5 pt-6 pb-5 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-ink">Seller workspace</p>
              <p className="text-[11px] text-muted">Run your PriceAm store</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Seller navigation">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const cleanHref = href.split("?")[0];
            const active = exact ? pathname === cleanHref : pathname.startsWith(cleanHref);
            return (
              <Link key={href} href={href} className={`seller-nav-link ${active ? "is-active" : ""}`}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                <span>{label}</span>
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-2xl border border-line bg-cream p-4">
          <p className="text-xs font-bold text-ink">Ready for a new listing?</p>
          <p className="mt-1 text-[11px] leading-4 text-muted">Clear photos and honest details close deals faster.</p>
          <Link href="/seller/products/new" className="mt-3 flex h-9 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary-light">
            <Plus className="h-4 w-4" /> Add listing
          </Link>
        </div>
        <Link href="/profile" className="seller-nav-link m-3 mt-0">
          <Settings className="h-[18px] w-[18px]" /> Store settings
        </Link>
      </aside>

      <nav className="seller-mobile-nav lg:hidden" aria-label="Seller navigation">
        {links.slice(0, 4).map(({ href, label, icon: Icon, exact }) => {
          const cleanHref = href.split("?")[0];
          const active = exact ? pathname === cleanHref : pathname.startsWith(cleanHref);
          return (
            <Link key={href} href={href} className={active ? "is-active" : ""}>
              <Icon className="h-4 w-4" />
              <span>{label.replace("Price Am ", "")}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
