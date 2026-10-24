import type { Metadata } from "next";
import { InfoDocument } from "@/components/InfoDocument";

export const metadata: Metadata = {
  title: "About Us | Price Am",
  description: "Learn how Price Am helps people across Nigeria buy, sell, negotiate, and trade more safely.",
};

export default function AboutPage() {
  return <InfoDocument source="about.md" label="About Price Am" summary="A negotiation-first marketplace built to help people across Nigeria find what they need, agree a fair price, and trade with greater confidence." />;
}
