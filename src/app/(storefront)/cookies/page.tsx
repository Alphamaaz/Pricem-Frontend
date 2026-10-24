import type { Metadata } from "next";
import { InfoDocument } from "@/components/InfoDocument";

export const metadata: Metadata = {
  title: "Cookie Policy | Price Am",
  description: "How Price Am uses cookies and similar technologies and the choices available to you.",
};

export default function CookiePolicyPage() {
  return <InfoDocument source="cookies.md" label="Privacy" summary="How cookies and similar technologies help the Price Am website work, and how you can manage your choices." updated="24 October 2026" />;
}
