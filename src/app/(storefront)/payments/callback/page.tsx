"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { verifyPayment } from "@/lib/payments";
import { ApiRequestError, tokenStore } from "@/lib/api";
import { Alert, Button } from "@/components/ui";
import { notifyCommerceChanged } from "@/lib/commerce-events";

export default function PaymentCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenStore.get()) {
      router.replace("/login");
      return;
    }
    const query = new URLSearchParams(window.location.search);
    const reference = query.get("reference") ?? query.get("trxref");
    if (!reference) {
      Promise.resolve().then(() => {
        setError("The payment flow did not return a payment reference.");
      });
      return;
    }
    verifyPayment(reference)
      .then((response) => {
        if (response.payment.status === "paid") {
          notifyCommerceChanged();
          router.replace("/orders?paid=1");
        }
        else setError(`Payment status is ${response.payment.status}. No order has been released for fulfilment.`);
      })
      .catch((requestError) => {
        setError(requestError instanceof ApiRequestError ? requestError.message : "Payment verification failed.");
      });
  }, [router]);

  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      {error ? (
        <>
          <Alert kind="error">{error}</Alert>
          <Link href="/orders" className="mt-6 inline-block"><Button variant="outline">View orders</Button></Link>
        </>
      ) : (
        <>
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <h1 className="mt-5 text-xl font-bold text-ink">Confirming your payment</h1>
          <p className="mt-2 text-sm text-muted">Please wait while PriceAm confirms the transaction and prepares the order for fulfilment.</p>
        </>
      )}
    </div>
  );
}
