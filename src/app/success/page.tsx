"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";

type OrderSummary = { order_number: string; product_title: string; quantity: number };

function SuccessContent() {
  const { clear, loaded } = useCart();
  const { dict } = useLocale();
  const sessionId = useSearchParams().get("session_id");
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);

  useEffect(() => {
    if (loaded) clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let attempts = 0;

    // The order is written to the database by Stripe's webhook, which
    // usually lands within a second or two of this page loading — so we
    // retry a handful of times rather than showing nothing.
    async function poll() {
      attempts++;
      const res = await fetch(`/api/orders/by-session?session_id=${sessionId}`);
      const data = await res.json();
      if (cancelled) return;
      if (data.orders?.length > 0) {
        setOrders(data.orders);
      } else if (attempts < 6) {
        setTimeout(poll, 1500);
      }
    }
    poll();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <main className="max-w-xl mx-auto px-6 py-24 flex-1 w-full text-center">
      <p className="placard-label text-ink-soft mb-3">{dict.success.orderConfirmed}</p>
      <h1 className="font-display text-3xl italic mb-4">{dict.success.thankYou}</h1>
      <p className="text-ink-soft mb-8">{dict.success.confirmationSent}</p>

      {orders && orders.length > 0 && (
        <div className="border border-line p-5 mb-8 text-left inline-block">
          {orders.map((o) => (
            <p key={o.order_number} className="mb-1 last:mb-0">
              <span className="placard-label text-ink-soft mr-2">
                {o.order_number}
              </span>
              {o.product_title}
              {o.quantity > 1 ? ` × ${o.quantity}` : ""}
            </p>
          ))}
          <p className="text-sm text-ink-soft mt-3">{dict.success.saveOrderNumber}</p>
        </div>
      )}

      <div>
        <Link
          href="/shop"
          className="inline-block bg-ink text-paper px-6 py-3 placard-label hover:bg-oxblood transition-colors"
        >
          {dict.success.backToShop}
        </Link>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <SuccessContent />
      </Suspense>
    </>
  );
}
