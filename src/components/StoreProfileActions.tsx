"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, MessageCircle } from "lucide-react";
import { openListingConversation } from "@/lib/chat";
import { tokenStore } from "@/lib/api";

export function StoreProfileActions({ productId }: { productId?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reported, setReported] = useState(false);

  async function chat() {
    if (!productId) return;
    if (!tokenStore.get()) { router.push("/login"); return; }
    setBusy(true);
    try {
      const response = await openListingConversation(productId);
      router.push(`/conversations/${response.conversation._id}`);
    } finally { setBusy(false); }
  }

  return (
    <div className="store-profile-actions">
      <button type="button" onClick={chat} disabled={!productId || busy}><MessageCircle />{busy ? "Opening…" : "Chat with seller"}</button>
      <button type="button" onClick={() => setReported(true)} disabled={reported}><Flag />{reported ? "Report received" : "Report seller"}</button>
    </div>
  );
}
