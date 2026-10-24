import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";
import { SearchBar } from "./SearchBar";
import { NavbarCommerceLinks } from "./NavbarCommerceLinks";
import { MobileSidebar } from "./MobileSidebar";
import Link from "next/link";
import { Bell } from "lucide-react";

export function Navbar() {
  return (
    <header className="site-navbar sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-5 sm:h-16 sm:px-6">
        <MobileSidebar />
        <Logo className="absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0" />

        <SearchBar className="hidden md:flex flex-1 max-w-xl" />

        <Link href="/conversations" aria-label="Notifications" className="relative ml-auto grid h-11 w-11 place-items-center text-ink sm:hidden">
          <Bell className="h-6 w-6" strokeWidth={1.9} />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-primary" />
        </Link>
        <nav className="ml-auto hidden items-center gap-0.5 sm:flex sm:gap-1">
          <NavbarCommerceLinks />
          <div className="w-px h-6 bg-line mx-1 hidden sm:block" />
          <UserMenu />
        </nav>
      </div>

    </header>
  );
}
