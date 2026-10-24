import type { Metadata } from "next";
import { InfoDocument } from "@/components/InfoDocument";

export const metadata: Metadata = {
  title: "Privacy Policy | Price Am",
  description: "How Price Am collects, uses, protects, and manages personal information.",
};

export default function PrivacyPage() {
  return <InfoDocument source="privacy.md" label="Privacy" summary="How Price Am collects, uses, protects, and manages personal information when you use our marketplace." updated="24 October 2026" />;
}
