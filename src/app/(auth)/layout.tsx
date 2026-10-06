import Link from "next/link";
import { CheckCircle2, Handshake, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-8 sm:py-12 bg-[radial-gradient(ellipse_at_top,_rgba(240,118,43,0.08)_0%,_transparent_70%)]">
      <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Brand Value & Social Proof (Hidden on small screens, gorgeous on lg) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-8 pr-4">
          <div>
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <Logo variant="wordmark" />
            </Link>
            <div className="mt-8 space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft/80 border border-primary/20 px-3.5 py-1 text-xs font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Nigeria&apos;s Price Am Marketplace
              </span>
              <h2 className="text-3xl font-black text-ink tracking-tight leading-tight">
                Shop smart. <br />
                <span className="text-primary">Price Am</span> your way to the best deals.
              </h2>
              <p className="text-sm text-body leading-relaxed">
                Connect directly with verified Nigerian merchants. Negotiate item prices in real time and arrange doorstep courier delivery or walk-in pickup.
              </p>
            </div>
          </div>

          {/* Value Props Strip */}
          <div className="space-y-3.5 border-t border-line pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-ink border border-accent/30">
                <Handshake className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink">Real-Time Price Am Offers</h4>
                <p className="text-[11px] text-muted">Counter and agree on fair prices directly before checkout.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success border border-success/30">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink">Direct Settlement & Meetup</h4>
                <p className="text-[11px] text-muted">Inspect items upon arrival or settle with the dispatch rider.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sunken text-body border border-line">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink">Nationwide Logistics Coordination</h4>
                <p className="text-[11px] text-muted">Lagos, Abuja, Port Harcourt, Ibadan, Kano and beyond.</p>
              </div>
            </div>
          </div>

          {/* Social Proof Pill */}
          <div className="rounded-2xl bg-surface border border-line p-3.5 shadow-soft flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 border-2 border-surface flex items-center justify-center text-[10px] font-bold text-primary">LAG</div>
              <div className="h-8 w-8 rounded-full bg-accent/30 border-2 border-surface flex items-center justify-center text-[10px] font-bold text-ink">ABJ</div>
              <div className="h-8 w-8 rounded-full bg-success/20 border-2 border-surface flex items-center justify-center text-[10px] font-bold text-success">PHC</div>
            </div>
            <div className="text-[11px]">
              <span className="font-bold text-ink flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Trusted across 36 Nigerian States
              </span>
              <span className="text-muted">Over ₦50M+ saved in Price Am deals</span>
            </div>
          </div>
        </div>

        {/* Right Side / Mobile Center: Auth Card */}
        <div className="w-full max-w-md mx-auto lg:col-span-7 lg:max-w-lg">
          {/* Mobile Logo Header */}
          <div className="flex lg:hidden justify-center mb-6">
            <Logo variant="stacked" />
          </div>

          <div className="rounded-3xl bg-surface border border-line p-6 sm:p-10 shadow-lifted">
            {children}
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-muted">
            Protected by PriceAm Safety & Deal Protection.
          </p>
        </div>
      </div>
    </main>
  );
}
