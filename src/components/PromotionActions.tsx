"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { ApiRequestError, tokenStore } from "@/lib/api";
import { captureReferral, generateReferralLink } from "@/lib/promotions";

function visitorKey() { const key = "pricem_visitor_key"; let value = localStorage.getItem(key); if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value); } return value; }

export function PromotionActions({ productId, referralCode, enabled }: { productId: string; referralCode?: string; enabled: boolean }) {
  const [notice, setNotice] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!referralCode) return; captureReferral(referralCode, productId, visitorKey()).then((result) => { const existing = JSON.parse(localStorage.getItem("pricem_referrals") || "{}"); existing[productId] = { token: result.token, expiresAt: result.expiresAt }; localStorage.setItem("pricem_referrals", JSON.stringify(existing)); }).catch(() => undefined); }, [productId, referralCode]);
  if (!enabled) return null;
  async function generate() { if (!tokenStore.get()) { setNotice("Log in to generate your referral link."); return; } setBusy(true); try { const result = await generateReferralLink(productId); await navigator.clipboard.writeText(result.url); setNotice("Referral link copied. Eligible purchases use 14-day last-click attribution."); } catch (err) { setNotice(err instanceof ApiRequestError ? err.message : "Could not generate referral link."); } finally { setBusy(false); } }
  return <div className="mt-4 rounded-2xl border border-line bg-surface p-4"><Button type="button" variant="outline" loading={busy} onClick={() => void generate()}>Promote this item</Button>{notice && <p className="mt-2 text-xs text-muted">{notice}</p>}</div>;
}
