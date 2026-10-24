import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-5 pb-28 sm:px-6 sm:py-8 sm:pb-8">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </>
  );
}
