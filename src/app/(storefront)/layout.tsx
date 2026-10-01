import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1 w-full mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
