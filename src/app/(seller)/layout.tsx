import { Navbar } from "@/components/Navbar";
import { SellerWorkspaceNav } from "@/components/SellerWorkspaceNav";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="seller-layout min-h-screen bg-cream">
      <div className="seller-desktop-navbar">
        <Navbar />
      </div>
      <div className="seller-shell">
        <SellerWorkspaceNav />
        <div className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</div>
      </div>
    </div>
  );
}
