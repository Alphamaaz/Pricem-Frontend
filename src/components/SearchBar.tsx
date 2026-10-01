"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={onSubmit} className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search for electronics, fashion…"
        className="w-full h-11 rounded-full border border-line bg-sunken pl-11 pr-4 text-sm text-ink placeholder:text-muted transition-shadow focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary focus:bg-surface"
      />
    </form>
  );
}
