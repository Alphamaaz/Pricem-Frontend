import Link from "next/link";
import { AtSign, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { href: "/", label: "Browse products" },
      { href: "/offers", label: "My offers" },
      { href: "/orders", label: "My orders" },
    ],
  },
  {
    title: "Sell on PriceAm",
    links: [
      { href: "/seller/onboarding", label: "Become a seller" },
      { href: "/seller/products", label: "Seller dashboard" },
      { href: "/seller/products/new", label: "List an item" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/register", label: "Create account" },
      { href: "/profile", label: "Manage profile" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      {/* Trust bar */}
      <div className="border-b border-line bg-sunken/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-medium text-body">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" strokeWidth={1.75} />
            Buyer protection on every order
          </span>
          <span className="flex items-center gap-2">
            <Truck className="h-4.5 w-4.5 text-primary" strokeWidth={1.75} />
            Fast, tracked delivery
          </span>
          <span className="hidden sm:flex items-center gap-2">
            <span className="text-primary font-bold">₦</span>
            Negotiate the price, every time
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-3 text-sm text-muted max-w-xs leading-relaxed">
            The marketplace where every price is negotiable and every account
            can sell. Make an offer, get a counter, close the deal.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {[AtSign, MessageCircle].map((Icon, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted hover:text-primary hover:border-primary transition-colors cursor-pointer"
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-ink mb-3">{col.title}</h3>
            <ul className="space-y-2.5 text-sm text-body">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
          <span>© {new Date().getFullYear()} PriceAm. All rights reserved.</span>
          <span>Built for negotiation-first commerce.</span>
        </div>
      </div>
    </footer>
  );
}
