import { Logo } from "./Logo";
import { UserMenu } from "./UserMenu";
import { SearchBar } from "./SearchBar";
import { NavbarCommerceLinks } from "./NavbarCommerceLinks";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-surface/85 backdrop-blur-md border-b border-line">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center gap-4 sm:gap-6 h-16">
        <Logo />

        <SearchBar className="hidden md:flex flex-1 max-w-xl" />

        <nav className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <NavbarCommerceLinks />
          <div className="w-px h-6 bg-line mx-1 hidden sm:block" />
          <UserMenu />
        </nav>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <SearchBar />
      </div>
    </header>
  );
}
