import type { Metadata } from "next";
import { InfoDocument } from "@/components/InfoDocument";

export const metadata: Metadata = {
  title: "Terms and Conditions | Price Am",
  description: "The terms that govern access to and use of the Price Am marketplace.",
};

export default function TermsPage() {
  return <InfoDocument source="terms.md" label="Legal" summary="The rules that govern access to and use of the Price Am marketplace by buyers, sellers, and visitors." updated="24 October 2026" />;
}
