import Image from "next/image";
import Link from "next/link";

/*
  Brand logos live in /public/logo:
  - PA.svg       → square mark (P + arrow)
  - priceAm.svg  → horizontal wordmark
*/

type LogoProps = {
  variant?: "wordmark" | "mark" | "stacked";
  className?: string;
};

export function Logo({ variant = "wordmark", className = "" }: LogoProps) {
  if (variant === "mark") {
    return (
      <Link href="/" className={`inline-flex ${className}`}>
        <Image src="/logo/PA.svg" alt="PriceAm" width={52} height={40} priority />
      </Link>
    );
  }

  if (variant === "stacked") {
    return (
      <Link href="/" className={`inline-flex flex-col items-center gap-2 ${className}`}>
        <Image src="/logo/PA.png" alt="" width={65} height={50} priority />
        <Image src="/logo/priceAm.svg" alt="PriceAm" width={99} height={24} priority />
      </Link>
    );
  }

  return (
    <Link href="/" className={`inline-flex items-center ${className}`}>
      <Image src="/logo/priceAm.svg" alt="PriceAm" width={112} height={27} priority />
    </Link>
  );
}
