import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-cream px-4 py-8 sm:py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex justify-center sm:mb-8">
          <Link href="/" aria-label="Back to Price Am marketplace" className="inline-flex transition-opacity hover:opacity-85">
            <Logo variant="wordmark" />
          </Link>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-6 shadow-lifted sm:p-10">
          {children}
        </div>
      </div>
    </main>
  );
}
